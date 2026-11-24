import { Request, Response } from 'express'

import { getClientIp } from '@modules/payment/payment.controller'
import PaymentService from '@modules/payment/payment.service'

import {
  AdminOrderQuerySchema,
  CancelOrderBody,
  CreateOrderBody,
  MyOrderQuerySchema,
  UpdateOrderStatusBody
} from './dto'
import OrderService from './order.service'

const ADMIN_SUCCESS_MESSAGE: Record<UpdateOrderStatusBody['status'], string> = {
  confirmed: 'Đã xác nhận đơn hàng',
  cancelled: 'Đã huỷ đơn hàng'
}

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

  // US-16: Huỷ đơn hàng
  static async cancel(req: Request<{ id: string }>, res: Response) {
    const order = await OrderService.cancelMine(req.user!.id, req.params.id, req.body as CancelOrderBody)
    return res.ok(order, {
      message:
        order.paymentStatus === 'refund_pending'
          ? 'Đã huỷ đơn hàng. Cửa hàng sẽ hoàn tiền cho bạn trong 3–5 ngày làm việc'
          : 'Đã huỷ đơn hàng'
    })
  }

  // US-18: Quản lý đơn hàng (admin)
  static async listForAdmin(req: Request, res: Response) {
    const orders = await OrderService.listForAdmin(AdminOrderQuerySchema.parse(req.query))
    return res.ok(orders)
  }

  static async countByStatus(_req: Request, res: Response) {
    return res.ok(await OrderService.countByStatus())
  }

  static async getForAdmin(req: Request<{ id: string }>, res: Response) {
    return res.ok(await OrderService.getForAdmin(req.params.id))
  }

  static async updateStatus(req: Request<{ id: string }>, res: Response) {
    const body = req.body as UpdateOrderStatusBody
    const order = await OrderService.updateStatusByAdmin(req.params.id, body)
    return res.ok(order, { message: ADMIN_SUCCESS_MESSAGE[body.status] })
  }

  static async pay(req: Request<{ id: string }>, res: Response) {
    const result = await PaymentService.retry(req.user!.id, req.params.id, getClientIp(req))
    return res.ok(result, { message: 'Đang chuyển sang trang thanh toán' })
  }
}

export default OrderController
