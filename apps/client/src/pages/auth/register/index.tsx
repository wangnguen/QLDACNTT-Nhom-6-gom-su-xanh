import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { CircleAlert } from 'lucide-react'
import { PASSWORD_HINT, registerSchema, type RegisterInput } from '@lib/schemas/auth'
import { useRegisterStore } from './store'
import { AuthLayout, ErrorBanner, FieldInput, SubmitButton } from '../components'

// US-01: Đăng ký tài khoản
export default function RegisterPage() {
  const navigate = useNavigate()
  const { loading, error, submit, reset } = useRegisterStore()

  useEffect(() => reset, [reset])

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', phone: '', password: '', confirmPassword: '', agree: false }
  })

  const goToVerify = (email: string) =>
    navigate(`/verify-email?email=${encodeURIComponent(email)}`, { state: { otpSent: true } })

  return (
    <AuthLayout title='Tạo tài khoản' subtitle='Đăng ký để mua gốm và đặt lịch workshop dễ dàng hơn.'>
      <form onSubmit={handleSubmit((data) => submit(data, goToVerify))} className='space-y-5' noValidate>
        <ErrorBanner message={error} />

        <FieldInput
          id='fullName'
          label='Họ và tên'
          placeholder='Nguyễn Văn An'
          autoComplete='name'
          error={errors.fullName}
          registration={register('fullName')}
        />

        <div className='grid gap-5 sm:grid-cols-2'>
          <FieldInput
            id='email'
            label='Email'
            type='email'
            placeholder='ban@gmail.com'
            autoComplete='email'
            error={errors.email}
            registration={register('email')}
          />
          <FieldInput
            id='phone'
            label='Số điện thoại'
            type='tel'
            inputMode='numeric'
            placeholder='0912345678'
            autoComplete='tel'
            error={errors.phone}
            registration={register('phone')}
          />
        </div>

        <FieldInput
          id='password'
          label='Mật khẩu'
          type='password'
          placeholder='Tối thiểu 8 ký tự'
          autoComplete='new-password'
          hint={PASSWORD_HINT}
          error={errors.password}
          registration={register('password')}
        />

        <FieldInput
          id='confirmPassword'
          label='Xác nhận mật khẩu'
          type='password'
          placeholder='Nhập lại mật khẩu'
          autoComplete='new-password'
          error={errors.confirmPassword}
          registration={register('confirmPassword')}
        />

        <div>
          <label className='flex cursor-pointer items-start gap-3 text-sm text-ink'>
            <input
              type='checkbox'
              className='mt-0.5 h-4 w-4 shrink-0 accent-teal'
              aria-invalid={!!errors.agree}
              {...register('agree')}
            />
            <span>Tôi đồng ý với Điều khoản sử dụng và Chính sách bảo mật của Gốm Sứ Xanh.</span>
          </label>
          {errors.agree && (
            <p className='mt-1.5 flex items-start gap-1 text-xs font-medium text-danger'>
              <CircleAlert size={14} className='mt-px shrink-0' />
              {errors.agree.message}
            </p>
          )}
        </div>

        <SubmitButton loading={loading} loadingText='Đang tạo tài khoản...'>
          Đăng ký
        </SubmitButton>
      </form>

      <p className='mt-8 text-center text-sm text-ink'>
        Đã có tài khoản?{' '}
        <Link to='/login' className='link'>
          Đăng nhập
        </Link>
      </p>
    </AuthLayout>
  )
}
