import { POST_NOT_FOUND_MESSAGE, POST_STATUS } from '@common/constants'
import { BadRequestError, NotFoundError } from '@common/errors'
import { Paginated, PostDetail, PostSummary } from '@common/types'
import { nextAvailableSlug, slugify } from '@common/utils/slug'

import PostCategoryRepository from '@modules/post-category/post-category.repository'

import { Post } from '@entities/post.entity'

import { AdminPostQuery, CreatePostBody, UpdatePostBody } from './dto'
import { toPostDetail, toPostSummary } from './post.mapper'
import PostRepository from './post.repository'

class PostService {
  // US-22: Danh sách bài viết ở trang admin (gồm cả bản nháp)
  static async listForAdmin(query: AdminPostQuery): Promise<Paginated<PostSummary>> {
    const [posts, total] = await PostRepository.findMany(query)
    return { limit: query.limit, offset: query.offset, total_count: total, entries: posts.map(toPostSummary) }
  }

  static async getForAdmin(id: string): Promise<PostDetail> {
    return toPostDetail(await this.findOrThrow(id))
  }

  // Bài đăng ngay thì ghi thời điểm đăng; người viết là admin đang đăng nhập
  static async create(authorId: string, dto: CreatePostBody): Promise<PostDetail> {
    await this.ensureCategoryExists(dto.categoryId)

    const slug = await this.generateSlug(dto.title)
    const post = await PostRepository.create({
      ...dto,
      slug,
      authorId,
      publishedAt: dto.status === POST_STATUS.PUBLISHED ? new Date() : null
    })
    return toPostDetail(post)
  }

  static async update(id: string, dto: UpdatePostBody): Promise<PostDetail> {
    const post = await this.findOrThrow(id)
    if (dto.categoryId && dto.categoryId !== post.categoryId) await this.ensureCategoryExists(dto.categoryId)

    // Chỉ sinh slug mới khi tiêu đề đổi thật sự để link đã chia sẻ không bị hỏng vô cớ
    const titleChanged = dto.title !== undefined && slugify(dto.title) !== slugify(post.title)
    const slug = titleChanged ? await this.generateSlug(dto.title!, id) : post.slug

    const updated = await PostRepository.update(id, { ...dto, slug, publishedAt: this.nextPublishedAt(post, dto) })
    return toPostDetail(updated)
  }

  static async remove(id: string): Promise<void> {
    await this.findOrThrow(id)
    await PostRepository.softDelete(id)
  }

  // Đăng bài (nháp → đã đăng) thì ghi thời điểm đăng; chuyển về nháp thì xoá; giữ nguyên trạng thái thì không đổi
  private static nextPublishedAt(post: Post, dto: UpdatePostBody): Date | null {
    if (dto.status === undefined || dto.status === post.status) return post.publishedAt
    return dto.status === POST_STATUS.PUBLISHED ? new Date() : null
  }

  private static async findOrThrow(id: string) {
    const post = await PostRepository.findById(id)
    if (!post) throw new NotFoundError(POST_NOT_FOUND_MESSAGE)
    return post
  }

  private static async ensureCategoryExists(categoryId: string) {
    const category = await PostCategoryRepository.findById(categoryId)
    if (!category) throw new BadRequestError('Danh mục bài viết không tồn tại')
  }

  private static async generateSlug(title: string, excludeId?: string) {
    const base = slugify(title)
    return nextAvailableSlug(base, await PostRepository.findSlugsWithBase(base, excludeId))
  }
}

export default PostService
