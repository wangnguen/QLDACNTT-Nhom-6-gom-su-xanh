import { Brackets, SelectQueryBuilder } from 'typeorm'

import { PostStatus } from '@common/constants'
import { slugify } from '@common/utils/slug'

import { Post } from '@entities/post.entity'

import AppDataSource from '@databases/data-source'

export type PostFilter = {
  search?: string
  categoryId?: string
  status?: PostStatus
  limit: number
  offset: number
}

type PostData = Partial<
  Pick<
    Post,
    'title' | 'slug' | 'excerpt' | 'content' | 'coverImageUrl' | 'categoryId' | 'status' | 'publishedAt' | 'authorId'
  >
>

const escapeLike = (value: string) => value.replace(/[\\%_]/g, (char) => `\\${char}`)

class PostRepository {
  // US-22: Trang admin — mới sửa lên trước
  static findMany(filter: PostFilter): Promise<[Post[], number]> {
    const query = this.baseQuery()

    if (filter.search) this.applySearch(query, filter.search)
    if (filter.categoryId) query.andWhere('post.categoryId = :categoryId', { categoryId: filter.categoryId })
    if (filter.status) query.andWhere('post.status = :status', { status: filter.status })

    return query
      .orderBy('post.updatedAt', 'DESC')
      .addOrderBy('post.id', 'ASC')
      .skip(filter.offset)
      .take(filter.limit)
      .getManyAndCount()
  }

  static findById(id: string) {
    return this.baseQuery().where('post.id = :id', { id }).getOne()
  }

  // Các slug đang dùng có dạng `base` hoặc `base-<số>` (bỏ qua bài `excludeId` khi đang sửa chính nó)
  static async findSlugsWithBase(base: string, excludeId?: string): Promise<string[]> {
    const query = this.postRepo
      .createQueryBuilder('post')
      .select('post.slug', 'slug')
      .where('(post.slug = :base OR post.slug LIKE :pattern)', { base, pattern: `${escapeLike(base)}-%` })
    if (excludeId) query.andWhere('post.id != :excludeId', { excludeId })

    const rows = await query.getRawMany<{ slug: string }>()
    return rows.map((row) => row.slug)
  }

  // Số bài theo danh mục; `publishedOnly` = chỉ đếm bài đã đăng
  static async countByCategory(publishedOnly = false): Promise<Map<string, number>> {
    const query = this.postRepo
      .createQueryBuilder('post')
      .select('post.categoryId', 'categoryId')
      .addSelect('COUNT(*)::int', 'count')
      .groupBy('post.categoryId')
    if (publishedOnly) query.where("post.status = 'published' AND post.publishedAt <= now()")

    const rows = await query.getRawMany<{ categoryId: string; count: number }>()
    return new Map(rows.map((row) => [row.categoryId, row.count]))
  }

  static countInCategory(categoryId: string) {
    return this.postRepo.count({ where: { categoryId } })
  }

  static async create(data: PostData & Pick<Post, 'title' | 'slug' | 'content' | 'categoryId'>) {
    const post = await this.postRepo.save(this.postRepo.create(data))
    return (await this.findById(post.id))!
  }

  static async update(id: string, data: PostData) {
    await this.postRepo.update(id, data)
    return (await this.findById(id))!
  }

  static softDelete(id: string) {
    return this.postRepo.softDelete(id)
  }

  // Tìm theo tiêu đề có dấu ("nghệ nhân") hoặc không dấu ("nghe nhan") — bản không dấu so với slug
  static applySearch(query: SelectQueryBuilder<Post>, search: string) {
    const slugKeyword = slugify(search)
    query.andWhere(
      new Brackets((where) => {
        where.where('post.title ILIKE :keyword', { keyword: `%${escapeLike(search)}%` })
        if (slugKeyword) where.orWhere('post.slug LIKE :slugKeyword', { slugKeyword: `%${slugKeyword}%` })
      })
    )
  }

  private static baseQuery(): SelectQueryBuilder<Post> {
    return this.postRepo
      .createQueryBuilder('post')
      .innerJoinAndSelect('post.category', 'category')
      .leftJoinAndSelect('post.author', 'author')
  }

  private static get postRepo() {
    return AppDataSource.getDataSource().getRepository(Post)
  }
}

export default PostRepository
