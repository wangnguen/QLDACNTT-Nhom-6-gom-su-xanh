import { Request, Response } from 'express'

import { getClientIp } from '@modules/payment/payment.controller'
import PaymentService from '@modules/payment/payment.service'

import { CreateOrderBody, MyOrderQuerySchema } from './dto'
import OrderService from './order.service'

class OrderController {
  // US-14: Đặt hàng và thanh toán
  static async checkout(req: Request, res: Response) {
    const result = await OrderService.checkout(req.user!.id, req.body as CreateOrderBody, getClientIp(req))
    return res.created(result, {
      message: result.paymentUrl ? 'Đặt hàng thành công, đang chuyển sang trang thanh toán' : 'Đặt hàng thành công'
    })
  }

  // US-15: Đơn hàng của tôi
  // Express 5 không cho ghi đè req.query nên controller parse lại (query đã qua validateQuery ở route)
  static async listMine(req: Request, res: Response) {
    const orders = await OrderService.listMine(req.user!.id, MyOrderQuerySchema.parse(req.query))
    return res.ok(orders)
  }

  static async getMine(req: Request<{ id: string }>, res: Response) {
    const order = await OrderService.getMine(req.user!.id, req.params.id)
    return res.ok(order)
  }

  static async pay(req: Request<{ id: string }>, res: Response) {
    const result = await PaymentService.retry(req.user!.id, req.params.id, getClientIp(req))
    return res.ok(result, { message: 'Đang chuyển sang trang thanh toán' })
  }
}

export default OrderController
