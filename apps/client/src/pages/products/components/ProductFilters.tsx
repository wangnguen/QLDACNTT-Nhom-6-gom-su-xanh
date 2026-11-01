import { useState, type FormEvent } from 'react'
import { CircleAlert } from 'lucide-react'
import type { CategoryItem } from '@lib/api'
import { cn } from '@lib/utils'

interface Props {
  categories: CategoryItem[]
  category: string
  minPrice: string
  maxPrice: string
  inStock: boolean
  onChange: (changes: Record<string, string>) => void
}

const priceInput =
  'w-full min-w-0 rounded-xl border border-clay bg-cream px-3 py-2.5 text-sm text-forest outline-none transition placeholder:text-muted/70 focus:border-teal focus:ring-4 focus:ring-teal/15'

// Cột bộ lọc: danh mục, khoảng giá, còn hàng — giá trị lấy từ URL, đổi thì báo lên trang qua `onChange`
export function ProductFilters({ categories, category, minPrice, maxPrice, inStock, onChange }: Props) {
  const [min, setMin] = useState(minPrice)
  const [max, setMax] = useState(maxPrice)
  const [priceError, setPriceError] = useState('')

  const applyPrice = (event: FormEvent) => {
    event.preventDefault()
    if (min && max && Number(min) > Number(max)) {
      setPriceError('Giá tối thiểu không được lớn hơn giá tối đa')
      return
    }
    setPriceError('')
    onChange({ minPrice: min, maxPrice: max })
  }

  const categoryButton = (active: boolean) =>
    cn(
      'flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold transition-colors',
      active ? 'bg-moss text-cream' : 'text-moss hover:bg-moss/5'
    )

  return (
    <div className='space-y-7'>
      <section>
        <h2 className='mb-2 text-xs font-bold tracking-wider text-muted uppercase'>Danh mục</h2>
        <ul className='space-y-0.5'>
          <li>
            <button type='button' onClick={() => onChange({ category: '' })} className={categoryButton(!category)}>
              Tất cả sản phẩm
            </button>
          </li>
          {categories.map((item) => (
            <li key={item.id}>
              <button
                type='button'
                onClick={() => onChange({ category: item.slug })}
                aria-pressed={category === item.slug}
                className={categoryButton(category === item.slug)}
              >
                <span className='min-w-0 truncate'>{item.name}</span>
                <span className={cn('text-xs', category === item.slug ? 'text-mint' : 'text-muted')}>
                  {item.productCount}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className='mb-2 text-xs font-bold tracking-wider text-muted uppercase'>Khoảng giá (₫)</h2>
        <form onSubmit={applyPrice} noValidate className='space-y-3'>
          <div className='flex items-center gap-2'>
            <input
              type='number'
              inputMode='numeric'
              min={0}
              step={1000}
              value={min}
              onChange={(e) => setMin(e.target.value)}
              placeholder='Từ'
              aria-label='Giá từ'
              className={priceInput}
            />
            <span className='text-muted' aria-hidden>
              –
            </span>
            <input
              type='number'
              inputMode='numeric'
              min={0}
              step={1000}
              value={max}
              onChange={(e) => setMax(e.target.value)}
              placeholder='Đến'
              aria-label='Giá đến'
              className={priceInput}
            />
          </div>
          {priceError && (
            <p className='flex items-start gap-1 text-xs font-medium text-danger'>
              <CircleAlert size={14} className='mt-px shrink-0' />
              {priceError}
            </p>
          )}
          <button type='submit' className='btn-outline w-full'>
            Áp dụng
          </button>
        </form>
      </section>

      <label className='flex cursor-pointer items-center gap-3 text-sm font-semibold text-forest'>
        <input
          type='checkbox'
          checked={inStock}
          onChange={(e) => onChange({ inStock: e.target.checked ? '1' : '' })}
          className='h-5 w-5 rounded border-clay accent-teal'
        />
        Chỉ hiện sản phẩm còn hàng
      </label>
    </div>
  )
}
