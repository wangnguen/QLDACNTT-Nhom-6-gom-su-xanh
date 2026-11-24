import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { PostCategoryItem } from '@lib/api'
import { postCategoryFormSchema, type PostCategoryFormInput } from '@lib/schemas/blog'
import { ErrorBanner, FieldInput, SubmitButton } from '@pages/auth/components'
import { TextareaField } from '@components/form'
import { Modal, Switch } from '@components/ui'
import { usePostCategoriesStore } from '../store'

interface Props {
  open: boolean
  // null = thêm mới
  category: PostCategoryItem | null
  onClose: () => void
}

const EMPTY: PostCategoryFormInput = { name: '', description: '', isActive: true }

// US-21: Thêm / sửa danh mục bài viết
export function PostCategoryFormDialog({ open, category, onClose }: Props) {
  const { saving, formError, save, clearFormError } = usePostCategoriesStore()

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors }
  } = useForm<PostCategoryFormInput>({ resolver: zodResolver(postCategoryFormSchema), defaultValues: EMPTY })

  // Mỗi lần mở: điền dữ liệu danh mục đang sửa (hoặc form trống)
  useEffect(() => {
    if (!open) return
    clearFormError()
    reset(
      category ? { name: category.name, description: category.description ?? '', isActive: category.isActive } : EMPTY
    )
  }, [open, category, reset, clearFormError])

  const onSubmit = async (data: PostCategoryFormInput) => {
    if (await save(category?.id ?? null, data)) onClose()
  }

  return (
    <Modal
      open={open}
      title={category ? 'Sửa danh mục bài viết' : 'Thêm danh mục bài viết'}
      description={
        category ? `Đường dẫn hiện tại: /blog?category=${category.slug}` : 'Đường dẫn được tạo tự động từ tên.'
      }
      onClose={saving ? () => {} : onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)} className='space-y-5' noValidate>
        <ErrorBanner message={formError} />

        <FieldInput
          id='post-category-name'
          label='Tên danh mục'
          placeholder='Kiến thức gốm'
          autoFocus
          error={errors.name}
          registration={register('name')}
        />

        <TextareaField
          id='post-category-description'
          label='Mô tả'
          rows={3}
          placeholder='Giới thiệu ngắn về chủ đề của danh mục (không bắt buộc)'
          error={errors.description}
          registration={register('description')}
        />

        <div className='flex items-center justify-between gap-4 rounded-xl border border-clay/70 bg-sand/60 px-4 py-3'>
          <div>
            <label htmlFor='post-category-active' className='text-sm font-semibold text-forest'>
              Hiển thị ở trang tin tức
            </label>
            <p className='text-xs text-muted'>Tắt để ẩn danh mục cùng toàn bộ bài viết trong đó.</p>
          </div>
          <Controller
            control={control}
            name='isActive'
            render={({ field }) => (
              <Switch
                id='post-category-active'
                checked={field.value}
                onChange={field.onChange}
                label='Hiển thị ở trang tin tức'
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
