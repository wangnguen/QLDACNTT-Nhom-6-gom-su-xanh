import { PostCategory } from '@entities/post-category.entity'

import AppDataSource from '@databases/data-source'

type PostCategoryData = Partial<Pick<PostCategory, 'name' | 'slug' | 'description' | 'isActive'>>

class PostCategoryRepository {
  static findAll(activeOnly = false) {
    return this.categoryRepo.find({ where: activeOnly ? { isActive: true } : {}, order: { name: 'ASC' } })
  }

  static findById(id: string) {
    return this.categoryRepo.findOne({ where: { id } })
  }

  static findBySlug(slug: string) {
    return this.categoryRepo.findOne({ where: { slug } })
  }

  static create(data: PostCategoryData & Pick<PostCategory, 'name' | 'slug'>) {
    return this.categoryRepo.save(this.categoryRepo.create(data))
  }

  static async update(id: string, data: PostCategoryData) {
    await this.categoryRepo.update(id, data)
    return this.categoryRepo.findOneOrFail({ where: { id } })
  }

  static softDelete(id: string) {
    return this.categoryRepo.softDelete(id)
  }

  private static get categoryRepo() {
    return AppDataSource.getDataSource().getRepository(PostCategory)
  }
}

export default PostCategoryRepository
