import { Request, Response } from 'express'

import CartService from './cart.service'
import { AddCartItemBody, UpdateCartItemBody } from './dto'

class CartController {
  // US-10: Quản lý giỏ hàng
  static async getCart(req: Request, res: Response) {
    const cart = await CartService.getCart(req.user!.id)
    return res.ok(cart)
  }

  static async addItem(req: Request, res: Response) {
    const cart = await CartService.addItem(req.user!.id, req.body as AddCartItemBody)
    return res.ok(cart, { message: 'Đã thêm vào giỏ hàng' })
  }

  static async updateItem(req: Request<{ productId: string }>, res: Response) {
    const cart = await CartService.updateItem(req.user!.id, req.params.productId, req.body as UpdateCartItemBody)
    return res.ok(cart, { message: 'Đã cập nhật số lượng' })
  }

  static async removeItem(req: Request<{ productId: string }>, res: Response) {
    const cart = await CartService.removeItem(req.user!.id, req.params.productId)
    return res.ok(cart, { message: 'Đã xoá sản phẩm khỏi giỏ hàng' })
  }

  static async clear(req: Request, res: Response) {
    const cart = await CartService.clear(req.user!.id)
    return res.ok(cart, { message: 'Đã xoá toàn bộ giỏ hàng' })
  }
}

export default CartController
