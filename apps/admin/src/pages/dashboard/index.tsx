import { BadgeCheck } from 'lucide-react'
import { useAuthStore } from '@stores/authStore'

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  if (!user) return null

  const rows = [
    { label: 'Email', value: user.email },
    { label: 'Số điện thoại', value: user.phone ?? '—' },
    { label: 'Vai trò', value: 'Quản trị viên' }
  ]

  return (
    <div className='mx-auto max-w-4xl'>
      <h1 className='font-display text-4xl font-bold text-moss'>Xin chào, {user.fullName}!</h1>
      <p className='mt-2 text-ink'>Chào mừng bạn đến trang quản trị Gốm Sứ Xanh.</p>

      <section className='mt-8 rounded-[var(--radius-organic)] border border-clay/70 bg-cream p-6 shadow-sm sm:p-8'>
        <div className='flex items-center gap-2'>
          <h2 className='text-lg font-bold'>Tài khoản đang đăng nhập</h2>
          <BadgeCheck size={18} className='text-teal' aria-label='Đã xác thực' />
        </div>
        <dl className='mt-4 divide-y divide-clay/50'>
          {rows.map((row) => (
            <div key={row.label} className='grid gap-1 py-3 sm:grid-cols-3'>
              <dt className='text-sm text-muted'>{row.label}</dt>
              <dd className='font-medium break-all sm:col-span-2'>{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}
