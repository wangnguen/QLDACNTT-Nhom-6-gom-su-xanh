import { beforeEach, describe, expect, it, vi } from 'vitest'

import { BadRequestError, NotFoundError } from '@common/errors'

import CartRepository from '@modules/cart/cart.repository'
import CartService from '@modules/cart/cart.service'
import ProductRepository from '@modules/product/product.repository'

import type { CartItem } from '@entities/cart-item.entity'

import { makeCategory, makeProduct } from '../../helpers/factories'

vi.mock('@modules/cart/cart.repository', () => ({
  default: {
    findByUser: vi.fn(),
    findItem: vi.fn(),
    countItems: vi.fn(),
    setQuantity: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  }
}))

vi.mock('@modules/product/product.repository', () => ({
  default: {
    findById: vi.fn()
  }
}))

const repo = vi.mocked(CartRepository)
const productRepo = vi.mocked(ProductRepository)

const makeCartItem = (overrides: Partial<CartItem> = {}): CartItem =>
  ({
    id: 'cart-item-1',
    userId: 'user-1',
    productId: 'product-1',
    quantity: 2,
    product: makeProduct(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides
  }) as CartItem

beforeEach(() => {
  vi.resetAllMocks()
  repo.findByUser.mockResolvedValue([])
})

describe('CartService.getCart', () => {
  it('tính thành tiền, tổng số lượng và tạm tính', async () => {
    repo.findByUser.mockResolvedValue([
      makeCartItem({ quantity: 2 }),
      makeCartItem({ productId: 'product-2', quantity: 1, product: makeProduct({ id: 'product-2', price: 50000 }) })
    ])

    const cart = await CartService.getCart('user-1')

    expect(cart.items.map((line) => [line.productId, line.lineTotal, line.issue])).toEqual([
      ['product-1', 900000, null],
      ['product-2', 50000, null]
    ])
    expect(cart).toMatchObject({ totalQuantity: 3, subtotal: 950000 })
  })

  it.each([
    ['sản phẩm đang ẩn', makeProduct({ isActive: false }), 'unavailable'],
    ['danh mục đang ẩn', makeProduct({ category: makeCategory({ isActive: false }) }), 'unavailable'],
    ['hết hàng', makeProduct({ stock: 0 }), 'out_of_stock'],
    ['tồn kho ít hơn số lượng trong giỏ', makeProduct({ stock: 1 }), 'not_enough_stock']
  ])('đánh dấu dòng không mua được khi %s và bỏ khỏi tạm tính', async (_case, product, issue) => {
    repo.findByUser.mockResolvedValue([makeCartItem({ quantity: 2, product })])

    const cart = await CartService.getCart('user-1')

    expect(cart.items[0].issue).toBe(issue)
    expect(cart).toMatchObject({ totalQuantity: 2, subtotal: 0 })
  })

  it('bỏ qua dòng có sản phẩm đã bị xoá', async () => {
    repo.findByUser.mockResolvedValue([makeCartItem({ product: undefined })])

    await expect(CartService.getCart('user-1')).resolves.toEqual({ items: [], totalQuantity: 0, subtotal: 0 })
  })
})

describe('CartService.addItem', () => {
  beforeEach(() => {
    productRepo.findById.mockResolvedValue(makeProduct({ stock: 5 }))
    repo.countItems.mockResolvedValue(0)
  })

  it('thêm dòng mới', async () => {
    repo.findItem.mockResolvedValue(null)

    await CartService.addItem('user-1', { productId: 'product-1', quantity: 2 })

    expect(repo.setQuantity).toHaveBeenCalledWith('user-1', 'product-1', 2)
    expect(repo.findByUser).toHaveBeenCalledWith('user-1')
  })

  it('cộng dồn khi sản phẩm đã có trong giỏ', async () => {
    repo.findItem.mockResolvedValue(makeCartItem({ quantity: 2 }))

    await CartService.addItem('user-1', { productId: 'product-1', quantity: 3 })

    expect(repo.setQuantity).toHaveBeenCalledWith('user-1', 'product-1', 5)
  })

  it('báo lỗi khi tổng số lượng vượt tồn kho', async () => {
    repo.findItem.mockResolvedValue(makeCartItem({ quantity: 3 }))

    await expect(CartService.addItem('user-1', { productId: 'product-1', quantity: 3 })).rejects.toThrow(
      'Chỉ còn 5 sản phẩm, giỏ hàng của bạn đã có 3'
    )
    expect(repo.setQuantity).not.toHaveBeenCalled()
  })

  it('báo lỗi khi vượt 99 sản phẩm', async () => {
    productRepo.findById.mockResolvedValue(makeProduct({ stock: 500 }))
    repo.findItem.mockResolvedValue(makeCartItem({ quantity: 99 }))

    await expect(CartService.addItem('user-1', { productId: 'product-1', quantity: 1 })).rejects.toThrow(
      BadRequestError
    )
  })

  it('báo lỗi khi giỏ đã đủ 50 sản phẩm khác nhau', async () => {
    repo.findItem.mockResolvedValue(null)
    repo.countItems.mockResolvedValue(50)

    await expect(CartService.addItem('user-1', { productId: 'product-1', quantity: 1 })).rejects.toThrow(
      'Giỏ hàng chỉ chứa tối đa 50 sản phẩm khác nhau'
    )
  })

  it('giỏ đã đủ 50 sản phẩm vẫn tăng số lượng sản phẩm đã có', async () => {
    repo.findItem.mockResolvedValue(makeCartItem({ quantity: 1 }))
    repo.countItems.mockResolvedValue(50)

    await CartService.addItem('user-1', { productId: 'product-1', quantity: 1 })

    expect(repo.setQuantity).toHaveBeenCalledWith('user-1', 'product-1', 2)
  })

  it.each([
    ['không tồn tại', null, NotFoundError],
    ['đang ẩn', makeProduct({ isActive: false }), BadRequestError],
    ['thuộc danh mục ẩn', makeProduct({ category: makeCategory({ isActive: false }) }), BadRequestError],
    ['hết hàng', makeProduct({ stock: 0 }), BadRequestError]
  ])('không cho thêm sản phẩm %s', async (_case, product, error) => {
    productRepo.findById.mockResolvedValue(product)
    repo.findItem.mockResolvedValue(null)

    await expect(CartService.addItem('user-1', { productId: 'product-1', quantity: 1 })).rejects.toThrow(error)
    expect(repo.setQuantity).not.toHaveBeenCalled()
  })
})

describe('CartService.updateItem', () => {
  beforeEach(() => {
    productRepo.findById.mockResolvedValue(makeProduct({ stock: 5 }))
  })

  it('ghi đè số lượng', async () => {
    repo.findItem.mockResolvedValue(makeCartItem({ quantity: 2 }))

    await CartService.updateItem('user-1', 'product-1', { quantity: 5 })

    expect(repo.setQuantity).toHaveBeenCalledWith('user-1', 'product-1', 5)
  })

  it('báo lỗi khi vượt tồn kho', async () => {
    repo.findItem.mockResolvedValue(makeCartItem({ quantity: 2 }))

    await expect(CartService.updateItem('user-1', 'product-1', { quantity: 6 })).rejects.toThrow('Chỉ còn 5 sản phẩm')
  })

  it('báo lỗi 404 khi sản phẩm không có trong giỏ', async () => {
    repo.findItem.mockResolvedValue(null)

    await expect(CartService.updateItem('user-1', 'product-1', { quantity: 1 })).rejects.toThrow(NotFoundError)
    expect(productRepo.findById).not.toHaveBeenCalled()
  })
})

describe('CartService.removeItem / clear', () => {
  it('xoá một sản phẩm rồi trả về giỏ còn lại', async () => {
    await CartService.removeItem('user-1', 'product-1')

    expect(repo.removeItem).toHaveBeenCalledWith('user-1', 'product-1')
    expect(repo.findByUser).toHaveBeenCalledWith('user-1')
  })

  it('xoá toàn bộ giỏ', async () => {
    await expect(CartService.clear('user-1')).resolves.toEqual({ items: [], totalQuantity: 0, subtotal: 0 })
    expect(repo.clear).toHaveBeenCalledWith('user-1')
  })
})
