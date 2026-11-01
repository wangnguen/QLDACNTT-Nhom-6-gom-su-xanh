import { Request, Response } from 'express'

import { AdminProductQuerySchema, CreateProductBody, UpdateProductBody } from './dto'
import ProductService from './product.service'

class ProductController {
  // US-07: Quản lý sản phẩm (admin)
  static async listForAdmin(req: Request, res: Response) {
    // Express 5 không cho ghi đè req.query nên parse lại (query đã qua validateQuery ở route)
    const products = await ProductService.listForAdmin(AdminProductQuerySchema.parse(req.query))
    return res.ok(products)
  }

  static async getForAdmin(req: Request<{ id: string }>, res: Response) {
    const product = await ProductService.getForAdmin(req.params.id)
    return res.ok(product)
  }

  static async create(req: Request, res: Response) {
    const product = await ProductService.create(req.body as CreateProductBody)
    return res.created(product, { message: 'Đã thêm sản phẩm' })
  }

  static async update(req: Request<{ id: string }>, res: Response) {
    const product = await ProductService.update(req.params.id, req.body as UpdateProductBody)
    return res.ok(product, { message: 'Đã cập nhật sản phẩm' })
  }

  static async remove(req: Request<{ id: string }>, res: Response) {
    await ProductService.remove(req.params.id)
    return res.ok(null, { message: 'Đã xoá sản phẩm' })
  }
}

export default ProductController
