import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PASSWORD_HINT } from '@lib/schemas/auth'
import { changePasswordSchema, type ChangePasswordInput } from '@lib/schemas/account'
import { ErrorBanner, FieldInput, SubmitButton } from '@pages/auth/components'
import { SectionHeader } from '../components'
import { useChangePasswordStore } from './store'

// US-05: Thay đổi mật khẩu
export default function ChangePasswordPage() {
  const { loading, error, submit, reset } = useChangePasswordStore()

  useEffect(() => reset, [reset])

  const {
    register,
    handleSubmit,
    reset: resetForm,
    formState: { errors }
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' }
  })

  const onSubmit = (data: ChangePasswordInput) => submit(data, () => resetForm())

  return (
    <>
      <SectionHeader
        title='Đổi mật khẩu'
        description='Sau khi đổi, các thiết bị khác đang đăng nhập sẽ bị đăng xuất. Thiết bị này vẫn giữ phiên đăng nhập.'
      />

      <form onSubmit={handleSubmit(onSubmit)} className='max-w-xl space-y-5' noValidate>
        <ErrorBanner message={error} />

        <FieldInput
          id='currentPassword'
          label='Mật khẩu hiện tại'
          type='password'
          placeholder='Nhập mật khẩu hiện tại'
          autoComplete='current-password'
          error={errors.currentPassword}
          registration={register('currentPassword')}
        />

        <FieldInput
          id='newPassword'
          label='Mật khẩu mới'
          type='password'
          placeholder='Tối thiểu 8 ký tự'
          autoComplete='new-password'
          hint={PASSWORD_HINT}
          error={errors.newPassword}
          registration={register('newPassword')}
        />

        <FieldInput
          id='confirmPassword'
          label='Xác nhận mật khẩu mới'
          type='password'
          placeholder='Nhập lại mật khẩu mới'
          autoComplete='new-password'
          error={errors.confirmPassword}
          registration={register('confirmPassword')}
        />

        <SubmitButton loading={loading} loadingText='Đang lưu...'>
          Đổi mật khẩu
        </SubmitButton>
      </form>
    </>
  )
}
