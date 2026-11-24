import { Request, Response } from 'express'

import { VnpayService } from '@common/services'

import {
  AdminTransactionQuerySchema,
  CompleteRefundBody,
  MyTransactionQuerySchema,
  TransactionSummaryQuerySchema
} from './dto'
import { renderSandboxPage } from './payment.sandbox'
import PaymentService from './payment.service'

// Địa chỉ IP của khách gửi sang VNPay (bỏ tiền tố IPv6 của địa chỉ IPv4)
export const getClientIp = (req: Request): string => (req.ip ?? '127.0.0.1').replace(/^::ffff:/, '')

class PaymentController {
  // US-14: Phương thức thanh toán đang nhận
  static methods(_req: Request, res: Response) {
    return res.ok(PaymentService.getMethods())
  }

  // US-17: Lịch sử giao dịch của tôi (query đã qua validateQuery ở route)
  static async listMine(req: Request, res: Response) {
    const transactions = await PaymentService.listMine(req.user!.id, MyTransactionQuerySchema.parse(req.query))
    return res.ok(transactions)
  }

  // US-20: Quản lý giao dịch (admin)
  static async listForAdmin(req: Request, res: Response) {
    const transactions = await PaymentService.listForAdmin(AdminTransactionQuerySchema.parse(req.query))
    return res.ok(transactions)
  }

  static async summary(req: Request, res: Response) {
    return res.ok(await PaymentService.summarize(TransactionSummaryQuerySchema.parse(req.query)))
  }

  static async completeRefund(req: Request<{ id: string }>, res: Response) {
    const transaction = await PaymentService.completeRefund(req.params.id, req.body as CompleteRefundBody)
    return res.ok(transaction, { message: 'Đã xác nhận hoàn tiền' })
  }

  // US-14: Trang kết quả thanh toán gửi lại query VNPay trả về để server kiểm tra chữ ký và ghi nhận
  static async vnpayReturn(req: Request, res: Response) {
    const result = await PaymentService.handleReturn(req.query)
    return res.ok(result, {
      message: result.transaction.status === 'success' ? 'Thanh toán thành công' : result.transaction.message
    })
  }

  // US-14: IPN — VNPay chỉ đọc { RspCode, Message } nên trả JSON thô, không bọc format chung
  static async vnpayIpn(req: Request, res: Response) {
    try {
      return res.status(200).json(await PaymentService.handleIpn(req.query))
    } catch {
      return res.status(200).json({ RspCode: '99', Message: 'Unknown error' })
    }
  }

  // Cổng thanh toán giả lập (chỉ khi chưa cấu hình VNPay và không phải production)
  static sandbox(req: Request, res: Response) {
    if (!VnpayService.isSandbox) return res.notFound({ message: 'Không có cổng thanh toán giả lập' })

    const successUrl = VnpayService.buildSandboxReturn(req.query, true)
    const cancelUrl = VnpayService.buildSandboxReturn(req.query, false)
    if (!successUrl || !cancelUrl) return res.fail({ message: 'Link thanh toán không hợp lệ' })

    const query = req.query as Record<string, string>
    return res.type('html').send(
      renderSandboxPage({
        txnRef: query.vnp_TxnRef,
        amount: Number(query.vnp_Amount) / 100,
        orderInfo: query.vnp_OrderInfo,
        successUrl,
        cancelUrl
      })
    )
  }
}

export default PaymentController
