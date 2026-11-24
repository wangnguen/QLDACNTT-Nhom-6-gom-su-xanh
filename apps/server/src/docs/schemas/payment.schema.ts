import { z } from 'zod/v4'

import { registry } from '@docs/registry'

import { PAYMENT_METHOD } from '@common/constants'

import { OrderDetailSchema, TransactionSchema, badRequestResponse, notFoundResponse, successWrapper } from './shared'

// ─── US-14: Thanh toán trực tuyến ────────────────────────────────────────────

const TAG = 'Thanh toán (US-14)'

registry.registerPath({
  method: 'get',
  path: '/payments/methods',
  tags: [TAG],
  summary: 'Phương thức thanh toán đang nhận',
  description:
    '`vnpay.enabled = false` khi server production chưa cấu hình VNPay. `sandbox = true`: đang dùng cổng thanh toán giả lập (môi trường phát triển).',
  responses: {
    200: {
      description: 'Danh sách phương thức',
      content: {
        'application/json': {
          schema: successWrapper(
            z.array(
              z.object({
                method: z.enum(PAYMENT_METHOD).meta({ example: 'vnpay' }),
                enabled: z.boolean().meta({ example: true }),
                sandbox: z.boolean().meta({ example: false })
              })
            ),
            '/payments/methods'
          )
        }
      }
    }
  }
})

registry.registerPath({
  method: 'get',
  path: '/payments/vnpay-return',
  tags: [TAG],
  summary: 'Ghi nhận kết quả thanh toán (trang kết quả)',
  description: `Trang \`/payment/result\` của client gửi nguyên query VNPay trả về (\`vnp_*\`). Server kiểm tra chữ ký HMAC-SHA512, số tiền, rồi ghi nhận kết quả.

Gọi lại nhiều lần (hoặc sau IPN) không ghi nhận lại — chỉ trả về trạng thái hiện tại.`,
  request: {
    query: z.object({
      vnp_TxnRef: z.string().meta({ example: 'TT7K3M9QX2' }),
      vnp_Amount: z.string().meta({ example: '93000000' }),
      vnp_ResponseCode: z.string().meta({ example: '00' }),
      vnp_SecureHash: z.string().meta({ example: '3f1c...' })
    })
  },
  responses: {
    200: {
      description: 'Kết quả thanh toán',
      content: {
        'application/json': {
          schema: successWrapper(
            z.object({ transaction: TransactionSchema, order: OrderDetailSchema }),
            '/payments/vnpay-return',
            200,
            'Thanh toán thành công'
          )
        }
      }
    },
    400: badRequestResponse('Kết quả thanh toán không hợp lệ (sai chữ ký)'),
    404: notFoundResponse('Không tìm thấy giao dịch')
  }
})

registry.registerPath({
  method: 'get',
  path: '/payments/vnpay-ipn',
  tags: [TAG],
  summary: 'IPN — VNPay báo kết quả thanh toán',
  description:
    'VNPay gọi trực tiếp (cần URL public). Trả `{ RspCode, Message }` theo đặc tả VNPay: `00` thành công, `01` không tìm thấy, `02` đã ghi nhận trước đó, `04` sai số tiền, `97` sai chữ ký.',
  responses: {
    200: {
      description: 'Phản hồi cho VNPay',
      content: {
        'application/json': {
          schema: z.object({
            RspCode: z.string().meta({ example: '00' }),
            Message: z.string().meta({ example: 'Confirm Success' })
          })
        }
      }
    }
  }
})
