import { REVIEW_NOT_FOUND_MESSAGE, REVIEW_STATUS } from '@common/constants'
import { BadRequestError, ConflictError, NotFoundError } from '@common/errors'
import { AdminReviewItem, MyReviewStatus, Paginated, ProductReviews, ReviewItem } from '@common/types'

import ProductRepository from '@modules/product/product.repository'

import { AdminReviewQuery, CreateReviewBody, ModerateReviewBody, ProductReviewQuery, UpdateReviewBody } from './dto'
import { toAdminReviewItem, toRatingSummary, toReviewItem } from './review.mapper'
import ReviewRepository from './review.repository'

const PRODUCT_NOT_FOUND_MESSAGE = 'Không tìm thấy sản phẩm'

export const NOT_PURCHASED_MESSAGE = 'Chỉ khách đã mua và nhận sản phẩm này mới đánh giá được'

class ReviewService {
  // US-24: Đánh giá của sản phẩm (đang hiện), kèm điểm trung bình và số đánh giá theo từng mức sao
  static async listForProduct(slug: string, query: ProductReviewQuery): Promise<ProductReviews> {
    const product = await ProductRepository.findVisibleBySlug(slug)
    if (!product) throw new NotFoundError(PRODUCT_NOT_FOUND_MESSAGE)

    const [[reviews, total], counts] = await Promise.all([
      ReviewRepository.findMany({ ...query, productId: product.id, visibleOnly: true }),
      ReviewRepository.countByRating(product.id)
    ])
    return {
      limit: query.limit,
      offset: query.offset,
      total_count: total,
      entries: reviews.map(toReviewItem),
      summary: toRatingSummary(counts)
    }
  }

  // US-24: Khách đã đánh giá chưa / có được đánh giá không (đã nhận hàng)
  static async getMine(userId: string, slug: string): Promise<MyReviewStatus> {
    const product = await ProductRepository.findVisibleBySlug(slug)
    if (!product) throw new NotFoundError(PRODUCT_NOT_FOUND_MESSAGE)

    const review = await ReviewRepository.findByProductAndUser(product.id, userId)
    if (review)
      return { canReview: false, reason: null, review: { ...toReviewItem(review), isHidden: review.isHidden } }

    const orderId = await ReviewRepository.findDeliveredOrderId(userId, product.id)
    return { canReview: !!orderId, reason: orderId ? null : NOT_PURCHASED_MESSAGE, review: null }
  }

  // US-24: Đánh giá sản phẩm — chỉ khách đã nhận hàng; mỗi sản phẩm một đánh giá (muốn đổi thì sửa)
  static async create(userId: string, { productId, rating, comment }: CreateReviewBody): Promise<ReviewItem> {
    const product = await ProductRepository.findById(productId)
    if (!product) throw new NotFoundError(PRODUCT_NOT_FOUND_MESSAGE)

    if (await ReviewRepository.findByProductAndUser(productId, userId)) {
      throw new ConflictError('Bạn đã đánh giá sản phẩm này rồi, có thể sửa đánh giá cũ')
    }

    const orderId = await ReviewRepository.findDeliveredOrderId(userId, productId)
    if (!orderId) throw new BadRequestError(NOT_PURCHASED_MESSAGE)

    const review = await ReviewRepository.create({ productId, userId, orderId, rating, comment: comment ?? null })
    return toReviewItem(review)
  }

  // US-24: Sửa đánh giá của mình
  static async update(userId: string, id: string, dto: UpdateReviewBody): Promise<ReviewItem> {
    const review = await ReviewRepository.findById(id)
    // Đánh giá của người khác cũng báo không tìm thấy
    if (!review || review.userId !== userId) throw new NotFoundError(REVIEW_NOT_FOUND_MESSAGE)

    const updated = await ReviewRepository.update(id, dto)
    return toReviewItem(updated)
  }

  // US-25: Danh sách đánh giá ở trang admin (cả đánh giá đã ẩn)
  static async listForAdmin({ status, ...query }: AdminReviewQuery): Promise<Paginated<AdminReviewItem>> {
    const isHidden = status === undefined ? undefined : status === REVIEW_STATUS.HIDDEN
    const [reviews, total] = await ReviewRepository.findMany({ ...query, isHidden, withDetails: true })
    return { limit: query.limit, offset: query.offset, total_count: total, entries: reviews.map(toAdminReviewItem) }
  }

  /**
   * US-25: Ẩn / hiện đánh giá (ẩn thì không hiện ở trang sản phẩm và không tính vào điểm trung bình)
   * và trả lời khách — ghi thời điểm trả lời khi nội dung phản hồi thay đổi.
   */
  static async moderate(id: string, { isHidden, adminReply }: ModerateReviewBody): Promise<AdminReviewItem> {
    const review = await ReviewRepository.findByIdWithDetails(id)
    if (!review) throw new NotFoundError(REVIEW_NOT_FOUND_MESSAGE)

    const replyChanged = adminReply !== undefined && adminReply !== review.adminReply
    await ReviewRepository.update(id, {
      ...(isHidden !== undefined && { isHidden }),
      ...(replyChanged && { adminReply, repliedAt: adminReply ? new Date() : null })
    })

    const updated = await ReviewRepository.findByIdWithDetails(id)
    return toAdminReviewItem(updated!)
  }

  // US-25: Xoá đánh giá (spam) — khách có thể đánh giá lại
  static async remove(id: string): Promise<void> {
    const review = await ReviewRepository.findById(id)
    if (!review) throw new NotFoundError(REVIEW_NOT_FOUND_MESSAGE)
    await ReviewRepository.softDelete(id)
  }
}

export default ReviewService
