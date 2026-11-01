import { Request, Response } from 'express'

import CategoryService from './category.service'
import { CreateCategoryBody, UpdateCategoryBody } from './dto'

class CategoryController {
  // US-08: Danh mục cho bộ lọc ở trang danh sách sản phẩm
  static async list(_req: Request, res: Response) {
    const categories = await CategoryService.list()
    return res.ok(categories)
  }

  // US-07: Quản lý danh mục (admin)
  static async listForAdmin(_req: Request, res: Response) {
    const categories = await CategoryService.listForAdmin()
    return res.ok(categories)
  }

  static async create(req: Request, res: Response) {
    const category = await CategoryService.create(req.body as CreateCategoryBody)
    return res.created(category, { message: 'Đã thêm danh mục' })
  }

  static async update(req: Request<{ id: string }>, res: Response) {
    const category = await CategoryService.update(req.params.id, req.body as UpdateCategoryBody)
    return res.ok(category, { message: 'Đã cập nhật danh mục' })
  }

  static async remove(req: Request<{ id: string }>, res: Response) {
    await CategoryService.remove(req.params.id)
    return res.ok(null, { message: 'Đã xoá danh mục' })
  }
}

export default CategoryController
