import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { forgotPasswordSchema, type ForgotPasswordInput } from '@lib/schemas/auth'
import { useForgotPasswordStore } from './store'
import { AuthLayout, ErrorBanner, FieldInput, SubmitButton } from '../components'

// US-03: Quên mật khẩu — bước 1: nhập email để nhận mã OTP
export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { loading, error, submit, reset } = useForgotPasswordStore()

  useEffect(() => reset, [reset])

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: searchParams.get('email') ?? '' }
  })

  const onSubmit = (data: ForgotPasswordInput) =>
    submit(data, () =>
      navigate(`/reset-password?email=${encodeURIComponent(data.email)}`, { state: { otpSent: true } })
    )

  return (
    <AuthLayout
      title='Quên mật khẩu'
      subtitle='Nhập email đã đăng ký, chúng tôi sẽ gửi mã OTP để bạn đặt lại mật khẩu.'
    >
      <form onSubmit={handleSubmit(onSubmit)} className='space-y-5' noValidate>
        <ErrorBanner message={error} />

        <FieldInput
          id='email'
          label='Email'
          type='email'
          placeholder='ban@gmail.com'
          autoComplete='email'
          error={errors.email}
          registration={register('email')}
        />

        <SubmitButton loading={loading} loadingText='Đang gửi mã...'>
          Gửi mã OTP
        </SubmitButton>
      </form>

      <div className='mt-8 flex flex-col items-center gap-3 text-sm text-ink'>
        <p>
          Đã có mã?{' '}
          <Link to='/reset-password' className='link'>
            Đặt lại mật khẩu
          </Link>
        </p>
        <Link to='/login' className='inline-flex items-center gap-1.5 font-semibold text-muted hover:text-teal'>
          <ArrowLeft size={16} />
          Quay lại đăng nhập
        </Link>
      </div>
    </AuthLayout>
  )
}
