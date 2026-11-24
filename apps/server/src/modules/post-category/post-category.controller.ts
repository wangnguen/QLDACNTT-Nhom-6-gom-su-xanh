import { Request, Response } from 'express'

import { CreatePostCategoryBody, UpdatePostCategoryBody } from './dto'
import PostCategoryService from './post-category.service'

class PostCategoryController {
  // US-21: Danh mục cho trang tin tức
  static async list(_req: Request, res: Response) {
    return res.ok(await PostCategoryService.list())
  }

  // US-21: Quản lý danh mục bài viết (admin)
  static async listForAdmin(_req: Request, res: Response) {
    return res.ok(await PostCategoryService.listForAdmin())
  }

  static async create(req: Request, res: Response) {
    const category = await PostCategoryService.create(req.body as CreatePostCategoryBody)
    return res.created(category, { message: 'Đã thêm danh mục bài viết' })
  }

  static async update(req: Request<{ id: string }>, res: Response) {
    const category = await PostCategoryService.update(req.params.id, req.body as UpdatePostCategoryBody)
    return res.ok(category, { message: 'Đã cập nhật danh mục bài viết' })
  }

  static async remove(req: Request<{ id: string }>, res: Response) {
    await PostCategoryService.remove(req.params.id)
    return res.ok(null, { message: 'Đã xoá danh mục bài viết' })
  }
}

export default PostCategoryController
