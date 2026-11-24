import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ConflictError, NotFoundError } from '@common/errors'

import PostCategoryRepository from '@modules/post-category/post-category.repository'
import PostCategoryService from '@modules/post-category/post-category.service'

import { makePostCategory } from '../../helpers/factories'

vi.mock('@modules/post-category/post-category.repository', () => ({
  default: {
    findAll: vi.fn(),
    findById: vi.fn(),
    findBySlug: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn()
  }
}))

const repo = vi.mocked(PostCategoryRepository)

beforeEach(() => {
  vi.resetAllMocks()
})

describe('PostCategoryService.list', () => {
  it('trang client chỉ lấy danh mục đang hiện', async () => {
    repo.findAll.mockResolvedValue([makePostCategory()])

    const result = await PostCategoryService.list()

    expect(repo.findAll).toHaveBeenCalledWith(true)
    expect(result).toEqual([
      {
        id: 'post-category-1',
        name: 'Kiến thức gốm',
        slug: 'kien-thuc-gom',
        description: null,
        isActive: true,
        postCount: 0
      }
    ])
  })

  it('trang admin lấy cả danh mục đang ẩn', async () => {
    repo.findAll.mockResolvedValue([makePostCategory({ isActive: false })])

    await PostCategoryService.listForAdmin()

    expect(repo.findAll).toHaveBeenCalledWith()
  })
})

describe('PostCategoryService.create', () => {
  it('sinh slug từ tên tiếng Việt', async () => {
    repo.findBySlug.mockResolvedValue(null)
    repo.create.mockImplementation(async (data) => makePostCategory(data))

    const result = await PostCategoryService.create({ name: 'Câu chuyện làng nghề' })

    expect(repo.create).toHaveBeenCalledWith({ name: 'Câu chuyện làng nghề', slug: 'cau-chuyen-lang-nghe' })
    expect(result.slug).toBe('cau-chuyen-lang-nghe')
  })

  it('tên trùng danh mục khác thì báo 409', async () => {
    repo.findBySlug.mockResolvedValue(makePostCategory())

    await expect(PostCategoryService.create({ name: 'KIẾN THỨC GỐM' })).rejects.toThrow(ConflictError)
    expect(repo.create).not.toHaveBeenCalled()
  })
})

describe('PostCategoryService.update', () => {
  it('đổi tên thì đổi slug', async () => {
    repo.findById.mockResolvedValue(makePostCategory())
    repo.findBySlug.mockResolvedValue(null)
    repo.update.mockImplementation(async (_id, data) => makePostCategory(data))

    await PostCategoryService.update('post-category-1', { name: 'Tin tức' })

    expect(repo.update).toHaveBeenCalledWith('post-category-1', { name: 'Tin tức', slug: 'tin-tuc' })
  })

  it('chỉ ẩn danh mục thì giữ slug, không kiểm tra trùng', async () => {
    repo.findById.mockResolvedValue(makePostCategory())
    repo.update.mockImplementation(async (_id, data) => makePostCategory(data))

    await PostCategoryService.update('post-category-1', { isActive: false })

    expect(repo.findBySlug).not.toHaveBeenCalled()
    expect(repo.update).toHaveBeenCalledWith('post-category-1', { isActive: false, slug: 'kien-thuc-gom' })
  })

  it('không tìm thấy danh mục', async () => {
    repo.findById.mockResolvedValue(null)

    await expect(PostCategoryService.update('x', { isActive: false })).rejects.toThrow(NotFoundError)
  })
})

describe('PostCategoryService.remove', () => {
  it('xoá mềm danh mục', async () => {
    repo.findById.mockResolvedValue(makePostCategory())

    await PostCategoryService.remove('post-category-1')

    expect(repo.softDelete).toHaveBeenCalledWith('post-category-1')
  })
})
