import { expect, request, test as base, type APIRequestContext, type Page } from '@playwright/test'
import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ADMIN_ACCOUNT, CLIENT_URL, ROOT_DIR, SERVER_URL, TMP_DIR } from '../../support/config'

type Category = { id: string; name: string; slug: string }
type Post = { id: string; title: string; slug: string; content: string; status: string; category: Category; publishedAt: string | null; coverImageUrl: string | null }
type Listing = { entries: Post[]; total_count: number }
type Fixtures = { admin: APIRequestContext; guestApi: APIRequestContext; category: Category; evidence: string }

async function api<T>(ctx: APIRequestContext, method: 'get' | 'post', path: string, payload?: object): Promise<T> {
  const response = await ctx[method](`/api/v1${path}`, payload ? { data: payload } : undefined)
  expect(response.ok(), `${method} ${path}: ${response.status()} ${await response.text()}`).toBeTruthy()
  return (await response.json()).data as T
}

const test = base.extend<Fixtures>({
  admin: async ({}, use) => {
    const anonymous = await request.newContext({ baseURL: SERVER_URL })
    const login = await api<{ accessToken: string }>(anonymous, 'post', '/auth/admin/login', { identifier: ADMIN_ACCOUNT.email, password: ADMIN_ACCOUNT.password })
    await anonymous.dispose()
    const ctx = await request.newContext({ baseURL: SERVER_URL, extraHTTPHeaders: { Authorization: `Bearer ${login.accessToken}` } })
    await use(ctx)
    await ctx.dispose()
  },
  guestApi: async ({}, use) => {
    const ctx = await request.newContext({ baseURL: SERVER_URL })
    await use(ctx)
    await ctx.dispose()
  },
  category: async ({ admin }, use) => {
    const category = await api<Category>(admin, 'post', '/admin/post-categories', { name: `Danh mục S158 ${randomUUID()}`, isActive: true })
    await use(category)
  },
  evidence: async ({}, use) => {
    const run = process.env.S158_RUN_ID || `run-${Date.now()}-${process.pid}`
    const directory = join(TMP_DIR, 'scrum158-20261127', run)
    await mkdir(directory, { recursive: true })
    await use(directory)
  }
})

async function createPost(admin: APIRequestContext, category: Category, label: string, content: string, status = 'published', coverImageUrl?: string) {
  return api<Post>(admin, 'post', '/admin/posts', { title: `S158 ${label} ${randomUUID()}`, content, categoryId: category.id, status, ...(coverImageUrl && { coverImageUrl }) })
}
async function visitCategory(page: Page, category: Category) {
  await page.goto('/blog')
  const tab = page.getByRole('tab').filter({ hasText: category.name })
  await tab.click()
  await expect(tab).toHaveAttribute('aria-selected', 'true')
}
const aContent = 'Nội dung riêng bài A nói về men lam và cách bảo quản đồ gốm.'
const bContent = 'Nội dung riêng bài B nói về men rạn, nghệ nhân Bát Tràng và lò nung.'

test('S158-01: menu khách đến danh sách rồi đọc đúng bài B', async ({ page, admin, guestApi, category, evidence }) => {
  const a = await createPost(admin, category, 'A men lam', aContent)
  const cover = 'https://s158.example.test/cover.png'
  // Chỉ ảnh bìa dùng fixture cục bộ; API danh sách và chi tiết là thật.
  await page.context().route(cover, route => route.fulfill({ path: join(ROOT_DIR, 'apps/client/public/logo.png'), contentType: 'image/png' }))
  const b = await createPost(admin, category, 'B men rạn', bContent, 'published', cover)
  await page.goto('/')
  await page.getByRole('link', { name: 'Tin tức', exact: true }).click()
  await expect(page).toHaveURL('/blog')
  const tab = page.getByRole('tab').filter({ hasText: category.name })
  await tab.click()
  await expect(tab).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('link', { name: a.title, exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: b.title, exact: true })).toHaveAttribute('href', `/blog/${b.slug}`)
  await page.screenshot({ path: join(evidence, 'S158-01-list.png'), fullPage: true })
  const [response] = await Promise.all([
    page.waitForResponse(r => r.url().includes(`/api/v1/posts/${b.slug}`) && r.request().method() === 'GET'),
    page.getByRole('link', { name: b.title, exact: true }).click()
  ])
  expect(response.status()).toBe(200)
  const responsePost = (await response.json()).data as Post
  expect(responsePost).toMatchObject({ id: b.id, slug: b.slug, title: b.title, content: bContent, coverImageUrl: cover, category: { id: category.id } })
  await expect(page).toHaveURL(`/blog/${b.slug}`)
  await expect(page.getByRole('heading', { name: b.title, exact: true })).toBeVisible()
  await expect(page.getByText(bContent, { exact: true })).toBeVisible()
  expect(b.publishedAt).not.toBeNull()
  const date = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(b.publishedAt!))
  await expect(page.getByText(date.charAt(0).toUpperCase() + date.slice(1), { exact: true })).toBeVisible()
  const image = page.getByAltText(b.title, { exact: true })
  await expect(image).toHaveAttribute('src', cover)
  await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0)
  // Bài A có thể xuất hiện hợp lệ trong mục bài cùng chủ đề; chỉ loại A khỏi nội dung chính của B.
  await expect(page.locator('article.pb-16 > div').getByText(aContent, { exact: true })).toHaveCount(0)
  await expect(page.locator('article').getByRole('link', { name: category.name, exact: true }).first()).toHaveAttribute('href', `/blog?category=${category.slug}`)
  const publicPost = await api<Post>(guestApi, 'get', `/posts/${b.slug}`)
  expect(publicPost).toMatchObject({ id: b.id, slug: b.slug, content: bContent, category: { id: category.id } })
  await page.screenshot({ path: join(evidence, 'S158-01-detail.png'), fullPage: true })
  await writeFile(join(evidence, 'S158-01-api.json'), JSON.stringify({ a, b, responsePost, publicPost }, null, 2))
})

test('S158-02: reload và URL trực tiếp trong phiên khách mới', async ({ page, browser, admin, guestApi, category, evidence }) => {
  const b = await createPost(admin, category, 'B liên kết trực tiếp', bContent)
  await page.goto(`/blog/${b.slug}`)
  await expect(page.getByRole('heading', { name: b.title, exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: b.title, exact: true })).toBeVisible()
  await expect(page.getByText(bContent, { exact: true })).toBeVisible()
  const context = await browser.newContext()
  const fresh = await context.newPage()
  await fresh.goto(`${CLIENT_URL}/blog/${b.slug}`)
  await expect(fresh.getByRole('heading', { name: b.title, exact: true })).toBeVisible()
  await expect(fresh.getByText(bContent, { exact: true })).toBeVisible()
  const publicPost = await api<Post>(guestApi, 'get', `/posts/${b.slug}`)
  expect(publicPost).toMatchObject({ id: b.id, slug: b.slug, title: b.title, content: bContent, category: { id: category.id } })
  await writeFile(join(evidence, 'S158-02-api.json'), JSON.stringify({ fixture: b, publicPost }, null, 2))
  await context.close()
})

test('S158-03: bài nháp, danh mục ẩn và slug không tồn tại không công khai', async ({ page, admin, guestApi, category, evidence }) => {
  const visible = await createPost(admin, category, 'công khai đối chứng', aContent)
  const draft = await createPost(admin, category, 'nháp riêng', bContent, 'draft')
  const hiddenCategory = await api<Category>(admin, 'post', '/admin/post-categories', { name: `Ẩn S158 ${randomUUID()}`, isActive: false })
  const hidden = await createPost(admin, hiddenCategory, 'danh mục ẩn', bContent)
  const missing = `s158-khong-ton-tai-${randomUUID()}`
  await visitCategory(page, category)
  await expect(page.getByRole('link', { name: visible.title, exact: true })).toBeVisible()
  const observations = []
  for (const post of [draft, hidden]) {
    const list = await api<Listing>(guestApi, 'get', `/posts?search=${encodeURIComponent(post.title)}`)
    expect(list.entries.some(p => p.id === post.id)).toBe(false)
    await page.goto('/blog')
    await page.getByLabel('Tìm bài viết').fill(post.title)
    await page.getByLabel('Tìm bài viết').press('Enter')
    await expect(page.getByText(`Không tìm thấy bài viết cho "${post.title}"`, { exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: post.title, exact: true })).toHaveCount(0)
    const detail = await guestApi.get(`/api/v1/posts/${post.slug}`)
    expect(detail.status()).toBe(404)
    await page.goto(`/blog/${post.slug}`)
    await expect(page.getByRole('heading', { name: 'Không tìm thấy bài viết' })).toBeVisible()
    observations.push({ id: post.id, slug: post.slug, listTotal: list.total_count, status: detail.status() })
  }
  const missingResponse = await guestApi.get(`/api/v1/posts/${missing}`)
  expect(missingResponse.status()).toBe(404)
  await page.goto(`/blog/${missing}`)
  await expect(page.getByRole('heading', { name: 'Không tìm thấy bài viết' })).toBeVisible()
  await writeFile(join(evidence, 'S158-03-api.json'), JSON.stringify({ visible, draft, hidden, observations, missing, missingStatus: missingResponse.status() }, null, 2))
})

test('S158-04a: tìm kiếm, lọc có kết quả, bỏ lọc và phân trang', async ({ page, admin, guestApi, category, evidence }) => {
  const posts: Post[] = []
  for (let i = 0; i < 8; i++) posts.push(await createPost(admin, category, `men ${i}`, `Bài số ${i} mô tả gốm Bát Tràng với nội dung riêng biệt để kiểm thử.`))
  const otherCategory = await api<Category>(admin, 'post', '/admin/post-categories', { name: `Đối chứng S158 ${randomUUID()}`, isActive: true })
  const other = await createPost(admin, otherCategory, 'đối chứng', aContent)
  await visitCategory(page, category)
  const first = await api<Listing>(guestApi, 'get', `/posts?category=${category.slug}&limit=7&offset=0`)
  expect(first.total_count).toBe(8)
  await expect(page.locator('article h2 a')).toHaveText(first.entries.map(p => p.title))
  await expect(page.getByRole('link', { name: other.title, exact: true })).toHaveCount(0)
  const second = await api<Listing>(guestApi, 'get', `/posts?category=${category.slug}&limit=7&offset=7`)
  await page.getByRole('navigation', { name: 'Phân trang' }).getByRole('button', { name: '2', exact: true }).click()
  await expect(page).toHaveURL(/page=2/)
  await expect(page.locator('article h2 a')).toHaveText(second.entries.map(p => p.title))
  expect(second.entries).toHaveLength(1)
  expect(first.entries.some(p => p.id === second.entries[0].id)).toBe(false)
  await page.getByRole('navigation', { name: 'Phân trang' }).getByRole('button', { name: '1', exact: true }).click()
  await expect(page.locator('article h2 a')).toHaveText(first.entries.map(p => p.title))
  await page.getByLabel('Tìm bài viết').fill(posts[0].title)
  await page.getByLabel('Tìm bài viết').press('Enter')
  await expect(page.getByRole('link', { name: posts[0].title, exact: true })).toBeVisible()
  await expect(page.locator('article h2 a')).toHaveText([posts[0].title])
  const absent = `khongco${randomUUID()}`
  await page.getByLabel('Tìm bài viết').fill(absent)
  await page.getByLabel('Tìm bài viết').press('Enter')
  await expect(page.getByText(`Không tìm thấy bài viết cho "${absent}"`, { exact: true })).toBeVisible()
  await expect(page.getByText('Chưa có bài viết nào', { exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Xem tất cả bài viết' }).click()
  await expect(page).toHaveURL('/blog')
  await expect(page.getByRole('tab', { name: 'Tất cả' })).toHaveAttribute('aria-selected', 'true')
  await page.getByRole('tab').filter({ hasText: category.name }).click()
  await expect(page.locator('article h2 a')).toHaveText(first.entries.map(p => p.title))
  await writeFile(join(evidence, 'S158-04a-api.json'), JSON.stringify({ posts, other, first, second, absent }, null, 2))
})

test('S158-04b: ngữ cảnh danh mục rỗng và bỏ lọc', async ({ page, admin, guestApi, evidence }) => {
  const filled = await api<Category>(admin, 'post', '/admin/post-categories', { name: `Có bài S158 ${randomUUID()}`, isActive: true })
  const empty = await api<Category>(admin, 'post', '/admin/post-categories', { name: `Rỗng S158 ${randomUUID()}`, isActive: true })
  const post = await createPost(admin, filled, 'có bài ở danh mục khác', aContent)
  const emptyList = await api<Listing>(guestApi, 'get', `/posts?category=${empty.slug}`)
  const populated = await api<Listing>(guestApi, 'get', `/posts?category=${filled.slug}`)
  expect(emptyList.total_count).toBe(0)
  expect(populated.entries.some(p => p.id === post.id)).toBe(true)
  await visitCategory(page, empty)
  await expect(page.getByRole('heading', { name: empty.name, exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Xem tất cả bài viết' })).toBeVisible()
  const message = await page.getByText('Chưa có bài viết nào', { exact: true }).textContent()
  await expect(page.getByText('Chưa có bài viết nào', { exact: true })).toBeVisible()
  await page.screenshot({ path: join(evidence, 'S158-04b-empty-category.png'), fullPage: true })
  await page.getByRole('button', { name: 'Xem tất cả bài viết' }).click()
  await expect(page).toHaveURL('/blog')
  await expect(page.getByRole('tab', { name: 'Tất cả' })).toHaveAttribute('aria-selected', 'true')
  await page.getByRole('tab').filter({ hasText: filled.name }).click()
  await expect(page.getByRole('link', { name: post.title, exact: true })).toBeVisible()
  await writeFile(join(evidence, 'S158-04b-api.json'), JSON.stringify({ empty, filled, post, emptyList, populated, message }, null, 2))
})
