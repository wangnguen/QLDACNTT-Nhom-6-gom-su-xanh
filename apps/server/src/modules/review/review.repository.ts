import { Brackets } from 'typeorm'

import { ORDER_STATUS } from '@common/constants'

import { Order } from '@entities/order.entity'
import { ProductReview } from '@entities/product-review.entity'

import AppDataSource from '@databases/data-source'

export type ReviewFilter = {
  productId?: string
  rating?: number
  // Chỉ đánh giá đang hiện (trang client)
  visibleOnly?: boolean
  // Trang admin: lọc đang hiện / đã ẩn, tìm kiếm và load kèm sản phẩm, đơn hàng
  isHidden?: boolean
  search?: string
  withDetails?: boolean
  limit: number
  offset: number
}

const escapeLike = (value: string) => value.replace(/[\\%_]/g, (char) => `\\${char}`)

type ReviewData = Partial<Pick<ProductReview, 'rating' | 'comment' | 'isHidden' | 'adminReply' | 'repliedAt'>>

class ReviewRepository {
  // Mới nhất lên trước
  static findMany(filter: ReviewFilter): Promise<[ProductReview[], number]> {
    const query = this.reviewRepo.createQueryBuilder('review').innerJoinAndSelect('review.user', 'user')

    if (filter.productId) query.andWhere('review.productId = :productId', { productId: filter.productId })
    if (filter.rating) query.andWhere('review.rating = :rating', { rating: filter.rating })
    if (filter.visibleOnly) query.andWhere('review.isHidden = false')
    if (filter.isHidden !== undefined) query.andWhere('review.isHidden = :isHidden', { isHidden: filter.isHidden })

    if (filter.withDetails || filter.search) {
      query.innerJoinAndSelect('review.product', 'product').leftJoinAndSelect('review.order', 'order')
    }
    if (filter.search) {
      const keyword = `%${escapeLike(filter.search)}%`
      query.andWhere(
        new Brackets((where) =>
          where
            .where('review.comment ILIKE :keyword', { keyword })
            .orWhere('product.name ILIKE :keyword')
            .orWhere('user.fullName ILIKE :keyword')
            .orWhere('user.email ILIKE :keyword')
        )
      )
    }

    return query
      .orderBy('review.createdAt', 'DESC')
      .addOrderBy('review.id', 'ASC')
      .skip(filter.offset)
      .take(filter.limit)
      .getManyAndCount()
  }

  // Số đánh giá đang hiện theo từng mức sao của một sản phẩm
  static async countByRating(productId: string): Promise<Map<number, number>> {
    const rows = await this.reviewRepo
      .createQueryBuilder('review')
      .select('review.rating', 'rating')
      .addSelect('COUNT(*)::int', 'count')
      .where('review.productId = :productId', { productId })
      .andWhere('review.isHidden = false')
      .groupBy('review.rating')
      .getRawMany<{ rating: number; count: number }>()
    return new Map(rows.map((row) => [Number(row.rating), row.count]))
  }

  static findById(id: string) {
    return this.reviewRepo.findOne({ where: { id }, relations: { user: true } })
  }

  static findByIdWithDetails(id: string) {
    return this.reviewRepo.findOne({ where: { id }, relations: { user: true, product: true, order: true } })
  }

  static softDelete(id: string) {
    return this.reviewRepo.softDelete(id)
  }

  static findByProductAndUser(productId: string, userId: string) {
    return this.reviewRepo.findOne({ where: { productId, userId }, relations: { user: true } })
  }

  // Đơn đã giao gần nhất của tài khoản có chứa sản phẩm — null nếu chưa từng nhận sản phẩm này
  static async findDeliveredOrderId(userId: string, productId: string): Promise<string | null> {
    const row = await AppDataSource.getDataSource()
      .getRepository(Order)
      .createQueryBuilder('order')
      .innerJoin('order.items', 'item', 'item.productId = :productId', { productId })
      .select('order.id', 'id')
      .where('order.userId = :userId', { userId })
      .andWhere('order.status = :status', { status: ORDER_STATUS.DELIVERED })
      .orderBy('order.deliveredAt', 'DESC')
      .limit(1)
      .getRawOne<{ id: string }>()
    return row?.id ?? null
  }

  static async create(data: Pick<ProductReview, 'productId' | 'userId' | 'orderId' | 'rating' | 'comment'>) {
    const review = await this.reviewRepo.save(this.reviewRepo.create(data))
    return (await this.findById(review.id))!
  }

  static async update(id: string, data: ReviewData) {
    await this.reviewRepo.update(id, data)
    return (await this.findById(id))!
  }

  private static get reviewRepo() {
    return AppDataSource.getDataSource().getRepository(ProductReview)
  }
}

export default ReviewRepository
