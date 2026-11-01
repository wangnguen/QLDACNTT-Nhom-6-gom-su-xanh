import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { ChevronDown, PackageOpen, Pencil, Plus, RotateCw, Search, Trash2, X } from 'lucide-react'
import type { AdminProductQuery, ProductSort, ProductStatus, ProductSummary } from '@lib/api'
import { cn, formatPrice } from '@lib/utils'
import { useDebouncedValue } from '@hooks/useDebouncedValue'
import { ConfirmDialog, PageHeader, Pagination, Switch, Thumbnail } from '@components/ui'
import { useProductsStore } from './store'

const PAGE_SIZE = 10

const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'name_asc', label: 'Tên A → Z' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' }
]

const STATUS_OPTIONS: { value: '' | ProductStatus; label: string }[] = [
  { value: '', label: 'Mọi trạng thái' },
  { value: 'active', label: 'Đang bán' },
  { value: 'hidden', label: 'Đang ẩn' }
]

const selectClass =
  'w-full appearance-none rounded-xl border border-clay bg-cream py-2.5 pr-9 pl-3.5 text-sm text-forest outline-none transition focus:border-teal focus:ring-4 focus:ring-teal/15'

function FilterSelect({
  label,
  value,
  onChange,
  options
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className='relative'>
      <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className={selectClass}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        className='pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted'
        aria-hidden
      />
    </div>
  )
}

// US-07: Quản lý sản phẩm — bộ lọc lưu trên URL để quay lại từ trang sửa vẫn giữ nguyên
export default function ProductsPage() {
  const { result, categories, loading, loadError, deleting, fetch, fetchCategories, toggleActive, remove } =
    useProductsStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const [deletingProduct, setDeletingProduct] = useState<ProductSummary | null>(null)

  const search = searchParams.get('search') ?? ''
  const categoryId = searchParams.get('categoryId') ?? ''
  const status = (searchParams.get('status') ?? '') as '' | ProductStatus
  const sort = (searchParams.get('sort') ?? 'newest') as ProductSort
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

  const query = useMemo<AdminProductQuery>(
    () => ({
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      search: search || undefined,
      categoryId: categoryId || undefined,
      status: status || undefined,
      sort
    }),
    [page, search, categoryId, status, sort]
  )

  useEffect(() => {
    fetch(query)
  }, [fetch, query])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const hasFilter = !!(search || categoryId || status)
  const entries = result?.entries ?? []

  const handleDelete = async () => {
    if (!deletingProduct || !(await remove(deletingProduct))) return
    setDeletingProduct(null)
    // Xoá món cuối cùng của trang → lùi về trang trước
    if (entries.length === 1 && page > 1) updateParams({ page: String(page - 1) }, false)
    else fetch(query)
  }

  return (
    <div className='mx-auto max-w-6xl'>
      <PageHeader
        title='Sản phẩm'
        description='Thêm, sửa, ẩn hoặc xoá sản phẩm đang bán trên cửa hàng.'
        actions={
          <Link to='/products/new' state={{ from: location.search }} className='btn-primary px-5 py-2.5 text-sm'>
            <Plus size={18} />
            Thêm sản phẩm
          </Link>
        }
      />

      <section className='rounded-[var(--radius-organic)] border border-clay/70 bg-cream shadow-sm'>
        <div className='grid gap-3 border-b border-clay/60 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_13rem_11rem_11rem]'>
          <div className='relative sm:col-span-2 lg:col-span-1'>
            <Search size={17} className='pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted' />
            <input
              type='search'
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder='Tìm theo tên sản phẩm...'
              aria-label='Tìm sản phẩm'
              className='w-full rounded-xl border border-clay bg-cream py-2.5 pr-3.5 pl-10 text-sm text-forest outline-none transition placeholder:text-muted/70 focus:border-teal focus:ring-4 focus:ring-teal/15'
            />
          </div>
          <FilterSelect
            label='Lọc theo danh mục'
            value={categoryId}
            onChange={(value) => updateParams({ categoryId: value })}
            options={[{ value: '', label: 'Mọi danh mục' }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
          />
          <FilterSelect
            label='Lọc theo trạng thái'
            value={status}
            onChange={(value) => updateParams({ status: value })}
            options={STATUS_OPTIONS}
          />
          <FilterSelect
            label='Sắp xếp'
            value={sort}
            onChange={(value) => updateParams({ sort: value === 'newest' ? '' : value })}
            options={SORT_OPTIONS}
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
          <div className='space-y-3 p-5' aria-busy='true' aria-label='Đang tải sản phẩm'>
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className='h-16 animate-pulse rounded-xl bg-sand' />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className='flex flex-col items-center gap-3 px-6 py-16 text-center'>
            <PackageOpen size={40} className='text-sage' aria-hidden />
            {hasFilter ? (
              <>
                <p className='font-semibold'>Không có sản phẩm nào khớp bộ lọc</p>
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
              </>
            ) : (
              <>
                <p className='font-semibold'>Chưa có sản phẩm nào</p>
                <Link to='/products/new' className='btn-primary mt-2 px-5 py-2.5 text-sm'>
                  <Plus size={18} />
                  Thêm sản phẩm đầu tiên
                </Link>
              </>
            )}
          </div>
        ) : (
          <div
            className={cn('relative overflow-x-auto transition-opacity', loading && 'opacity-60')}
            aria-busy={loading}
          >
            <table className='w-full min-w-[44rem] text-left text-sm'>
              <thead className='border-b border-clay/60 bg-sand/60 text-xs font-bold tracking-wider text-muted uppercase'>
                <tr>
                  <th scope='col' className='px-5 py-3'>
                    Sản phẩm
                  </th>
                  <th scope='col' className='px-5 py-3'>
                    Danh mục
                  </th>
                  <th scope='col' className='px-5 py-3 text-right'>
                    Giá bán
                  </th>
                  <th scope='col' className='px-5 py-3 text-right'>
                    Tồn kho
                  </th>
                  <th scope='col' className='px-5 py-3'>
                    Đang bán
                  </th>
                  <th scope='col' className='px-5 py-3'>
                    <span className='sr-only'>Thao tác</span>
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-clay/50'>
                {entries.map((product) => (
                  <tr key={product.id} className='transition-colors hover:bg-sand/40'>
                    <td className='px-5 py-3'>
                      <div className='flex items-center gap-3'>
                        <Thumbnail src={product.imageUrl} alt='' />
                        <div className='min-w-0'>
                          <Link
                            to={`/products/${product.id}/edit`}
                            state={{ from: location.search }}
                            className='line-clamp-2 font-semibold text-forest hover:text-teal'
                          >
                            {product.name}
                          </Link>
                          <p className='truncate text-xs text-muted'>/{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className='px-5 py-3 text-ink'>{product.category.name}</td>
                    <td className='px-5 py-3 text-right font-semibold whitespace-nowrap'>
                      {formatPrice(product.price)}
                    </td>
                    <td className='px-5 py-3 text-right whitespace-nowrap'>
                      {product.stock > 0 ? (
                        product.stock
                      ) : (
                        <span className='rounded-full bg-danger/10 px-2.5 py-1 text-xs font-semibold text-danger'>
                          Hết hàng
                        </span>
                      )}
                    </td>
                    <td className='px-5 py-3'>
                      <Switch
                        checked={product.isActive}
                        onChange={() => toggleActive(product)}
                        label={`Mở bán ${product.name}`}
                      />
                    </td>
                    <td className='px-5 py-3'>
                      <div className='flex justify-end gap-1'>
                        <Link
                          to={`/products/${product.id}/edit`}
                          state={{ from: location.search }}
                          className='inline-flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-moss/5 hover:text-moss'
                          aria-label={`Sửa ${product.name}`}
                          title='Sửa'
                        >
                          <Pencil size={17} />
                        </Link>
                        <button
                          type='button'
                          onClick={() => setDeletingProduct(product)}
                          className='inline-flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-danger/5 hover:text-danger'
                          aria-label={`Xoá ${product.name}`}
                          title='Xoá'
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
        open={!!deletingProduct}
        title='Xoá sản phẩm?'
        message={
          deletingProduct && (
            <>
              <strong className='text-forest'>{deletingProduct.name}</strong> sẽ bị gỡ khỏi cửa hàng. Không thể hoàn
              tác.
            </>
          )
        }
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeletingProduct(null)}
      />
    </div>
  )
}
