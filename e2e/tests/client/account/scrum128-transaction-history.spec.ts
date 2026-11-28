import { expect, request, test, type APIRequestContext, type Page } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { ADMIN_ACCOUNT, SERVER_URL, TMP_DIR } from '../../../support/config'
import { createVerifiedUser, fillLoginForm, login, logout, type TestUser } from '../../../support/helpers'

type Transaction = {
  id: string; code: string; type: 'payment' | 'refund'; method: 'vnpay' | 'cod'
  status: 'pending' | 'failed' | 'success'; amount: number; gatewayTransactionNo: string | null
  message: string; createdAt: string; completedAt: string | null
  order: { id: string; code: string }
}
type Listing = { entries: Transaction[]; total_count: number }
const evidenceDir = join(TMP_DIR, 'scrum128-20261127')

async function api<T>(ctx: APIRequestContext, method: 'get' | 'post', path: string, data?: object): Promise<T> {
  const response = await ctx[method](`/api/v1${path}`, data ? { data } : undefined)
  expect(response.ok(), `${method} ${path}: ${response.status()} ${await response.text()}`).toBeTruthy()
  return (await response.json()).data as T
}

async function userApi(user: TestUser) {
  const plain = await request.newContext({ baseURL: SERVER_URL })
  const result = await api<{ accessToken: string }>(plain, 'post', '/auth/login', { identifier: user.email, password: user.password })
  await plain.dispose()
  return request.newContext({ baseURL: SERVER_URL, extraHTTPHeaders: { Authorization: `Bearer ${result.accessToken}` } })
}

async function productFixture() {
  const admin = await userApi({ ...ADMIN_ACCOUNT, phone: '' })
  const name = `QA S128 ${Date.now()} ${Math.floor(Math.random() * 100000)}`
  const category = await api<{ id: string }>(admin, 'post', '/admin/categories', { name, isActive: true })
  const product = await api<{ id: string; slug: string }>(admin, 'post', '/admin/products', {
    name, categoryId: category.id, price: 125000, stock: 100, imageUrls: [], isActive: true
  })
  await admin.dispose()
  return product
}

async function createOrder(ctx: APIRequestContext, user: TestUser, productId: string) {
  await api(ctx, 'post', '/cart/items', { productId, quantity: 1 })
  return api<{ order: { id: string; code: string }; paymentUrl: string }>(ctx, 'post', '/orders', {
    recipientName: user.fullName, recipientPhone: user.phone, shippingAddress: '12 Bat Trang Gia Lam Ha Noi',
    note: null, paymentMethod: 'vnpay'
  })
}

function displayTime(value: string) {
  const date = new Date(value)
  const time = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' }).format(date)
  const day = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
  return `${time}, ${day.charAt(0).toUpperCase()}${day.slice(1)}`
}

async function verifyRows(page: Page, expected: Transaction[]) {
  const list = page.locator('main ul[aria-busy]')
  await expect(list).toHaveAttribute('aria-busy', 'false')
  const rows = list.locator(':scope > li')
  await expect(rows).toHaveCount(expected.length)
  for (const [index, item] of expected.entries()) {
    const row = rows.nth(index)
    await expect(row).toContainText(item.code)
    await expect(row.getByRole('link', { name: `Đơn ${item.order.code}` })).toHaveAttribute('href', `/account/orders/${item.order.id}`)
    await expect(row).toContainText(new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.amount))
    await expect(row).toContainText(displayTime(item.completedAt ?? item.createdAt))
    await expect(row).toContainText(item.method === 'vnpay' ? 'VNPay' : 'Tiền mặt (COD)')
    await expect(row).toContainText(({ pending: 'Đang xử lý', failed: 'Thất bại', success: 'Thành công' })[item.status])
    if (item.gatewayTransactionNo) await expect(row).toContainText(item.gatewayTransactionNo)
  }
}

test('S128-01: lịch sử A/B, sandbox, lọc, phân trang và đăng nhập', async ({ page }) => {
  test.setTimeout(120_000)
  await mkdir(evidenceDir, { recursive: true })
  const [a, b, empty] = await Promise.all([
    createVerifiedUser({ fullName: 'Khach Test A' }), createVerifiedUser({ fullName: 'Khach Test B' }),
    createVerifiedUser({ fullName: 'Khach Test Empty' })
  ])
  const product = await productFixture()
  const [apiA, apiB] = await Promise.all([userApi(a), userApi(b)])
  // Giao dịch chuẩn bị qua API: 10 đơn A, cùng số tiền, và retry một đơn tạo 2 lượt.
  let firstOrder = ''
  for (let i = 0; i < 10; i++) {
    const created = await createOrder(apiA, a, product.id)
    if (!firstOrder) firstOrder = created.order.id
  }
  await api(apiA, 'post', `/orders/${firstOrder}/payment`)
  await createOrder(apiB, b, product.id)

  const anonymous = await request.newContext({ baseURL: SERVER_URL })
  expect((await anonymous.get('/api/v1/payments')).status()).toBe(401)
  await anonymous.dispose()
  await page.goto('/account/transactions')
  await expect(page).toHaveURL(/\/login/)
  await fillLoginForm(page, a.email, a.password)
  await expect(page).toHaveURL('/account/transactions')
  // Một đơn khác thực sự đặt và hoàn tất qua UI ở cổng giả lập nội bộ.
  await page.goto(`/products/${product.slug}`)
  await page.getByRole('button', { name: /Thêm vào giỏ hàng/i }).click()
  await page.goto('/checkout')
  await page.getByLabel('Địa chỉ giao hàng').fill('12 Bat Trang Gia Lam Ha Noi')
  await page.getByText('Thanh toán trực tuyến qua VNPay').click()
  await page.getByRole('button', { name: 'Đặt hàng' }).click()
  await page.waitForURL(/payments\/sandbox/)
  await page.getByRole('link', { name: 'Thanh toán thành công' }).click()
  await expect(page.getByRole('heading', { name: 'Thanh toán thành công!' })).toBeVisible()
  await page.goto('/account')
  await page.getByRole('link', { name: 'Lịch sử giao dịch' }).click()
  const all = await api<Listing>(apiA, 'get', '/payments?limit=100&offset=0')
  expect(all.total_count).toBe(12)
  expect(all.entries.filter((item) => item.order.id === firstOrder)).toHaveLength(2)
  expect(all.entries.some((item) => item.status === 'success')).toBe(true)
  await verifyRows(page, all.entries.slice(0, 10))
  await page.screenshot({ path: join(evidenceDir, 'S128-A-page1.png'), fullPage: true })
  await page.getByRole('link', { name: `Đơn ${all.entries[0].order.code}` }).click()
  await expect(page).toHaveURL(new RegExp(`/account/orders/${all.entries[0].order.id}$`))
  await expect(page.getByRole('heading', { name: new RegExp(all.entries[0].order.code) })).toBeVisible()
  await page.goto('/account/transactions')
  await verifyRows(page, all.entries.slice(0, 10))
  await page.getByRole('button', { name: 'Trang sau' }).click()
  await verifyRows(page, all.entries.slice(10))
  await page.screenshot({ path: join(evidenceDir, 'S128-A-page2.png'), fullPage: true })
  await page.reload()
  await verifyRows(page, all.entries.slice(10))
  await page.getByRole('tab', { name: 'Hoàn tiền' }).click()
  await expect(page.getByText('Không có giao dịch nào khớp bộ lọc')).toBeVisible()
  await page.getByRole('tab', { name: 'Thanh toán', exact: true }).click()
  await expect(page.getByRole('tab', { name: 'Thanh toán', exact: true })).toHaveAttribute('aria-selected', 'true')
  await page.getByLabel('Lọc theo kết quả').selectOption('failed')
  const failed = all.entries.filter((item) => item.status === 'failed')
  expect(failed.length).toBe(1)
  await verifyRows(page, failed)
  await page.screenshot({ path: join(evidenceDir, 'S128-A-filter-failed.png'), fullPage: true })
  await page.getByLabel('Lọc theo kết quả').selectOption('')
  await page.getByRole('tab', { name: 'Tất cả' }).click()
  await verifyRows(page, all.entries.slice(0, 10))
  await logout(page)
  await login(page, a)
  await page.goto('/account/transactions')
  await verifyRows(page, all.entries.slice(0, 10))
  await logout(page)
  await login(page, b)
  await page.goto('/account/transactions')
  const bHistory = await api<Listing>(apiB, 'get', '/payments?limit=100&offset=0')
  expect(bHistory.total_count).toBe(1)
  await verifyRows(page, bHistory.entries)
  await expect(page.getByText(all.entries[0].code)).toHaveCount(0)
  await page.screenshot({ path: join(evidenceDir, 'S128-B-history.png'), fullPage: true })
  await logout(page)
  await login(page, empty)
  await page.goto('/account/transactions')
  await expect(page.getByText('Bạn chưa có giao dịch nào')).toBeVisible()
  await page.screenshot({ path: join(evidenceDir, 'S128-empty.png'), fullPage: true })
  await writeFile(join(evidenceDir, 'S128-api.json'), JSON.stringify({ a: all, b: bHistory, provenance: 'A: 10 API orders + API retry + 1 UI sandbox success; B: 1 API order' }, null, 2))
  await apiA.dispose()
  await apiB.dispose()
})
