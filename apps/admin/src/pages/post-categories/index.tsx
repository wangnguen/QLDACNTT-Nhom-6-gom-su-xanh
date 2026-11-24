import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FolderOpen, Pencil, Plus, RotateCw, Trash2 } from 'lucide-react'
import type { PostCategoryItem } from '@lib/api'
import { ConfirmDialog, PageHeader, Switch } from '@components/ui'
import { PostCategoryFormDialog } from './components/PostCategoryFormDialog'
import { usePostCategoriesStore } from './store'

const iconButton =
  'inline-flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-moss/5 hover:text-moss'

// US-21: Quản lý danh mục bài viết
export default function PostCategoriesPage() {
  const { categories, loading, loadError, deleting, fetch, toggleActive, remove } = usePostCategoriesStore()
  // undefined = đóng, null = thêm mới, PostCategoryItem = đang sửa
  const [editing, setEditing] = useState<PostCategoryItem | null | undefined>(undefined)
  const [deletingCategory, setDeletingCategory] = useState<PostCategoryItem | null>(null)

  useEffect(() => {
    fetch()
  }, [fetch])

  const handleDelete = async () => {
    if (deletingCategory && (await remove(deletingCategory))) setDeletingCategory(null)
  }

  return (
    <div className='mx-auto max-w-6xl'>
      <PageHeader
        title='Danh mục bài viết'
        description='Chủ đề của các bài tin tức, blog hiển thị ở trang khách hàng.'
        actions={
          <button type='button' onClick={() => setEditing(null)} className='btn-primary px-5 py-2.5 text-sm'>
            <Plus size={18} />
            Thêm danh mục
          </button>
        }
      />

      <section className='overflow-hidden rounded-[var(--radius-organic)] border border-clay/70 bg-cream shadow-sm'>
        {loadError ? (
          <div className='flex flex-col items-center gap-3 px-6 py-16 text-center'>
            <p className='font-semibold text-danger'>{loadError}</p>
            <button type='button' onClick={fetch} className='btn-outline'>
              <RotateCw size={16} />
              Thử lại
            </button>
          </div>
        ) : loading && categories.length === 0 ? (
          <div className='space-y-3 p-6' aria-busy='true' aria-label='Đang tải danh mục'>
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className='h-14 animate-pulse rounded-xl bg-sand' />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className='flex flex-col items-center gap-3 px-6 py-16 text-center'>
            <FolderOpen size={40} className='text-sage' aria-hidden />
            <p className='font-semibold'>Chưa có danh mục bài viết nào</p>
            <p className='max-w-sm text-sm text-muted'>Tạo danh mục trước, sau đó viết bài vào từng danh mục.</p>
            <button type='button' onClick={() => setEditing(null)} className='btn-primary mt-2 px-5 py-2.5 text-sm'>
              <Plus size={18} />
              Thêm danh mục đầu tiên
            </button>
          </div>
        ) : (
          <div className='relative overflow-x-auto'>
            <table className='w-full min-w-[40rem] text-left text-sm'>
              <thead className='border-b border-clay/60 bg-sand/60 text-xs font-bold tracking-wider text-muted uppercase'>
                <tr>
                  <th scope='col' className='px-5 py-3'>
                    Danh mục
                  </th>
                  <th scope='col' className='hidden px-5 py-3 lg:table-cell'>
                    Mô tả
                  </th>
                  <th scope='col' className='px-5 py-3 text-right'>
                    Bài viết
                  </th>
                  <th scope='col' className='px-5 py-3'>
                    Hiển thị
                  </th>
                  <th scope='col' className='px-5 py-3'>
                    <span className='sr-only'>Thao tác</span>
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-clay/50'>
                {categories.map((category) => (
                  <tr key={category.id} className='transition-colors hover:bg-sand/40'>
                    <td className='px-5 py-3'>
                      <p className='font-semibold text-forest'>{category.name}</p>
                      <p className='text-xs text-muted'>/{category.slug}</p>
                    </td>
                    <td className='hidden max-w-xs px-5 py-3 text-ink lg:table-cell'>
                      <p className='line-clamp-2'>{category.description ?? <span className='text-muted'>—</span>}</p>
                    </td>
                    <td className='px-5 py-3 text-right'>
                      {category.postCount > 0 ? (
                        <Link
                          to={`/posts?categoryId=${category.id}`}
                          className='font-semibold text-teal hover:underline'
                          title='Xem bài viết trong danh mục'
                        >
                          {category.postCount}
                        </Link>
                      ) : (
                        <span className='text-muted'>0</span>
                      )}
                    </td>
                    <td className='px-5 py-3'>
                      <div className='flex items-center gap-2.5'>
                        <Switch
                          checked={category.isActive}
                          onChange={() => toggleActive(category)}
                          label={`Hiển thị danh mục ${category.name}`}
                        />
                        <span className={category.isActive ? 'text-xs font-semibold text-teal' : 'text-xs text-muted'}>
                          {category.isActive ? 'Đang hiện' : 'Đang ẩn'}
                        </span>
                      </div>
                    </td>
                    <td className='px-5 py-3'>
                      <div className='flex justify-end gap-1'>
                        <button
                          type='button'
                          onClick={() => setEditing(category)}
                          className={iconButton}
                          aria-label={`Sửa danh mục ${category.name}`}
                          title='Sửa'
                        >
                          <Pencil size={17} />
                        </button>
                        <button
                          type='button'
                          onClick={() => setDeletingCategory(category)}
                          className={`${iconButton} hover:bg-danger/5 hover:text-danger`}
                          aria-label={`Xoá danh mục ${category.name}`}
                          title='Xoá'
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <PostCategoryFormDialog
        open={editing !== undefined}
        category={editing ?? null}
        onClose={() => setEditing(undefined)}
      />

      <ConfirmDialog
        open={!!deletingCategory}
        title='Xoá danh mục bài viết?'
        message={
          deletingCategory && (
            <>
              Danh mục <strong className='text-forest'>{deletingCategory.name}</strong> sẽ bị xoá.
              {deletingCategory.postCount > 0 && (
                <span className='mt-2 block rounded-xl bg-warning/10 p-3 text-sm text-warning'>
                  Danh mục đang có {deletingCategory.postCount} bài viết — cần chuyển hoặc xoá các bài này trước.
                </span>
              )}
            </>
          )
        }
        loading={deleting}
        disabled={!!deletingCategory?.postCount}
        onConfirm={handleDelete}
        onClose={() => setDeletingCategory(null)}
      />
    </div>
  )
}
