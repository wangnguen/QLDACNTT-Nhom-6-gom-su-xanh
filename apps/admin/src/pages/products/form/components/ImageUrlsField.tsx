import { useFieldArray, useWatch, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form'
import { ArrowUp, CircleAlert, ImagePlus, Trash2 } from 'lucide-react'
import { MAX_PRODUCT_IMAGES, type ProductFormInput } from '@lib/schemas/catalog'
import { cn } from '@lib/utils'
import { Thumbnail } from '@components/ui'

interface Props {
  control: Control<ProductFormInput>
  register: UseFormRegister<ProductFormInput>
  errors: FieldErrors<ProductFormInput>
}

const iconButton =
  'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-moss/5 hover:text-moss disabled:pointer-events-none disabled:opacity-30'

// Danh sách link ảnh: ảnh đầu tiên là ảnh đại diện, có thể đưa ảnh khác lên đầu
export function ImageUrlsField({ control, register, errors }: Props) {
  const { fields, append, remove, move } = useFieldArray({ control, name: 'images' })
  const images = useWatch({ control, name: 'images' })
  const listError = errors.images?.message ?? errors.images?.root?.message

  return (
    <div>
      {fields.length === 0 ? (
        <div className='rounded-xl border border-dashed border-clay bg-sand/50 px-4 py-8 text-center text-sm text-muted'>
          Chưa có ảnh. Sản phẩm không có ảnh sẽ hiện ảnh mặc định ở trang khách hàng.
        </div>
      ) : (
        <ol className='space-y-3'>
          {fields.map((field, index) => {
            const error = errors.images?.[index]?.url
            const url = images?.[index]?.url?.trim() ?? ''
            return (
              <li key={field.id} className='flex items-start gap-3'>
                <Thumbnail src={url || null} alt={`Ảnh ${index + 1}`} className='h-16 w-16' />
                <div className='min-w-0 flex-1'>
                  <div className='mb-1 flex items-center gap-2'>
                    <label htmlFor={`image-${index}`} className='text-xs font-semibold text-forest'>
                      Ảnh {index + 1}
                    </label>
                    {index === 0 && (
                      <span className='rounded-full bg-teal/10 px-2 py-0.5 text-[11px] font-bold text-teal'>
                        Ảnh đại diện
                      </span>
                    )}
                  </div>
                  <input
                    id={`image-${index}`}
                    type='url'
                    placeholder='https://...'
                    aria-invalid={!!error}
                    className={cn(
                      'w-full rounded-xl border bg-cream px-3.5 py-2.5 text-sm text-forest outline-none transition placeholder:text-muted/70 focus:ring-4',
                      error ? 'border-danger focus:ring-danger/15' : 'border-clay focus:border-teal focus:ring-teal/15'
                    )}
                    {...register(`images.${index}.url`)}
                  />
                  {error && (
                    <p className='mt-1.5 flex items-start gap-1 text-xs font-medium text-danger'>
                      <CircleAlert size={14} className='mt-px shrink-0' />
                      {error.message}
                    </p>
                  )}
                </div>
                <div className='mt-6 flex'>
                  <button
                    type='button'
                    onClick={() => move(index, 0)}
                    disabled={index === 0}
                    className={iconButton}
                    aria-label={`Đặt ảnh ${index + 1} làm ảnh đại diện`}
                    title='Đặt làm ảnh đại diện'
                  >
                    <ArrowUp size={17} />
                  </button>
                  <button
                    type='button'
                    onClick={() => remove(index)}
                    className={`${iconButton} hover:bg-danger/5 hover:text-danger`}
                    aria-label={`Xoá ảnh ${index + 1}`}
                    title='Xoá ảnh'
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </li>
            )
          })}
        </ol>
      )}

      {listError && (
        <p className='mt-3 flex items-start gap-1 text-xs font-medium text-danger'>
          <CircleAlert size={14} className='mt-px shrink-0' />
          {listError}
        </p>
      )}

      <div className='mt-4 flex flex-wrap items-center justify-between gap-2'>
        <button
          type='button'
          onClick={() => append({ url: '' }, { shouldFocus: true })}
          disabled={fields.length >= MAX_PRODUCT_IMAGES}
          className='btn-outline'
        >
          <ImagePlus size={16} />
          Thêm link ảnh
        </button>
        <span className='text-xs text-muted'>
          {fields.length}/{MAX_PRODUCT_IMAGES} ảnh
        </span>
      </div>
    </div>
  )
}
