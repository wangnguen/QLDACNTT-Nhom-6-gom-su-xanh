import { Category } from '@entities/category.entity'
import { Product } from '@entities/product.entity'

import AppDataSource from '@databases/data-source'

type CategoryData = Partial<Pick<Category, 'name' | 'slug' | 'description' | 'imageUrl' | 'isActive'>>

class CategoryRepository {
  static findAll(activeOnly = false) {
    return this.categoryRepo.find({ where: activeOnly ? { isActive: true } : {}, order: { name: 'ASC' } })
  }

  static findById(id: string) {
    return this.categoryRepo.findOne({ where: { id } })
  }

  static findBySlug(slug: string) {
    return this.categoryRepo.findOne({ where: { slug } })
  }

  // Số sản phẩm (chưa xoá) của từng danh mục; `activeOnly` = chỉ đếm sản phẩm đang bán
  static async countProductsByCategory(activeOnly = false): Promise<Map<string, number>> {
    const query = this.productRepo
      .createQueryBuilder('product')
      .select('product.categoryId', 'categoryId')
      .addSelect('COUNT(*)::int', 'count')
      .groupBy('product.categoryId')
    if (activeOnly) query.where('product.isActive = true')

    const rows = await query.getRawMany<{ categoryId: string; count: number }>()

    return new Map(rows.map((row) => [row.categoryId, row.count]))
  }

  static countProducts(categoryId: string) {
    return this.productRepo.count({ where: { categoryId } })
  }

  static create(data: CategoryData & Pick<Category, 'name' | 'slug'>) {
    return this.categoryRepo.save(this.categoryRepo.create(data))
  }

  static async update(id: string, data: CategoryData) {
    await this.categoryRepo.update(id, data)
    return this.categoryRepo.findOneOrFail({ where: { id } })
  }

  static softDelete(id: string) {
    return this.categoryRepo.softDelete(id)
  }

  private static get categoryRepo() {
    return AppDataSource.getDataSource().getRepository(Category)
  }

  private static get productRepo() {
    return AppDataSource.getDataSource().getRepository(Product)
  }
}

export default CategoryRepository
