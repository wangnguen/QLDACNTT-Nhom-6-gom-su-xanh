import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { CategoryItem } from '@lib/api'
import { categoryFormSchema, type CategoryFormInput } from '@lib/schemas/catalog'
import { ErrorBanner, FieldInput, SubmitButton } from '@pages/auth/components'
import { TextareaField } from '@components/form'
import { Modal, Switch, Thumbnail } from '@components/ui'
import { useCategoriesStore } from '../store'

interface Props {
  open: boolean
  // null = thêm mới
  category: CategoryItem | null
  onClose: () => void
}

const EMPTY: CategoryFormInput = { name: '', description: '', imageUrl: '', isActive: true }

export function CategoryFormDialog({ open, category, onClose }: Props) {
  const { saving, formError, save, clearFormError } = useCategoriesStore()

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors }
  } = useForm<CategoryFormInput>({ resolver: zodResolver(categoryFormSchema), defaultValues: EMPTY })

  // Mỗi lần mở: điền dữ liệu danh mục đang sửa (hoặc form trống)
  useEffect(() => {
    if (!open) return
    clearFormError()
    reset(
      category
        ? {
            name: category.name,
            description: category.description ?? '',
            imageUrl: category.imageUrl ?? '',
            isActive: category.isActive
          }
        : EMPTY
    )
  }, [open, category, reset, clearFormError])

  const imageUrl = watch('imageUrl')

  const onSubmit = async (data: CategoryFormInput) => {
    if (await save(category?.id ?? null, data)) onClose()
  }

  return (
    <Modal
      open={open}
      title={category ? 'Sửa danh mục' : 'Thêm danh mục'}
      description={category ? `Đường dẫn hiện tại: /${category.slug}` : 'Đường dẫn được tạo tự động từ tên.'}
      onClose={saving ? () => {} : onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)} className='space-y-5' noValidate>
        <ErrorBanner message={formError} />

        <FieldInput
          id='category-name'
          label='Tên danh mục'
          placeholder='Bình hoa'
          autoFocus
          error={errors.name}
          registration={register('name')}
        />

        <TextareaField
          id='category-description'
          label='Mô tả'
          rows={3}
          placeholder='Giới thiệu ngắn về danh mục (không bắt buộc)'
          error={errors.description}
          registration={register('description')}
        />

        <div className='flex items-end gap-3'>
          <FieldInput
            id='category-image'
            label='Link ảnh'
            type='url'
            placeholder='https://...'
            className='min-w-0 flex-1'
            hint='Dán link ảnh trên mạng (không bắt buộc)'
            error={errors.imageUrl}
            registration={register('imageUrl')}
          />
          <Thumbnail src={imageUrl.trim() || null} alt='Xem trước ảnh danh mục' className='mb-6 h-12 w-12' />
        </div>

        <div className='flex items-center justify-between gap-4 rounded-xl border border-clay/70 bg-sand/60 px-4 py-3'>
          <div>
            <label htmlFor='category-active' className='text-sm font-semibold text-forest'>
              Hiển thị ở trang khách hàng
            </label>
            <p className='text-xs text-muted'>Tắt để ẩn danh mục cùng toàn bộ sản phẩm trong đó.</p>
          </div>
          <Controller
            control={control}
            name='isActive'
            render={({ field }) => (
              <Switch
                id='category-active'
                checked={field.value}
                onChange={field.onChange}
                label='Hiển thị ở trang khách hàng'
              />
            )}
          />
        </div>

        <div className='flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end'>
          <button type='button' onClick={onClose} disabled={saving} className='btn-outline'>
            Huỷ
          </button>
          <div className='sm:w-44'>
            <SubmitButton loading={saving} loadingText='Đang lưu...'>
              {category ? 'Lưu thay đổi' : 'Thêm danh mục'}
            </SubmitButton>
          </div>
        </div>
      </form>
    </Modal>
  )
}
