import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MailCheck } from 'lucide-react'
import { OTP_RESEND_SECONDS } from '@lib/schemas/auth'
import {
  changeEmailSchema,
  verifyChangeEmailSchema,
  type ChangeEmailInput,
  type VerifyChangeEmailInput
} from '@lib/schemas/account'
import { useCountdown } from '@hooks/useCountdown'
import { useAuthStore } from '@stores/authStore'
import { ErrorBanner, FieldInput, OtpInput, ResendButton, SubmitButton } from '@pages/auth/components'
import { ReadonlyField, SectionHeader } from '../components'
import { useChangeEmailStore } from './store'

// US-04: Thay đổi email — bước 1: email mới + mật khẩu, bước 2: mã OTP gửi tới email mới
export default function ChangeEmailPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { step, pending, loading, resending, error, request, verify, resend, back, reset } = useChangeEmailStore()
  const { seconds, start } = useCountdown()

  useEffect(() => reset, [reset])

  const emailForm = useForm<ChangeEmailInput>({
    resolver: zodResolver(changeEmailSchema),
    defaultValues: { newEmail: '', password: '' }
  })

  const otpForm = useForm<VerifyChangeEmailInput>({
    resolver: zodResolver(verifyChangeEmailSchema),
    defaultValues: { otp: '' }
  })

  const onRequest = async (data: ChangeEmailInput) => {
    if (await request(data)) start(OTP_RESEND_SECONDS)
  }

  const onVerify = (data: VerifyChangeEmailInput) => verify(data, () => navigate('/account', { replace: true }))

  const handleResend = async () => {
    if (await resend()) start(OTP_RESEND_SECONDS)
  }

  const handleBack = () => {
    back()
    otpForm.reset()
    emailForm.resetField('password')
  }

  if (!user) return null

  return (
    <>
      <SectionHeader
        title='Đổi email'
        description='Email dùng để đăng nhập và nhận thông báo. Email chỉ thay đổi sau khi bạn xác nhận mã gửi tới email mới.'
      />

      {step === 'form' ? (
        <form onSubmit={emailForm.handleSubmit(onRequest)} className='max-w-xl space-y-5' noValidate>
          <ErrorBanner message={error} />

          <ReadonlyField label='Email hiện tại' value={<span className='truncate'>{user.email}</span>} />

          <FieldInput
            id='newEmail'
            label='Email mới'
            type='email'
            placeholder='ban@gmail.com'
            autoComplete='email'
            error={emailForm.formState.errors.newEmail}
            registration={emailForm.register('newEmail')}
          />

          <FieldInput
            id='password'
            label='Mật khẩu hiện tại'
            type='password'
            placeholder='Nhập mật khẩu để xác nhận'
            autoComplete='current-password'
            hint='Để chắc chắn chính bạn đang thực hiện thay đổi này'
            error={emailForm.formState.errors.password}
            registration={emailForm.register('password')}
          />

          <SubmitButton loading={loading} loadingText='Đang gửi mã...'>
            Gửi mã xác nhận
          </SubmitButton>
        </form>
      ) : (
        <form onSubmit={otpForm.handleSubmit(onVerify)} className='max-w-xl space-y-5' noValidate>
          <div className='flex items-start gap-3 rounded-xl border border-sage/50 bg-mint/25 p-4 text-ink'>
            <MailCheck size={22} className='mt-px shrink-0 text-teal' />
            <p>
              Mã xác nhận 6 số đã được gửi tới <strong className='break-all text-forest'>{pending?.newEmail}</strong>.
              Mã có hiệu lực trong 10 phút.
            </p>
          </div>

          <ErrorBanner message={error} />

          <Controller
            name='otp'
            control={otpForm.control}
            render={({ field }) => (
              <OtpInput value={field.value} onChange={field.onChange} error={otpForm.formState.errors.otp?.message} />
            )}
          />

          <SubmitButton loading={loading} loadingText='Đang xác nhận...'>
            Xác nhận đổi email
          </SubmitButton>

          <ResendButton seconds={seconds} loading={resending} onResend={handleResend} />

          <button
            type='button'
            onClick={handleBack}
            className='mx-auto flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-teal'
          >
            <ArrowLeft size={16} />
            Dùng email khác
          </button>
        </form>
      )}
    </>
  )
}
