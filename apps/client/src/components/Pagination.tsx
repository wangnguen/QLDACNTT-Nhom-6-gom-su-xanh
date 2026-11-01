import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@lib/utils'

interface Props {
  page: number
  pageCount: number
  onChange: (page: number) => void
}

// Các số trang cần hiện: trang đầu, cuối và 1 trang mỗi bên trang hiện tại; null = dấu "…"
function pageItems(page: number, pageCount: number): (number | null)[] {
  const pages = new Set([1, pageCount, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pageCount))
  const sorted = [...pages].sort((a, b) => a - b)
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? [null, p] : [p]))
}

export function Pagination({ page, pageCount, onChange }: Props) {
  if (pageCount <= 1) return null

  const navButton =
    'inline-flex h-10 w-10 items-center justify-center rounded-full text-moss transition-colors hover:bg-moss/5 disabled:pointer-events-none disabled:opacity-35'

  return (
    <nav aria-label='Phân trang' className='flex items-center justify-center gap-1'>
      <button
        type='button'
        className={navButton}
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label='Trang trước'
      >
        <ChevronLeft size={20} />
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
              'h-10 min-w-10 rounded-full px-3 text-sm font-semibold transition-colors',
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
        <ChevronRight size={20} />
      </button>
    </nav>
  )
}
