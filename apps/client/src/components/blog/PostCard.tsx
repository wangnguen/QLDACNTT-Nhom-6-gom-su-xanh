import { Link } from 'react-router-dom'
import { Clock } from 'lucide-react'
import type { PostSummary } from '@lib/api'
import { cn, formatShortDate } from '@lib/utils'
import { ProductImage } from '@components/product'

interface Props {
  post: PostSummary
  // Bài nổi bật đầu trang: ảnh lớn, nằm ngang trên màn hình rộng
  featured?: boolean
}

// US-23: Thẻ bài viết ở trang tin tức
export function PostCard({ post, featured }: Props) {
  return (
    <article
      className={cn(
        'group overflow-hidden rounded-[var(--radius-organic)] border border-clay/70 bg-cream shadow-sm transition-shadow hover:shadow-md',
        featured && 'lg:grid lg:grid-cols-[1.2fr_1fr]'
      )}
    >
      <Link to={`/blog/${post.slug}`} className='block overflow-hidden' tabIndex={-1} aria-hidden>
        <ProductImage
          src={post.coverImageUrl}
          alt=''
          className={cn(
            'w-full transition-transform duration-500 group-hover:scale-[1.03]',
            featured ? 'aspect-[16/9] lg:h-full lg:aspect-auto' : 'aspect-[16/10]'
          )}
        />
      </Link>
      <div className={cn('flex flex-col p-5', featured && 'lg:justify-center lg:p-8')}>
        <Link
          to={`/blog?category=${post.category.slug}`}
          className='text-xs font-bold tracking-wider text-teal uppercase hover:underline'
        >
          {post.category.name}
        </Link>
        <h2 className={cn('mt-2 font-display font-bold text-moss', featured ? 'text-3xl' : 'text-xl')}>
          <Link to={`/blog/${post.slug}`} className='hover:text-teal'>
            {post.title}
          </Link>
        </h2>
        <p className={cn('mt-2 text-ink', featured ? 'line-clamp-4' : 'line-clamp-3 text-sm')}>{post.excerpt}</p>
        <p className='mt-4 flex items-center gap-1.5 text-xs text-muted'>
          {post.publishedAt && <span>{formatShortDate(post.publishedAt)}</span>}
          <span aria-hidden>·</span>
          <Clock size={13} aria-hidden />
          {post.readingMinutes} phút đọc
        </p>
      </div>
    </article>
  )
}

export function PostCardSkeleton() {
  return (
    <div className='overflow-hidden rounded-[var(--radius-organic)] border border-clay/70 bg-cream'>
      <div className='aspect-[16/10] animate-pulse bg-sand' />
      <div className='space-y-2 p-5'>
        <div className='h-3 w-24 animate-pulse rounded bg-sand' />
        <div className='h-6 w-3/4 animate-pulse rounded bg-sand' />
        <div className='h-4 w-full animate-pulse rounded bg-sand' />
      </div>
    </div>
  )
}
