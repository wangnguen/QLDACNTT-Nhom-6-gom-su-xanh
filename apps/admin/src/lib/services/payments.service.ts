import { http } from '../axios'
import type { AdminTransaction, AdminTransactionQuery, Paginated, TransactionSummary } from '../types'

// US-20: Quản lý giao dịch thanh toán
export async function list(query: AdminTransactionQuery): Promise<Paginated<AdminTransaction>> {
  const { data } = await http.get<Paginated<AdminTransaction>>('/admin/payments', { params: query })
  return data
}

// Tiền đã nhận / đã hoàn trong khoảng ngày; yêu cầu hoàn đang chờ tính mọi thời điểm
export async function summary(range: { from?: string; to?: string }): Promise<TransactionSummary> {
  const { data } = await http.get<TransactionSummary>('/admin/payments/summary', { params: range })
  return data
}

// Xác nhận đã hoàn tiền cho khách (kèm mã tham chiếu ngân hàng)
export async function completeRefund(
  id: string,
  referenceNo: string | null,
  note: string | null
): Promise<AdminTransaction> {
  const { data } = await http.patch<AdminTransaction>(`/admin/payments/${id}/refund`, { referenceNo, note })
  return data
}

export const paymentsService = {
  list,
  summary,
  completeRefund
}
