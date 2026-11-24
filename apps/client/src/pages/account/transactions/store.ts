import { create } from 'zustand'
import { paymentsService, ApiError, type MyTransactionQuery, type Paginated, type Transaction } from '@lib/api'

const errorMessage = (err: unknown, fallback: string) => (err instanceof ApiError ? err.message : fallback)

// Chỉ nhận kết quả của lần gọi mới nhất (đổi bộ lọc nhanh không bị kết quả cũ ghi đè)
let latestRequest = 0

interface TransactionsState {
  result: Paginated<Transaction> | null
  loading: boolean
  error: string

  fetch: (query: MyTransactionQuery) => Promise<void>
}

// US-17: Lịch sử giao dịch của tôi
export const useTransactionsStore = create<TransactionsState>((set) => ({
  result: null,
  loading: false,
  error: '',

  fetch: async (query) => {
    const requestId = ++latestRequest
    set({ loading: true, error: '' })
    try {
      const result = await paymentsService.listMine(query)
      if (requestId === latestRequest) set({ result })
    } catch (err) {
      if (requestId === latestRequest) set({ error: errorMessage(err, 'Không tải được lịch sử giao dịch') })
    } finally {
      if (requestId === latestRequest) set({ loading: false })
    }
  }
}))
