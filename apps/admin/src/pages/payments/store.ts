import { create } from 'zustand'
import { toast } from 'sonner'
import {
  paymentsService,
  ApiError,
  type AdminTransaction,
  type AdminTransactionQuery,
  type Paginated,
  type TransactionSummary
} from '@lib/api'

const errorMessage = (err: unknown, fallback: string) => (err instanceof ApiError ? err.message : fallback)

// Chỉ nhận kết quả của lần gọi mới nhất (đổi bộ lọc nhanh không bị kết quả cũ ghi đè)
let latestRequest = 0

interface PaymentsState {
  result: Paginated<AdminTransaction> | null
  summary: TransactionSummary | null
  loading: boolean
  loadError: string
  refundingId: string | null

  fetch: (query: AdminTransactionQuery) => Promise<void>
  fetchSummary: (range: { from?: string; to?: string }) => Promise<void>
  // Trả về true khi xác nhận hoàn tiền thành công
  completeRefund: (transaction: AdminTransaction, referenceNo: string, note: string) => Promise<boolean>
}

// US-20: Quản lý giao dịch thanh toán
export const usePaymentsStore = create<PaymentsState>((set) => ({
  result: null,
  summary: null,
  loading: false,
  loadError: '',
  refundingId: null,

  fetch: async (query) => {
    const requestId = ++latestRequest
    set({ loading: true, loadError: '' })
    try {
      const result = await paymentsService.list(query)
      if (requestId === latestRequest) set({ result })
    } catch (err) {
      if (requestId === latestRequest) set({ loadError: errorMessage(err, 'Không tải được danh sách giao dịch') })
    } finally {
      if (requestId === latestRequest) set({ loading: false })
    }
  },

  fetchSummary: async (range) => {
    try {
      set({ summary: await paymentsService.summary(range) })
    } catch {
      // Không có số tổng hợp thì danh sách vẫn dùng được
    }
  },

  completeRefund: async (transaction, referenceNo, note) => {
    set({ refundingId: transaction.id })
    try {
      const updated = await paymentsService.completeRefund(
        transaction.id,
        referenceNo.trim() || null,
        note.trim() || null
      )
      set((state) => ({
        result: state.result && {
          ...state.result,
          entries: state.result.entries.map((t) => (t.id === updated.id ? updated : t))
        }
      }))
      toast.success(`Đã xác nhận hoàn ${transaction.code} cho ${transaction.customer.fullName}`)
      return true
    } catch (err) {
      toast.error(errorMessage(err, 'Không xác nhận được hoàn tiền'))
      return false
    } finally {
      set({ refundingId: null })
    }
  }
}))
