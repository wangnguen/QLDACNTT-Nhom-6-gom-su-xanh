import { BadgeCheck } from 'lucide-react'
import { useAuthStore } from '@stores/authStore'

export default function AccountPage() {
  const user = useAuthStore((s) => s.user)
  if (!user) return null

  const rows = [
    { label: 'Họ và tên', value: user.fullName },
    { label: 'Email', value: user.email },
    { label: 'Số điện thoại', value: user.phone ?? '—' }
  ]

  return (
    <div className='mx-auto max-w-2xl px-4 py-12 sm:px-6'>
      <h1 className='font-display text-4xl font-bold text-moss'>Tài khoản của tôi</h1>

      <div className='mt-8 rounded-[var(--radius-organic)] border border-clay/70 bg-cream p-6 shadow-sm sm:p-8'>
        <div className='flex flex-wrap items-center gap-3'>
          <span className='flex h-14 w-14 items-center justify-center rounded-full bg-moss font-display text-2xl font-bold text-cream'>
            {user.fullName.trim().charAt(0).toUpperCase()}
          </span>
          <div>
            <p className='text-lg font-bold'>{user.fullName}</p>
            {user.isEmailVerified && (
              <p className='inline-flex items-center gap-1 text-sm font-semibold text-teal'>
                <BadgeCheck size={16} /> Email đã xác thực
              </p>
            )}
          </div>
        </div>

        <dl className='mt-6 divide-y divide-clay/50'>
          {rows.map((row) => (
            <div key={row.label} className='grid gap-1 py-3 sm:grid-cols-3'>
              <dt className='text-sm text-muted'>{row.label}</dt>
              <dd className='font-medium break-all sm:col-span-2'>{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
