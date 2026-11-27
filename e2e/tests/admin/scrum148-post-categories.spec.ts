import { expect, request, test, type APIRequestContext } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ADMIN_ACCOUNT, CLIENT_URL, SERVER_URL, TMP_DIR } from '../../support/config'
import { createVerifiedUser, fillLoginForm } from '../../support/helpers'

type Category = { id: string; name: string; slug: string; postCount: number; isActive: boolean; description: string | null }
type Post = { id: string; slug: string; category: { id: string; name: string } }
const evidence = join(TMP_DIR, 'scrum148-20261127', 'targeted')

async function loginApi(identifier: string, password: string, admin = false) {
  const anonymous = await request.newContext({ baseURL: SERVER_URL })
  const response = await anonymous.post(`/api/v1/auth/${admin ? 'admin/' : ''}login`, { data: { identifier, password } })
  expect(response.ok(), await response.text()).toBeTruthy()
  const token = (await response.json()).data.accessToken as string
  await anonymous.dispose()
  return request.newContext({ baseURL: SERVER_URL, extraHTTPHeaders: { Authorization: `Bearer ${token}` } })
}

async function data<T>(api: APIRequestContext, method: 'get' | 'post' | 'patch', path: string, payload?: object): Promise<T> {
  const response = await api[method](`/api/v1${path}`, payload ? { data: payload } : undefined)
  expect(response.ok(), `${method} ${path}: ${response.status()} ${await response.text()}`).toBeTruthy()
  return (await response.json()).data as T
}

test('S148-01: danh mục được lưu, phân loại đúng bài và điều khiển hiển thị', async ({ page, browser }) => {
  test.setTimeout(120_000)
  await mkdir(evidence, { recursive: true })
  const admin = await loginApi(ADMIN_ACCOUNT.email, ADMIN_ACCOUNT.password, true)
  const guest = await request.newContext({ baseURL: SERVER_URL })
  const tag = `${Date.now()}`
  const nameA = `Kiến thức gốm QA ${tag}`
  const nameB = `Làng nghề gốm QA ${tag}`
  await fillLoginForm(page, ADMIN_ACCOUNT.email, ADMIN_ACCOUNT.password)
  await expect(page).toHaveURL('/')
  await page.getByRole('link', { name: 'Danh mục bài viết' }).click()
  for (const name of [nameA, nameB]) {
    await page.getByRole('button', { name: 'Thêm danh mục', exact: true }).first().click()
    const dialog = page.getByRole('dialog', { name: 'Thêm danh mục bài viết' })
    await dialog.getByLabel('Tên danh mục').fill(`  ${name}  `)
    await dialog.getByRole('button', { name: 'Thêm danh mục', exact: true }).click()
    await expect(dialog).toBeHidden()
    await expect(page.getByRole('row').filter({ hasText: name })).toBeVisible()
  }
  await page.reload()
  const categories = await data<Category[]>(admin, 'get', '/admin/post-categories')
  const a = categories.find(item => item.name === nameA)!
  const b = categories.find(item => item.name === nameB)!
  expect(a.id).not.toBe(b.id)
  expect(a.slug).not.toBe(b.slug)
  const post = await data<Post>(admin, 'post', '/admin/posts', { title: `Bài gốm Bát Tràng QA ${tag}`, content: 'Nội dung gốm Bát Tràng dành riêng cho kiểm thử danh mục.', categoryId: a.id, status: 'published' })
  expect(post.category.id).toBe(a.id)
  expect((await data<Post>(admin, 'get', `/admin/posts/${post.id}`)).category.id).toBe(a.id)
  await page.reload()
  const rowA = page.getByRole('row').filter({ hasText: nameA })
  const rowB = page.getByRole('row').filter({ hasText: nameB })
  await expect(rowA.getByTitle('Xem bài viết trong danh mục')).toHaveText('1')
  await expect(rowB.getByRole('cell').nth(2)).toHaveText('0')
  await page.screenshot({ path: join(evidence, 'S148-categories.png'), fullPage: true })
  await rowA.getByTitle('Xem bài viết trong danh mục').click()
  await expect(page).toHaveURL(new RegExp(`categoryId=${a.id}`))
  await expect(page.getByText(`Bài gốm Bát Tràng QA ${tag}`)).toBeVisible()
  await page.goto('/post-categories')
  await page.getByRole('button', { name: `Xoá danh mục ${nameA}` }).click()
  const deletion = page.getByRole('dialog', { name: 'Xoá danh mục bài viết?' })
  await expect(deletion.getByText(/cần chuyển hoặc xoá các bài này trước/)).toBeVisible()
  await expect(deletion.getByRole('button', { name: 'Xoá', exact: true })).toBeDisabled()
  expect((await admin.delete(`/api/v1/admin/post-categories/${a.id}`)).status()).toBe(409)
  await deletion.getByRole('button', { name: 'Huỷ' }).click()
  await page.getByRole('switch', { name: `Hiển thị danh mục ${nameA}` }).click()
  await expect(page.getByRole('row').filter({ hasText: nameA })).toContainText('Đang ẩn')
  await page.reload()
  await expect(page.getByRole('row').filter({ hasText: nameA })).toContainText('Đang ẩn')
  expect((await data<Category[]>(guest, 'get', '/post-categories')).some(c => c.id === a.id)).toBe(false)
  expect((await guest.get(`/api/v1/posts/${post.slug}`)).status()).toBe(404)
  await page.getByRole('switch', { name: `Hiển thị danh mục ${nameA}` }).click()
  await expect(page.getByRole('row').filter({ hasText: nameA })).toContainText('Đang hiện')
  const publicPost = await data<Post>(guest, 'get', `/posts/${post.slug}`)
  expect(publicPost.category.id).toBe(a.id)
  const client = await browser.newPage()
  await client.goto(`${CLIENT_URL}/blog/${post.slug}`)
  await expect(client.getByText(`Bài gốm Bát Tràng QA ${tag}`, { exact: true })).toBeVisible()
  await client.screenshot({ path: join(evidence, 'S148-public-post.png'), fullPage: true })
  const finalCategories = await data<Category[]>(admin, 'get', '/admin/post-categories')
  expect(finalCategories.find(c => c.id === a.id)).toMatchObject({ postCount: 1, isActive: true })
  expect(finalCategories.find(c => c.id === b.id)).toMatchObject({ postCount: 0, isActive: true })
  const renamed = `${nameB} sửa`
  await page.getByRole('button', { name: `Sửa danh mục ${nameB}` }).click()
  const edit = page.getByRole('dialog', { name: 'Sửa danh mục bài viết' })
  await edit.getByLabel('Tên danh mục').fill(renamed)
  await edit.getByLabel('Mô tả').fill('Mô tả danh mục đối chứng')
  await edit.getByRole('button', { name: 'Lưu thay đổi' }).click()
  await expect(edit).toBeHidden()
  await page.reload()
  await expect(page.getByRole('row').filter({ hasText: renamed })).toBeVisible()
  const edited = (await data<Category[]>(admin, 'get', '/admin/post-categories')).find(c => c.id === b.id)
  expect(edited).toMatchObject({ name: renamed, description: 'Mô tả danh mục đối chứng', postCount: 0 })
  await page.getByRole('button', { name: `Xoá danh mục ${renamed}` }).click()
  const deleteEmpty = page.getByRole('dialog', { name: 'Xoá danh mục bài viết?' })
  await deleteEmpty.getByRole('button', { name: 'Xoá', exact: true }).click()
  await expect(deleteEmpty).toBeHidden()
  await page.reload()
  expect((await data<Category[]>(admin, 'get', '/admin/post-categories')).some(c => c.id === b.id)).toBe(false)
  expect((await data<Post>(admin, 'get', `/admin/posts/${post.id}`)).category.id).toBe(a.id)
  await writeFile(join(evidence, 'S148-api.json'), JSON.stringify({ a, b, post, finalCategories: finalCategories.filter(c => [a.id, b.id].includes(c.id)), publicPost, edited, emptyCategoryDeleted: true }, null, 2))
  await client.close()
  await Promise.all([admin.dispose(), guest.dispose()])
})

test('S148-02: ràng buộc tên, trùng slug, hủy và phân quyền API', async ({ page }) => {
  test.setTimeout(120_000)
  const admin = await loginApi(ADMIN_ACCOUNT.email, ADMIN_ACCOUNT.password, true)
  const guest = await request.newContext({ baseURL: SERVER_URL })
  const customerUser = await createVerifiedUser()
  const customer = await loginApi(customerUser.email, customerUser.password)
  const name = `Danh mục QA ${Date.now()}`
  await fillLoginForm(page, ADMIN_ACCOUNT.email, ADMIN_ACCOUNT.password)
  await expect(page).toHaveURL('/')
  await page.goto('/post-categories')
  await page.getByRole('button', { name: 'Thêm danh mục', exact: true }).first().click()
  const dialog = page.getByRole('dialog', { name: 'Thêm danh mục bài viết' })
  await dialog.getByLabel('Tên danh mục').fill('   ')
  await dialog.getByRole('button', { name: 'Thêm danh mục', exact: true }).click()
  await expect(dialog.getByText('Vui lòng nhập tên danh mục')).toBeVisible()
  await dialog.getByLabel('Tên danh mục').fill('a'.repeat(101))
  await dialog.getByRole('button', { name: 'Thêm danh mục', exact: true }).click()
  await expect(dialog.getByText('Tên danh mục tối đa 100 ký tự')).toBeVisible()
  await dialog.getByLabel('Tên danh mục').fill(name)
  await dialog.getByRole('button', { name: 'Huỷ' }).click()
  expect((await data<Category[]>(admin, 'get', '/admin/post-categories')).some(c => c.name === name)).toBe(false)
  const created = await data<Category>(admin, 'post', '/admin/post-categories', { name, isActive: true })
  expect((await admin.post('/api/v1/admin/post-categories', { data: { name } })).status()).toBe(409)
  for (const invalid of ['', '   ', 'a'.repeat(101)]) {
    expect((await admin.post('/api/v1/admin/post-categories', { data: { name: invalid } })).status()).toBe(422)
  }
  expect((await guest.post('/api/v1/admin/post-categories', { data: { name: `${name} guest` } })).status()).toBe(401)
  expect((await customer.post('/api/v1/admin/post-categories', { data: { name: `${name} customer` } })).status()).toBe(403)
  expect((await guest.patch(`/api/v1/admin/post-categories/${created.id}`, { data: { isActive: false } })).status()).toBe(401)
  expect((await customer.delete(`/api/v1/admin/post-categories/${created.id}`)).status()).toBe(403)
  expect((await data<Category[]>(admin, 'get', '/admin/post-categories')).find(c => c.id === created.id)).toMatchObject({ isActive: true })
  await Promise.all([admin.dispose(), guest.dispose(), customer.dispose()])
})
