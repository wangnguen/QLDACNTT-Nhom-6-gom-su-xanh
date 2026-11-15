import { useEffect, useMemo, type ReactNode } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, RotateCw } from 'lucide-react'
import { MAX_WORKSHOP_IMAGES, workshopFormSchema, type WorkshopFormInput } from '@lib/schemas/workshop'
import { formatPrice, toVnParts } from '@lib/utils'
import { ErrorBanner, FieldInput, SubmitButton } from '@pages/auth/components'
import { ImageUrlsField, TextareaField } from '@components/form'
import { PageHeader, Switch } from '@components/ui'
import { FullPageSpinner } from '@components/Spinner'
import { SeatsCell } from '../components/SeatsCell'
import { useWorkshopFormStore } from './store'

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className='rounded-[var(--radius-organic)] border border-clay/70 bg-cream p-5 shadow-sm sm:p-6'>
      <h2 className='mb-4 text-base font-bold text-moss'>{title}</h2>
      <div className='space-y-5'>{children}</div>
    </section>
  )
}

// Ô số để trống → undefined để form hiện trống và báo "Vui lòng nhập ..."
const EMPTY_FORM = {
  name: '',
  instructor: '',
  location: '',
  date: '',
  startTime: '',
  endTime: '',
  deadline: '',
  price: undefined as unknown as number,
  capacity: undefined as unknown as number,
  description: '',
  images: [],
  isActive: true
} satisfies WorkshopFormInput

// US-11: Thêm lớp (/workshops/new) và sửa lớp (/workshops/:id/edit)
export default function WorkshopFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  // Quay về đúng trang/bộ lọc của danh sách
  const backTo = `/workshops${(location.state as { from?: string } | null)?.from ?? ''}`

  const { workshop, loading, loadError, notFound, saving, error, load, submit, reset } = useWorkshopFormStore()

  useEffect(() => {
    load(id)
    return reset
  }, [id, load, reset])

  const values = useMemo<WorkshopFormInput | undefined>(() => {
    if (!workshop) return undefined
    const start = toVnParts(workshop.startsAt)
    const deadline = workshop.registrationDeadline ? toVnParts(workshop.registrationDeadline) : null
    return {
      name: workshop.name,
      instructor: workshop.instructor ?? '',
      location: workshop.location,
      date: start.date,
      startTime: start.time,
      endTime: toVnParts(workshop.endsAt).time,
      deadline: deadline ? `${deadline.date}T${deadline.time}` : '',
      price: workshop.price,
      capacity: workshop.capacity,
      description: workshop.description ?? '',
      images: workshop.imageUrls.map((url) => ({ url })),
      isActive: workshop.isActive
    }
  }, [workshop])

  const resolver = useMemo(() => zodResolver(workshopFormSchema(!id)), [id])

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty }
  } = useForm<WorkshopFormInput>({ resolver, defaultValues: EMPTY_FORM, values })

  const price = useWatch({ control, name: 'price' })

  const onSubmit = async (data: WorkshopFormInput) => {
    if (await submit(id, data)) navigate(backTo)
  }

  if (loading) return <FullPageSpinner />

  if (notFound || loadError) {
    return (
      <div className='mx-auto flex max-w-md flex-col items-center gap-3 py-20 text-center'>
        <p className='font-display text-2xl font-bold text-moss'>
          {notFound ? 'Không tìm thấy lớp workshop' : 'Không tải được dữ liệu'}
        </p>
        <p className='text-ink'>{notFound ? 'Lớp có thể đã bị xoá.' : loadError}</p>
        <div className='mt-3 flex gap-2'>
          {!notFound && (
            <button type='button' onClick={() => load(id)} className='btn-outline'>
              <RotateCw size={16} />
              Thử lại
            </button>
          )}
          <Link to={backTo} className='btn-primary px-5 py-2.5 text-sm'>
            Về danh sách lớp
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className='mx-auto max-w-6xl'>
      <Link
        to={backTo}
        className='mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-teal'
      >
        <ArrowLeft size={16} />
        Danh sách lớp
      </Link>
      <PageHeader
        title={workshop ? 'Sửa lớp workshop' : 'Thêm lớp workshop'}
        description={workshop ? `Đường dẫn: /workshops/${workshop.slug}` : 'Đường dẫn của lớp được tạo tự động từ tên.'}
      />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className='grid gap-6 lg:grid-cols-[1fr_21rem] lg:items-start'>
        <div className='min-w-0 space-y-6'>
          <ErrorBanner message={error} />

          <Card title='Thông tin lớp'>
            <FieldInput
              id='name'
              label='Tên lớp'
              placeholder='Lớp vuốt gốm trên bàn xoay cơ bản'
              error={errors.name}
              registration={register('name')}
            />
            <div className='grid gap-5 sm:grid-cols-2'>
              <FieldInput
                id='instructor'
                label='Người hướng dẫn'
                placeholder='Nghệ nhân Lê Văn Thành'
                error={errors.instructor}
                registration={register('instructor')}
              />
              <FieldInput
                id='location'
                label='Địa điểm'
                placeholder='12 Bát Tràng, Gia Lâm, Hà Nội'
                error={errors.location}
                registration={register('location')}
              />
            </div>
            <TextareaField
              id='description'
              label='Mô tả'
              rows={7}
              placeholder='Học gì, phù hợp với ai, cần chuẩn bị gì, sản phẩm mang về...'
              error={errors.description}
              registration={register('description')}
            />
          </Card>

          <Card title='Lịch học'>
            <p className='-mt-2 text-xs text-muted'>Theo giờ Việt Nam. Mỗi lớp kéo dài tối đa 12 tiếng.</p>
            <div className='grid gap-5 sm:grid-cols-3'>
              <FieldInput id='date' label='Ngày học' type='date' error={errors.date} registration={register('date')} />
              <FieldInput
                id='startTime'
                label='Giờ bắt đầu'
                type='time'
                error={errors.startTime}
                registration={register('startTime')}
              />
              <FieldInput
                id='endTime'
                label='Giờ kết thúc'
                type='time'
                error={errors.endTime}
                registration={register('endTime')}
              />
            </div>
            <FieldInput
              id='deadline'
              label='Hạn đăng ký (không bắt buộc)'
              type='datetime-local'
              hint='Để trống: nhận đăng ký tới giờ bắt đầu.'
              error={errors.deadline}
              registration={register('deadline')}
            />
          </Card>

          <Card title='Hình ảnh'>
            <ImageUrlsField
              control={control}
              register={register}
              errors={errors}
              max={MAX_WORKSHOP_IMAGES}
              emptyText='Chưa có ảnh. Lớp không có ảnh sẽ hiện ảnh mặc định ở trang khách hàng.'
            />
          </Card>
        </div>

        <div className='min-w-0 space-y-6'>
          <Card title='Trạng thái'>
            <div className='flex items-center justify-between gap-4'>
              <div>
                <label htmlFor='isActive' className='text-sm font-semibold text-forest'>
                  Đang mở
                </label>
                <p className='text-xs text-muted'>Tắt để ẩn lớp khỏi trang khách hàng.</p>
              </div>
              <Controller
                control={control}
                name='isActive'
                render={({ field }) => (
                  <Switch id='isActive' checked={field.value} onChange={field.onChange} label='Đang mở' />
                )}
              />
            </div>
            {workshop && <SeatsCell workshop={workshop} />}
          </Card>

          <Card title='Học phí và số chỗ'>
            <FieldInput
              id='price'
              label='Học phí mỗi chỗ (VND)'
              type='number'
              inputMode='numeric'
              placeholder='350000'
              hint={Number.isFinite(price) ? (price > 0 ? formatPrice(price) : 'Miễn phí') : 'Nhập 0 nếu miễn phí'}
              error={errors.price}
              registration={register('price', { valueAsNumber: true })}
            />
            <FieldInput
              id='capacity'
              label='Số chỗ'
              type='number'
              inputMode='numeric'
              placeholder='12'
              hint={
                workshop && workshop.bookedSeats > 0
                  ? `Đã có ${workshop.bookedSeats} chỗ được đặt, không giảm xuống dưới số này.`
                  : undefined
              }
              error={errors.capacity}
              registration={register('capacity', { valueAsNumber: true })}
            />
          </Card>

          <div className='space-y-2 lg:sticky lg:top-6'>
            <SubmitButton loading={saving} disabled={!!workshop && !isDirty} loadingText='Đang lưu...'>
              {workshop ? 'Lưu thay đổi' : 'Thêm lớp'}
            </SubmitButton>
            <Link to={backTo} className='btn-outline w-full'>
              Huỷ
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}
