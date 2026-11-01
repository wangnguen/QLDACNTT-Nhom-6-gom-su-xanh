import { ConflictError, NotFoundError } from '@common/errors'
import { CategoryItem } from '@common/types'
import { slugify } from '@common/utils/slug'

import { toCategoryItem } from './category.mapper'
import CategoryRepository from './category.repository'
import { CreateCategoryBody, UpdateCategoryBody } from './dto'

export const CATEGORY_NOT_FOUND_MESSAGE = 'Không tìm thấy danh mục'

class CategoryService {
  // US-08: Danh mục đang hiện ở trang client, kèm số sản phẩm đang bán (dùng cho bộ lọc)
  static async list(): Promise<CategoryItem[]> {
    const [categories, productCounts] = await Promise.all([
      CategoryRepository.findAll(true),
      CategoryRepository.countProductsByCategory(true)
    ])
    return categories.map((category) => toCategoryItem(category, productCounts.get(category.id) ?? 0))
  }

  // US-07: Danh sách danh mục ở trang admin (gồm cả danh mục đang ẩn)
  static async listForAdmin(): Promise<CategoryItem[]> {
    const [categories, productCounts] = await Promise.all([
      CategoryRepository.findAll(),
      CategoryRepository.countProductsByCategory()
    ])
    return categories.map((category) => toCategoryItem(category, productCounts.get(category.id) ?? 0))
  }

  static async create(dto: CreateCategoryBody): Promise<CategoryItem> {
    const slug = slugify(dto.name)
    await this.ensureSlugAvailable(slug)

    const category = await CategoryRepository.create({ ...dto, slug })
    return toCategoryItem(category, 0)
  }

  static async update(id: string, dto: UpdateCategoryBody): Promise<CategoryItem> {
    const category = await this.findOrThrow(id)

    // Đổi tên thì đổi luôn slug; tên mới không được trùng danh mục khác
    const slug = dto.name === undefined ? category.slug : slugify(dto.name)
    if (slug !== category.slug) await this.ensureSlugAvailable(slug)

    const [updated, productCount] = await Promise.all([
      CategoryRepository.update(id, { ...dto, slug }),
      CategoryRepository.countProducts(id)
    ])
    return toCategoryItem(updated, productCount)
  }

  static async remove(id: string): Promise<void> {
    await this.findOrThrow(id)

    const productCount = await CategoryRepository.countProducts(id)
    if (productCount > 0) {
      throw new ConflictError(
        `Danh mục đang có ${productCount} sản phẩm. Hãy chuyển các sản phẩm sang danh mục khác hoặc xoá chúng trước`
      )
    }

    await CategoryRepository.softDelete(id)
  }

  private static async findOrThrow(id: string) {
    const category = await CategoryRepository.findById(id)
    if (!category) throw new NotFoundError(CATEGORY_NOT_FOUND_MESSAGE)
    return category
  }

  // Slug sinh từ tên nên trùng slug nghĩa là trùng tên (không phân biệt hoa thường, dấu)
  private static async ensureSlugAvailable(slug: string) {
    const existing = await CategoryRepository.findBySlug(slug)
    if (existing) throw new ConflictError('Đã có danh mục với tên này')
  }
}

export default CategoryService
