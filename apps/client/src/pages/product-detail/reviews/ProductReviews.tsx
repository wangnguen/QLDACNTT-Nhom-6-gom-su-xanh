import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { MessageSquareText, Pencil, Store } from 'lucide-react'
import type { ProductDetail } from '@lib/api'
import { cn, formatShortDate } from '@lib/utils'
import { Pagination } from '@components/Pagination'
import { StarRating } from '@components/product'
import { useAuthStore } from '@stores/authStore'
import { ReviewForm } from './ReviewForm'
import { REVIEW_PAGE_SIZE, useReviewsStore } from './store'

// US-24: Đánh giá sản phẩm — tổng hợp số sao, lọc theo sao, danh sách đánh giá và form của khách đã nhận hàng
export function ProductReviews({ product }: { product: ProductDetail }) {
  const { isAuthenticated } = useAuthStore()
  const { result, loading, error, mine, submitting, fetch, fetchMine, submit, reset } = useReviewsStore()
  const location = useLocation()
  const [rating, setRating] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    reset()
  }, [product.slug, reset])

  useEffect(() => {
    fetch(product.slug, rating, page)
  }, [fetch, product.slug, rating, page])

  // Chờ khôi phục phiên đăng nhập xong mới hỏi "đánh giá của tôi"
  useEffect(() => {
    if (isAuthenticated) fetchMine(product.slug)
  }, [isAuthenticated, fetchMine, product.slug])

  const summary = result?.summary
  const handleSubmit = async (stars: number, comment: string) => {
    const ok = await submit(product.id, stars, comment)
    if (ok) setEditing(false)
    return ok
  }

  return (
    <section className='mt-20' aria-labelledby='reviews-heading'>
      <h2 id='reviews-heading' className='font-display text-3xl font-bold text-moss'>
        Đánh giá sản phẩm
      </h2>

      <div className='mt-6 grid gap-8 lg:grid-cols-[18rem_1fr]'>
        <div>
          <div className='rounded-[var(--radius-organic)] border border-clay/70 bg-cream p-6 text-center'>
            <p className='font-display text-5xl font-bold text-moss'>{summary ? summary.average.toFixed(1) : '–'}</p>
            <StarRating value={summary?.average ?? 0} size={20} className='mt-2' />
            <p className='mt-1 text-sm text-muted'>{summary?.count ?? 0} đánh giá</p>
            <div className='mt-5 space-y-1.5'>
              {[5, 4, 3, 2, 1].map((star) => {
                const count = summary?.distribution[String(star) as '1'] ?? 0
                const percent = summary?.count ? (count / summary.count) * 100 : 0
                return (
                  <button
                    key={star}
                    type='button'
                    onClick={() => {
                      setRating(rating === star ? null : star)
                      setPage(1)
                    }}
                    aria-pressed={rating === star}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-lg px-1.5 py-1 text-xs transition-colors',
                      rating === star ? 'bg-warning/10' : 'hover:bg-sand'
                    )}
                  >
                    <span className='w-8 shrink-0 text-left font-semibold text-ink'>{star} ★</span>
                    <span className='h-2 flex-1 overflow-hidden rounded-full bg-sand'>
                      <span className='block h-full rounded-full bg-warning' style={{ width: `${percent}%` }} />
                    </span>
                    <span className='w-6 shrink-0 text-right text-muted'>{count}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className='min-w-0 space-y-5'>
          {!isAuthenticated ? (
            <p className='rounded-2xl border border-clay/70 bg-cream p-4 text-sm text-ink'>
              <Link to='/login' state={{ from: location.pathname }} className='link'>
                Đăng nhập
              </Link>{' '}
              để đánh giá sản phẩm bạn đã mua.
            </p>
          ) : mine?.review && !editing ? (
            <div className='rounded-2xl border border-teal/30 bg-teal/5 p-4'>
              <div className='flex flex-wrap items-center justify-between gap-2'>
                <p className='text-sm font-semibold text-forest'>Đánh giá của bạn</p>
                <button
                  type='button'
                  onClick={() => setEditing(true)}
                  className='inline-flex items-center gap-1.5 text-sm font-semibold text-teal hover:underline'
                >
                  <Pencil size={14} />
                  Sửa
                </button>
              </div>
              <StarRating value={mine.review.rating} className='mt-1' />
              {mine.review.comment && <p className='mt-1 text-sm text-ink'>{mine.review.comment}</p>}
              {mine.review.isHidden && (
                <p className='mt-2 text-xs text-warning'>Đánh giá này đang được cửa hàng ẩn khỏi trang sản phẩm.</p>
              )}
            </div>
          ) : mine?.canReview || (mine?.review && editing) ? (
            <ReviewForm
              key={mine.review?.id ?? 'new'}
              mine={mine}
              submitting={submitting}
              onSubmit={handleSubmit}
              onCancel={mine.review ? () => setEditing(false) : undefined}
            />
          ) : (
            mine?.reason && <p className='rounded-2xl bg-sand/70 p-4 text-sm text-muted'>{mine.reason}.</p>
          )}

          {error ? (
            <p className='text-sm font-semibold text-danger'>{error}</p>
          ) : !result ? (
            <div className='space-y-3' aria-busy='true' aria-label='Đang tải đánh giá'>
              {Array.from({ length: 2 }, (_, i) => (
                <div key={i} className='h-20 animate-pulse rounded-2xl bg-cream' />
              ))}
            </div>
          ) : result.entries.length === 0 ? (
            <div className='flex flex-col items-center gap-2 rounded-2xl border border-dashed border-clay py-10 text-center'>
              <MessageSquareText size={32} className='text-sage' aria-hidden />
              <p className='font-semibold text-ink'>
                {rating ? `Chưa có đánh giá ${rating} sao` : 'Chưa có đánh giá nào cho sản phẩm này'}
              </p>
            </div>
          ) : (
            <>
              <ul className={cn('divide-y divide-clay/50 transition-opacity', loading && 'opacity-60')}>
                {result.entries.map((review) => (
                  <li key={review.id} className='py-4 first:pt-0'>
                    <div className='flex flex-wrap items-center gap-x-3 gap-y-1'>
                      <span className='flex h-9 w-9 items-center justify-center rounded-full bg-moss/10 font-bold text-moss'>
                        {review.authorName.trim().charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <p className='text-sm font-semibold text-forest'>{review.authorName}</p>
                        <div className='flex items-center gap-2'>
                          <StarRating value={review.rating} size={14} />
                          <span className='text-xs text-muted'>{formatShortDate(review.createdAt)}</span>
                          <span className='text-xs font-semibold text-teal'>· Đã mua hàng</span>
                        </div>
                      </div>
                    </div>
                    {review.comment && <p className='mt-2 text-ink'>{review.comment}</p>}
                    {review.adminReply && (
                      <div className='mt-3 rounded-xl bg-sand/70 p-3 text-sm'>
                        <p className='flex items-center gap-1.5 font-semibold text-moss'>
                          <Store size={14} aria-hidden />
                          Phản hồi của Gốm Sứ Xanh
                        </p>
                        <p className='mt-1 text-ink'>{review.adminReply}</p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              <Pagination page={page} pageCount={Math.ceil(result.total_count / REVIEW_PAGE_SIZE)} onChange={setPage} />
            </>
          )}
        </div>
      </div>
    </section>
  )
}
