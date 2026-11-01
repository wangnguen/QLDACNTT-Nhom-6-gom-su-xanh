import { PRODUCT_STATUS } from '@common/constants'
import { BadRequestError, NotFoundError } from '@common/errors'
import { Paginated, ProductDetail, ProductSummary } from '@common/types'
import { nextAvailableSlug, slugify } from '@common/utils/slug'

import CategoryRepository from '@modules/category/category.repository'

import { AdminProductQuery, CreateProductBody, ProductQuery, UpdateProductBody } from './dto'
import { toProductDetail, toProductSummary } from './product.mapper'
import ProductRepository from './product.repository'

export const PRODUCT_NOT_FOUND_MESSAGE = 'Không tìm thấy sản phẩm'

class ProductService {
  // US-08: Danh sách sản phẩm ở trang client — chỉ sản phẩm đang bán thuộc danh mục đang hiện
  static async list({ category, ...query }: ProductQuery): Promise<Paginated<ProductSummary>> {
    const [products, total] = await ProductRepository.findMany({ ...query, categorySlug: category, visibleOnly: true })

    return { limit: query.limit, offset: query.offset, total_count: total, entries: products.map(toProductSummary) }
  }

  // US-09: Chi tiết sản phẩm — sản phẩm đang ẩn trả 404 như không tồn tại
  static async getBySlug(slug: string): Promise<ProductDetail> {
    const product = await ProductRepository.findVisibleBySlug(slug)
    if (!product) throw new NotFoundError(PRODUCT_NOT_FOUND_MESSAGE)
    return toProductDetail(product)
  }

  // US-07: Danh sách sản phẩm ở trang admin (gồm cả sản phẩm đang ẩn)
  static async listForAdmin({ status, ...query }: AdminProductQuery): Promise<Paginated<ProductSummary>> {
    const isActive = status === undefined ? undefined : status === PRODUCT_STATUS.ACTIVE
    const [products, total] = await ProductRepository.findMany({ ...query, isActive })

    return { limit: query.limit, offset: query.offset, total_count: total, entries: products.map(toProductSummary) }
  }

  static async getForAdmin(id: string): Promise<ProductDetail> {
    return toProductDetail(await this.findOrThrow(id))
  }

  static async create(dto: CreateProductBody): Promise<ProductDetail> {
    await this.ensureCategoryExists(dto.categoryId)

    const slug = await this.generateSlug(dto.name)
    const product = await ProductRepository.create({ ...dto, slug })
    return toProductDetail(product)
  }

  static async update(id: string, dto: UpdateProductBody): Promise<ProductDetail> {
    const product = await this.findOrThrow(id)
    if (dto.categoryId && dto.categoryId !== product.categoryId) await this.ensureCategoryExists(dto.categoryId)

    // Chỉ sinh slug mới khi tên đổi thật sự (không tính hoa thường, dấu) để link cũ không bị hỏng vô cớ
    const nameChanged = dto.name !== undefined && slugify(dto.name) !== slugify(product.name)
    const slug = nameChanged ? await this.generateSlug(dto.name!, id) : product.slug

    const updated = await ProductRepository.update(id, { ...dto, slug })
    return toProductDetail(updated)
  }

  static async remove(id: string): Promise<void> {
    await this.findOrThrow(id)
    await ProductRepository.softDelete(id)
  }

  private static async findOrThrow(id: string) {
    const product = await ProductRepository.findById(id)
    if (!product) throw new NotFoundError(PRODUCT_NOT_FOUND_MESSAGE)
    return product
  }

  private static async ensureCategoryExists(categoryId: string) {
    const category = await CategoryRepository.findById(categoryId)
    if (!category) throw new BadRequestError('Danh mục không tồn tại')
  }

  private static async generateSlug(name: string, excludeId?: string) {
    const base = slugify(name)
    return nextAvailableSlug(base, await ProductRepository.findSlugsWithBase(base, excludeId))
  }
}

export default ProductService
