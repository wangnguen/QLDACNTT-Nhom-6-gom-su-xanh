import type { ReactNode } from 'react'

interface Props {
  title: string
  description?: ReactNode
  actions?: ReactNode
}

export function PageHeader({ title, description, actions }: Props) {
  return (
    <div className='mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
      <div>
        <h1 className='font-display text-4xl font-bold text-moss'>{title}</h1>
        {description && <p className='mt-1.5 text-ink'>{description}</p>}
      </div>
      {actions && <div className='flex shrink-0 flex-wrap gap-2'>{actions}</div>}
    </div>
  )
}
