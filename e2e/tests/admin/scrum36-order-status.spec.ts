import { expect, request, test, type APIRequestContext, type Page } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ADMIN_ACCOUNT, CLIENT_URL, SERVER_URL, TMP_DIR } from '../../support/config'
import { createVerifiedUser, fillLoginForm, type TestUser } from '../../support/helpers'

type Order = { id: string; code: string; status: string; paymentStatus: string; shippingCarrier: string | null; trackingCode: string | null; confirmedAt: string | null; shippedAt: string | null; deliveredAt: string | null }
type Product = { id: string; stock: number }
const evidence = join(TMP_DIR, 'scrum36-20261127')

async function api<T>(ctx: APIRequestContext, method: 'get' | 'post' | 'patch', path: string, data?: object): Promise<T> {
  const response = await ctx[method](`/api/v1${path}`, data ? { data } : undefined)
  expect(response.ok(), `${method} ${path}: ${response.status()} ${await response.text()}`).toBe(true)
  return (await response.json()).data as T
}

async function auth(identifier: string, password: string, admin = false) {
  const tmp = await request.newContext({ baseURL: SERVER_URL })
  const result = await api<{ accessToken: string }>(tmp, 'post', admin ? '/auth/admin/login' : '/auth/login', { identifier, password })
  await tmp.dispose()
  return request.newContext({ baseURL: SERVER_URL, extraHTTPHeaders: { Authorization: `Bearer ${result.accessToken}` } })
}

async function order(ctx: APIRequestContext, user: TestUser, productId: string) {
  await api(ctx, 'post', '/cart/items', { productId, quantity: 1 })
  return (await api<{ order: Order }>(ctx, 'post', '/orders', { recipientName: user.fullName, recipientPhone: user.phone, shippingAddress: '12 Bat Trang Gia Lam Ha Noi', paymentMethod: 'cod', note: null })).order
}

async function showCustomer(page: Page, id: string, expected: string) {
  await page.goto(`${CLIENT_URL}/account/orders/${id}`)
  await expect(page.getByText(expected, { exact: true }).first()).toBeVisible()
  await page.reload()
  await expect(page.getByText(expected, { exact: true }).first()).toBeVisible()
}

test('S36-01: duyệt COD, giao nội bộ, hoàn tất và bảo vệ trạng thái', async ({ page, browser }) => {
  test.setTimeout(120_000)
  await mkdir(evidence, { recursive: true })
  const user = await createVerifiedUser({ fullName: 'Khach QA S36' })
  const [customer, admin1, admin2] = await Promise.all([auth(user.email, user.password), auth(ADMIN_ACCOUNT.email, ADMIN_ACCOUNT.password, true), auth(ADMIN_ACCOUNT.email, ADMIN_ACCOUNT.password, true)])
  const name = `S36 QA ${Date.now()} ${Math.floor(Math.random() * 100000)}`
  const category = await api<{ id: string }>(admin1, 'post', '/admin/categories', { name, isActive: true })
  const product = await api<Product>(admin1, 'post', '/admin/products', { name, categoryId: category.id, price: 125000, stock: 20, imageUrls: [], isActive: true })
  const target = await order(customer, user, product.id)
  const control = await order(customer, user, product.id)
  const cancelled = await order(customer, user, product.id)
  await api(customer, 'patch', `/orders/${cancelled.id}/cancel`, { reason: 'Fixture S36' })
  const stockBefore = await api<Product>(admin1, 'get', `/admin/products/${product.id}`)
  expect(stockBefore.stock).toBe(18)
  expect((await customer.patch(`/api/v1/admin/orders/${target.id}/status`, { data: { status: 'confirmed' } })).status()).toBe(403)
  const guest = await request.newContext({ baseURL: SERVER_URL })
  expect((await guest.get('/api/v1/admin/orders')).status()).toBe(401)
  await guest.dispose()
  const skipped = await admin1.patch(`/api/v1/admin/orders/${target.id}/shipment`, { data: { action: 'deliver' } })
  expect(skipped.status()).toBe(400)
  expect((await api<Order>(admin1, 'get', `/admin/orders/${target.id}`)).status).toBe('pending')
  expect((await admin1.patch(`/api/v1/admin/orders/${cancelled.id}/status`, { data: { status: 'confirmed' } })).status()).toBe(400)
  expect((await api<Order>(admin1, 'get', `/admin/orders/${cancelled.id}`)).status).toBe('cancelled')

  await fillLoginForm(page, ADMIN_ACCOUNT.email, ADMIN_ACCOUNT.password)
  await expect(page).toHaveURL('/')
  await page.goto('/orders')
  await page.getByRole('tab', { name: /Chờ xác nhận/ }).click()
  await expect(page.getByRole('tab', { name: /Chờ xác nhận/ })).toHaveAttribute('aria-selected', 'true')
  await page.getByLabel('Tìm đơn hàng').fill(target.code)
  await page.getByRole('link', { name: `Xem đơn ${target.code}` }).click()
  await expect(page.getByRole('heading', { name: `Đơn ${target.code}` })).toBeVisible()
  await page.screenshot({ path: join(evidence, 'S36-01-pending.png'), fullPage: true })
  const customerPage = await browser.newPage()
  await customerPage.goto(`${CLIENT_URL}/login`)
  await customerPage.getByLabel('Email hoặc số điện thoại').fill(user.email)
  await customerPage.getByLabel('Mật khẩu', { exact: true }).fill(user.password)
  await customerPage.getByRole('button', { name: 'Đăng nhập' }).click()
  await expect(customerPage).toHaveURL(`${CLIENT_URL}/`)
  await page.getByRole('button', { name: 'Xác nhận đơn' }).click()
  await expect(page.getByText('Chờ giao', { exact: true }).first()).toBeVisible()
  await page.reload()
  await expect(page.getByText('Chờ giao', { exact: true }).first()).toBeVisible()
  const confirmed = await api<Order>(admin1, 'get', `/admin/orders/${target.id}`)
  expect(confirmed).toMatchObject({ status: 'confirmed', paymentStatus: 'unpaid', shippingCarrier: null })
  expect(confirmed.confirmedAt).toBeTruthy()
  await showCustomer(customerPage, target.id, 'Đang chuẩn bị')
  await page.screenshot({ path: join(evidence, 'S36-02-confirmed.png'), fullPage: true })
  const repeated = await admin2.patch(`/api/v1/admin/orders/${target.id}/status`, { data: { status: 'confirmed' } })
  expect(repeated.status()).toBe(400)
  expect((await api<Order>(admin1, 'get', `/admin/orders/${target.id}`)).status).toBe('confirmed')

  await page.getByRole('button', { name: 'Giao cho đơn vị vận chuyển' }).click()
  const ship = page.getByRole('dialog', { name: 'Giao cho đơn vị vận chuyển' })
  await ship.getByLabel('Đơn vị vận chuyển').selectOption('shop')
  await ship.getByRole('button', { name: 'Bắt đầu giao' }).click()
  await expect(ship).toBeHidden()
  await page.reload()
  await expect(page.getByText('Đang giao', { exact: true }).first()).toBeVisible()
  const shipping = await api<Order>(admin1, 'get', `/admin/orders/${target.id}`)
  expect(shipping).toMatchObject({ status: 'shipping', paymentStatus: 'unpaid', shippingCarrier: 'shop', trackingCode: null })
  expect(shipping.shippedAt).toBeTruthy()
  await showCustomer(customerPage, target.id, 'Đang giao')
  await page.screenshot({ path: join(evidence, 'S36-03-shipping.png'), fullPage: true })
  expect((await admin1.patch(`/api/v1/admin/orders/${target.id}/status`, { data: { status: 'confirmed' } })).status()).toBe(400)
  expect((await api<Order>(admin1, 'get', `/admin/orders/${target.id}`)).status).toBe('shipping')

  await page.getByRole('button', { name: 'Đã giao thành công' }).click()
  await page.getByRole('dialog', { name: 'Xác nhận đã giao hàng?' }).getByRole('button', { name: 'Đã giao' }).click()
  await expect(page.getByText('Đã giao', { exact: true }).first()).toBeVisible()
  await page.reload()
  await expect(page.getByText('Đã giao', { exact: true }).first()).toBeVisible()
  const delivered = await api<Order>(admin1, 'get', `/admin/orders/${target.id}`)
  expect(delivered).toMatchObject({ status: 'delivered', paymentStatus: 'paid', shippingCarrier: 'shop' })
  expect(delivered.deliveredAt).toBeTruthy()
  await showCustomer(customerPage, target.id, 'Đã giao')
  await expect(customerPage.getByText('Đã thanh toán', { exact: true })).toBeVisible()
  await page.screenshot({ path: join(evidence, 'S36-04-delivered.png'), fullPage: true })
  expect((await admin1.patch(`/api/v1/admin/orders/${target.id}/status`, { data: { status: 'cancelled' } })).status()).toBe(400)
  expect((await admin1.patch(`/api/v1/admin/orders/${target.id}/shipment`, { data: { action: 'deliver' } })).status()).toBe(400)
  expect((await api<Order>(admin1, 'get', `/admin/orders/${target.id}`)).status).toBe('delivered')
  const transactions = await api<{ entries: { type: string; method: string; status: string }[] }>(customer, 'get', `/payments?orderId=${target.id}&limit=20`)
  expect(transactions.entries.filter((t) => t.type === 'payment' && t.method === 'cod' && t.status === 'success')).toHaveLength(1)
  const unchanged = await api<Order>(admin1, 'get', `/admin/orders/${control.id}`)
  expect(unchanged).toMatchObject({ status: 'pending', paymentStatus: 'unpaid', shippingCarrier: null })
  expect((await api<Product>(admin1, 'get', `/admin/products/${product.id}`)).stock).toBe(18)
  await writeFile(join(evidence, 'S36-api.json'), JSON.stringify({ target: target.code, control: control.code, cancelled: cancelled.code, confirmed, shipping, delivered, unchanged, stockBefore: stockBefore.stock, transactions, note: 'All orders and delivery actions are internal E2E fixtures; no actual shipment or cash collection.' }, null, 2))
  await customerPage.close()
  await Promise.all([customer.dispose(), admin1.dispose(), admin2.dispose()])
})
