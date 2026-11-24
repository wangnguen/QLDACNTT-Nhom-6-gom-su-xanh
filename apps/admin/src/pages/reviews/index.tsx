import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, MessageSquareReply, MessageSquareText, RotateCw, Search, Trash2, X } from 'lucide-react'
import type { AdminReview, AdminReviewQuery, ReviewStatus } from '@lib/api'
import { cn, formatDateTime } from '@lib/utils'
import { useDebouncedValue } from '@hooks/useDebouncedValue'
import { ConfirmDialog, FilterSelect, PageHeader, Pagination, Stars, Thumbnail } from '@components/ui'
import { ReplyDialog } from './components/ReplyDialog'
import { useReviewsStore } from './store'

const PAGE_SIZE = 10

const RATING_OPTIONS = [
  { value: '', label: 'Mọi số sao' },
  ...[5, 4, 3, 2, 1].map((star) => ({ value: String(star), label: `${star} sao` }))
]

const STATUS_OPTIONS: { value: '' | ReviewStatus; label: string }[] = [
  { value: '', label: 'Mọi trạng thái' },
  { value: 'visible', label: 'Đang hiện' },
  { value: 'hidden', label: 'Đã ẩn' }
]

const iconButton =
  'inline-flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-moss/5 hover:text-moss disabled:opacity-40'

// US-25: Quản lý đánh giá — ẩn đánh giá vi phạm, trả lời khách, xoá spam
export default function ReviewsPage() {
  const { result, loading, loadError, busyId, fetch, toggleHidden, reply, remove } = useReviewsStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const [replying, setReplying] = useState<AdminReview | null>(null)
  const [deleting, setDeleting] = useState<AdminReview | null>(null)

  const search = searchParams.get('search') ?? ''
  const rating = searchParams.get('rating') ?? ''
  const status = (searchParams.get('status') ?? '') as '' | ReviewStatus
  const page = Math.max(1, Number(searchParams.get('page')) || 1)

  const [searchInput, setSearchInput] = useState(search)
  const debouncedSearch = useDebouncedValue(searchInput.trim())

  const updateParams = useCallback(
    (changes: Record<string, string>, resetPage = true) =>
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)))
          if (resetPage) next.delete('page')
          return next
        },
        { replace: true }
      ),
    [setSearchParams]
  )

  useEffect(() => {
    if (debouncedSearch !== search) updateParams({ search: debouncedSearch })
  }, [debouncedSearch, search, updateParams])

  const query = useMemo<AdminReviewQuery>(
    () => ({
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      search: search || undefined,
      rating: rating ? Number(rating) : undefined,
      status: status || undefined
    }),
    [page, search, rating, status]
  )

  useEffect(() => {
    fetch(query)
  }, [fetch, query])

  const entries = result?.entries ?? []
  const hasFilter = !!(search || rating || status)
  const clientUrl = import.meta.env.VITE_CLIENT_URL ?? 'http://localhost:3000'

  return (
    <div className='mx-auto max-w-6xl'>
      <PageHeader
        title='Đánh giá'
        description='Đánh giá của khách đã mua hàng. Trả lời khách, ẩn đánh giá vi phạm hoặc xoá spam.'
      />

      <section className='rounded-[var(--radius-organic)] border border-clay/70 bg-cream shadow-sm'>
        <div className='grid gap-3 border-b border-clay/60 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_11rem_11rem]'>
          <div className='relative sm:col-span-2 lg:col-span-1'>
            <Search size={17} className='pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted' />
            <input
              type='search'
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder='Nhận xét, sản phẩm, tên hoặc email khách...'
              aria-label='Tìm đánh giá'
              className='w-full rounded-xl border border-clay bg-cream py-2.5 pr-3.5 pl-10 text-sm text-forest outline-none transition placeholder:text-muted/70 focus:border-teal focus:ring-4 focus:ring-teal/15'
            />
          </div>
          <FilterSelect
            label='Lọc theo số sao'
            value={rating}
            onChange={(value) => updateParams({ rating: value })}
            options={RATING_OPTIONS}
          />
          <FilterSelect
            label='Lọc theo trạng thái'
            value={status}
            onChange={(value) => updateParams({ status: value })}
            options={STATUS_OPTIONS}
          />
        </div>

        {loadError ? (
          <div className='flex flex-col items-center gap-3 px-6 py-16 text-center'>
            <p className='font-semibold text-danger'>{loadError}</p>
            <button type='button' onClick={() => fetch(query)} className='btn-outline'>
              <RotateCw size={16} />
              Thử lại
            </button>
          </div>
        ) : !result ? (
          <div className='space-y-3 p-5' aria-busy='true' aria-label='Đang tải đánh giá'>
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className='h-20 animate-pulse rounded-xl bg-sand' />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className='flex flex-col items-center gap-3 px-6 py-16 text-center'>
            <MessageSquareText size={40} className='text-sage' aria-hidden />
            <p className='font-semibold'>{hasFilter ? 'Không có đánh giá nào khớp bộ lọc' : 'Chưa có đánh giá nào'}</p>
            {hasFilter && (
              <button
                type='button'
                onClick={() => {
                  setSearchInput('')
                  updateParams({ search: '', rating: '', status: '' })
                }}
                className='btn-outline'
              >
                <X size={16} />
                Xoá bộ lọc
              </button>
            )}
          </div>
        ) : (
          <ul className={cn('divide-y divide-clay/50 transition-opacity', loading && 'opacity-60')} aria-busy={loading}>
            {entries.map((review) => {
              const busy = busyId === review.id
              return (
                <li
                  key={review.id}
                  className={cn('flex flex-col gap-4 p-5 sm:flex-row', review.isHidden && 'bg-sand/50')}
                >
                  <a
                    href={`${clientUrl}/products/${review.product.slug}`}
                    target='_blank'
                    rel='noreferrer'
                    className='flex shrink-0 gap-3 sm:w-56'
                    title='Xem sản phẩm ở trang khách hàng'
                  >
                    <Thumbnail src={review.product.imageUrl} alt='' />
                    <span className='line-clamp-2 text-sm font-semibold text-forest hover:text-teal'>
                      {review.product.name}
                    </span>
                  </a>

                  <div className='min-w-0 flex-1'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <Stars value={review.rating} />
                      <span className='text-sm font-semibold text-forest'>{review.customer.fullName}</span>
                      <span className='text-xs text-muted'>{review.customer.email}</span>
                      {review.isHidden && (
                        <span className='rounded-full bg-clay/50 px-2 py-0.5 text-xs font-bold text-muted'>Đã ẩn</span>
                      )}
                    </div>
                    <p className='mt-1 text-sm text-ink'>
                      {review.comment ?? <span className='text-muted italic'>Không có nhận xét</span>}
                    </p>
                    <p className='mt-1 text-xs text-muted'>
                      {formatDateTime(review.createdAt)}
                      {review.orderCode && (
                        <>
                          {' '}
                          · đã mua trong đơn{' '}
                          <Link
                            to={`/orders?search=${review.orderCode}`}
                            className='font-mono font-bold text-teal hover:underline'
                          >
                            {review.orderCode}
                          </Link>
                        </>
                      )}
                    </p>
                    {review.adminReply && (
                      <div className='mt-2 rounded-xl border-l-4 border-teal/40 bg-teal/5 px-3 py-2 text-sm'>
                        <p className='text-xs font-bold text-teal'>
                          Cửa hàng đã trả lời{review.repliedAt && ` · ${formatDateTime(review.repliedAt)}`}
                        </p>
                        <p className='text-ink'>{review.adminReply}</p>
                      </div>
                    )}
                  </div>

                  <div className='flex shrink-0 gap-1 self-start'>
                    <button
                      type='button'
                      onClick={() => setReplying(review)}
                      disabled={busy}
                      className={iconButton}
                      aria-label={`Trả lời đánh giá của ${review.authorName}`}
                      title={review.adminReply ? 'Sửa phản hồi' : 'Trả lời'}
                    >
                      <MessageSquareReply size={17} />
                    </button>
                    <button
                      type='button'
                      onClick={() => toggleHidden(review)}
                      disabled={busy}
                      className={iconButton}
                      aria-label={review.isHidden ? 'Hiện lại đánh giá' : 'Ẩn đánh giá'}
                      title={review.isHidden ? 'Hiện lại' : 'Ẩn khỏi trang sản phẩm'}
                    >
                      {review.isHidden ? <Eye size={17} /> : <EyeOff size={17} />}
                    </button>
                    <button
                      type='button'
                      onClick={() => setDeleting(review)}
                      disabled={busy}
                      className={cn(iconButton, 'hover:bg-danger/5 hover:text-danger')}
                      aria-label={`Xoá đánh giá của ${review.authorName}`}
                      title='Xoá'
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {result && result.total_count > 0 && (
          <div className='border-t border-clay/60 px-5 py-4'>
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={result.total_count}
              onChange={(next) => updateParams({ page: next > 1 ? String(next) : '' }, false)}
            />
          </div>
        )}
      </section>

      <ReplyDialog
        key={replying?.id ?? 'closed'}
        review={replying}
        loading={!!replying && busyId === replying.id}
        onConfirm={async (text) => {
          if (replying && (await reply(replying, text))) setReplying(null)
        }}
        onClose={() => setReplying(null)}
      />
      <ConfirmDialog
        open={!!deleting}
        title='Xoá đánh giá?'
        message={
          deleting && (
            <>
              Đánh giá {deleting.rating} sao của <strong>{deleting.authorName}</strong> cho {deleting.product.name} sẽ
              bị xoá. Khách có thể đánh giá lại. Nếu chỉ muốn tạm ẩn, hãy dùng nút ẩn.
            </>
          )
        }
        loading={!!deleting && busyId === deleting.id}
        onConfirm={async () => {
          if (deleting && (await remove(deleting))) setDeleting(null)
        }}
        onClose={() => setDeleting(null)}
      />
    </div>
  )
}
