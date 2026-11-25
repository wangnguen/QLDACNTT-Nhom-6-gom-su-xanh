import { useState } from 'react'
import type { RevenueStats } from '@lib/api'
import { formatPrice } from '@lib/utils'
import { periodLabel } from './periodLabel'

const WIDTH = 760
const HEIGHT = 260
const PAD = { top: 16, right: 12, bottom: 28, left: 52 }
const MAX_BAR = 24

// Trục y tròn số: 0 / 250K / 500K... hoặc 0 / 1M / 2M
const niceMax = (value: number) => {
  if (value <= 0) return 1_000_000
  const power = 10 ** Math.floor(Math.log10(value))
  const step = [1, 2, 2.5, 5, 10].find((s) => s * power * 4 >= value)! * power
  return step * 4
}

const compact = (value: number) =>
  value >= 1_000_000
    ? `${(value / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}M`
    : value >= 1_000
      ? `${(value / 1_000).toLocaleString('vi-VN', { maximumFractionDigits: 0 })}K`
      : String(value)

// US-26: Doanh thu theo ngày / tháng — một chuỗi số liệu nên dùng một màu, rê chuột vào cột để xem chi tiết
export function RevenueChart({ series }: { series: RevenueStats['series'] }) {
  const [active, setActive] = useState<number | null>(null)

  const max = niceMax(Math.max(...series.map((point) => point.revenue), 0))
  const plotW = WIDTH - PAD.left - PAD.right
  const plotH = HEIGHT - PAD.top - PAD.bottom
  const slot = plotW / Math.max(series.length, 1)
  const barW = Math.max(2, Math.min(MAX_BAR, slot - 2))
  const y = (value: number) => PAD.top + plotH - (value / max) * plotH
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ratio * max)
  // Nhãn trục x thưa ra để không chồng nhau
  const labelEvery = Math.ceil(series.length / 10)
  const point = active === null ? null : series[active]

  return (
    <div className='relative'>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className='h-auto w-full' role='img' aria-label='Biểu đồ doanh thu'>
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={y(tick)}
              y2={y(tick)}
              stroke='var(--color-clay)'
              strokeOpacity={0.6}
              strokeWidth={1}
            />
            <text x={PAD.left - 8} y={y(tick)} dy='0.32em' textAnchor='end' fontSize={11} fill='var(--color-muted)'>
              {compact(tick)}
            </text>
          </g>
        ))}

        {series.map((item, i) => {
          const cx = PAD.left + slot * i + slot / 2
          const top = y(item.revenue)
          const h = PAD.top + plotH - top
          const r = Math.min(4, barW / 2, h)
          return (
            <g key={item.period}>
              {h > 0 && (
                <path
                  d={`M${cx - barW / 2},${PAD.top + plotH} V${top + r} Q${cx - barW / 2},${top} ${cx - barW / 2 + r},${top} H${cx + barW / 2 - r} Q${cx + barW / 2},${top} ${cx + barW / 2},${top + r} V${PAD.top + plotH} Z`}
                  fill='var(--color-teal)'
                  opacity={active === null || active === i ? 1 : 0.45}
                />
              )}
              {i % labelEvery === 0 && (
                <text x={cx} y={HEIGHT - 8} textAnchor='middle' fontSize={11} fill='var(--color-muted)'>
                  {periodLabel(item.period)}
                </text>
              )}
              {/* Vùng rê chuột rộng bằng cả cột để dễ chạm */}
              <rect
                x={PAD.left + slot * i}
                y={PAD.top}
                width={slot}
                height={plotH}
                fill='transparent'
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                tabIndex={0}
                aria-label={`${periodLabel(item.period)}: ${formatPrice(item.revenue)}, ${item.orders} đơn`}
              />
            </g>
          )
        })}
        <line
          x1={PAD.left}
          x2={WIDTH - PAD.right}
          y1={PAD.top + plotH}
          y2={PAD.top + plotH}
          stroke='var(--color-clay)'
          strokeWidth={1}
        />
      </svg>

      {point && active !== null && (
        <div
          className='pointer-events-none absolute top-2 z-10 -translate-x-1/2 rounded-xl border border-clay/70 bg-cream px-3 py-2 text-xs shadow-lg'
          style={{ left: `${((PAD.left + slot * active + slot / 2) / WIDTH) * 100}%` }}
        >
          <p className='font-semibold text-forest'>{periodLabel(point.period)}</p>
          <p className='mt-0.5 flex items-center gap-1.5 text-ink'>
            <span className='h-2 w-2 rounded-sm bg-teal' aria-hidden />
            {formatPrice(point.revenue)}
          </p>
          <p className='text-muted'>{point.orders} đơn giao thành công</p>
        </div>
      )}
    </div>
  )
}
