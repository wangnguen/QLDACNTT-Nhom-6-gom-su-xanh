import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { OTP_RESEND_SECONDS, verifyEmailSchema, type VerifyEmailInput } from '@lib/schemas/auth'
import { useCountdown } from '@hooks/useCountdown'
import { useVerifyEmailStore } from './store'
import { AuthLayout, ErrorBanner, FieldInput, OtpInput, ResendButton, SubmitButton } from '../components'

// US-01: Bước 2 của đăng ký — nhập mã OTP gửi qua email
export default function VerifyEmailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { loading, resending, error, submit, resend, reset } = useVerifyEmailStore()

  const otpJustSent = (location.state as { otpSent?: boolean } | null)?.otpSent === true
  const { seconds, start } = useCountdown(otpJustSent ? OTP_RESEND_SECONDS : 0)

  useEffect(() => reset, [reset])

  const {
    control,
    register,
    handleSubmit,
    getValues,
    trigger,
    formState: { errors }
  } = useForm<VerifyEmailInput>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { email: searchParams.get('email') ?? '', otp: '' }
  })

  const handleResend = async () => {
    if (!(await trigger('email'))) return
    if (await resend(getValues('email'))) start(OTP_RESEND_SECONDS)
  }

  const onSubmit = (data: VerifyEmailInput) =>
    submit(data, () => navigate(`/login?email=${encodeURIComponent(data.email)}`, { replace: true }))

  return (
    <AuthLayout
      title='Xác thực email'
      subtitle='Nhập mã gồm 6 chữ số đã được gửi tới email của bạn. Mã có hiệu lực trong 10 phút.'
    >
      <form onSubmit={handleSubmit(onSubmit)} className='space-y-5' noValidate>
        <ErrorBanner message={error} />

        <FieldInput
          id='email'
          label='Email đăng ký'
          type='email'
          placeholder='ban@gmail.com'
          autoComplete='email'
          error={errors.email}
          registration={register('email')}
        />

        <Controller
          name='otp'
          control={control}
          render={({ field }) => <OtpInput value={field.value} onChange={field.onChange} error={errors.otp?.message} />}
        />

        <SubmitButton loading={loading} loadingText='Đang xác thực...'>
          Xác thực
        </SubmitButton>

        <ResendButton seconds={seconds} loading={resending} onResend={handleResend} />
      </form>

      <p className='mt-8 text-center text-sm text-ink'>
        Đã xác thực?{' '}
        <Link to='/login' className='link'>
          Đăng nhập
        </Link>
      </p>
    </AuthLayout>
  )
}
