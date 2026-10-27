import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { BadgeCheck } from 'lucide-react'
import { GENDER_OPTIONS, profileSchema, type ProfileInput } from '@lib/schemas/account'
import { useAuthStore } from '@stores/authStore'
import { ErrorBanner, FieldInput, SubmitButton } from '@pages/auth/components'
import { ReadonlyField, SectionHeader } from '../components'
import { useProfileStore } from './store'

// US-06: Quản lý thông tin cá nhân
export default function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const { loading, error, submit, reset } = useProfileStore()

  useEffect(() => reset, [reset])

  // Form bám theo `user`: lưu xong store cập nhật user → form nhận giá trị mới và hết trạng thái "đã sửa"
  const values = useMemo<ProfileInput>(
    () => ({
      fullName: user?.fullName ?? '',
      phone: user?.phone ?? '',
      gender: user?.gender ?? '',
      address: user?.address ?? ''
    }),
    [user]
  )

  const {
    register,
    handleSubmit,
    reset: resetForm,
    formState: { errors, isDirty }
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    values
  })

  if (!user) return null

  return (
    <>
      <SectionHeader title='Hồ sơ cá nhân' description='Thông tin liên hệ dùng khi đặt hàng và đăng ký workshop.' />

      <form onSubmit={handleSubmit(submit)} className='max-w-xl space-y-5' noValidate>
        <ErrorBanner message={error} />

        <FieldInput
          id='fullName'
          label='Họ và tên'
          placeholder='Nguyễn Văn An'
          autoComplete='name'
          error={errors.fullName}
          registration={register('fullName')}
        />

        <ReadonlyField
          label='Email'
          value={
            <>
              <span className='truncate'>{user.email}</span>
              {user.isEmailVerified && (
                <BadgeCheck size={16} className='shrink-0 text-teal' aria-label='Email đã xác thực' />
              )}
            </>
          }
          action={
            <Link to='/account/email' className='link'>
              Đổi email
            </Link>
          }
        />

        <FieldInput
          id='phone'
          label='Số điện thoại'
          type='tel'
          inputMode='numeric'
          placeholder='0912345678'
          autoComplete='tel'
          hint='Có thể dùng số điện thoại thay email khi đăng nhập'
          error={errors.phone}
          registration={register('phone')}
        />

        <fieldset>
          <legend className='mb-1.5 block text-sm font-semibold text-forest'>Giới tính</legend>
          <div className='flex flex-wrap gap-2'>
            {GENDER_OPTIONS.map((option) => (
              <label key={option.value} className='cursor-pointer'>
                <input type='radio' value={option.value} className='peer sr-only' {...register('gender')} />
                <span className='inline-flex min-w-20 justify-center rounded-full border border-clay px-5 py-2 text-sm font-semibold text-moss transition-colors peer-checked:border-teal peer-checked:bg-teal peer-checked:text-cream peer-focus-visible:ring-4 peer-focus-visible:ring-teal/20 hover:border-teal'>
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <FieldInput
          id='address'
          label='Địa chỉ'
          placeholder='Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành'
          autoComplete='street-address'
          error={errors.address}
          registration={register('address')}
        />

        <div className='space-y-3 pt-1'>
          <SubmitButton loading={loading} disabled={!isDirty} loadingText='Đang lưu...'>
            Lưu thay đổi
          </SubmitButton>
          {isDirty && !loading && (
            <button
              type='button'
              onClick={() => resetForm()}
              className='mx-auto block text-sm font-semibold text-muted hover:text-teal'
            >
              Huỷ thay đổi
            </button>
          )}
        </div>
      </form>
    </>
  )
}
