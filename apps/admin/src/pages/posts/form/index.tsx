import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, LoaderCircle, RotateCw, Save, Send } from 'lucide-react'
import type { PostStatus } from '@lib/api'
import { postFormSchema, type PostFormInput } from '@lib/schemas/blog'
import { cn, formatDateTime } from '@lib/utils'
import { ErrorBanner, FieldInput } from '@pages/auth/components'
import { SelectField, TextareaField } from '@components/form'
import { PageHeader, Thumbnail } from '@components/ui'
import { usePostFormStore } from './store'

const EMPTY: PostFormInput = { title: '', categoryId: '', excerpt: '', coverImageUrl: '', content: '' }

// Xem trước nội dung theo đúng cách trang tin tức hiển thị: đoạn cách nhau bởi dòng trống, "## " là tiêu đề mục
function ContentPreview({ content }: { content: string }) {
  const blocks = content
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
  if (blocks.length === 0) return <p className='text-sm text-muted'>Nội dung xem trước sẽ hiện ở đây.</p>
  return (
    <div className='space-y-3 text-[15px] leading-relaxed text-ink'>
      {blocks.map((block, i) =>
        block.startsWith('## ') ? (
          <h3 key={i} className='pt-2 font-display text-xl font-bold text-moss'>
            {block.slice(3)}
          </h3>
        ) : (
          <p key={i} className='whitespace-pre-line'>
            {block}
          </p>
        )
      )}
    </div>
  )
}

// US-22: Viết bài mới / sửa bài — lưu nháp hoặc đăng ngay
export default function PostFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { post, categories, loading, loadError, saving, error, load, submit } = usePostFormStore()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty }
  } = useForm<PostFormInput>({ resolver: zodResolver(postFormSchema), defaultValues: EMPTY })

  useEffect(() => {
    load(id)
  }, [load, id])

  useEffect(() => {
    if (post && post.id === id) {
      reset({
        title: post.title,
        categoryId: post.category.id,
        excerpt: post.customExcerpt ?? '',
        coverImageUrl: post.coverImageUrl ?? '',
        content: post.content
      })
    } else if (!id) {
      reset(EMPTY)
    }
  }, [post, id, reset])

  const content = watch('content')
  const coverImageUrl = watch('coverImageUrl')
  const categoryOptions = useMemo(
    () =>
      categories.map((category) => ({
        value: category.id,
        label: category.isActive ? category.name : `${category.name} (đang ẩn)`
      })),
    [categories]
  )

  const save = (status: PostStatus) =>
    handleSubmit(async (data) => {
      const saved = await submit(id, data, status)
      if (saved && !id) navigate(`/posts/${saved.id}/edit`, { replace: true })
    })

  if (loading) {
    return (
      <div className='mx-auto max-w-6xl space-y-4' aria-busy='true' aria-label='Đang tải bài viết'>
        <div className='h-12 w-72 animate-pulse rounded-xl bg-cream' />
        <div className='h-96 animate-pulse rounded-[var(--radius-organic)] bg-cream' />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className='mx-auto flex max-w-6xl flex-col items-center gap-3 py-16 text-center'>
        <p className='font-semibold text-danger'>{loadError}</p>
        <div className='flex gap-2'>
          <Link to='/posts' className='btn-outline'>
            <ArrowLeft size={16} />
            Danh sách bài viết
          </Link>
          <button type='button' onClick={() => load(id)} className='btn-outline'>
            <RotateCw size={16} />
            Thử lại
          </button>
        </div>
      </div>
    )
  }

  const published = post?.status === 'published'

  return (
    <div className='mx-auto max-w-6xl'>
      <Link to='/posts' className='inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-teal'>
        <ArrowLeft size={16} />
        Danh sách bài viết
      </Link>
      <div className='mt-3'>
        <PageHeader
          title={id ? 'Sửa bài viết' : 'Viết bài mới'}
          description={
            post
              ? published
                ? `Đã đăng lúc ${formatDateTime(post.publishedAt!)} · ${post.viewCount.toLocaleString('vi-VN')} lượt xem`
                : 'Bản nháp — chưa hiện ở trang tin tức'
              : 'Lưu nháp để viết tiếp sau, hoặc đăng ngay lên trang tin tức.'
          }
          actions={
            <>
              <button type='button' onClick={save('draft')} disabled={saving} className='btn-outline'>
                {saving ? <LoaderCircle size={16} className='animate-spin' /> : <Save size={16} />}
                {published ? 'Gỡ về nháp' : 'Lưu nháp'}
              </button>
              <button
                type='button'
                onClick={save('published')}
                disabled={saving}
                className='btn-primary px-5 py-2.5 text-sm'
              >
                <Send size={16} />
                {published ? 'Lưu thay đổi' : 'Đăng bài'}
              </button>
            </>
          }
        />
      </div>

      {categories.length === 0 && (
        <p className='mb-4 rounded-2xl border border-warning/30 bg-warning/5 p-4 text-sm text-warning'>
          Chưa có danh mục bài viết nào.{' '}
          <Link to='/post-categories' className='link'>
            Tạo danh mục
          </Link>{' '}
          trước khi viết bài.
        </p>
      )}

      <form onSubmit={save('published')} noValidate className='grid gap-5 lg:grid-cols-[1fr_22rem] lg:items-start'>
        <section className='space-y-5 rounded-[var(--radius-organic)] border border-clay/70 bg-cream p-6 shadow-sm'>
          <ErrorBanner message={error} />
          <FieldInput
            id='post-title'
            label='Tiêu đề'
            placeholder='Phân biệt men lam và men rạn Bát Tràng'
            error={errors.title}
            registration={register('title')}
          />
          <TextareaField
            id='post-content'
            label='Nội dung'
            rows={18}
            hint='Các đoạn cách nhau bởi một dòng trống. Dòng bắt đầu bằng "## " là tiêu đề mục.'
            error={errors.content}
            registration={register('content')}
            className='[&_textarea]:font-mono [&_textarea]:text-sm'
          />
        </section>

        <aside className='space-y-5'>
          <section className='space-y-5 rounded-[var(--radius-organic)] border border-clay/70 bg-cream p-6 shadow-sm'>
            <SelectField
              id='post-category'
              label='Danh mục'
              placeholder='Chọn danh mục'
              options={categoryOptions}
              error={errors.categoryId}
              registration={register('categoryId')}
            />
            <TextareaField
              id='post-excerpt'
              label='Tóm tắt'
              rows={3}
              hint='Hiện ở danh sách bài; để trống thì lấy đầu nội dung.'
              error={errors.excerpt}
              registration={register('excerpt')}
            />
            <div>
              <FieldInput
                id='post-cover'
                label='Ảnh bìa'
                type='url'
                placeholder='https://...'
                error={errors.coverImageUrl}
                registration={register('coverImageUrl')}
              />
              <Thumbnail
                src={coverImageUrl.trim() || null}
                alt='Xem trước ảnh bìa'
                className='mt-3 aspect-[16/9] h-auto w-full'
              />
            </div>
          </section>

          <section className={cn('rounded-[var(--radius-organic)] border border-clay/70 bg-cream p-6 shadow-sm')}>
            <h2 className='mb-3 text-xs font-bold tracking-wider text-muted uppercase'>
              Xem trước nội dung {isDirty && <span className='normal-case'>(chưa lưu)</span>}
            </h2>
            <div className='max-h-96 overflow-y-auto pr-1'>
              <ContentPreview content={content} />
            </div>
          </section>
        </aside>
      </form>
    </div>
  )
}
