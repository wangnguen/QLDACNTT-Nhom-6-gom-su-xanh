import { beforeEach, describe, expect, it, vi } from 'vitest'

import StatsRepository from '@modules/stats/stats.repository'
import StatsService, { listPeriods, vnDate } from '@modules/stats/stats.service'

vi.mock('@modules/stats/stats.repository', () => ({
  default: {
    deliveredTotals: vi.fn(),
    countPlaced: vi.fn(),
    countCancelled: vi.fn(),
    refundedAmount: vi.fn(),
    workshopRevenue: vi.fn(),
    revenueSeries: vi.fn(),
    topProducts: vi.fn(),
    revenueByPaymentMethod: vi.fn()
  }
}))

const repo = vi.mocked(StatsRepository)

beforeEach(() => {
  vi.resetAllMocks()
  repo.deliveredTotals.mockResolvedValue({ revenue: 0, orders: 0 })
  repo.countPlaced.mockResolvedValue(0)
  repo.countCancelled.mockResolvedValue(0)
  repo.refundedAmount.mockResolvedValue(0)
  repo.workshopRevenue.mockResolvedValue(0)
  repo.revenueSeries.mockResolvedValue([])
  repo.topProducts.mockResolvedValue([])
  repo.revenueByPaymentMethod.mockResolvedValue([])
})

describe('vnDate / listPeriods', () => {
  it('ngày theo giờ Việt Nam (23h UTC đã sang ngày mới ở Việt Nam)', () => {
    expect(vnDate(new Date('2026-11-23T23:00:00.000Z'))).toBe('2026-11-24')
    expect(vnDate(new Date('2026-11-24T05:00:00.000Z'), -29)).toBe('2026-10-26')
  })

  it('đủ mọi ngày / tháng trong khoảng', () => {
    expect(listPeriods('2026-02-27', '2026-03-02', 'day')).toEqual([
      '2026-02-27',
      '2026-02-28',
      '2026-03-01',
      '2026-03-02'
    ])
    expect(listPeriods('2025-11-15', '2026-02-03', 'month')).toEqual(['2025-11', '2025-12', '2026-01', '2026-02'])
  })
})

describe('StatsService.revenue', () => {
  it('mặc định 30 ngày gần nhất theo giờ Việt Nam, kỳ trước cùng độ dài', async () => {
    const result = await StatsService.revenue({ groupBy: 'day' }, new Date('2026-11-24T05:00:00.000Z'))

    expect(result).toMatchObject({ from: '2026-10-26', to: '2026-11-24', groupBy: 'day' })
    expect(repo.deliveredTotals).toHaveBeenNthCalledWith(1, {
      start: new Date('2026-10-25T17:00:00.000Z'),
      end: new Date('2026-11-24T17:00:00.000Z')
    })
    expect(repo.deliveredTotals).toHaveBeenNthCalledWith(2, {
      start: new Date('2026-09-25T17:00:00.000Z'),
      end: new Date('2026-10-25T17:00:00.000Z')
    })
    expect(result.series).toHaveLength(30)
  })

  it('tính trung bình mỗi đơn, điền 0 cho ngày không có đơn và đủ mọi phương thức thanh toán', async () => {
    repo.deliveredTotals.mockResolvedValueOnce({ revenue: 1_000_000, orders: 3 })
    repo.countPlaced.mockResolvedValueOnce(5)
    repo.revenueSeries.mockResolvedValue([{ period: '2026-11-02', revenue: 1_000_000, orders: 3 }])
    repo.revenueByPaymentMethod.mockResolvedValue([{ method: 'vnpay', revenue: 1_000_000, orders: 3 }])

    const result = await StatsService.revenue({ from: '2026-11-01', to: '2026-11-03', groupBy: 'day' })

    expect(result.summary).toMatchObject({
      revenue: 1_000_000,
      deliveredOrders: 3,
      averageOrderValue: 333_333,
      newOrders: 5
    })
    expect(result.previous).toMatchObject({ revenue: 0, averageOrderValue: 0 })
    expect(result.series).toEqual([
      { period: '2026-11-01', revenue: 0, orders: 0 },
      { period: '2026-11-02', revenue: 1_000_000, orders: 3 },
      { period: '2026-11-03', revenue: 0, orders: 0 }
    ])
    expect(result.byPaymentMethod).toEqual([
      { method: 'cod', revenue: 0, orders: 0 },
      { method: 'vnpay', revenue: 1_000_000, orders: 3 }
    ])
    expect(repo.topProducts).toHaveBeenCalledWith(expect.any(Object), 5)
  })

  it('nhóm theo tháng', async () => {
    const result = await StatsService.revenue({ from: '2026-01-15', to: '2026-03-10', groupBy: 'month' })

    expect(repo.revenueSeries).toHaveBeenCalledWith(expect.any(Object), 'month')
    expect(result.series.map((point) => point.period)).toEqual(['2026-01', '2026-02', '2026-03'])
  })
})
