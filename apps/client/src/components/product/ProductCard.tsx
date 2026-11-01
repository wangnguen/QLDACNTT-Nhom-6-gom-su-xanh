import { Link } from 'react-router-dom'
import type { ProductSummary } from '@lib/api'
import { formatPrice } from '@lib/utils'
import { ProductImage } from './ProductImage'

// Còn ít hàng thì nhắc khách (dưới ngưỡng này)
const LOW_STOCK = 3

export function ProductCard({ product }: { product: ProductSummary }) {
  const soldOut = product.stock === 0

  return (
    <Link
      to={`/products/${product.slug}`}
      className='group flex flex-col overflow-hidden rounded-[var(--radius-organic)] border border-clay/60 bg-cream shadow-sm transition-shadow hover:shadow-[0_12px_32px_rgba(28,61,30,0.12)]'
    >
      <div className='relative aspect-square overflow-hidden'>
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          className='h-full w-full transition-transform duration-500 group-hover:scale-105'
        />
        {soldOut ? (
          <span className='absolute top-3 left-3 rounded-full bg-forest/85 px-3 py-1 text-xs font-bold text-cream'>
            Hết hàng
          </span>
        ) : (
          product.stock <= LOW_STOCK && (
            <span className='absolute top-3 left-3 rounded-full bg-warning px-3 py-1 text-xs font-bold text-cream'>
              Chỉ còn {product.stock}
            </span>
          )
        )}
      </div>
      <div className='flex flex-1 flex-col gap-1 p-4'>
        <p className='text-xs font-bold tracking-wider text-leaf uppercase'>{product.category.name}</p>
        <h3 className='line-clamp-2 font-semibold text-forest group-hover:text-teal'>{product.name}</h3>
        <p className='mt-auto pt-2 font-display text-xl font-bold text-moss'>{formatPrice(product.price)}</p>
      </div>
    </Link>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className='overflow-hidden rounded-[var(--radius-organic)] border border-clay/60 bg-cream'>
      <div className='aspect-square animate-pulse bg-sand' />
      <div className='space-y-2 p-4'>
        <div className='h-3 w-1/3 animate-pulse rounded bg-sand' />
        <div className='h-4 w-4/5 animate-pulse rounded bg-sand' />
        <div className='h-6 w-1/2 animate-pulse rounded bg-sand' />
      </div>
    </div>
  )
}
