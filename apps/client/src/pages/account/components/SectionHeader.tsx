import type { ReactNode } from 'react'

interface Props {
  title: string
  description?: ReactNode
}

export function SectionHeader({ title, description }: Props) {
  return (
    <header className='mb-6 border-b border-clay/50 pb-5'>
      <h2 className='font-display text-2xl font-bold text-moss sm:text-3xl'>{title}</h2>
      {description && <p className='mt-1.5 text-ink'>{description}</p>}
    </header>
  )
}
