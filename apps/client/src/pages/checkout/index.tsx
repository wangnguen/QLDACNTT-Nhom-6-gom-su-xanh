import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { checkoutSchema, type CheckoutInput } from '@lib/schemas/order'
import { ErrorBanner, FieldInput, SubmitButton } from '@pages/auth/components'
import { useAuthStore } from '@stores/authStore'
import { useCartStore } from '@stores/cartStore'
import { OrderSummary } from './components/OrderSummary'
import { PaymentMethodPicker } from './components/PaymentMethodPicker'
import { useCheckoutStore } from './store'

// US-14: Đặt hàng — thông tin giao hàng, phương thức thanh toán; đơn VNPay chuyển sang cổng thanh toán
export default function CheckoutPage() {
  const user = useAuthStore((s) => s.user)
  const { cart, fetch: fetchCart } = useCartStore()
  const { methods, submitting, submitError, fetchMethods, checkout, reset } = useCheckoutStore()
  const navigate = useNavigate()

  useEffect(() => {
    reset()
    fetchCart()
    fetchMethods()
  }, [reset, fetchCart, fetchMethods])

  const {
    register,
    handleSubmit,
    control,
    formState: { errors }
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      recipientName: user?.fullName ?? '',
      recipientPhone: user?.phone ?? '',
      shippingAddress: user?.address ?? '',
      note: '',
      paymentMethod: 'cod'
    }
  })

  if (!cart) {
    return (
      <div className='mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14' aria-busy='true' aria-label='Đang tải giỏ hàng'>
        <div className='h-10 w-56 animate-pulse rounded bg-cream' />
        <div className='mt-8 h-96 animate-pulse rounded-[var(--radius-organic)] bg-cream' />
      </div>
    )
  }

  const lines = cart.items.filter((line) => !line.issue)
  // Giỏ không còn gì mua được thì quay lại giỏ hàng (trừ lúc vừa đặt xong, đang chuyển trang)
  if (lines.length === 0 && !submitting) return <Navigate to='/cart' replace />

  const onSubmit = async (data: CheckoutInput) => {
    const result = await checkout({ ...data, note: data.note || null })
    if (!result) return

    if (result.paymentUrl) {
      // Chuyển sang cổng thanh toán; giỏ hàng được tải lại khi khách quay về
      window.location.assign(result.paymentUrl)
      return
    }
    // Trang kết quả tự tải lại giỏ hàng (sản phẩm đã đặt được bỏ khỏi giỏ)
    navigate('/payment/result', { replace: true, state: { order: result.order } })
  }

  return (
    <div className='mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14'>
      <Link to='/cart' className='inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-teal'>
        <ArrowLeft size={16} />
        Quay lại giỏ hàng
      </Link>
      <h1 className='mt-3 font-display text-4xl font-bold text-moss'>Đặt hàng</h1>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className='mt-8 grid gap-6 lg:grid-cols-[1fr_24rem] lg:items-start'
      >
        <section className='space-y-6 rounded-[var(--radius-organic)] border border-clay/70 bg-cream p-6 shadow-sm sm:p-8'>
          <ErrorBanner message={submitError} />

          <div>
            <h2 className='text-lg font-bold text-moss'>Thông tin giao hàng</h2>
            <div className='mt-4 grid gap-4 sm:grid-cols-2'>
              <FieldInput
                id='recipientName'
                label='Người nhận'
                autoComplete='name'
                error={errors.recipientName}
                registration={register('recipientName')}
              />
              <FieldInput
                id='recipientPhone'
                label='Số điện thoại'
                type='tel'
                autoComplete='tel'
                placeholder='0912345678'
                error={errors.recipientPhone}
                registration={register('recipientPhone')}
              />
              <FieldInput
                id='shippingAddress'
                label='Địa chỉ giao hàng'
                autoComplete='street-address'
                placeholder='Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành'
                error={errors.shippingAddress}
                registration={register('shippingAddress')}
                className='sm:col-span-2'
              />
              <FieldInput
                id='note'
                label='Ghi chú cho cửa hàng (không bắt buộc)'
                placeholder='VD: giao giờ hành chính, gọi trước khi giao'
                error={errors.note}
                registration={register('note')}
                className='sm:col-span-2'
              />
            </div>
          </div>

          <Controller
            control={control}
            name='paymentMethod'
            render={({ field }) => (
              <PaymentMethodPicker
                methods={methods}
                value={field.value}
                onChange={field.onChange}
                disabled={submitting}
              />
            )}
          />
        </section>

        <aside className='rounded-[var(--radius-organic)] border border-clay/70 bg-cream p-6 shadow-sm lg:sticky lg:top-24'>
          <OrderSummary lines={lines} skippedCount={cart.items.length - lines.length} />
          <div className='mt-6'>
            <SubmitButton loading={submitting} loadingText='Đang đặt hàng...'>
              Đặt hàng
            </SubmitButton>
          </div>
          <p className='mt-3 flex items-start gap-2 text-xs text-muted'>
            <ShieldCheck size={15} className='mt-px shrink-0 text-teal' aria-hidden />
            Giá và phí giao hàng được chốt khi đặt. Gốm được đóng gói chống sốc, kiểm hàng trước khi nhận.
          </p>
        </aside>
      </form>
    </div>
  )
}
