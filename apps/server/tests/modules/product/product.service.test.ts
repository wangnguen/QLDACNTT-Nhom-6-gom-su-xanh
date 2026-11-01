import { beforeEach, describe, expect, it, vi } from 'vitest'

import { BadRequestError, NotFoundError } from '@common/errors'

import CategoryRepository from '@modules/category/category.repository'
import ProductRepository from '@modules/product/product.repository'
import ProductService from '@modules/product/product.service'

import { makeCategory, makeProduct } from '../../helpers/factories'

vi.mock('@modules/product/product.repository', () => ({
  default: {
    findMany: vi.fn(),
    findById: vi.fn(),
    findSlugsWithBase: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn()
  }
}))

vi.mock('@modules/category/category.repository', () => ({
  default: {
    findById: vi.fn()
  }
}))

const repo = vi.mocked(ProductRepository)
const categoryRepo = vi.mocked(CategoryRepository)

const createBody = {
  name: 'Bình hoa men lam',
  categoryId: 'category-1',
  price: 450000,
  stock: 20,
  imageUrls: ['https://example.com/1.jpg'],
  isActive: true
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('ProductService.listForAdmin', () => {
  it('đổi status thành bộ lọc isActive và trả về dạng phân trang', async () => {
    repo.findMany.mockResolvedValue([[makeProduct()], 1])

    const result = await ProductService.listForAdmin({ limit: 12, offset: 0, sort: 'newest', status: 'hidden' })

    expect(repo.findMany).toHaveBeenCalledWith({ limit: 12, offset: 0, sort: 'newest', isActive: false })
    expect(result).toMatchObject({ limit: 12, offset: 0, total_count: 1 })
    expect(result.entries[0]).toEqual({
      id: 'product-1',
      name: 'Bình hoa men lam',
      slug: 'binh-hoa-men-lam',
      price: 450000,
      stock: 20,
      imageUrl: 'https://example.com/1.jpg',
      isActive: true,
      category: { id: 'category-1', name: 'Bình hoa', slug: 'binh-hoa' }
    })
  })

  it('không lọc trạng thái khi bỏ trống status', async () => {
    repo.findMany.mockResolvedValue([[], 0])

    await ProductService.listForAdmin({ limit: 12, offset: 0, sort: 'newest' })

    expect(repo.findMany).toHaveBeenCalledWith(expect.objectContaining({ isActive: undefined }))
  })
})

describe('ProductService.getForAdmin', () => {
  it('trả về đầy đủ thông tin để sửa', async () => {
    repo.findById.mockResolvedValue(makeProduct())

    await expect(ProductService.getForAdmin('product-1')).resolves.toMatchObject({
      description: 'Vẽ tay hoạ tiết hoa sen',
      imageUrls: ['https://example.com/1.jpg', 'https://example.com/2.jpg']
    })
  })

  it('báo lỗi 404 khi không tìm thấy', async () => {
    repo.findById.mockResolvedValue(null)

    await expect(ProductService.getForAdmin('product-1')).rejects.toThrow(NotFoundError)
  })
})

describe('ProductService.create', () => {
  it('sinh slug, thêm hậu tố khi trùng', async () => {
    categoryRepo.findById.mockResolvedValue(makeCategory())
    repo.findSlugsWithBase.mockResolvedValue(['binh-hoa-men-lam'])
    repo.create.mockResolvedValue(makeProduct({ slug: 'binh-hoa-men-lam-2' }))

    const result = await ProductService.create(createBody)

    expect(repo.findSlugsWithBase).toHaveBeenCalledWith('binh-hoa-men-lam', undefined)
    expect(repo.create).toHaveBeenCalledWith({ ...createBody, slug: 'binh-hoa-men-lam-2' })
    expect(result.slug).toBe('binh-hoa-men-lam-2')
  })

  it('báo lỗi 400 khi danh mục không tồn tại', async () => {
    categoryRepo.findById.mockResolvedValue(null)

    await expect(ProductService.create(createBody)).rejects.toThrow(BadRequestError)
    expect(repo.create).not.toHaveBeenCalled()
  })
})

describe('ProductService.update', () => {
  beforeEach(() => {
    repo.findById.mockResolvedValue(makeProduct())
    repo.update.mockResolvedValue(makeProduct())
  })

  it('giữ slug khi tên chỉ đổi hoa thường', async () => {
    await ProductService.update('product-1', { name: 'Bình Hoa Men Lam' })

    expect(repo.findSlugsWithBase).not.toHaveBeenCalled()
    expect(repo.update).toHaveBeenCalledWith('product-1', { name: 'Bình Hoa Men Lam', slug: 'binh-hoa-men-lam' })
  })

  it('đổi tên thì sinh slug mới, bỏ qua chính sản phẩm đang sửa', async () => {
    repo.findSlugsWithBase.mockResolvedValue([])

    await ProductService.update('product-1', { name: 'Bình hoa men rạn' })

    expect(repo.findSlugsWithBase).toHaveBeenCalledWith('binh-hoa-men-ran', 'product-1')
    expect(repo.update).toHaveBeenCalledWith('product-1', { name: 'Bình hoa men rạn', slug: 'binh-hoa-men-ran' })
  })

  it('kiểm tra danh mục mới khi đổi danh mục', async () => {
    categoryRepo.findById.mockResolvedValue(null)

    await expect(ProductService.update('product-1', { categoryId: 'category-2' })).rejects.toThrow(BadRequestError)
    expect(repo.update).not.toHaveBeenCalled()
  })

  it('báo lỗi 404 khi không tìm thấy sản phẩm', async () => {
    repo.findById.mockResolvedValue(null)

    await expect(ProductService.update('product-1', { price: 1000 })).rejects.toThrow(NotFoundError)
  })
})

describe('ProductService.remove', () => {
  it('xoá mềm sản phẩm', async () => {
    repo.findById.mockResolvedValue(makeProduct())

    await ProductService.remove('product-1')

    expect(repo.softDelete).toHaveBeenCalledWith('product-1')
  })

  it('báo lỗi 404 khi không tìm thấy sản phẩm', async () => {
    repo.findById.mockResolvedValue(null)

    await expect(ProductService.remove('product-1')).rejects.toThrow(NotFoundError)
    expect(repo.softDelete).not.toHaveBeenCalled()
  })
})
