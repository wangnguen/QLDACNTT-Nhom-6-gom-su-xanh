import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Newspaper, RotateCw, Search, X } from 'lucide-react'
import type { PostQuery } from '@lib/api'
import { cn } from '@lib/utils'
import { PostCard, PostCardSkeleton } from '@components/blog'
import { Pagination } from '@components/Pagination'
import { useBlogStore } from './store'

const PAGE_SIZE = 7

// US-23: Tin tức / blog — lọc theo danh mục, tìm kiếm; bài mới nhất nổi bật ở trang đầu
export default function BlogPage() {
  const { result, categories, loading, error, fetch, fetchCategories } = useBlogStore()
  const [searchParams, setSearchParams] = useSearchParams()

  const category = searchParams.get('category') ?? ''
  const search = searchParams.get('search') ?? ''
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const [searchInput, setSearchInput] = useState(search)

  const query = useMemo<PostQuery>(
    () => ({
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      category: category || undefined,
      search: search || undefined
    }),
    [page, category, search]
  )

  useEffect(() => {
    fetch(query)
  }, [fetch, query])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const changeParams = (next: Record<string, string>) =>
    setSearchParams(Object.fromEntries(Object.entries({ category, search, ...next }).filter(([, value]) => value)), {
      replace: true
    })

  const activeCategory = categories.find((c) => c.slug === category)
  const [featured, ...rest] = result?.entries ?? []
  const showFeatured = page === 1 && !search && !!featured

  return (
    <div className='mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14'>
      <p className='text-sm font-bold tracking-[0.2em] text-teal uppercase'>Tin tức & câu chuyện</p>
      <h1 className='mt-2 font-display text-4xl font-bold text-moss sm:text-5xl'>
        {activeCategory?.name ?? 'Góc gốm'}
      </h1>
      <p className='mt-2 max-w-2xl text-ink'>
        {activeCategory?.description ??
          'Kiến thức về men gốm, cách dùng đồ gốm và những câu chuyện từ làng nghề Bát Tràng.'}
      </p>

      <div className='mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
        <div
          className='-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]'
          role='tablist'
          aria-label='Danh mục'
        >
          {[{ slug: '', name: 'Tất cả', postCount: undefined as number | undefined }, ...categories].map((c) => (
            <button
              key={c.slug}
              type='button'
              role='tab'
              aria-selected={category === c.slug}
              onClick={() => changeParams({ category: c.slug, page: '' })}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors',
                category === c.slug
                  ? 'bg-moss text-cream'
                  : 'border border-clay bg-cream text-moss hover:border-moss/40'
              )}
            >
              {c.name}
              {c.postCount !== undefined && <span className='ml-1.5 opacity-60'>{c.postCount}</span>}
            </button>
          ))}
        </div>
        <form
          role='search'
          onSubmit={(e) => {
            e.preventDefault()
            changeParams({ search: searchInput.trim(), page: '' })
          }}
          className='relative w-full lg:w-72'
        >
          <Search size={17} className='pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted' />
          <input
            type='search'
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder='Tìm bài viết...'
            aria-label='Tìm bài viết'
            className='w-full rounded-full border border-clay bg-cream py-2.5 pr-4 pl-10 text-sm text-forest outline-none transition placeholder:text-muted/70 focus:border-teal focus:ring-4 focus:ring-teal/15'
          />
        </form>
      </div>

      <div className='mt-8'>
        {error ? (
          <div className='flex flex-col items-center gap-3 py-16 text-center'>
            <p className='font-semibold text-danger'>{error}</p>
            <button type='button' onClick={() => fetch(query)} className='btn-outline'>
              <RotateCw size={16} />
              Thử lại
            </button>
          </div>
        ) : !result ? (
          <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3' aria-busy='true' aria-label='Đang tải bài viết'>
            {Array.from({ length: 6 }, (_, i) => (
              <PostCardSkeleton key={i} />
            ))}
          </div>
        ) : result.entries.length === 0 ? (
          <div className='flex flex-col items-center gap-3 py-16 text-center'>
            <Newspaper size={40} className='text-sage' aria-hidden />
            <p className='font-display text-2xl font-bold text-moss'>
              {search ? `Không tìm thấy bài viết cho "${search}"` : 'Chưa có bài viết nào'}
            </p>
            {(search || category) && (
              <button
                type='button'
                onClick={() => {
                  setSearchInput('')
                  setSearchParams({}, { replace: true })
                }}
                className='btn-outline'
              >
                <X size={16} />
                Xem tất cả bài viết
              </button>
            )}
          </div>
        ) : (
          <div className={cn('space-y-6 transition-opacity', loading && 'opacity-60')} aria-busy={loading}>
            {showFeatured && <PostCard post={featured} featured />}
            <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
              {(showFeatured ? rest : result.entries).map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
            <Pagination
              page={page}
              pageCount={Math.ceil(result.total_count / PAGE_SIZE)}
              onChange={(next) => changeParams({ page: next > 1 ? String(next) : '' })}
            />
          </div>
        )}
      </div>
    </div>
  )
}
