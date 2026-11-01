import { Brackets, SelectQueryBuilder } from 'typeorm'

import { PRODUCT_SORT, ProductSort } from '@common/constants'
import { slugify } from '@common/utils/slug'

import { CartItem } from '@entities/cart-item.entity'
import { Product } from '@entities/product.entity'

import AppDataSource from '@databases/data-source'

export type ProductFilter = {
  search?: string
  categoryId?: string
  categorySlug?: string
  isActive?: boolean
  // Chỉ lấy sản phẩm khách được thấy: sản phẩm đang bán và danh mục đang hiện
  visibleOnly?: boolean
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  sort: ProductSort
  limit: number
  offset: number
}

type ProductData = Partial<
  Pick<
    Product,
    | 'name'
    | 'slug'
    | 'categoryId'
    | 'price'
    | 'stock'
    | 'description'
    | 'material'
    | 'dimensions'
    | 'imageUrls'
    | 'isActive'
  >
>

const escapeLike = (value: string) => value.replace(/[\\%_]/g, (char) => `\\${char}`)

class ProductRepository {
  static findMany(filter: ProductFilter): Promise<[Product[], number]> {
    const query = this.productRepo.createQueryBuilder('product').innerJoinAndSelect('product.category', 'category')

    if (filter.visibleOnly) query.andWhere('product.isActive = true AND category.isActive = true')
    if (filter.search) this.applySearch(query, filter.search)
    if (filter.categoryId) query.andWhere('product.categoryId = :categoryId', { categoryId: filter.categoryId })
    if (filter.categorySlug) query.andWhere('category.slug = :categorySlug', { categorySlug: filter.categorySlug })
    if (filter.isActive !== undefined) query.andWhere('product.isActive = :isActive', { isActive: filter.isActive })
    if (filter.minPrice !== undefined) query.andWhere('product.price >= :minPrice', { minPrice: filter.minPrice })
    if (filter.maxPrice !== undefined) query.andWhere('product.price <= :maxPrice', { maxPrice: filter.maxPrice })
    if (filter.inStock) query.andWhere('product.stock > 0')

    this.applySort(query, filter.sort)
    return query.skip(filter.offset).take(filter.limit).getManyAndCount()
  }

  static findById(id: string) {
    return this.productRepo.findOne({ where: { id }, relations: { category: true } })
  }

  // Sản phẩm khách được xem: đang bán và thuộc danh mục đang hiện
  static findVisibleBySlug(slug: string) {
    return this.productRepo
      .createQueryBuilder('product')
      .innerJoinAndSelect('product.category', 'category')
      .where('product.slug = :slug', { slug })
      .andWhere('product.isActive = true AND category.isActive = true')
      .getOne()
  }

  // Các slug đang dùng có dạng `base` hoặc `base-<số>` (bỏ qua sản phẩm `excludeId` khi đang sửa chính nó)
  static async findSlugsWithBase(base: string, excludeId?: string): Promise<string[]> {
    const query = this.productRepo
      .createQueryBuilder('product')
      .select('product.slug', 'slug')
      .where('(product.slug = :base OR product.slug LIKE :pattern)', { base, pattern: `${escapeLike(base)}-%` })
    if (excludeId) query.andWhere('product.id != :excludeId', { excludeId })

    const rows = await query.getRawMany<{ slug: string }>()
    return rows.map((row) => row.slug)
  }

  static async create(data: ProductData & Pick<Product, 'name' | 'slug' | 'categoryId' | 'price' | 'imageUrls'>) {
    const product = await this.productRepo.save(this.productRepo.create(data))
    return this.findByIdOrFail(product.id)
  }

  static async update(id: string, data: ProductData) {
    await this.productRepo.update(id, data)
    return this.findByIdOrFail(id)
  }

  // Sản phẩm đã xoá không mua được nữa nên bỏ luôn khỏi mọi giỏ hàng
  static softDelete(id: string) {
    return AppDataSource.getDataSource().transaction(async (manager) => {
      await manager.getRepository(CartItem).delete({ productId: id })
      await manager.getRepository(Product).softDelete(id)
    })
  }

  private static findByIdOrFail(id: string) {
    return this.productRepo.findOneOrFail({ where: { id }, relations: { category: true } })
  }

  // Tìm theo tên có dấu ("bình hoa") hoặc không dấu ("binh hoa") — bản không dấu so với slug
  private static applySearch(query: SelectQueryBuilder<Product>, search: string) {
    const slugKeyword = slugify(search)
    query.andWhere(
      new Brackets((where) => {
        where.where('product.name ILIKE :keyword', { keyword: `%${escapeLike(search)}%` })
        if (slugKeyword) where.orWhere('product.slug LIKE :slugKeyword', { slugKeyword: `%${slugKeyword}%` })
      })
    )
  }

  private static applySort(query: SelectQueryBuilder<Product>, sort: ProductSort) {
    switch (sort) {
      case PRODUCT_SORT.PRICE_ASC:
        query.orderBy('product.price', 'ASC')
        break
      case PRODUCT_SORT.PRICE_DESC:
        query.orderBy('product.price', 'DESC')
        break
      case PRODUCT_SORT.NAME_ASC:
        query.orderBy('product.name', 'ASC')
        break
      default:
        query.orderBy('product.createdAt', 'DESC')
    }
    // Thứ tự ổn định giữa các trang khi giá trị sắp xếp bằng nhau
    query.addOrderBy('product.id', 'ASC')
  }

  private static get productRepo() {
    return AppDataSource.getDataSource().getRepository(Product)
  }
}

export default ProductRepository
