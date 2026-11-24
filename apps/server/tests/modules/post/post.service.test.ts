import { beforeEach, describe, expect, it, vi } from 'vitest'

import { BadRequestError, NotFoundError } from '@common/errors'

import { autoExcerpt, readingMinutes } from '@modules/post/post.mapper'
import PostRepository from '@modules/post/post.repository'
import PostService from '@modules/post/post.service'
import PostCategoryRepository from '@modules/post-category/post-category.repository'

import type { Post } from '@entities/post.entity'

import { makePost, makePostCategory } from '../../helpers/factories'

vi.mock('@modules/post/post.repository', () => ({
  default: {
    findMany: vi.fn(),
    findById: vi.fn(),
    findVisibleBySlug: vi.fn(),
    incrementViews: vi.fn(),
    findSlugsWithBase: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn()
  }
}))

vi.mock('@modules/post-category/post-category.repository', () => ({
  default: {
    findById: vi.fn()
  }
}))

const repo = vi.mocked(PostRepository)
const categoryRepo = vi.mocked(PostCategoryRepository)

const body = {
  title: 'Phân biệt men lam và men rạn',
  content: 'Men lam là lớp men trong phủ trên hoạ tiết vẽ bằng ô-xít coban.',
  categoryId: 'post-category-1',
  status: 'draft' as const
}

beforeEach(() => {
  vi.resetAllMocks()
  categoryRepo.findById.mockResolvedValue(makePostCategory())
  repo.findSlugsWithBase.mockResolvedValue([])
  repo.create.mockImplementation(async (data) => makePost(data as Partial<Post>))
  repo.update.mockImplementation(async (_id, data) => makePost(data as Partial<Post>))
})

describe('post mapper', () => {
  it('tóm tắt tự lấy từ nội dung, bỏ dấu tiêu đề mục', () => {
    expect(autoExcerpt('## Men lam\n\nMen lam đẹp.')).toBe('Men lam Men lam đẹp.')
    expect(autoExcerpt('chữ '.repeat(100)).length).toBeLessThanOrEqual(181)
    expect(autoExcerpt('chữ '.repeat(100)).endsWith('…')).toBe(true)
  })

  it('thời gian đọc tối thiểu 1 phút, 200 từ mỗi phút', () => {
    expect(readingMinutes('ngắn')).toBe(1)
    expect(readingMinutes('từ '.repeat(401))).toBe(3)
  })
})

describe('PostService.create', () => {
  it('lưu nháp: chưa có thời điểm đăng, slug từ tiêu đề, người viết là admin', async () => {
    const result = await PostService.create('admin-1', body)

    expect(repo.create).toHaveBeenCalledWith({
      ...body,
      slug: 'phan-biet-men-lam-va-men-ran',
      authorId: 'admin-1',
      publishedAt: null
    })
    expect(result).toMatchObject({ status: 'draft', publishedAt: null })
  })

  it('đăng ngay: ghi thời điểm đăng', async () => {
    await PostService.create('admin-1', { ...body, status: 'published' })

    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ publishedAt: expect.any(Date) }))
  })

  it('tiêu đề trùng thì thêm hậu tố', async () => {
    repo.findSlugsWithBase.mockResolvedValue(['phan-biet-men-lam-va-men-ran'])

    await PostService.create('admin-1', body)

    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ slug: 'phan-biet-men-lam-va-men-ran-2' }))
  })

  it('danh mục không tồn tại', async () => {
    categoryRepo.findById.mockResolvedValue(null)

    await expect(PostService.create('admin-1', body)).rejects.toThrow(BadRequestError)
  })
})

describe('PostService.update', () => {
  it('nháp → đăng: ghi thời điểm đăng là lúc này', async () => {
    repo.findById.mockResolvedValue(makePost({ status: 'draft', publishedAt: null }))

    await PostService.update('post-1', { status: 'published' })

    expect(repo.update).toHaveBeenCalledWith('post-1', {
      status: 'published',
      slug: 'phan-biet-men-lam-va-men-ran',
      publishedAt: expect.any(Date)
    })
  })

  it('gỡ bài về nháp: xoá thời điểm đăng', async () => {
    repo.findById.mockResolvedValue(makePost())

    await PostService.update('post-1', { status: 'draft' })

    expect(repo.update).toHaveBeenCalledWith('post-1', expect.objectContaining({ status: 'draft', publishedAt: null }))
  })

  it('sửa nội dung bài đã đăng: giữ nguyên thời điểm đăng và slug', async () => {
    const post = makePost()
    repo.findById.mockResolvedValue(post)

    await PostService.update('post-1', {
      content: 'Nội dung mới đủ dài để hợp lệ.',
      title: 'PHÂN BIỆT MEN LAM VÀ MEN RẠN'
    })

    expect(repo.findSlugsWithBase).not.toHaveBeenCalled()
    expect(repo.update).toHaveBeenCalledWith(
      'post-1',
      expect.objectContaining({ slug: post.slug, publishedAt: post.publishedAt })
    )
  })

  it('đổi tiêu đề thì sinh slug mới', async () => {
    repo.findById.mockResolvedValue(makePost())

    await PostService.update('post-1', { title: 'Men gốm Bát Tràng' })

    expect(repo.update).toHaveBeenCalledWith('post-1', expect.objectContaining({ slug: 'men-gom-bat-trang' }))
  })

  it('không tìm thấy bài', async () => {
    repo.findById.mockResolvedValue(null)

    await expect(PostService.update('x', { status: 'draft' })).rejects.toThrow(NotFoundError)
  })
})

describe('PostService.listForAdmin', () => {
  it('trả danh sách phân trang kèm tóm tắt và người viết', async () => {
    repo.findMany.mockResolvedValue([[makePost({ status: 'draft' })], 1])

    const result = await PostService.listForAdmin({ limit: 10, offset: 0 })

    expect(result.total_count).toBe(1)
    expect(result.entries[0]).toMatchObject({
      status: 'draft',
      publishedAt: null,
      readingMinutes: 1,
      author: { id: 'admin-1', fullName: 'Quản trị viên' },
      category: { slug: 'kien-thuc-gom' }
    })
  })
})

describe('PostService.list (tin tức)', () => {
  it('chỉ lấy bài khách được xem, lọc theo slug danh mục', async () => {
    repo.findMany.mockResolvedValue([[makePost()], 1])

    const result = await PostService.list({ limit: 9, offset: 0, category: 'kien-thuc-gom', search: 'men' })

    expect(repo.findMany).toHaveBeenCalledWith({
      limit: 9,
      offset: 0,
      search: 'men',
      categorySlug: 'kien-thuc-gom',
      visibleOnly: true
    })
    expect(result.entries[0]).toMatchObject({ slug: 'phan-biet-men-lam-va-men-ran', status: 'published' })
  })
})

describe('PostService.getBySlug', () => {
  it('trả bài kèm bài liên quan cùng danh mục và cộng lượt xem', async () => {
    repo.findVisibleBySlug.mockResolvedValue(makePost({ viewCount: 9 }))
    repo.findMany.mockResolvedValue([[makePost({ id: 'post-2', slug: 'men-ran' })], 1])

    const result = await PostService.getBySlug('phan-biet-men-lam-va-men-ran')

    expect(repo.incrementViews).toHaveBeenCalledWith('post-1')
    expect(repo.findMany).toHaveBeenCalledWith({
      visibleOnly: true,
      categoryId: 'post-category-1',
      excludeId: 'post-1',
      limit: 3,
      offset: 0
    })
    expect(result).toMatchObject({ viewCount: 10, content: expect.stringContaining('## Men rạn') })
    expect(result.related.map((post) => post.slug)).toEqual(['men-ran'])
  })

  it('bài không xem được thì 404, không cộng lượt xem', async () => {
    repo.findVisibleBySlug.mockResolvedValue(null)

    await expect(PostService.getBySlug('ban-nhap')).rejects.toThrow(NotFoundError)
    expect(repo.incrementViews).not.toHaveBeenCalled()
  })
})
