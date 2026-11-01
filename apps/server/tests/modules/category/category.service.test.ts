import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ConflictError, NotFoundError } from '@common/errors'

import CategoryRepository from '@modules/category/category.repository'
import CategoryService from '@modules/category/category.service'

import { makeCategory } from '../../helpers/factories'

vi.mock('@modules/category/category.repository', () => ({
  default: {
    findAll: vi.fn(),
    findById: vi.fn(),
    findBySlug: vi.fn(),
    countProductsByCategory: vi.fn(),
    countProducts: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn()
  }
}))

const repo = vi.mocked(CategoryRepository)

beforeEach(() => {
  vi.resetAllMocks()
})

describe('CategoryService.listForAdmin', () => {
  it('ghép số sản phẩm vào từng danh mục, danh mục chưa có sản phẩm là 0', async () => {
    repo.findAll.mockResolvedValue([makeCategory(), makeCategory({ id: 'category-2', name: 'Ấm chén' })])
    repo.countProductsByCategory.mockResolvedValue(new Map([['category-1', 3]]))

    const result = await CategoryService.listForAdmin()

    expect(result.map((c) => [c.id, c.productCount])).toEqual([
      ['category-1', 3],
      ['category-2', 0]
    ])
  })
})

describe('CategoryService.create', () => {
  it('sinh slug từ tên rồi lưu', async () => {
    repo.findBySlug.mockResolvedValue(null)
    repo.create.mockResolvedValue(makeCategory({ name: 'Ấm chén Bát Tràng', slug: 'am-chen-bat-trang' }))

    const result = await CategoryService.create({ name: 'Ấm chén Bát Tràng' })

    expect(repo.create).toHaveBeenCalledWith({ name: 'Ấm chén Bát Tràng', slug: 'am-chen-bat-trang' })
    expect(result).toMatchObject({ slug: 'am-chen-bat-trang', productCount: 0 })
  })

  it('báo trùng khi đã có danh mục cùng tên', async () => {
    repo.findBySlug.mockResolvedValue(makeCategory())

    await expect(CategoryService.create({ name: 'BÌNH HOA' })).rejects.toThrow(ConflictError)
    expect(repo.create).not.toHaveBeenCalled()
  })
})

describe('CategoryService.update', () => {
  beforeEach(() => {
    repo.findById.mockResolvedValue(makeCategory())
    repo.countProducts.mockResolvedValue(2)
    repo.update.mockImplementation(async (_id, data) => makeCategory(data))
  })

  it('không kiểm tra trùng khi chỉ đổi hoa thường (slug giữ nguyên)', async () => {
    await CategoryService.update('category-1', { name: 'Bình Hoa' })

    expect(repo.findBySlug).not.toHaveBeenCalled()
    expect(repo.update).toHaveBeenCalledWith('category-1', { name: 'Bình Hoa', slug: 'binh-hoa' })
  })

  it('đổi tên thì đổi slug', async () => {
    repo.findBySlug.mockResolvedValue(null)

    const result = await CategoryService.update('category-1', { name: 'Bình gốm' })

    expect(repo.update).toHaveBeenCalledWith('category-1', { name: 'Bình gốm', slug: 'binh-gom' })
    expect(result).toMatchObject({ slug: 'binh-gom', productCount: 2 })
  })

  it('báo trùng khi tên mới thuộc danh mục khác', async () => {
    repo.findBySlug.mockResolvedValue(makeCategory({ id: 'category-2', slug: 'am-chen' }))

    await expect(CategoryService.update('category-1', { name: 'Ấm chén' })).rejects.toThrow(ConflictError)
    expect(repo.update).not.toHaveBeenCalled()
  })

  it('báo lỗi 404 khi không tìm thấy danh mục', async () => {
    repo.findById.mockResolvedValue(null)

    await expect(CategoryService.update('category-1', { isActive: false })).rejects.toThrow(NotFoundError)
  })
})

describe('CategoryService.remove', () => {
  it('xoá mềm danh mục không còn sản phẩm', async () => {
    repo.findById.mockResolvedValue(makeCategory())
    repo.countProducts.mockResolvedValue(0)

    await CategoryService.remove('category-1')

    expect(repo.softDelete).toHaveBeenCalledWith('category-1')
  })

  it('không cho xoá danh mục còn sản phẩm', async () => {
    repo.findById.mockResolvedValue(makeCategory())
    repo.countProducts.mockResolvedValue(3)

    await expect(CategoryService.remove('category-1')).rejects.toThrow(ConflictError)
    expect(repo.softDelete).not.toHaveBeenCalled()
  })

  it('báo lỗi 404 khi không tìm thấy danh mục', async () => {
    repo.findById.mockResolvedValue(null)

    await expect(CategoryService.remove('category-1')).rejects.toThrow(NotFoundError)
  })
})
