import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronRight, PackageCheck, PackageX, RotateCw, SearchX } from 'lucide-react'
import { formatPrice } from '@lib/utils'
import { ProductCard } from '@components/product'
import { AddToCart } from './components/AddToCart'
import { ProductGallery } from './components/ProductGallery'
import { useProductDetailStore } from './store'

// Còn ít hàng thì nhắc khách (giống thẻ sản phẩm)
const LOW_STOCK = 3

function DetailSkeleton() {
  return (
    <div className='grid gap-10 lg:grid-cols-2' aria-busy='true' aria-label='Đang tải sản phẩm'>
      <div className='aspect-square animate-pulse rounded-[var(--radius-organic)] bg-cream' />
      <div className='space-y-4 pt-2'>
        <div className='h-4 w-1/4 animate-pulse rounded bg-cream' />
        <div className='h-10 w-3/4 animate-pulse rounded bg-cream' />
        <div className='h-8 w-1/3 animate-pulse rounded bg-cream' />
        <div className='h-24 w-full animate-pulse rounded bg-cream' />
      </div>
    </div>
  )
}

// US-09: Xem chi tiết sản phẩm
export default function ProductDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const { product, related, loading, notFound, error, load, reset } = useProductDetailStore()

  useEffect(() => {
    load(slug)
    window.scrollTo({ top: 0 })
  }, [slug, load])

  useEffect(() => reset, [reset])

  if (notFound) {
    return (
      <div className='mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-24 text-center'>
        <SearchX size={44} className='text-sage' aria-hidden />
        <h1 className='font-display text-3xl font-bold text-moss'>Không tìm thấy sản phẩm</h1>
        <p className='text-ink'>Sản phẩm có thể đã ngừng bán hoặc đường dẫn không đúng.</p>
        <Link to='/products' className='btn-primary mt-4'>
          Xem sản phẩm khác
        </Link>
      </div>
    )
  }

  if (error) {
    return (
      <div className='mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-24 text-center'>
        <p className='font-semibold text-danger'>{error}</p>
        <button type='button' onClick={() => load(slug)} className='btn-outline'>
          <RotateCw size={16} />
          Thử lại
        </button>
      </div>
    )
  }

  const specs = product
    ? [
        { label: 'Danh mục', value: product.category.name },
        { label: 'Chất liệu', value: product.material },
        { label: 'Kích thước', value: product.dimensions }
      ].filter((spec) => spec.value)
    : []

  return (
    <div className='mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-12'>
      {loading || !product ? (
        <DetailSkeleton />
      ) : (
        <>
          <nav aria-label='Đường dẫn' className='mb-6 flex flex-wrap items-center gap-1.5 text-sm text-muted'>
            <Link to='/' className='hover:text-teal'>
              Trang chủ
            </Link>
            <ChevronRight size={14} aria-hidden />
            <Link to='/products' className='hover:text-teal'>
              Sản phẩm
            </Link>
            <ChevronRight size={14} aria-hidden />
            <Link to={`/products?category=${product.category.slug}`} className='hover:text-teal'>
              {product.category.name}
            </Link>
            <ChevronRight size={14} aria-hidden />
            <span className='line-clamp-1 font-semibold text-forest'>{product.name}</span>
          </nav>

          <div className='grid gap-10 lg:grid-cols-2 lg:gap-14'>
            <ProductGallery key={product.id} name={product.name} imageUrls={product.imageUrls} />

            <div className='min-w-0'>
              <Link
                to={`/products?category=${product.category.slug}`}
                className='text-sm font-bold tracking-[0.15em] text-leaf uppercase hover:text-teal'
              >
                {product.category.name}
              </Link>
              <h1 className='mt-2 font-display text-4xl leading-tight font-bold text-moss sm:text-5xl'>
                {product.name}
              </h1>
              <p className='mt-4 font-display text-4xl font-bold text-teal'>{formatPrice(product.price)}</p>

              <p className='mt-4 flex items-center gap-2 text-sm font-semibold'>
                {product.stock === 0 ? (
                  <>
                    <PackageX size={18} className='text-danger' aria-hidden />
                    <span className='text-danger'>Tạm hết hàng</span>
                  </>
                ) : (
                  <>
                    <PackageCheck size={18} className='text-teal' aria-hidden />
                    <span className={product.stock <= LOW_STOCK ? 'text-warning' : 'text-teal'}>
                      {product.stock <= LOW_STOCK ? `Chỉ còn ${product.stock} sản phẩm` : 'Còn hàng'}
                    </span>
                  </>
                )}
              </p>

              <div className='mt-8'>
                <AddToCart key={product.id} product={product} />
              </div>

              {specs.length > 0 && (
                <dl className='mt-8 divide-y divide-clay/50 rounded-[var(--radius-organic)] border border-clay/70 bg-cream px-5'>
                  {specs.map((spec) => (
                    <div key={spec.label} className='grid grid-cols-3 gap-4 py-3 text-sm'>
                      <dt className='text-muted'>{spec.label}</dt>
                      <dd className='col-span-2 font-semibold text-forest'>{spec.value}</dd>
                    </div>
                  ))}
                </dl>
              )}

              {product.description && (
                <section className='mt-8'>
                  <h2 className='text-lg font-bold text-moss'>Mô tả sản phẩm</h2>
                  <p className='mt-2 leading-relaxed whitespace-pre-line text-ink'>{product.description}</p>
                </section>
              )}
            </div>
          </div>

          {related.length > 0 && (
            <section className='mt-20'>
              <div className='mb-6 flex items-end justify-between gap-4'>
                <h2 className='font-display text-3xl font-bold text-moss'>Sản phẩm cùng danh mục</h2>
                <Link to={`/products?category=${product.category.slug}`} className='link shrink-0 text-sm'>
                  Xem tất cả
                </Link>
              </div>
              <div className='grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4'>
                {related.map((item) => (
                  <ProductCard key={item.id} product={item} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
