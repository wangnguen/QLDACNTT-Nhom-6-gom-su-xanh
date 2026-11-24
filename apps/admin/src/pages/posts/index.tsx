import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Eye, FileText, Pencil, Plus, RotateCw, Search, Send, Trash2, Undo2, X } from 'lucide-react'
import type { AdminPostQuery, PostStatus, PostSummary } from '@lib/api'
import { cn, formatDateTime } from '@lib/utils'
import { useDebouncedValue } from '@hooks/useDebouncedValue'
import { ConfirmDialog, FilterSelect, PageHeader, Pagination, Thumbnail } from '@components/ui'
import { usePostsStore } from './store'

const PAGE_SIZE = 10

const STATUS_OPTIONS: { value: '' | PostStatus; label: string }[] = [
  { value: '', label: 'Mọi trạng thái' },
  { value: 'published', label: 'Đã đăng' },
  { value: 'draft', label: 'Bản nháp' }
]

const iconButton =
  'inline-flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-moss/5 hover:text-moss disabled:opacity-40'

// US-22: Quản lý bài viết — bộ lọc lưu trên URL để quay lại từ trang sửa vẫn giữ nguyên
export default function PostsPage() {
  const { result, categories, loading, loadError, busyId, fetch, fetchCategories, togglePublish, remove } =
    usePostsStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const [deleting, setDeleting] = useState<PostSummary | null>(null)

  const search = searchParams.get('search') ?? ''
  const categoryId = searchParams.get('categoryId') ?? ''
  const status = (searchParams.get('status') ?? '') as '' | PostStatus
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

  const query = useMemo<AdminPostQuery>(
    () => ({
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      search: search || undefined,
      categoryId: categoryId || undefined,
      status: status || undefined
    }),
    [page, search, categoryId, status]
  )

  useEffect(() => {
    fetch(query)
  }, [fetch, query])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const entries = result?.entries ?? []
  const hasFilter = !!(search || categoryId || status)
  const categoryOptions = [
    { value: '', label: 'Mọi danh mục' },
    ...categories.map((category) => ({ value: category.id, label: category.name }))
  ]

  const handleDelete = async () => {
    if (deleting && (await remove(deleting))) setDeleting(null)
  }

  return (
    <div className='mx-auto max-w-6xl'>
      <PageHeader
        title='Bài viết'
        description='Tin tức, kiến thức gốm và câu chuyện làng nghề hiển thị ở trang Tin tức.'
        actions={
          <Link to='/posts/new' className='btn-primary px-5 py-2.5 text-sm'>
            <Plus size={18} />
            Viết bài
          </Link>
        }
      />

      <section className='rounded-[var(--radius-organic)] border border-clay/70 bg-cream shadow-sm'>
        <div className='grid gap-3 border-b border-clay/60 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_14rem_12rem]'>
          <div className='relative sm:col-span-2 lg:col-span-1'>
            <Search size={17} className='pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted' />
            <input
              type='search'
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder='Tìm theo tiêu đề...'
              aria-label='Tìm bài viết'
              className='w-full rounded-xl border border-clay bg-cream py-2.5 pr-3.5 pl-10 text-sm text-forest outline-none transition placeholder:text-muted/70 focus:border-teal focus:ring-4 focus:ring-teal/15'
            />
          </div>
          <FilterSelect
            label='Lọc theo danh mục'
            value={categoryId}
            onChange={(value) => updateParams({ categoryId: value })}
            options={categoryOptions}
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
          <div className='space-y-3 p-5' aria-busy='true' aria-label='Đang tải bài viết'>
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className='h-16 animate-pulse rounded-xl bg-sand' />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className='flex flex-col items-center gap-3 px-6 py-16 text-center'>
            <FileText size={40} className='text-sage' aria-hidden />
            <p className='font-semibold'>{hasFilter ? 'Không có bài viết nào khớp bộ lọc' : 'Chưa có bài viết nào'}</p>
            {hasFilter ? (
              <button
                type='button'
                onClick={() => {
                  setSearchInput('')
                  updateParams({ search: '', categoryId: '', status: '' })
                }}
                className='btn-outline'
              >
                <X size={16} />
                Xoá bộ lọc
              </button>
            ) : (
              <Link to='/posts/new' className='btn-primary mt-2 px-5 py-2.5 text-sm'>
                <Plus size={18} />
                Viết bài đầu tiên
              </Link>
            )}
          </div>
        ) : (
          <div className={cn('overflow-x-auto transition-opacity', loading && 'opacity-60')} aria-busy={loading}>
            <table className='w-full min-w-[52rem] text-left text-sm'>
              <thead className='border-b border-clay/60 bg-sand/60 text-xs font-bold tracking-wider whitespace-nowrap text-muted uppercase'>
                <tr>
                  <th scope='col' className='px-5 py-3'>
                    Bài viết
                  </th>
                  <th scope='col' className='px-5 py-3'>
                    Danh mục
                  </th>
                  <th scope='col' className='px-5 py-3'>
                    Trạng thái
                  </th>
                  <th scope='col' className='px-5 py-3 text-right'>
                    Lượt xem
                  </th>
                  <th scope='col' className='px-5 py-3'>
                    <span className='sr-only'>Thao tác</span>
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-clay/50'>
                {entries.map((post) => {
                  const published = post.status === 'published'
                  const busy = busyId === post.id
                  return (
                    <tr key={post.id} className='align-top transition-colors hover:bg-sand/40'>
                      <td className='px-5 py-3'>
                        <div className='flex gap-3'>
                          <Thumbnail src={post.coverImageUrl} alt='' className='h-14 w-20' />
                          <div className='min-w-0'>
                            <Link
                              to={`/posts/${post.id}/edit`}
                              className='line-clamp-2 font-semibold text-forest hover:text-teal'
                            >
                              {post.title}
                            </Link>
                            <p className='mt-0.5 line-clamp-1 max-w-md text-xs text-muted'>{post.excerpt}</p>
                            <p className='mt-0.5 text-xs text-muted'>
                              {post.author?.fullName ?? 'Gốm Sứ Xanh'} · {post.readingMinutes} phút đọc · sửa{' '}
                              {formatDateTime(post.updatedAt)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className='px-5 py-3 whitespace-nowrap'>{post.category.name}</td>
                      <td className='px-5 py-3'>
                        <span
                          className={cn(
                            'inline-block rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap',
                            published ? 'bg-teal/10 text-teal' : 'bg-clay/40 text-muted'
                          )}
                        >
                          {published ? 'Đã đăng' : 'Bản nháp'}
                        </span>
                        {post.publishedAt && (
                          <p className='mt-1 text-xs whitespace-nowrap text-muted'>
                            {formatDateTime(post.publishedAt)}
                          </p>
                        )}
                      </td>
                      <td className='px-5 py-3 text-right font-semibold'>{post.viewCount.toLocaleString('vi-VN')}</td>
                      <td className='px-5 py-3'>
                        <div className='flex justify-end gap-1'>
                          <button
                            type='button'
                            onClick={() => togglePublish(post)}
                            disabled={busy}
                            className={iconButton}
                            aria-label={published ? `Gỡ bài ${post.title}` : `Đăng bài ${post.title}`}
                            title={published ? 'Gỡ về nháp' : 'Đăng bài'}
                          >
                            {published ? <Undo2 size={17} /> : <Send size={17} />}
                          </button>
                          {published && (
                            <a
                              href={`${import.meta.env.VITE_CLIENT_URL ?? 'http://localhost:3000'}/blog/${post.slug}`}
                              target='_blank'
                              rel='noreferrer'
                              className={iconButton}
                              aria-label={`Xem bài ${post.title} ở trang khách hàng`}
                              title='Xem ở trang khách hàng'
                            >
                              <Eye size={17} />
                            </a>
                          )}
                          <Link
                            to={`/posts/${post.id}/edit`}
                            className={iconButton}
                            aria-label={`Sửa bài ${post.title}`}
                            title='Sửa'
                          >
                            <Pencil size={17} />
                          </Link>
                          <button
                            type='button'
                            onClick={() => setDeleting(post)}
                            disabled={busy}
                            className={cn(iconButton, 'hover:bg-danger/5 hover:text-danger')}
                            aria-label={`Xoá bài ${post.title}`}
                            title='Xoá'
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
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

      <ConfirmDialog
        open={!!deleting}
        title='Xoá bài viết?'
        message={
          deleting && (
            <>
              Bài <strong className='text-forest'>{deleting.title}</strong> sẽ bị xoá khỏi trang tin tức.
            </>
          )
        }
        loading={!!deleting && busyId === deleting.id}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  )
}
