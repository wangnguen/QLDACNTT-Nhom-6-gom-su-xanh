import { expect, request, test, type APIRequestContext } from '@playwright/test'
import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ADMIN_ACCOUNT, SERVER_URL, TMP_DIR } from '../../support/config'
import { createVerifiedUser, login } from '../../support/helpers'

type Product = { id: string; slug: string; name: string }
type Review = { id: string; rating: number; comment: string; authorName: string; isHidden?: boolean }
type Listing = { total_count: number; entries: Review[] }
type Mine = { canReview: boolean; review: Review | null }

async function api<T>(ctx: APIRequestContext, method: 'get' | 'post' | 'patch', path: string, data?: object): Promise<T> {
  const res = await ctx[method](`/api/v1${path}`, data ? { data } : undefined)
  expect(res.ok(), `${method} ${path}: ${res.status()} ${await res.text()}`).toBe(true)
  return (await res.json()).data as T
}

async function auth(identifier: string, password: string, admin = false) {
  const guest = await request.newContext({ baseURL: SERVER_URL })
  const { accessToken } = await api<{ accessToken: string }>(guest, 'post', admin ? '/auth/admin/login' : '/auth/login', { identifier, password })
  await guest.dispose()
  return request.newContext({ baseURL: SERVER_URL, extraHTTPHeaders: { Authorization: `Bearer ${accessToken}` } })
}

test('S163: đánh giá sản phẩm đã giao, sửa, trùng và quyền', async ({ page, browser }) => {
  test.setTimeout(120_000)
  const evidence = join(TMP_DIR, 'scrum163', process.env.S163_RUN_ID || `run-${Date.now()}-${process.pid}`)
  await mkdir(evidence, { recursive: true })
  const a = await createVerifiedUser({ fullName: 'Khach QA S163 A' })
  const b = await createVerifiedUser({ fullName: 'Khach QA S163 B' })
  const [customer, other, admin, guest] = await Promise.all([
    auth(a.email, a.password), auth(b.email, b.password), auth(ADMIN_ACCOUNT.email, ADMIN_ACCOUNT.password, true),
    request.newContext({ baseURL: SERVER_URL })
  ])
  const category = await api<{ id: string }>(admin, 'post', '/admin/categories', { name: `S163 ${randomUUID()}`, isActive: true })
  const makeProduct = (label: string) => api<Product>(admin, 'post', '/admin/products', {
    name: `S163 ${label} ${randomUUID()}`, categoryId: category.id, price: 125000, stock: 10, imageUrls: [], isActive: true
  })
  const x = await makeProduct('X')
  const y = await makeProduct('Y')
  await api(customer, 'post', '/cart/items', { productId: x.id, quantity: 1 })
  const { order } = await api<{ order: { id: string; code: string } }>(customer, 'post', '/orders', {
    recipientName: a.fullName, recipientPhone: a.phone, shippingAddress: '12 Bat Trang Gia Lam Ha Noi', paymentMethod: 'cod', note: null
  })
  await api(admin, 'patch', `/admin/orders/${order.id}/status`, { status: 'confirmed' })
  await api(admin, 'patch', `/admin/orders/${order.id}/shipment`, { action: 'ship', shippingCarrier: 'shop' })
  await api(admin, 'patch', `/admin/orders/${order.id}/shipment`, { action: 'deliver' })
  expect((await api<{ status: string }>(admin, 'get', `/admin/orders/${order.id}`)).status).toBe('delivered')
  expect(await api<Mine>(customer, 'get', `/products/${x.slug}/reviews/me`)).toMatchObject({ canReview: true, review: null })
  expect((await api<Listing>(guest, 'get', `/products/${y.slug}/reviews`)).total_count).toBe(0)

  await login(page, a)
  await page.goto(`/products/${x.slug}`)
  const section = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Đánh giá sản phẩm' }) })
  await section.getByRole('radio', { name: /^1 sao/ }).click()
  const firstComment = 'Men gốm đẹp, đóng gói cẩn thận — S163 lần đầu.'
  await section.getByLabel('Nhận xét').fill(firstComment)
  await expect(section.getByLabel('Nhận xét')).toHaveAttribute('maxlength', '1000')
  const [createdResponse] = await Promise.all([
    page.waitForResponse(r => r.url().endsWith('/api/v1/reviews') && r.request().method() === 'POST'),
    section.getByRole('button', { name: 'Gửi đánh giá' }).click()
  ])
  expect(createdResponse.status()).toBe(201)
  await expect(section.getByText('Đánh giá của bạn')).toBeVisible()
  await page.reload()
  await expect(section.getByText(firstComment).first()).toBeVisible()
  await expect(section.getByText('Đánh giá của bạn').locator('../..').getByRole('img', { name: '1 trên 5 sao' })).toBeVisible()
  const first = await api<Mine>(customer, 'get', `/products/${x.slug}/reviews/me`)
  expect(first.review).toMatchObject({ rating: 1, comment: firstComment, authorName: a.fullName, isHidden: false })
  expect(first.review?.id).toBeTruthy()
  const id = first.review!.id
  const publicFirst = await api<Listing>(guest, 'get', `/products/${x.slug}/reviews`)
  expect(publicFirst.total_count).toBe(1)
  expect(publicFirst.entries).toEqual([expect.objectContaining({ id, rating: 1, comment: firstComment, authorName: a.fullName })])
  const adminList = await api<{ entries: { id: string; product: { id: string }; customer: { fullName: string }; orderCode: string }[] }>(admin, 'get', `/admin/reviews?productId=${x.id}`)
  expect(adminList.entries).toEqual([expect.objectContaining({ id, product: expect.objectContaining({ id: x.id }), customer: expect.objectContaining({ fullName: a.fullName }), orderCode: order.code })])
  await section.screenshot({ path: join(evidence, 'S163-first.png') })
  await writeFile(join(evidence, 'S163-first.json'), JSON.stringify({ orderCode: order.code, x: { id: x.id, slug: x.slug }, y: { id: y.id, slug: y.slug }, review: first.review }, null, 2))

  const duplicate = await customer.post('/api/v1/reviews', { data: { productId: x.id, rating: 5, comment: 'Duplicate' } })
  expect(duplicate.status()).toBe(409)
  expect((await api<Mine>(customer, 'get', `/products/${x.slug}/reviews/me`)).review).toMatchObject({ id, rating: 1, comment: firstComment })
  expect((await api<Listing>(guest, 'get', `/products/${x.slug}/reviews`)).total_count).toBe(1)

  await section.getByRole('button', { name: 'Sửa', exact: true }).click()
  await section.getByRole('radio', { name: /^5 sao/ }).click()
  const editedComment = 'Men gốm rất đẹp sau khi sử dụng — S163 đã sửa.'
  await section.getByLabel('Nhận xét').fill(editedComment)
  const [updatedResponse] = await Promise.all([
    page.waitForResponse(r => r.url().endsWith(`/api/v1/reviews/${id}`) && r.request().method() === 'PATCH'),
    section.getByRole('button', { name: 'Lưu đánh giá' }).click()
  ])
  expect(updatedResponse.status()).toBe(200)
  await page.reload()
  await expect(section.getByText(editedComment).first()).toBeVisible()
  await expect(section.getByText('Đánh giá của bạn').locator('../..').getByRole('img', { name: '5 trên 5 sao' })).toBeVisible()
  const updated = await api<Mine>(customer, 'get', `/products/${x.slug}/reviews/me`)
  expect(updated.review).toMatchObject({ id, rating: 5, comment: editedComment, authorName: a.fullName, isHidden: false })
  const publicUpdated = await api<Listing>(guest, 'get', `/products/${x.slug}/reviews`)
  expect(publicUpdated.total_count).toBe(1)
  expect(publicUpdated.entries).toEqual([expect.objectContaining({ id, rating: 5, comment: editedComment, authorName: a.fullName })])
  expect((await api<Listing>(guest, 'get', `/products/${y.slug}/reviews`)).total_count).toBe(0)
  await section.screenshot({ path: join(evidence, 'S163-edited.png') })
  await writeFile(join(evidence, 'S163-edited.json'), JSON.stringify({ orderCode: order.code, review: updated.review, publicCount: publicUpdated.total_count, controlProduct: y.id, duplicateStatus: duplicate.status() }, null, 2))

  const bPage = await browser.newPage({ baseURL: page.context().pages()[0].url().split('/products/')[0] })
  await login(bPage, b)
  await bPage.goto(`/products/${x.slug}`)
  await expect(bPage.getByText('Chỉ khách đã mua và nhận sản phẩm này mới đánh giá được.')).toBeVisible()
  const rejected = await other.post('/api/v1/reviews', { data: { productId: x.id, rating: 5, comment: 'B' } })
  expect(rejected.status()).toBe(400)
  await bPage.close()
  const guestPage = await browser.newPage({ baseURL: page.url().split('/products/')[0] })
  await guestPage.goto(`/products/${x.slug}`)
  await expect(guestPage.getByText('để đánh giá sản phẩm bạn đã mua.')).toBeVisible()
  const denied = await guest.post('/api/v1/reviews', { data: { productId: x.id, rating: 5, comment: 'Guest' } })
  expect(denied.status()).toBe(401)
  expect((await api<Listing>(guest, 'get', `/products/${x.slug}/reviews`)).entries).toEqual([expect.objectContaining({ id, rating: 5, comment: editedComment })])
  await guestPage.close()
  await writeFile(join(evidence, 'S163-access.json'), JSON.stringify({ duplicate: duplicate.status(), customerWithoutDelivery: rejected.status(), guest: denied.status(), reviewId: id }, null, 2))
  await Promise.all([customer.dispose(), other.dispose(), admin.dispose(), guest.dispose()])
})
