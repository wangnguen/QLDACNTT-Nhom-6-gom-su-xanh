import { Request, Response } from 'express'

import {
  AdminReviewQuerySchema,
  CreateReviewBody,
  ModerateReviewBody,
  ProductReviewQuerySchema,
  UpdateReviewBody
} from './dto'
import ReviewService from './review.service'

// Express 5 không cho ghi đè req.query nên controller parse lại (query đã qua validateQuery ở route)
class ReviewController {
  // US-24: Đánh giá sản phẩm
  static async listForProduct(req: Request<{ slug: string }>, res: Response) {
    const reviews = await ReviewService.listForProduct(req.params.slug, ProductReviewQuerySchema.parse(req.query))
    return res.ok(reviews)
  }

  static async getMine(req: Request<{ slug: string }>, res: Response) {
    return res.ok(await ReviewService.getMine(req.user!.id, req.params.slug))
  }

  static async create(req: Request, res: Response) {
    const review = await ReviewService.create(req.user!.id, req.body as CreateReviewBody)
    return res.created(review, { message: 'Cảm ơn bạn đã đánh giá sản phẩm' })
  }

  static async update(req: Request<{ id: string }>, res: Response) {
    const review = await ReviewService.update(req.user!.id, req.params.id, req.body as UpdateReviewBody)
    return res.ok(review, { message: 'Đã cập nhật đánh giá' })
  }

  // US-25: Quản lý đánh giá (admin)
  static async listForAdmin(req: Request, res: Response) {
    return res.ok(await ReviewService.listForAdmin(AdminReviewQuerySchema.parse(req.query)))
  }

  static async moderate(req: Request<{ id: string }>, res: Response) {
    const body = req.body as ModerateReviewBody
    const review = await ReviewService.moderate(req.params.id, body)
    const message =
      body.isHidden === undefined ? 'Đã lưu phản hồi' : body.isHidden ? 'Đã ẩn đánh giá' : 'Đã hiện lại đánh giá'
    return res.ok(review, { message })
  }

  static async remove(req: Request<{ id: string }>, res: Response) {
    await ReviewService.remove(req.params.id)
    return res.ok(null, { message: 'Đã xoá đánh giá' })
  }
}

export default ReviewController
