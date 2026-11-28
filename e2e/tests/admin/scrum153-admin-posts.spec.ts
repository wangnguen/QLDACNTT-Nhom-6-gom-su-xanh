import { expect, request, test as base, type APIRequestContext, type Page } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { ADMIN_ACCOUNT, CLIENT_URL, ROOT_DIR, SERVER_URL, TMP_DIR } from '../../support/config'
import { createVerifiedUser, fillLoginForm } from '../../support/helpers'

type Category = { id: string; slug: string }
type Post = { id: string; title: string; content: string; slug: string; coverImageUrl: string | null; status: 'draft' | 'published'; publishedAt: string | null; category: { id: string } }
type Listing = { total_count: number; entries: Post[] }
type Fixtures = { admin: APIRequestContext; guest: APIRequestContext; category: Category; evidence: string }

async function api<T>(ctx: APIRequestContext, method: 'get' | 'post', path: string, payload?: object): Promise<T> {
  const response = await ctx[method](`/api/v1${path}`, payload ? { data: payload } : undefined)
  expect(response.ok(), `${method} ${path}: ${response.status()} ${await response.text()}`).toBeTruthy()
  return (await response.json()).data as T
}

async function authenticated(identifier: string, password: string, admin = false): Promise<APIRequestContext> {
  const anonymous = await request.newContext({ baseURL: SERVER_URL })
  const { accessToken } = await api<{ accessToken: string }>(anonymous, 'post', `/auth/${admin ? 'admin/' : ''}login`, { identifier, password })
  await anonymous.dispose()
  return request.newContext({ baseURL: SERVER_URL, extraHTTPHeaders: { Authorization: `Bearer ${accessToken}` } })
}

const test = base.extend<Fixtures>({
  admin: async ({}, use) => {
    const ctx = await authenticated(ADMIN_ACCOUNT.email, ADMIN_ACCOUNT.password, true)
    await use(ctx)
    await ctx.dispose()
  },
  guest: async ({}, use) => {
    const ctx = await request.newContext({ baseURL: SERVER_URL })
    await use(ctx)
    await ctx.dispose()
  },
  category: async ({ admin }, use) => {
    const category = await api<Category>(admin, 'post', '/admin/post-categories', { name: `Danh mục S153 ${randomUUID()}`, isActive: true })
    await use(category)
  },
  evidence: async ({}, use) => {
    const run = process.env.S153_RUN_ID || `run-${Date.now()}-${process.pid}`
    const directory = join(TMP_DIR, 'scrum153-20261127', run)
    await mkdir(directory, { recursive: true })
    await use(directory)
  }
})

const title = (label: string) => `S153 ${label} gốm Bát Tràng ${randomUUID()}`
const content = 'Nội dung kiểm thử gốm Bát Tràng có dấu tiếng Việt và đủ hai mươi ký tự.'
async function createPost(admin: APIRequestContext, category: Category, label: string, status: 'draft' | 'published' = 'draft') {
  return api<Post>(admin, 'post', '/admin/posts', { title: title(label), content, categoryId: category.id, status })
}
async function adminLogin(page: Page) {
  await fillLoginForm(page, ADMIN_ACCOUNT.email, ADMIN_ACCOUNT.password)
  await expect(page).toHaveURL('/')
}
async function openEdit(page: Page, post: Post) {
  await page.goto(`/posts/${post.id}/edit`)
  await expect(page.getByLabel('Tiêu đề')).toHaveValue(post.title)
  await expect(page.getByLabel('Nội dung')).toHaveValue(post.content)
}
async function patchFromUi(page: Page, postId: string, button: string) {
  const [response] = await Promise.all([
    page.waitForResponse(r => r.url().includes(`/admin/posts/${postId}`) && r.request().method() === 'PATCH'),
    page.getByRole('button', { name: button, exact: true }).click()
  ])
  expect(response.ok(), `PATCH: ${response.status()} ${await response.text()}`).toBeTruthy()
  return (await response.json()).data as Post
}

test('S153-01: đăng bài tiếng Việt qua UI và đọc lại sau reload', async ({ page, admin, category, evidence }) => {
  const postTitle = title('đăng bài')
  const cover = 'https://s153.example.test/cover.png'
  // Chỉ ảnh dùng fixture cục bộ; mọi API bài viết vẫn là API thật.
  await page.context().route(cover, route => route.fulfill({ path: join(ROOT_DIR, 'apps/client/public/logo.png'), contentType: 'image/png' }))
  await adminLogin(page)
  await page.getByRole('link', { name: 'Bài viết', exact: true }).click()
  await page.getByRole('link', { name: 'Viết bài', exact: true }).click()
  await page.getByLabel('Tiêu đề').fill(postTitle)
  await page.getByLabel('Nội dung').fill(content)
  await page.getByLabel('Danh mục', { exact: true }).selectOption(category.id)
  await page.getByLabel('Ảnh bìa').fill(cover)
  await expect.poll(() => page.getByAltText('Xem trước ảnh bìa').evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0)
  const [response] = await Promise.all([
    page.waitForResponse(r => r.url().endsWith('/admin/posts') && r.request().method() === 'POST'),
    page.getByRole('button', { name: 'Đăng bài', exact: true }).click()
  ])
  expect(response.status()).toBe(201)
  const created = (await response.json()).data as Post
  await expect(page).toHaveURL(new RegExp(`/posts/${created.id}/edit$`))
  await expect(page.getByLabel('Tiêu đề')).toHaveValue(postTitle)
  await page.reload()
  await expect(page.getByLabel('Tiêu đề')).toHaveValue(postTitle)
  await expect(page.getByLabel('Nội dung')).toHaveValue(content)
  await expect(page.getByLabel('Danh mục', { exact: true })).toHaveValue(category.id)
  await expect(page.getByLabel('Ảnh bìa')).toHaveValue(cover)
  await expect.poll(() => page.getByAltText('Xem trước ảnh bìa').evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0)
  const saved = await api<Post>(admin, 'get', `/admin/posts/${created.id}`)
  expect(saved).toMatchObject({ id: created.id, title: postTitle, content, coverImageUrl: cover, status: 'published', category: { id: category.id } })
  expect(saved.publishedAt).not.toBeNull()
  await page.screenshot({ path: join(evidence, 'S153-01-published.png'), fullPage: true })
  const publicPage = await page.context().newPage()
  await publicPage.goto(`${CLIENT_URL}/blog/${saved.slug}`)
  await expect(publicPage.getByRole('heading', { name: postTitle })).toBeVisible()
  await expect.poll(() => publicPage.getByAltText(postTitle).evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0)
  await publicPage.close()
  await writeFile(join(evidence, 'S153-01-api.json'), JSON.stringify({ created, saved }, null, 2))
})

test('S153-02: sửa A qua UI, giữ ID và bài B đối chứng', async ({ page, admin, category, evidence }) => {
  const a = await createPost(admin, category, 'A trước sửa', 'published')
  const b = await createPost(admin, category, 'B đối chứng', 'published')
  const newTitle = title('A sau sửa')
  const newContent = 'Nội dung A đã sửa qua giao diện về kỹ thuật làm men gốm Bát Tràng.'
  await adminLogin(page)
  await openEdit(page, a)
  await page.screenshot({ path: join(evidence, 'S153-02-before.png'), fullPage: true })
  await page.getByLabel('Tiêu đề').fill(newTitle)
  await page.getByLabel('Nội dung').fill(newContent)
  const patched = await patchFromUi(page, a.id, 'Lưu thay đổi')
  expect(patched).toMatchObject({ id: a.id, title: newTitle, content: newContent, status: 'published' })
  await expect(page.getByRole('button', { name: 'Lưu thay đổi' })).toBeEnabled()
  await page.reload()
  await expect(page.getByLabel('Tiêu đề')).toHaveValue(newTitle)
  await expect(page.getByLabel('Nội dung')).toHaveValue(newContent)
  const afterA = await api<Post>(admin, 'get', `/admin/posts/${a.id}`)
  const afterB = await api<Post>(admin, 'get', `/admin/posts/${b.id}`)
  expect(afterA).toMatchObject({ id: a.id, title: newTitle, content: newContent, status: 'published', category: { id: category.id } })
  expect(afterA.slug).not.toBe(a.slug)
  expect(afterB).toMatchObject({ id: b.id, title: b.title, content: b.content, slug: b.slug, status: b.status, category: { id: category.id } })
  await page.screenshot({ path: join(evidence, 'S153-02-after.png'), fullPage: true })
  await writeFile(join(evidence, 'S153-02-api.json'), JSON.stringify({ beforeA: a, afterA, beforeB: b, afterB }, null, 2))
})

test('S153-03: bắt buộc và rời form không lưu', async ({ page, admin, category, evidence }) => {
  const saved = await createPost(admin, category, 'hủy chỉnh sửa')
  const beforeList = await api<Listing>(admin, 'get', `/admin/posts?categoryId=${category.id}`)
  await adminLogin(page)
  await page.goto('/posts/new')
  const createRequests: string[] = []
  page.on('request', req => {
    if (req.method() === 'POST' && new URL(req.url()).pathname.endsWith('/admin/posts')) createRequests.push(req.url())
  })
  await page.getByRole('button', { name: 'Đăng bài', exact: true }).click()
  await expect(page.getByText('Vui lòng nhập tiêu đề')).toBeVisible()
  await expect(page.getByText('Vui lòng chọn danh mục')).toBeVisible()
  await expect(page.getByText('Nội dung tối thiểu 20 ký tự')).toBeVisible()
  await page.getByLabel('Tiêu đề').fill(title('thiếu nội dung'))
  await page.getByLabel('Danh mục', { exact: true }).selectOption(category.id)
  await page.getByLabel('Nội dung').fill('ngắn')
  await page.getByRole('button', { name: 'Đăng bài', exact: true }).click()
  await expect(page.getByText('Nội dung tối thiểu 20 ký tự')).toBeVisible()
  expect(createRequests).toHaveLength(0)
  const afterList = await api<Listing>(admin, 'get', `/admin/posts?categoryId=${category.id}`)
  expect(afterList.total_count).toBe(beforeList.total_count)
  expect(afterList.entries.map(p => p.id)).toEqual(beforeList.entries.map(p => p.id))
  await openEdit(page, saved)
  await page.getByLabel('Tiêu đề').fill('Tên thay đổi chưa lưu')
  await page.getByLabel('Nội dung').fill('Nội dung đã sửa trong form nhưng không bấm lưu thay đổi.')
  await page.getByRole('link', { name: 'Danh sách bài viết' }).click()
  await expect(page).toHaveURL('/posts')
  await openEdit(page, saved)
  const after = await api<Post>(admin, 'get', `/admin/posts/${saved.id}`)
  expect(after).toMatchObject({ id: saved.id, title: saved.title, content: saved.content, status: saved.status })
  await writeFile(join(evidence, 'S153-03-api.json'), JSON.stringify({ invalidCreateRequests: createRequests.length, beforeList, afterList, before: saved, after }, null, 2))
})

test('S153-04: nháp, xuất bản và gỡ về nháp qua UI', async ({ page, admin, guest, category, evidence }) => {
  const post = await createPost(admin, category, 'trạng thái')
  await adminLogin(page)
  await openEdit(page, post)
  await expect(page.getByText('Bản nháp — chưa hiện ở trang tin tức')).toBeVisible()
  expect((await guest.get(`/api/v1/posts/${post.slug}`)).status()).toBe(404)
  expect((await api<Listing>(guest, 'get', `/posts?category=${category.slug}`)).entries.some(p => p.id === post.id)).toBe(false)
  const published = await patchFromUi(page, post.id, 'Đăng bài')
  expect(published).toMatchObject({ id: post.id, status: 'published' })
  await expect(page.getByRole('button', { name: 'Gỡ về nháp' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Gỡ về nháp' })).toBeVisible()
  const publicPost = await api<Post>(guest, 'get', `/posts/${published.slug}`)
  expect(publicPost.id).toBe(post.id)
  expect((await api<Listing>(guest, 'get', `/posts?category=${category.slug}`)).entries.some(p => p.id === post.id)).toBe(true)
  const unpublished = await patchFromUi(page, post.id, 'Gỡ về nháp')
  expect(unpublished).toMatchObject({ id: post.id, status: 'draft', publishedAt: null })
  await page.reload()
  await expect(page.getByText('Bản nháp — chưa hiện ở trang tin tức')).toBeVisible()
  expect((await guest.get(`/api/v1/posts/${unpublished.slug}`)).status()).toBe(404)
  expect((await api<Listing>(guest, 'get', `/posts?category=${category.slug}`)).entries.some(p => p.id === post.id)).toBe(false)
  const after = await api<Post>(admin, 'get', `/admin/posts/${post.id}`)
  expect(after).toMatchObject({ id: post.id, status: 'draft', publishedAt: null })
  await writeFile(join(evidence, 'S153-04-api.json'), JSON.stringify({ draft: post, published, publicPost, unpublished, after }, null, 2))
})

test('S153-05: quyền guest/customer với API quản trị và đọc lại bài', async ({ admin, guest, category, evidence }) => {
  const post = await createPost(admin, category, 'phân quyền', 'published')
  const customerUser = await createVerifiedUser()
  const customer = await authenticated(customerUser.email, customerUser.password)
  const payload = { title: title('trái phép'), content, categoryId: category.id, status: 'published' }
  const attempts = [
    { actor: 'guest', method: 'get', run: () => guest.get(`/api/v1/admin/posts/${post.id}`), status: 401 },
    { actor: 'guest', method: 'post', run: () => guest.post('/api/v1/admin/posts', { data: payload }), status: 401 },
    { actor: 'guest', method: 'patch', run: () => guest.patch(`/api/v1/admin/posts/${post.id}`, { data: { title: payload.title } }), status: 401 },
    { actor: 'customer', method: 'get', run: () => customer.get(`/api/v1/admin/posts/${post.id}`), status: 403 },
    { actor: 'customer', method: 'post', run: () => customer.post('/api/v1/admin/posts', { data: payload }), status: 403 },
    { actor: 'customer', method: 'patch', run: () => customer.patch(`/api/v1/admin/posts/${post.id}`, { data: { title: payload.title } }), status: 403 },
    { actor: 'customer', method: 'delete', run: () => customer.delete(`/api/v1/admin/posts/${post.id}`), status: 403 }
  ]
  const denied: { actor: string; method: string; status: number }[] = []
  for (const attempt of attempts) {
    const response = await attempt.run()
    expect(response.status(), `${attempt.actor} ${attempt.method}`).toBe(attempt.status)
    const current = await api<Post>(admin, 'get', `/admin/posts/${post.id}`)
    expect(current).toMatchObject({ id: post.id, title: post.title, content: post.content, slug: post.slug, status: post.status, category: { id: category.id } })
    denied.push({ actor: attempt.actor, method: attempt.method, status: response.status() })
  }
  const after = await api<Post>(admin, 'get', `/admin/posts/${post.id}`)
  const list = await api<Listing>(admin, 'get', `/admin/posts?categoryId=${category.id}`)
  expect(list.total_count).toBe(1)
  await writeFile(join(evidence, 'S153-05-api.json'), JSON.stringify({ before: post, after, denied }, null, 2))
  await customer.dispose()
})
