import { useState } from 'react'
import { cn } from '@lib/utils'
import { ProductImage } from '@components/product'

interface Props {
  name: string
  imageUrls: string[]
}

// Ảnh lớn + dãy ảnh nhỏ để chọn; sản phẩm không có ảnh thì hiện ảnh mặc định
export function ProductGallery({ name, imageUrls }: Props) {
  const [selected, setSelected] = useState(0)
  const current = imageUrls[selected] ?? imageUrls[0] ?? null

  return (
    <div>
      <div className='aspect-square overflow-hidden rounded-[var(--radius-organic)] border border-clay/60 bg-cream shadow-sm'>
        <ProductImage src={current} alt={name} loading='eager' className='h-full w-full' />
      </div>

      {imageUrls.length > 1 && (
        <ul className='mt-4 grid grid-cols-5 gap-3' aria-label='Chọn ảnh sản phẩm'>
          {imageUrls.map((url, index) => (
            <li key={url}>
              <button
                type='button'
                onClick={() => setSelected(index)}
                aria-label={`Xem ảnh ${index + 1}`}
                aria-current={index === selected}
                className={cn(
                  'block aspect-square w-full overflow-hidden rounded-xl border-2 transition',
                  index === selected ? 'border-teal' : 'border-transparent opacity-70 hover:opacity-100'
                )}
              >
                <ProductImage src={url} alt='' className='h-full w-full' />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
