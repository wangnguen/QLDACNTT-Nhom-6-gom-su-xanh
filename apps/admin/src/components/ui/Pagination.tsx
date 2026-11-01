import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@lib/utils'

interface Props {
  page: number
  pageSize: number
  total: number
  onChange: (page: number) => void
}

// Các số trang cần hiện: trang đầu, cuối và 1 trang mỗi bên trang hiện tại; null = dấu "…"
function pageItems(page: number, pageCount: number): (number | null)[] {
  const pages = new Set([1, pageCount, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pageCount))
  const sorted = [...pages].sort((a, b) => a - b)
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? [null, p] : [p]))
}

export function Pagination({ page, pageSize, total, onChange }: Props) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  if (total === 0) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  const navButton =
    'inline-flex h-9 w-9 items-center justify-center rounded-full text-moss transition-colors hover:bg-moss/5 disabled:pointer-events-none disabled:opacity-35'

  return (
    <nav aria-label='Phân trang' className='flex flex-col items-center justify-between gap-3 sm:flex-row'>
      <p className='text-sm text-muted'>
        Hiển thị <span className='font-semibold text-forest'>{from}</span>–
        <span className='font-semibold text-forest'>{to}</span> trong{' '}
        <span className='font-semibold text-forest'>{total}</span>
      </p>
      {pageCount > 1 && (
        <div className='flex items-center gap-1'>
          <button
            type='button'
            className={navButton}
            onClick={() => onChange(page - 1)}
            disabled={page <= 1}
            aria-label='Trang trước'
          >
            <ChevronLeft size={18} />
          </button>
          {pageItems(page, pageCount).map((p, i) =>
            p === null ? (
              <span key={`gap-${i}`} className='px-1 text-muted'>
                …
              </span>
            ) : (
              <button
                key={p}
                type='button'
                onClick={() => onChange(p)}
                aria-current={p === page ? 'page' : undefined}
                className={cn(
                  'h-9 min-w-9 rounded-full px-2 text-sm font-semibold transition-colors',
                  p === page ? 'bg-moss text-cream' : 'text-moss hover:bg-moss/5'
                )}
              >
                {p}
              </button>
            )
          )}
          <button
            type='button'
            className={navButton}
            onClick={() => onChange(page + 1)}
            disabled={page >= pageCount}
            aria-label='Trang sau'
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </nav>
  )
}
