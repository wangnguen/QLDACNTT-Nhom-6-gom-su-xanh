import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ChevronDown, ChevronRight, RotateCw, Search, SearchX, SlidersHorizontal, X } from 'lucide-react'
import type { ProductQuery, ProductSort } from '@lib/api'
import { cn } from '@lib/utils'
import { Pagination } from '@components/Pagination'
import { ProductCard, ProductCardSkeleton } from '@components/product'
import { ProductFilters } from './components/ProductFilters'
import { useProductsStore } from './store'

const PAGE_SIZE = 12

const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá thấp đến cao' },
  { value: 'price_desc', label: 'Giá cao đến thấp' },
  { value: 'name_asc', label: 'Tên A → Z' }
]

const toNumber = (value: string) => (value && Number.isFinite(Number(value)) ? Number(value) : undefined)

// US-08: Xem danh sách sản phẩm — bộ lọc nằm trên URL để chia sẻ link và bấm Back vẫn giữ nguyên
export default function ProductsPage() {
  const { result, categories, loading, error, fetch, fetchCategories } = useProductsStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const [filtersOpen, setFiltersOpen] = useState(false)

  const search = searchParams.get('search') ?? ''
  const category = searchParams.get('category') ?? ''
  const minPrice = searchParams.get('minPrice') ?? ''
  const maxPrice = searchParams.get('maxPrice') ?? ''
  const inStock = searchParams.get('inStock') === '1'
  const sort = (searchParams.get('sort') ?? 'newest') as ProductSort
  const page = Math.max(1, Number(searchParams.get('page')) || 1)

  const [searchInput, setSearchInput] = useState(search)
  const searchTimer = useRef<number | undefined>(undefined)

  // URL đổi từ bên ngoài (bấm link Sản phẩm, nút Back) → cập nhật lại ô tìm kiếm
  const [syncedSearch, setSyncedSearch] = useState(search)
  if (search !== syncedSearch) {
    setSyncedSearch(search)
    if (search !== searchInput.trim()) setSearchInput(search)
  }

  // `replace`: không thêm bước vào lịch sử trình duyệt (dùng cho ô tìm kiếm)
  const updateParams = useCallback(
    (changes: Record<string, string>, { resetPage = true, replace = false } = {}) =>
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)))
          if (resetPage) next.delete('page')
          return next
        },
        { replace }
      ),
    [setSearchParams]
  )

  // Gõ xong 350ms mới tìm, không gọi API theo từng phím
  const changeSearch = (value: string) => {
    setSearchInput(value)
    window.clearTimeout(searchTimer.current)
    searchTimer.current = window.setTimeout(() => updateParams({ search: value.trim() }, { replace: true }), 350)
  }

  useEffect(() => () => window.clearTimeout(searchTimer.current), [])

  const query = useMemo<ProductQuery>(
    () => ({
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      search: search || undefined,
      category: category || undefined,
      minPrice: toNumber(minPrice),
      maxPrice: toNumber(maxPrice),
      inStock: inStock || undefined,
      sort
    }),
    [page, search, category, minPrice, maxPrice, inStock, sort]
  )

  useEffect(() => {
    fetch(query)
  }, [fetch, query])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const currentCategory = categories.find((c) => c.slug === category)
  const hasFilter = !!(search || category || minPrice || maxPrice || inStock)
  const total = result?.total_count ?? 0
  const pageCount = Math.ceil(total / PAGE_SIZE)

  const clearFilters = () => {
    window.clearTimeout(searchTimer.current)
    setSearchInput('')
    setSearchParams(sort === 'newest' ? {} : { sort })
  }

  const changePage = (next: number) => {
    updateParams({ page: next > 1 ? String(next) : '' }, { resetPage: false })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const filters = (
    <ProductFilters
      key={`${minPrice}-${maxPrice}`}
      categories={categories}
      category={category}
      minPrice={minPrice}
      maxPrice={maxPrice}
      inStock={inStock}
      onChange={(changes) => {
        updateParams(changes)
        setFiltersOpen(false)
      }}
    />
  )

  return (
    <div className='mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-12'>
      <nav aria-label='Đường dẫn' className='mb-4 flex items-center gap-1.5 text-sm text-muted'>
        <Link to='/' className='hover:text-teal'>
          Trang chủ
        </Link>
        <ChevronRight size={14} aria-hidden />
        {currentCategory ? (
          <>
            <Link to='/products' className='hover:text-teal'>
              Sản phẩm
            </Link>
            <ChevronRight size={14} aria-hidden />
            <span className='font-semibold text-forest'>{currentCategory.name}</span>
          </>
        ) : (
          <span className='font-semibold text-forest'>Sản phẩm</span>
        )}
      </nav>

      <header className='mb-8'>
        <h1 className='font-display text-4xl font-bold text-moss sm:text-5xl'>
          {currentCategory?.name ?? 'Sản phẩm gốm thủ công'}
        </h1>
        <p className='mt-2 max-w-2xl text-ink'>
          {currentCategory?.description ??
            'Mỗi món đồ được làm thủ công từ gốm sứ tái chế tại Bát Tràng — không có hai chiếc giống hệt nhau.'}
        </p>
      </header>

      <div className='grid gap-8 lg:grid-cols-[15rem_1fr]'>
        <aside className='hidden lg:block' aria-label='Bộ lọc sản phẩm'>
          {filters}
        </aside>

        <div className='min-w-0'>
          <div className='mb-6 flex flex-col gap-3 sm:flex-row sm:items-center'>
            <div className='relative flex-1'>
              <Search size={18} className='pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted' />
              <input
                type='search'
                value={searchInput}
                onChange={(e) => changeSearch(e.target.value)}
                placeholder='Tìm bình, chén, tranh gốm...'
                aria-label='Tìm sản phẩm'
                className='w-full rounded-full border border-clay bg-cream py-3 pr-4 pl-11 text-[15px] text-forest outline-none transition placeholder:text-muted/70 focus:border-teal focus:ring-4 focus:ring-teal/15'
              />
            </div>
            <div className='flex gap-2'>
              <button
                type='button'
                onClick={() => setFiltersOpen((open) => !open)}
                aria-expanded={filtersOpen}
                className='btn-outline flex-1 lg:hidden'
              >
                <SlidersHorizontal size={16} />
                Bộ lọc
              </button>
              <div className='relative flex-1 sm:w-52 sm:flex-none'>
                <select
                  value={sort}
                  onChange={(e) => updateParams({ sort: e.target.value === 'newest' ? '' : e.target.value })}
                  aria-label='Sắp xếp'
                  className='w-full appearance-none rounded-full border border-clay bg-cream py-2.5 pr-10 pl-4 text-sm font-semibold text-moss outline-none transition focus:border-teal focus:ring-4 focus:ring-teal/15'
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className='pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-muted'
                  aria-hidden
                />
              </div>
            </div>
          </div>

          {filtersOpen && (
            <div className='mb-6 rounded-[var(--radius-organic)] border border-clay/70 bg-cream p-5 shadow-sm lg:hidden'>
              {filters}
            </div>
          )}

          <div className='mb-4 flex min-h-8 flex-wrap items-center justify-between gap-2'>
            <p className='text-sm text-muted' aria-live='polite'>
              {result && !error && (
                <>
                  <span className='font-semibold text-forest'>{total}</span> sản phẩm
                </>
              )}
            </p>
            {hasFilter && (
              <button
                type='button'
                onClick={clearFilters}
                className='inline-flex items-center gap-1 text-sm font-semibold text-teal hover:text-teal-dark'
              >
                <X size={15} />
                Xoá bộ lọc
              </button>
            )}
          </div>

          {error ? (
            <div className='flex flex-col items-center gap-3 rounded-[var(--radius-organic)] border border-clay/70 bg-cream px-6 py-16 text-center'>
              <p className='font-semibold text-danger'>{error}</p>
              <button type='button' onClick={() => fetch(query)} className='btn-outline'>
                <RotateCw size={16} />
                Thử lại
              </button>
            </div>
          ) : !result ? (
            <div className='grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3' aria-busy='true' aria-label='Đang tải'>
              {Array.from({ length: 6 }, (_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : result.entries.length === 0 ? (
            <div className='flex flex-col items-center gap-3 rounded-[var(--radius-organic)] border border-clay/70 bg-cream px-6 py-16 text-center'>
              <SearchX size={40} className='text-sage' aria-hidden />
              <p className='font-display text-2xl font-bold text-moss'>Không tìm thấy sản phẩm phù hợp</p>
              <p className='max-w-sm text-ink'>Thử từ khoá khác hoặc bỏ bớt bộ lọc nhé.</p>
              {hasFilter && (
                <button type='button' onClick={clearFilters} className='btn-primary mt-2'>
                  Xem tất cả sản phẩm
                </button>
              )}
            </div>
          ) : (
            <>
              <div
                className={cn(
                  'grid grid-cols-2 gap-4 transition-opacity sm:gap-6 md:grid-cols-3',
                  loading && 'opacity-60'
                )}
                aria-busy={loading}
              >
                {result.entries.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <div className='mt-10'>
                <Pagination page={page} pageCount={pageCount} onChange={changePage} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
