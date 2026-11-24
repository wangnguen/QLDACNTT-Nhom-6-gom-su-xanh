import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarCheck,
  CircleX,
  HandCoins,
  PackageCheck,
  ReceiptText,
  RotateCw,
  Undo2,
  Wallet
} from 'lucide-react'
import type { RevenueSummary, StatsGroupBy } from '@lib/api'
import { cn, formatPrice } from '@lib/utils'
import { PageHeader, Thumbnail } from '@components/ui'
import { useAuthStore } from '@stores/authStore'
import { RevenueChart } from './components/RevenueChart'
import { periodLabel } from './components/periodLabel'
import { useDashboardStore } from './store'

type Preset = '7d' | '30d' | '90d' | 'year' | 'custom'

const PRESETS: { value: Preset; label: string }[] = [
  { value: '7d', label: '7 ngày' },
  { value: '30d', label: '30 ngày' },
  { value: '90d', label: '90 ngày' },
  { value: 'year', label: 'Năm nay' },
  { value: 'custom', label: 'Tuỳ chọn' }
]

const VN_OFFSET_MS = 7 * 60 * 60 * 1000
const vnDate = (addDays = 0) =>
  new Date(Date.now() + VN_OFFSET_MS + addDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

const rangeOf = (preset: Exclude<Preset, 'custom'>): { from: string; to: string; groupBy: StatsGroupBy } => {
  const to = vnDate()
  if (preset === 'year') return { from: `${to.slice(0, 4)}-01-01`, to, groupBy: 'month' }
  const days = { '7d': 7, '30d': 30, '90d': 90 }[preset]
  return { from: vnDate(-(days - 1)), to, groupBy: 'day' }
}

const dateInput =
  'rounded-xl border border-clay bg-cream px-3 py-2 text-sm text-forest outline-none transition focus:border-teal focus:ring-4 focus:ring-teal/15'

// Tăng / giảm so với kỳ trước — chỉ dùng mũi tên + chữ, không dựa vào màu
function Delta({ current, previous, inverse }: { current: number; previous: number; inverse?: boolean }) {
  if (previous === 0) {
    return <span className='text-xs text-muted'>{current === 0 ? 'Không đổi' : 'Kỳ trước chưa có'}</span>
  }
  const change = ((current - previous) / previous) * 100
  const up = change >= 0
  const good = inverse ? !up : up
  const Icon = up ? ArrowUpRight : ArrowDownRight
  return (
    <span className={cn('inline-flex items-center gap-0.5 text-xs font-semibold', good ? 'text-teal' : 'text-danger')}>
      <Icon size={14} aria-hidden />
      {up ? '+' : ''}
      {change.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}% so với kỳ trước
    </span>
  )
}

function StatTile({ icon, label, value, delta }: { icon: ReactNode; label: string; value: string; delta?: ReactNode }) {
  return (
    <div className='rounded-2xl border border-clay/70 bg-cream p-4 shadow-sm'>
      <p className='flex items-center gap-2 text-xs font-bold tracking-wider text-muted uppercase'>
        <span className='text-teal'>{icon}</span>
        {label}
      </p>
      <p className='mt-2 font-display text-2xl font-bold text-forest'>{value}</p>
      {delta && <div className='mt-1'>{delta}</div>}
    </div>
  )
}

const METHOD_LABEL = { cod: 'Thanh toán khi nhận hàng', vnpay: 'VNPay' }

// US-26: Thống kê doanh thu — trang tổng quan của admin
export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const { stats, loading, error, fetch } = useDashboardStore()
  const [preset, setPreset] = useState<Preset>('30d')
  const [custom, setCustom] = useState(() => ({ from: vnDate(-29), to: vnDate(), groupBy: 'day' as StatsGroupBy }))
  const [showTable, setShowTable] = useState(false)

  const query = useMemo(() => (preset === 'custom' ? custom : rangeOf(preset)), [preset, custom])
  const customInvalid = preset === 'custom' && (!custom.from || !custom.to || custom.from > custom.to)

  useEffect(() => {
    if (!customInvalid) fetch(query)
  }, [fetch, query, customInvalid])

  const s: RevenueSummary | undefined = stats?.summary
  const p: RevenueSummary | undefined = stats?.previous
  const topMax = Math.max(...(stats?.topProducts.map((item) => item.revenue) ?? [0]), 1)
  const methodMax = Math.max(...(stats?.byPaymentMethod.map((item) => item.revenue) ?? [0]), 1)

  return (
    <div className='mx-auto max-w-6xl'>
      <PageHeader
        title='Tổng quan'
        description={
          <>
            Xin chào, {user?.fullName}. Doanh thu tính trên các đơn <strong>giao thành công</strong> (gồm phí giao
            hàng), theo ngày giao.
          </>
        }
      />

      <div className='mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
        <div role='tablist' aria-label='Khoảng thời gian' className='flex flex-wrap gap-2'>
          {PRESETS.map((item) => (
            <button
              key={item.value}
              type='button'
              role='tab'
              aria-selected={preset === item.value}
              onClick={() => setPreset(item.value)}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                preset === item.value
                  ? 'bg-moss text-cream'
                  : 'border border-clay bg-cream text-moss hover:border-moss/40'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        {preset === 'custom' && (
          <div className='flex flex-wrap items-center gap-2 text-sm'>
            <input
              type='date'
              value={custom.from}
              max={custom.to}
              onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))}
              aria-label='Từ ngày'
              className={dateInput}
            />
            <span className='text-muted'>đến</span>
            <input
              type='date'
              value={custom.to}
              min={custom.from}
              onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))}
              aria-label='Đến ngày'
              className={dateInput}
            />
            <select
              value={custom.groupBy}
              onChange={(e) => setCustom((c) => ({ ...c, groupBy: e.target.value as StatsGroupBy }))}
              aria-label='Nhóm theo'
              className={dateInput}
            >
              <option value='day'>Theo ngày</option>
              <option value='month'>Theo tháng</option>
            </select>
          </div>
        )}
      </div>

      {error ? (
        <div className='flex flex-col items-center gap-3 rounded-[var(--radius-organic)] border border-clay/70 bg-cream px-6 py-16 text-center'>
          <p className='font-semibold text-danger'>{error}</p>
          <button type='button' onClick={() => fetch(query)} className='btn-outline'>
            <RotateCw size={16} />
            Thử lại
          </button>
        </div>
      ) : !stats || !s || !p ? (
        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4' aria-busy='true' aria-label='Đang tải thống kê'>
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className='h-28 animate-pulse rounded-2xl bg-cream' />
          ))}
        </div>
      ) : (
        <div className={cn('space-y-5 transition-opacity', loading && 'opacity-60')} aria-busy={loading}>
          <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
            <StatTile
              icon={<Wallet size={16} />}
              label='Doanh thu'
              value={formatPrice(s.revenue)}
              delta={<Delta current={s.revenue} previous={p.revenue} />}
            />
            <StatTile
              icon={<PackageCheck size={16} />}
              label='Đơn giao thành công'
              value={s.deliveredOrders.toLocaleString('vi-VN')}
              delta={<Delta current={s.deliveredOrders} previous={p.deliveredOrders} />}
            />
            <StatTile
              icon={<HandCoins size={16} />}
              label='Giá trị trung bình / đơn'
              value={formatPrice(s.averageOrderValue)}
              delta={<Delta current={s.averageOrderValue} previous={p.averageOrderValue} />}
            />
            <StatTile
              icon={<ReceiptText size={16} />}
              label='Đơn mới'
              value={s.newOrders.toLocaleString('vi-VN')}
              delta={<Delta current={s.newOrders} previous={p.newOrders} />}
            />
            <StatTile
              icon={<CircleX size={16} />}
              label='Đơn bị huỷ'
              value={s.cancelledOrders.toLocaleString('vi-VN')}
              delta={<Delta current={s.cancelledOrders} previous={p.cancelledOrders} inverse />}
            />
            <StatTile
              icon={<Undo2 size={16} />}
              label='Đã hoàn tiền'
              value={formatPrice(s.refundedAmount)}
              delta={<Delta current={s.refundedAmount} previous={p.refundedAmount} inverse />}
            />
            <StatTile
              icon={<CalendarCheck size={16} />}
              label='Học phí workshop'
              value={formatPrice(s.workshopRevenue)}
              delta={<Delta current={s.workshopRevenue} previous={p.workshopRevenue} />}
            />
            <Link
              to='/orders?status=pending'
              className='flex flex-col justify-center rounded-2xl border border-dashed border-clay p-4 text-sm font-semibold text-teal transition-colors hover:border-teal hover:bg-teal/5'
            >
              Xem đơn đang chờ xác nhận →
            </Link>
          </div>

          <section className='rounded-[var(--radius-organic)] border border-clay/70 bg-cream p-5 shadow-sm sm:p-6'>
            <div className='mb-4 flex flex-wrap items-end justify-between gap-2'>
              <div>
                <h2 className='text-lg font-bold text-moss'>
                  Doanh thu theo {stats.groupBy === 'month' ? 'tháng' : 'ngày'}
                </h2>
                <p className='text-sm text-muted'>
                  {periodLabel(stats.from)} – {periodLabel(stats.to)} · rê chuột vào cột để xem chi tiết
                </p>
              </div>
              <button type='button' onClick={() => setShowTable((v) => !v)} className='link text-sm'>
                {showTable ? 'Xem biểu đồ' : 'Xem dạng bảng'}
              </button>
            </div>
            {showTable ? (
              <div className='max-h-80 overflow-y-auto'>
                <table className='w-full text-left text-sm'>
                  <thead className='sticky top-0 bg-sand text-xs font-bold tracking-wider text-muted uppercase'>
                    <tr>
                      <th scope='col' className='px-3 py-2'>
                        {stats.groupBy === 'month' ? 'Tháng' : 'Ngày'}
                      </th>
                      <th scope='col' className='px-3 py-2 text-right'>
                        Doanh thu
                      </th>
                      <th scope='col' className='px-3 py-2 text-right'>
                        Đơn
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-clay/50'>
                    {stats.series.map((item) => (
                      <tr key={item.period}>
                        <td className='px-3 py-1.5'>{periodLabel(item.period)}</td>
                        <td className='px-3 py-1.5 text-right font-semibold'>{formatPrice(item.revenue)}</td>
                        <td className='px-3 py-1.5 text-right'>{item.orders}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <RevenueChart series={stats.series} />
            )}
          </section>

          <div className='grid gap-5 lg:grid-cols-[1.4fr_1fr]'>
            <section className='rounded-[var(--radius-organic)] border border-clay/70 bg-cream p-5 shadow-sm sm:p-6'>
              <h2 className='text-lg font-bold text-moss'>Sản phẩm bán chạy</h2>
              <p className='text-sm text-muted'>Theo tiền hàng trong các đơn đã giao</p>
              {stats.topProducts.length === 0 ? (
                <p className='mt-6 text-sm text-muted'>Chưa có đơn giao thành công trong kỳ này.</p>
              ) : (
                <ol className='mt-4 space-y-3'>
                  {stats.topProducts.map((item, i) => (
                    <li key={item.productId ?? item.slug} className='flex items-center gap-3'>
                      <span className='w-4 text-sm font-bold text-muted'>{i + 1}</span>
                      <Thumbnail src={item.imageUrl} alt='' className='h-10 w-10' />
                      <div className='min-w-0 flex-1'>
                        <div className='flex justify-between gap-3 text-sm'>
                          <span className='truncate font-semibold text-forest'>{item.name}</span>
                          <span className='shrink-0 font-semibold'>{formatPrice(item.revenue)}</span>
                        </div>
                        <div className='mt-1 flex items-center gap-2'>
                          <span className='h-1.5 flex-1 overflow-hidden rounded-full bg-sand'>
                            <span
                              className='block h-full rounded-full bg-teal'
                              style={{ width: `${(item.revenue / topMax) * 100}%` }}
                            />
                          </span>
                          <span className='shrink-0 text-xs text-muted'>{item.quantity} sp</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <section className='rounded-[var(--radius-organic)] border border-clay/70 bg-cream p-5 shadow-sm sm:p-6'>
              <h2 className='text-lg font-bold text-moss'>Theo phương thức thanh toán</h2>
              <ul className='mt-4 space-y-4'>
                {stats.byPaymentMethod.map((item) => (
                  <li key={item.method}>
                    <div className='flex justify-between gap-3 text-sm'>
                      <span className='font-semibold text-forest'>{METHOD_LABEL[item.method]}</span>
                      <span className='font-semibold'>{formatPrice(item.revenue)}</span>
                    </div>
                    <div className='mt-1 flex items-center gap-2'>
                      <span className='h-1.5 flex-1 overflow-hidden rounded-full bg-sand'>
                        <span
                          className='block h-full rounded-full bg-teal'
                          style={{ width: `${(item.revenue / methodMax) * 100}%` }}
                        />
                      </span>
                      <span className='shrink-0 text-xs text-muted'>{item.orders} đơn</span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      )}
    </div>
  )
}
