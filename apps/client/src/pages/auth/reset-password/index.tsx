import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CircleCheck } from 'lucide-react'
import { OTP_RESEND_SECONDS, PASSWORD_HINT, resetPasswordSchema, type ResetPasswordInput } from '@lib/schemas/auth'
import { useCountdown } from '@hooks/useCountdown'
import { useResetPasswordStore } from './store'
import { AuthLayout, ErrorBanner, FieldInput, OtpInput, ResendButton, SubmitButton } from '../components'

// US-03: Quên mật khẩu — bước 2: nhập OTP + mật khẩu mới
export default function ResetPasswordPage() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { step, loading, resending, error, submit, resend, reset } = useResetPasswordStore()

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
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: searchParams.get('email') ?? '', otp: '', password: '', confirmPassword: '' }
  })

  const handleResend = async () => {
    if (!(await trigger('email'))) return
    if (await resend(getValues('email'))) start(OTP_RESEND_SECONDS)
  }

  if (step === 'done') {
    return (
      <AuthLayout title='Đặt lại mật khẩu thành công'>
        <div className='flex items-start gap-3 rounded-xl border border-sage/50 bg-mint/25 p-4 text-ink'>
          <CircleCheck size={22} className='mt-px shrink-0 text-teal' />
          <p>Mật khẩu của bạn đã được cập nhật. Các phiên đăng nhập cũ đã bị đăng xuất để bảo vệ tài khoản.</p>
        </div>
        <Link to={`/login?email=${encodeURIComponent(getValues('email'))}`} replace className='btn-primary mt-6 w-full'>
          Đăng nhập với mật khẩu mới
        </Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title='Đặt lại mật khẩu' subtitle='Nhập mã OTP đã được gửi tới email và tạo mật khẩu mới.'>
      <form onSubmit={handleSubmit(submit)} className='space-y-5' noValidate>
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

        <Controller
          name='otp'
          control={control}
          render={({ field }) => <OtpInput value={field.value} onChange={field.onChange} error={errors.otp?.message} />}
        />

        <FieldInput
          id='password'
          label='Mật khẩu mới'
          type='password'
          placeholder='Tối thiểu 8 ký tự'
          autoComplete='new-password'
          hint={PASSWORD_HINT}
          error={errors.password}
          registration={register('password')}
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
          Đặt lại mật khẩu
        </SubmitButton>

        <ResendButton seconds={seconds} loading={resending} onResend={handleResend} />
      </form>

      <div className='mt-8 flex justify-center text-sm'>
        <Link to='/login' className='inline-flex items-center gap-1.5 font-semibold text-muted hover:text-teal'>
          <ArrowLeft size={16} />
          Quay lại đăng nhập
        </Link>
      </div>
    </AuthLayout>
  )
}
