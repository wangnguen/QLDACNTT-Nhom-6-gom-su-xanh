import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Clock, Eye, RotateCw } from 'lucide-react'
import { formatDate } from '@lib/utils'
import { PostCard, PostContent } from '@components/blog'
import { ProductImage } from '@components/product'
import { usePostDetailStore } from './store'

// US-23: Đọc bài viết — ảnh bìa, nội dung, bài cùng danh mục
export default function BlogDetailPage() {
  const { slug = '' } = useParams()
  const { post, loading, notFound, error, fetch } = usePostDetailStore()

  useEffect(() => {
    fetch(slug)
  }, [fetch, slug])

  useEffect(() => {
    if (post) document.title = `${post.title} — Gốm Sứ Xanh`
    return () => {
      document.title = 'Gốm Sứ Xanh'
    }
  }, [post])

  if (notFound) {
    return (
      <div className='mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-24 text-center'>
        <h1 className='font-display text-3xl font-bold text-moss'>Không tìm thấy bài viết</h1>
        <p className='text-ink'>Bài viết có thể đã bị gỡ hoặc đường dẫn không đúng.</p>
        <Link to='/blog' className='btn-primary mt-2'>
          Xem các bài viết khác
        </Link>
      </div>
    )
  }

  if (error) {
    return (
      <div className='mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-24 text-center'>
        <p className='font-semibold text-danger'>{error}</p>
        <button type='button' onClick={() => fetch(slug)} className='btn-outline'>
          <RotateCw size={16} />
          Thử lại
        </button>
      </div>
    )
  }

  if (loading || !post || post.slug !== slug) {
    return (
      <div className='mx-auto max-w-3xl px-4 py-10 sm:px-6' aria-busy='true' aria-label='Đang tải bài viết'>
        <div className='h-10 w-3/4 animate-pulse rounded bg-cream' />
        <div className='mt-6 aspect-[16/9] animate-pulse rounded-[var(--radius-organic)] bg-cream' />
      </div>
    )
  }

  return (
    <article className='pb-16'>
      <header className='mx-auto max-w-3xl px-4 pt-10 sm:px-6 lg:pt-14'>
        <Link to='/blog' className='inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-teal'>
          <ArrowLeft size={16} />
          Tin tức
        </Link>
        <Link
          to={`/blog?category=${post.category.slug}`}
          className='mt-6 block text-sm font-bold tracking-wider text-teal uppercase hover:underline'
        >
          {post.category.name}
        </Link>
        <h1 className='mt-2 font-display text-4xl leading-tight font-bold text-moss sm:text-5xl'>{post.title}</h1>
        <p className='mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted'>
          {post.author && <span className='font-semibold text-ink'>{post.author.fullName}</span>}
          {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}
          <span className='inline-flex items-center gap-1'>
            <Clock size={14} aria-hidden />
            {post.readingMinutes} phút đọc
          </span>
          <span className='inline-flex items-center gap-1'>
            <Eye size={14} aria-hidden />
            {post.viewCount.toLocaleString('vi-VN')} lượt xem
          </span>
        </p>
      </header>

      {post.coverImageUrl && (
        <div className='mx-auto mt-8 max-w-5xl px-4 sm:px-6'>
          <ProductImage
            src={post.coverImageUrl}
            alt={post.title}
            loading='eager'
            className='aspect-[16/9] w-full rounded-[var(--radius-organic)]'
          />
        </div>
      )}

      <div className='mx-auto mt-8 max-w-3xl px-4 sm:px-6'>
        {/* Tóm tắt tự lấy từ đầu nội dung thì không lặp lại */}
        {post.customExcerpt && (
          <p className='mb-8 border-l-4 border-sage pl-4 text-lg font-medium text-forest italic'>
            {post.customExcerpt}
          </p>
        )}
        <div>
          <PostContent content={post.content} />
        </div>
      </div>

      {post.related.length > 0 && (
        <section className='mx-auto mt-16 max-w-6xl px-4 sm:px-6' aria-labelledby='related-heading'>
          <h2 id='related-heading' className='font-display text-3xl font-bold text-moss'>
            Bài cùng chủ đề
          </h2>
          <div className='mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
            {post.related.map((related) => (
              <PostCard key={related.id} post={related} />
            ))}
          </div>
        </section>
      )}
    </article>
  )
}
