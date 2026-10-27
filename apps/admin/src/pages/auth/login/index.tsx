import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useLocation, useNavigate } from 'react-router-dom'
import { loginSchema, type LoginInput } from '@lib/schemas/auth'
import { useLoginStore } from './store'
import { AuthLayout, ErrorBanner, FieldInput, SubmitButton } from '../components'

// Quên mật khẩu dùng chung luồng OTP của trang client (US-03)
const FORGOT_PASSWORD_URL = `${import.meta.env.VITE_CLIENT_URL ?? 'http://localhost:3000'}/forgot-password`

// US-02: Đăng nhập trang quản trị
export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { loading, error, submit, reset } = useLoginStore()

  useEffect(() => reset, [reset])

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' }
  })

  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/'

  return (
    <AuthLayout title='Đăng nhập quản trị' subtitle='Sử dụng tài khoản quản trị viên được cấp.'>
      <form
        onSubmit={handleSubmit((data) => submit(data, () => navigate(redirectTo, { replace: true })))}
        className='space-y-5'
        noValidate
      >
        <ErrorBanner message={error} />

        <FieldInput
          id='identifier'
          label='Email hoặc số điện thoại'
          placeholder='admin@gmail.com'
          autoComplete='username'
          error={errors.identifier}
          registration={register('identifier')}
        />

        <div>
          <FieldInput
            id='password'
            label='Mật khẩu'
            type='password'
            placeholder='••••••••'
            autoComplete='current-password'
            error={errors.password}
            registration={register('password')}
          />
          <div className='mt-2 text-right'>
            <a href={FORGOT_PASSWORD_URL} className='link text-sm'>
              Quên mật khẩu?
            </a>
          </div>
        </div>

        <SubmitButton loading={loading} loadingText='Đang đăng nhập...'>
          Đăng nhập
        </SubmitButton>
      </form>
    </AuthLayout>
  )
}
