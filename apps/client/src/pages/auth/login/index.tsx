import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { loginSchema, type LoginInput } from '@lib/schemas/auth'
import { useLoginStore } from './store'
import { AuthLayout, ErrorBanner, FieldInput, SubmitButton } from '../components'

// US-02: Đăng nhập hệ thống
export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { loading, error, needsVerification, submit, reset } = useLoginStore()

  useEffect(() => reset, [reset])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: searchParams.get('email') ?? '', password: '' }
  })

  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/'
  const identifier = watch('identifier').trim()
  const verifyLink = identifier.includes('@')
    ? `/verify-email?email=${encodeURIComponent(identifier)}`
    : '/verify-email'

  return (
    <AuthLayout title='Đăng nhập' subtitle='Chào mừng bạn quay lại với Gốm Sứ Xanh.'>
      <form
        onSubmit={handleSubmit((data) => submit(data, () => navigate(redirectTo, { replace: true })))}
        className='space-y-5'
        noValidate
      >
        <ErrorBanner message={error}>
          {needsVerification && (
            <Link to={verifyLink} className='link'>
              Xác thực email ngay
            </Link>
          )}
        </ErrorBanner>

        <FieldInput
          id='identifier'
          label='Email hoặc số điện thoại'
          placeholder='ban@gmail.com hoặc 0912345678'
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
            <Link to='/forgot-password' className='link text-sm'>
              Quên mật khẩu?
            </Link>
          </div>
        </div>

        <SubmitButton loading={loading} loadingText='Đang đăng nhập...'>
          Đăng nhập
        </SubmitButton>
      </form>

      <p className='mt-8 text-center text-sm text-ink'>
        Chưa có tài khoản?{' '}
        <Link to='/register' className='link'>
          Đăng ký ngay
        </Link>
      </p>
    </AuthLayout>
  )
}
