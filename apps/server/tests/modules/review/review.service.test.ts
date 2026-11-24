import { beforeEach, describe, expect, it, vi } from 'vitest'

import { BadRequestError, ConflictError, NotFoundError } from '@common/errors'

import ProductRepository from '@modules/product/product.repository'
import { toRatingSummary } from '@modules/review/review.mapper'
import ReviewRepository from '@modules/review/review.repository'
import ReviewService from '@modules/review/review.service'

import { makeProduct, makeReview } from '../../helpers/factories'

vi.mock('@modules/review/review.repository', () => ({
  default: {
    findMany: vi.fn(),
    countByRating: vi.fn(),
    findById: vi.fn(),
    findByProductAndUser: vi.fn(),
    findDeliveredOrderId: vi.fn(),
    create: vi.fn(),
    update: vi.fn()
  }
}))

vi.mock('@modules/product/product.repository', () => ({
  default: {
    findVisibleBySlug: vi.fn(),
    findById: vi.fn()
  }
}))

const repo = vi.mocked(ReviewRepository)
const productRepo = vi.mocked(ProductRepository)

beforeEach(() => {
  vi.resetAllMocks()
  productRepo.findVisibleBySlug.mockResolvedValue(makeProduct())
  productRepo.findById.mockResolvedValue(makeProduct())
  repo.create.mockImplementation(async (data) => makeReview(data))
  repo.update.mockImplementation(async (_id, data) => makeReview(data))
})

describe('toRatingSummary', () => {
  it('tính điểm trung bình 1 chữ số thập phân và đủ 5 mức sao', () => {
    expect(
      toRatingSummary(
        new Map([
          [5, 8],
          [4, 3],
          [3, 1]
        ])
      )
    ).toEqual({
      average: 4.6,
      count: 12,
      distribution: { 1: 0, 2: 0, 3: 1, 4: 3, 5: 8 }
    })
  })

  it('chưa có đánh giá thì trung bình 0', () => {
    expect(toRatingSummary(new Map())).toMatchObject({ average: 0, count: 0 })
  })
})

describe('ReviewService.listForProduct', () => {
  it('chỉ lấy đánh giá đang hiện của sản phẩm, kèm tổng hợp', async () => {
    repo.findMany.mockResolvedValue([[makeReview()], 1])
    repo.countByRating.mockResolvedValue(new Map([[5, 1]]))

    const result = await ReviewService.listForProduct('binh-hoa-men-lam', { limit: 5, offset: 0, rating: undefined })

    expect(repo.findMany).toHaveBeenCalledWith({
      limit: 5,
      offset: 0,
      rating: undefined,
      productId: 'product-1',
      visibleOnly: true
    })
    expect(result.summary).toMatchObject({ average: 5, count: 1 })
    expect(result.entries[0]).toMatchObject({ rating: 5, authorName: 'Nguyễn Văn An' })
  })

  it('sản phẩm không xem được thì 404', async () => {
    productRepo.findVisibleBySlug.mockResolvedValue(null)

    await expect(ReviewService.listForProduct('x', { limit: 5, offset: 0 })).rejects.toThrow(NotFoundError)
  })
})

describe('ReviewService.getMine', () => {
  it('đã nhận hàng, chưa đánh giá: được đánh giá', async () => {
    repo.findByProductAndUser.mockResolvedValue(null)
    repo.findDeliveredOrderId.mockResolvedValue('order-1')

    await expect(ReviewService.getMine('user-1', 'binh-hoa-men-lam')).resolves.toEqual({
      canReview: true,
      reason: null,
      review: null
    })
  })

  it('chưa nhận hàng: chưa được đánh giá, kèm lý do', async () => {
    repo.findByProductAndUser.mockResolvedValue(null)
    repo.findDeliveredOrderId.mockResolvedValue(null)

    await expect(ReviewService.getMine('user-1', 'binh-hoa-men-lam')).resolves.toMatchObject({
      canReview: false,
      reason: expect.stringContaining('đã mua và nhận')
    })
  })

  it('đã đánh giá: trả đánh giá cũ để sửa (kể cả khi bị ẩn)', async () => {
    repo.findByProductAndUser.mockResolvedValue(makeReview({ isHidden: true }))

    await expect(ReviewService.getMine('user-1', 'binh-hoa-men-lam')).resolves.toMatchObject({
      canReview: false,
      review: { id: 'review-1', isHidden: true }
    })
  })
})

describe('ReviewService.create', () => {
  const body = { productId: 'product-1', rating: 5, comment: 'Rất đẹp' }

  it('gắn với đơn đã giao gần nhất có sản phẩm', async () => {
    repo.findByProductAndUser.mockResolvedValue(null)
    repo.findDeliveredOrderId.mockResolvedValue('order-9')

    await ReviewService.create('user-1', body)

    expect(repo.findDeliveredOrderId).toHaveBeenCalledWith('user-1', 'product-1')
    expect(repo.create).toHaveBeenCalledWith({
      productId: 'product-1',
      userId: 'user-1',
      orderId: 'order-9',
      rating: 5,
      comment: 'Rất đẹp'
    })
  })

  it('chưa nhận hàng thì không cho đánh giá', async () => {
    repo.findByProductAndUser.mockResolvedValue(null)
    repo.findDeliveredOrderId.mockResolvedValue(null)

    await expect(ReviewService.create('user-1', body)).rejects.toThrow(BadRequestError)
    expect(repo.create).not.toHaveBeenCalled()
  })

  it('đã đánh giá rồi thì 409', async () => {
    repo.findByProductAndUser.mockResolvedValue(makeReview())

    await expect(ReviewService.create('user-1', body)).rejects.toThrow(ConflictError)
  })

  it('sản phẩm không tồn tại', async () => {
    productRepo.findById.mockResolvedValue(null)

    await expect(ReviewService.create('user-1', body)).rejects.toThrow(NotFoundError)
  })
})

describe('ReviewService.update', () => {
  it('sửa đánh giá của mình', async () => {
    repo.findById.mockResolvedValue(makeReview())

    await ReviewService.update('user-1', 'review-1', { rating: 3 })

    expect(repo.update).toHaveBeenCalledWith('review-1', { rating: 3 })
  })

  it('đánh giá của người khác báo không tìm thấy', async () => {
    repo.findById.mockResolvedValue(makeReview({ userId: 'user-2' }))

    await expect(ReviewService.update('user-1', 'review-1', { rating: 3 })).rejects.toThrow(NotFoundError)
    expect(repo.update).not.toHaveBeenCalled()
  })
})
