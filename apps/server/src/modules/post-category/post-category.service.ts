import { POST_CATEGORY_NOT_FOUND_MESSAGE } from '@common/constants'
import { ConflictError, NotFoundError } from '@common/errors'
import { PostCategoryItem } from '@common/types'
import { slugify } from '@common/utils/slug'

import { CreatePostCategoryBody, UpdatePostCategoryBody } from './dto'
import { toPostCategoryItem } from './post-category.mapper'
import PostCategoryRepository from './post-category.repository'

class PostCategoryService {
  // US-21: Danh mục đang hiện ở trang tin tức
  static async list(): Promise<PostCategoryItem[]> {
    const categories = await PostCategoryRepository.findAll(true)
    return categories.map((category) => toPostCategoryItem(category, 0))
  }

  // US-21: Danh sách danh mục ở trang admin (gồm cả danh mục đang ẩn)
  static async listForAdmin(): Promise<PostCategoryItem[]> {
    const categories = await PostCategoryRepository.findAll()
    return categories.map((category) => toPostCategoryItem(category, 0))
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

    const updated = await PostCategoryRepository.update(id, { ...dto, slug })
    return toPostCategoryItem(updated, 0)
  }

  static async remove(id: string): Promise<void> {
    await this.findOrThrow(id)
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
