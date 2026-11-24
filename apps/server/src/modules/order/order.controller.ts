import { Request, Response } from 'express'

import { getClientIp } from '@modules/payment/payment.controller'
import PaymentService from '@modules/payment/payment.service'

import { CreateOrderBody } from './dto'
import OrderService from './order.service'

class OrderController {
  // US-14: Đặt hàng và thanh toán
  static async checkout(req: Request, res: Response) {
    const result = await OrderService.checkout(req.user!.id, req.body as CreateOrderBody, getClientIp(req))
    return res.created(result, {
      message: result.paymentUrl ? 'Đặt hàng thành công, đang chuyển sang trang thanh toán' : 'Đặt hàng thành công'
    })
  }

  static async pay(req: Request<{ id: string }>, res: Response) {
    const result = await PaymentService.retry(req.user!.id, req.params.id, getClientIp(req))
    return res.ok(result, { message: 'Đang chuyển sang trang thanh toán' })
  }
}

export default OrderController
