import { describe, expect, it } from 'vitest'

import { RevenueQuerySchema } from '@modules/stats/dto'

describe('RevenueQuerySchema', () => {
  it('mặc định nhóm theo ngày, khoảng ngày không bắt buộc', () => {
    expect(RevenueQuerySchema.parse({})).toEqual({ groupBy: 'day' })
    expect(RevenueQuerySchema.parse({ from: '2026-01-01', to: '2026-12-31', groupBy: 'month' })).toEqual({
      from: '2026-01-01',
      to: '2026-12-31',
      groupBy: 'month'
    })
  })

  it.each([
    ['từ ngày sau đến ngày', { from: '2026-12-01', to: '2026-11-01' }],
    ['ngày sai định dạng', { from: '01/11/2026' }],
    ['nhóm lạ', { groupBy: 'week' }],
    ['xem theo ngày quá 1 năm', { from: '2025-01-01', to: '2026-06-30' }]
  ])('từ chối khi %s', (_case, query) => {
    expect(RevenueQuerySchema.safeParse(query).success).toBe(false)
  })
})
