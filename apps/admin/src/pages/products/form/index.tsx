import { useEffect, useMemo, type ReactNode } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, RotateCw } from 'lucide-react'
import { productFormSchema, type ProductFormInput } from '@lib/schemas/catalog'
import { formatPrice } from '@lib/utils'
import { ErrorBanner, FieldInput, SubmitButton } from '@pages/auth/components'
import { SelectField, TextareaField } from '@components/form'
import { PageHeader, Switch } from '@components/ui'
import { FullPageSpinner } from '@components/Spinner'
import { ImageUrlsField } from './components/ImageUrlsField'
import { useProductFormStore } from './store'

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
  categoryId: '',
  price: undefined as unknown as number,
  stock: 0,
  material: '',
  dimensions: '',
  description: '',
  images: [],
  isActive: true
} satisfies ProductFormInput

// US-07: Thêm sản phẩm (/products/new) và sửa sản phẩm (/products/:id/edit)
export default function ProductFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  // Quay về đúng trang/bộ lọc của danh sách
  const backTo = `/products${(location.state as { from?: string } | null)?.from ?? ''}`

  const { product, categories, loading, loadError, notFound, saving, error, load, submit, reset } =
    useProductFormStore()

  useEffect(() => {
    load(id)
    return reset
  }, [id, load, reset])

  const values = useMemo<ProductFormInput | undefined>(
    () =>
      product
        ? {
            name: product.name,
            categoryId: product.category.id,
            price: product.price,
            stock: product.stock,
            material: product.material ?? '',
            dimensions: product.dimensions ?? '',
            description: product.description ?? '',
            images: product.imageUrls.map((url) => ({ url })),
            isActive: product.isActive
          }
        : undefined,
    [product]
  )

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty }
  } = useForm<ProductFormInput>({
    resolver: zodResolver(productFormSchema),
    defaultValues: EMPTY_FORM,
    values
  })

  const price = useWatch({ control, name: 'price' })

  const onSubmit = async (data: ProductFormInput) => {
    if (await submit(id, data)) navigate(backTo)
  }

  if (loading) return <FullPageSpinner />

  if (notFound || loadError) {
    return (
      <div className='mx-auto flex max-w-md flex-col items-center gap-3 py-20 text-center'>
        <p className='font-display text-2xl font-bold text-moss'>
          {notFound ? 'Không tìm thấy sản phẩm' : 'Không tải được dữ liệu'}
        </p>
        <p className='text-ink'>{notFound ? 'Sản phẩm có thể đã bị xoá.' : loadError}</p>
        <div className='mt-3 flex gap-2'>
          {!notFound && (
            <button type='button' onClick={() => load(id)} className='btn-outline'>
              <RotateCw size={16} />
              Thử lại
            </button>
          )}
          <Link to={backTo} className='btn-primary px-5 py-2.5 text-sm'>
            Về danh sách sản phẩm
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
        Danh sách sản phẩm
      </Link>
      <PageHeader
        title={product ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}
        description={product ? `Đường dẫn: /products/${product.slug}` : 'Đường dẫn sản phẩm được tạo tự động từ tên.'}
      />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className='grid gap-6 lg:grid-cols-[1fr_21rem] lg:items-start'>
        <div className='min-w-0 space-y-6'>
          <ErrorBanner message={error} />

          <Card title='Thông tin sản phẩm'>
            <FieldInput
              id='name'
              label='Tên sản phẩm'
              placeholder='Bình hoa men lam vẽ sen'
              error={errors.name}
              registration={register('name')}
            />
            <TextareaField
              id='description'
              label='Mô tả'
              rows={7}
              placeholder='Câu chuyện, cách làm, cách bảo quản...'
              error={errors.description}
              registration={register('description')}
            />
          </Card>

          <Card title='Hình ảnh'>
            <ImageUrlsField control={control} register={register} errors={errors} />
          </Card>
        </div>

        <div className='min-w-0 space-y-6'>
          <Card title='Trạng thái'>
            <div className='flex items-center justify-between gap-4'>
              <div>
                <label htmlFor='isActive' className='text-sm font-semibold text-forest'>
                  Đang bán
                </label>
                <p className='text-xs text-muted'>Tắt để ẩn sản phẩm khỏi trang khách hàng.</p>
              </div>
              <Controller
                control={control}
                name='isActive'
                render={({ field }) => (
                  <Switch id='isActive' checked={field.value} onChange={field.onChange} label='Đang bán' />
                )}
              />
            </div>
          </Card>

          <Card title='Danh mục và giá'>
            <div>
              <SelectField
                id='categoryId'
                label='Danh mục'
                placeholder='— Chọn danh mục —'
                options={categories.map((c) => ({ value: c.id, label: c.isActive ? c.name : `${c.name} (đang ẩn)` }))}
                error={errors.categoryId}
                registration={register('categoryId')}
              />
              {categories.length === 0 && (
                <p className='mt-1.5 text-xs text-muted'>
                  Chưa có danh mục nào.{' '}
                  <Link to='/categories' className='link'>
                    Tạo danh mục
                  </Link>
                </p>
              )}
            </div>
            <FieldInput
              id='price'
              label='Giá bán (VND)'
              type='number'
              inputMode='numeric'
              placeholder='450000'
              hint={Number.isFinite(price) && price > 0 ? formatPrice(price) : undefined}
              error={errors.price}
              registration={register('price', { valueAsNumber: true })}
            />
            <FieldInput
              id='stock'
              label='Tồn kho'
              type='number'
              inputMode='numeric'
              error={errors.stock}
              registration={register('stock', { valueAsNumber: true })}
            />
          </Card>

          <Card title='Thông số'>
            <FieldInput
              id='material'
              label='Chất liệu'
              placeholder='Gốm men lam'
              error={errors.material}
              registration={register('material')}
            />
            <FieldInput
              id='dimensions'
              label='Kích thước'
              placeholder='Cao 30cm, miệng 10cm'
              error={errors.dimensions}
              registration={register('dimensions')}
            />
          </Card>

          <div className='space-y-2 lg:sticky lg:top-6'>
            <SubmitButton loading={saving} disabled={!!product && !isDirty} loadingText='Đang lưu...'>
              {product ? 'Lưu thay đổi' : 'Thêm sản phẩm'}
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
