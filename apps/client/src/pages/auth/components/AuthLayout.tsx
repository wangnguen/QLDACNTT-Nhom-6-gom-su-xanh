import type { ReactNode } from 'react'
import { Logo } from '@components/Logo'

interface Props {
  title: string
  subtitle?: ReactNode
  children: ReactNode
}

// Khung chung cho các trang đăng nhập / đăng ký / quên mật khẩu
export function AuthLayout({ title, subtitle, children }: Props) {
  return (
    <div className='grid min-h-screen lg:grid-cols-[5fr_6fr]'>
      <aside className='relative hidden flex-col justify-between overflow-hidden bg-moss p-12 text-cream lg:flex'>
        <Logo inverted />

        <div className='relative z-10'>
          <p className='font-display text-5xl leading-[1.1] font-bold'>
            Nặn đất thành hình,
            <br />
            gửi tình vào gốm.
          </p>
          <p className='mt-5 max-w-sm text-mint/90'>
            Gốm thủ công Bát Tràng và những buổi workshop tự tay làm gốm cùng nghệ nhân.
          </p>
        </div>

        <p className='relative z-10 text-sm text-mint/70'>© 2026 Gốm Sứ Xanh</p>

        {/* Vòng tròn trang trí — gợi hình bàn xoay gốm */}
        <div
          aria-hidden
          className='absolute -right-40 -bottom-40 h-[30rem] w-[30rem] rounded-full border-[48px] border-leaf/30'
        />
        <div
          aria-hidden
          className='absolute -right-12 -bottom-12 h-64 w-64 rounded-full border-[28px] border-mint/15'
        />
        <div aria-hidden className='absolute top-24 -right-20 h-40 w-40 rounded-full border-[16px] border-sage/20' />
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
