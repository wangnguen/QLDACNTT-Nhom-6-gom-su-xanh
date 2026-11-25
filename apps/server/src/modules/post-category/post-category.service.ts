import { POST_CATEGORY_NOT_FOUND_MESSAGE } from '@common/constants'
import { ConflictError, NotFoundError } from '@common/errors'
import { PostCategoryItem } from '@common/types'
import { slugify } from '@common/utils/slug'

import PostRepository from '@modules/post/post.repository'

import { CreatePostCategoryBody, UpdatePostCategoryBody } from './dto'
import { toPostCategoryItem } from './post-category.mapper'
import PostCategoryRepository from './post-category.repository'

class PostCategoryService {
  // US-21: Danh mục đang hiện ở trang tin tức, kèm số bài đã đăng
  static async list(): Promise<PostCategoryItem[]> {
    const [categories, counts] = await Promise.all([
      PostCategoryRepository.findAll(true),
      PostRepository.countByCategory(true)
    ])
    return categories.map((category) => toPostCategoryItem(category, counts.get(category.id) ?? 0))
  }

  // US-21: Danh sách danh mục ở trang admin (gồm cả danh mục đang ẩn), kèm số bài (cả bản nháp)
  static async listForAdmin(): Promise<PostCategoryItem[]> {
    const [categories, counts] = await Promise.all([PostCategoryRepository.findAll(), PostRepository.countByCategory()])
    return categories.map((category) => toPostCategoryItem(category, counts.get(category.id) ?? 0))
  }

  static async create(dto: CreatePostCategoryBody): Promise<PostCategoryItem> {
    const slug = slugify(dto.name)
    await this.ensureSlugAvailable(slug)

    const category = await PostCategoryRepository.create({ ...dto, slug })
    return toPostCategoryItem(category, 0)
  }

  static async update(id: string, dto: UpdatePostCategoryBody): Promise<PostCategoryItem> {
    const category = await this.findOrThrow(id)

    // Đổi tên thì đổi luôn slug; tên mới không được trùng danh mục khác
    const slug = dto.name === undefined ? category.slug : slugify(dto.name)
    if (slug !== category.slug) await this.ensureSlugAvailable(slug)

    const [updated, postCount] = await Promise.all([
      PostCategoryRepository.update(id, { ...dto, slug }),
      PostRepository.countInCategory(id)
    ])
    return toPostCategoryItem(updated, postCount)
  }

  // US-22: Danh mục còn bài viết (kể cả bản nháp) thì không xoá được
  static async remove(id: string): Promise<void> {
    await this.findOrThrow(id)

    const postCount = await PostRepository.countInCategory(id)
    if (postCount > 0) {
      throw new ConflictError(
        `Danh mục đang có ${postCount} bài viết. Hãy chuyển các bài sang danh mục khác hoặc xoá chúng trước`
      )
    }
    await PostCategoryRepository.softDelete(id)
  }

  static async findOrThrow(id: string) {
    const category = await PostCategoryRepository.findById(id)
    if (!category) throw new NotFoundError(POST_CATEGORY_NOT_FOUND_MESSAGE)
    return category
  }

  private static async ensureSlugAvailable(slug: string) {
    const existing = await PostCategoryRepository.findBySlug(slug)
    if (existing) throw new ConflictError('Đã có danh mục bài viết với tên này')
  }
}

export default PostCategoryService
