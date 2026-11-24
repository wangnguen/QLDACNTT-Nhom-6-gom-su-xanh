import { Request, Response } from 'express'

import { AdminPostQuerySchema, CreatePostBody, PostQuerySchema, UpdatePostBody } from './dto'
import PostService from './post.service'

const PUBLISHED_MESSAGE = { draft: 'Đã lưu nháp', published: 'Đã đăng bài' }

// Express 5 không cho ghi đè req.query nên controller parse lại (query đã qua validateQuery ở route)
class PostController {
  // US-23: Xem tin tức / blog
  static async list(req: Request, res: Response) {
    return res.ok(await PostService.list(PostQuerySchema.parse(req.query)))
  }

  static async getBySlug(req: Request<{ slug: string }>, res: Response) {
    return res.ok(await PostService.getBySlug(req.params.slug))
  }

  // US-22: Quản lý bài viết (admin)
  static async listForAdmin(req: Request, res: Response) {
    return res.ok(await PostService.listForAdmin(AdminPostQuerySchema.parse(req.query)))
  }

  static async getForAdmin(req: Request<{ id: string }>, res: Response) {
    return res.ok(await PostService.getForAdmin(req.params.id))
  }

  static async create(req: Request, res: Response) {
    const post = await PostService.create(req.user!.id, req.body as CreatePostBody)
    return res.created(post, { message: PUBLISHED_MESSAGE[post.status] })
  }

  static async update(req: Request<{ id: string }>, res: Response) {
    const post = await PostService.update(req.params.id, req.body as UpdatePostBody)
    return res.ok(post, { message: 'Đã cập nhật bài viết' })
  }

  static async remove(req: Request<{ id: string }>, res: Response) {
    await PostService.remove(req.params.id)
    return res.ok(null, { message: 'Đã xoá bài viết' })
  }
}

export default PostController
