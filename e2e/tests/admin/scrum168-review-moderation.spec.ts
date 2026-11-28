import { expect, request, test, type APIRequestContext } from '@playwright/test'
import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ADMIN_ACCOUNT, CLIENT_URL, SERVER_URL, TMP_DIR } from '../../support/config'
import { createVerifiedUser, fillLoginForm, type TestUser } from '../../support/helpers'

type Review = { id: string; rating: number; comment: string; authorName: string; isHidden: boolean; adminReply: string | null; repliedAt: string | null }
type Listing = { total_count: number; entries: Review[] }

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

test('S168: admin ẩn, hiện, lọc, trả lời và bảo vệ quyền', async ({ page, browser }) => {
  test.setTimeout(120_000)
  const dir = join(TMP_DIR, 'scrum168', process.env.S168_RUN_ID || `run-${Date.now()}-${process.pid}`)
  await mkdir(dir, { recursive: true })
  const a = await createVerifiedUser({ fullName: 'Khach S168 A' })
  const b = await createVerifiedUser({ fullName: 'Khach S168 B' })
  const [admin, customerA, customerB, guest] = await Promise.all([
    auth(ADMIN_ACCOUNT.email, ADMIN_ACCOUNT.password, true), auth(a.email, a.password), auth(b.email, b.password),
    request.newContext({ baseURL: SERVER_URL })
  ])
  const category = await api<{ id: string }>(admin, 'post', '/admin/categories', { name: `S168 ${randomUUID()}`, isActive: true })
  const product = await api<{ id: string; slug: string; name: string }>(admin, 'post', '/admin/products', {
    name: `S168 ${randomUUID()}`, categoryId: category.id, price: 120000, stock: 10, imageUrls: [], isActive: true
  })
  const createReview = async (ctx: APIRequestContext, user: TestUser, rating: number, comment: string) => {
    await api(ctx, 'post', '/cart/items', { productId: product.id, quantity: 1 })
    const { order } = await api<{ order: { id: string } }>(ctx, 'post', '/orders', {
      recipientName: user.fullName, recipientPhone: user.phone, shippingAddress: '12 Bat Trang Gia Lam Ha Noi', paymentMethod: 'cod', note: null
    })
    await api(admin, 'patch', `/admin/orders/${order.id}/status`, { status: 'confirmed' })
    await api(admin, 'patch', `/admin/orders/${order.id}/shipment`, { action: 'ship', shippingCarrier: 'shop' })
    await api(admin, 'patch', `/admin/orders/${order.id}/shipment`, { action: 'deliver' })
    expect((await api<{ status: string }>(admin, 'get', `/admin/orders/${order.id}`)).status).toBe('delivered')
    return api<Review>(ctx, 'post', '/reviews', { productId: product.id, rating, comment })
  }
  const commentA = 'S168 A men lam cần được kiểm duyệt.'
  const commentB = 'S168 B đối chứng vẫn phải hiển thị.'
  const reply = 'Cảm ơn bạn A đã phản hồi cho cửa hàng S168.'
  const createdA = await createReview(customerA, a, 1, commentA)
  const createdB = await createReview(customerB, b, 5, commentB)
  expect(createdA.id).not.toBe(createdB.id)
  const adminReviews = () => api<Listing>(admin, 'get', `/admin/reviews?productId=${product.id}`)
  const publicReviews = () => api<Listing>(guest, 'get', `/products/${product.slug}/reviews`)
  const expectAdmin = (list: Listing, hidden: boolean, replyText: string | null = null) => {
    expect(list.total_count).toBe(2)
    expect(list.entries).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: createdA.id, isHidden: hidden, comment: commentA, adminReply: replyText }),
      expect.objectContaining({ id: createdB.id, isHidden: false, comment: commentB, adminReply: null })
    ]))
  }
  const expectPublic = (list: Listing, hidden: boolean) => {
    expect(list.total_count).toBe(hidden ? 1 : 2)
    expect(list.entries.map(r => r.id).sort()).toEqual((hidden ? [createdB.id] : [createdA.id, createdB.id]).sort())
  }
  const initial = await adminReviews()
  expectAdmin(initial, false)
  expectPublic(await publicReviews(), false)
  const customerPage = await browser.newPage({ baseURL: CLIENT_URL })
  await customerPage.goto(`/products/${product.slug}`)
  await expect(customerPage.getByText(commentA)).toBeVisible()
  await expect(customerPage.getByText(commentB)).toBeVisible()

  await fillLoginForm(page, ADMIN_ACCOUNT.email, ADMIN_ACCOUNT.password)
  await expect(page).toHaveURL('/')
  await page.goto('/reviews')
  await page.getByLabel('Tìm đánh giá').fill(product.name)
  const rowA = page.getByRole('listitem').filter({ hasText: commentA })
  const rowB = page.getByRole('listitem').filter({ hasText: commentB })
  await expect(rowA).toBeVisible()
  await expect(rowB).toBeVisible()
  await page.screenshot({ path: join(dir, 'S168-before.png'), fullPage: true })
  await rowA.getByRole('button', { name: 'Ẩn đánh giá' }).click()
  await expect(rowA.getByText('Đã ẩn', { exact: true })).toBeVisible()
  await page.reload()
  await expect(rowA.getByText('Đã ẩn', { exact: true })).toBeVisible()
  const hidden = await adminReviews()
  expectAdmin(hidden, true)
  expectPublic(await publicReviews(), true)
  await customerPage.reload()
  await expect(customerPage.getByText(commentA)).toHaveCount(0)
  await expect(customerPage.getByText(commentB)).toBeVisible()
  await page.screenshot({ path: join(dir, 'S168-hidden.png'), fullPage: true })
  await writeFile(join(dir, 'S168-hidden.json'), JSON.stringify({ product: product.id, a: createdA.id, b: createdB.id, admin: hidden.entries.map(({ id, isHidden, comment }) => ({ id, isHidden, comment })), publicIds: (await publicReviews()).entries.map(r => r.id) }, null, 2))

  await page.getByLabel('Lọc theo trạng thái').selectOption('hidden')
  await expect(rowA).toBeVisible()
  await expect(rowB).toHaveCount(0)
  await rowA.getByRole('button', { name: 'Hiện lại đánh giá' }).click()
  await page.getByLabel('Lọc theo trạng thái').selectOption('')
  await page.reload()
  await expect(rowA.getByRole('button', { name: 'Ẩn đánh giá' })).toBeVisible()
  await expect(rowB).toBeVisible()
  expectAdmin(await adminReviews(), false)
  expectPublic(await publicReviews(), false)
  await customerPage.reload()
  await expect(customerPage.getByText(commentA)).toBeVisible()
  await expect(customerPage.getByText(commentB)).toBeVisible()
  await page.screenshot({ path: join(dir, 'S168-visible.png'), fullPage: true })

  const guestDenied = await guest.patch(`/api/v1/admin/reviews/${createdA.id}`, { data: { isHidden: true } })
  const customerDenied = await customerB.patch(`/api/v1/admin/reviews/${createdA.id}`, { data: { isHidden: true } })
  expect(guestDenied.status()).toBe(401)
  expect(customerDenied.status()).toBe(403)
  expectAdmin(await adminReviews(), false)
  expectPublic(await publicReviews(), false)

  await rowA.getByRole('button', { name: `Trả lời đánh giá của ${a.fullName}` }).click()
  const dialog = page.getByRole('dialog', { name: 'Trả lời đánh giá' })
  await dialog.getByLabel('Phản hồi của cửa hàng (khách và mọi người sẽ thấy)').fill(reply)
  await dialog.getByRole('button', { name: 'Lưu phản hồi' }).click()
  await expect(dialog).toBeHidden()
  await page.reload()
  await expect(rowA.getByText(reply)).toBeVisible()
  const replied = await adminReviews()
  expectAdmin(replied, false, reply)
  expect(replied.entries.find(r => r.id === createdA.id)?.repliedAt).toBeTruthy()
  const publicReplied = await publicReviews()
  expectPublic(publicReplied, false)
  expect(publicReplied.entries.find(r => r.id === createdA.id)).toMatchObject({ id: createdA.id, adminReply: reply })
  await customerPage.reload()
  await expect(customerPage.getByText(reply)).toBeVisible()
  await page.screenshot({ path: join(dir, 'S168-reply.png'), fullPage: true })
  await writeFile(join(dir, 'S168-final.json'), JSON.stringify({ product: product.id, a: createdA.id, b: createdB.id, guestStatus: guestDenied.status(), customerStatus: customerDenied.status(), admin: replied.entries.map(({ id, isHidden, comment, adminReply, repliedAt }) => ({ id, isHidden, comment, adminReply, repliedAt })), publicIds: publicReplied.entries.map(r => r.id) }, null, 2))
  await customerPage.close()
  await Promise.all([admin.dispose(), customerA.dispose(), customerB.dispose(), guest.dispose()])
})
