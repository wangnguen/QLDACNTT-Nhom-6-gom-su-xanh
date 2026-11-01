import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { cn } from '@lib/utils'

interface Props {
  src: string | null
  alt: string
  className?: string
}

// Ảnh nhỏ trong bảng/form; link hỏng hoặc chưa có ảnh thì hiện biểu tượng thay thế
export function Thumbnail({ src, alt, className }: Props) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  // Link đang gõ dở (chưa phải http/https) thì chưa tải để khỏi gọi request hỏng
  const broken = !src || !/^https?:\/\/\S+$/i.test(src) || failedSrc === src

  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-clay/60 bg-sand text-muted',
        className ?? 'h-12 w-12'
      )}
    >
      {broken ? (
        <ImageOff size={18} aria-hidden />
      ) : (
        <img
          src={src}
          alt={alt}
          loading='lazy'
          className='h-full w-full object-cover'
          onError={() => setFailedSrc(src)}
        />
      )}
    </span>
  )
}
