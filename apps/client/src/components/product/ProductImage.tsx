import { useState } from 'react'
import { cn } from '@lib/utils'

interface Props {
  src: string | null
  alt: string
  className?: string
  loading?: 'lazy' | 'eager'
}

// Ảnh sản phẩm; chưa có ảnh hoặc link hỏng thì hiện logo mờ trên nền gốm
export function ProductImage({ src, alt, className, loading = 'lazy' }: Props) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)

  if (!src || failedSrc === src) {
    return (
      <div className={cn('flex items-center justify-center bg-sand', className)} role='img' aria-label={alt}>
        <img src='/logo.png' alt='' className='h-1/3 w-1/3 rounded-full object-cover opacity-30 grayscale' />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      onError={() => setFailedSrc(src)}
      className={cn('bg-sand object-cover', className)}
    />
  )
}
