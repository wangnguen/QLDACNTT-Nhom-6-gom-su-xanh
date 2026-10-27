import type { ReactNode } from 'react'
import { ShieldCheck } from 'lucide-react'
import { Logo } from '@components/Logo'

interface Props {
  title: string
  subtitle?: ReactNode
  children: ReactNode
}

export function AuthLayout({ title, subtitle, children }: Props) {
  return (
    <div className='grid min-h-screen lg:grid-cols-[5fr_6fr]'>
      <aside className='relative hidden flex-col justify-between overflow-hidden bg-forest p-12 text-cream lg:flex'>
        <Logo inverted />

        <div className='relative z-10'>
          <span className='inline-flex items-center gap-2 rounded-full bg-cream/10 px-3 py-1 text-sm font-semibold text-mint'>
            <ShieldCheck size={16} /> Chỉ dành cho quản trị viên
          </span>
          <p className='mt-5 font-display text-5xl leading-[1.1] font-bold'>
            Quản lý cửa hàng
            <br />
            Gốm Sứ Xanh.
          </p>
          <p className='mt-5 max-w-sm text-mint/80'>Sản phẩm, đơn hàng, lịch workshop và khách hàng ở cùng một nơi.</p>
        </div>

        <p className='relative z-10 text-sm text-mint/60'>© 2026 Gốm Sứ Xanh</p>

        <div
          aria-hidden
          className='absolute -right-40 -bottom-40 h-[30rem] w-[30rem] rounded-full border-[48px] border-moss/60'
        />
        <div
          aria-hidden
          className='absolute -right-12 -bottom-12 h-64 w-64 rounded-full border-[28px] border-leaf/25'
        />
      </aside>

      <main className='flex items-center justify-center px-4 py-10 sm:px-8'>
        <div className='w-full max-w-md'>
          <div className='mb-8 flex justify-center lg:hidden'>
            <Logo />
          </div>
          <h1 className='font-display text-3xl font-bold text-moss sm:text-4xl'>{title}</h1>
          {subtitle && <p className='mt-2 text-ink'>{subtitle}</p>}
          <div className='mt-8'>{children}</div>
        </div>
      </main>
    </div>
  )
}
