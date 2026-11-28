import { expect, request, test, type APIRequestContext, type Page } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ADMIN_ACCOUNT, ADMIN_URL, SERVER_URL, TMP_DIR } from '../../../support/config'
import { createVerifiedUser, login, type TestUser } from '../../../support/helpers'

type Order = { id: string; code: string; status: string; paymentStatus: string; cancelledBy: string | null; cancelReason: string | null; shippingCarrier: string | null; trackingCode: string | null }
type Transaction = { type: string; status: string; amount: number }
type Product = { id: string; stock: number }
const evidence = join(TMP_DIR, 'scrum123-20261127')

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

async function makeOrder(ctx: APIRequestContext, user: TestUser, productId: string, quantity: number, method: 'cod' | 'vnpay') {
  await api(ctx, 'post', '/cart/items', { productId, quantity })
  return api<{ order: Order; paymentUrl: string | null }>(ctx, 'post', '/orders', {
    recipientName: user.fullName, recipientPhone: user.phone, shippingAddress: '12 Bat Trang Gia Lam Ha Noi', note: null, paymentMethod: method
  })
}

async function openOrder(page: Page, id: string, code: string) {
  await page.goto(`/account/orders/${id}`)
  await expect(page.getByRole('heading', { name: `Đơn ${code}` })).toBeVisible()
}

test('S123-01: khách hủy, giữ đơn, hoàn kho, đã trả và admin duyệt trước', async ({ page, browser }) => {
  test.setTimeout(120_000)
  await mkdir(evidence, { recursive: true })
  const [user, other] = await Promise.all([createVerifiedUser({ fullName: 'Khach A S123' }), createVerifiedUser({ fullName: 'Khach B S123' })])
  const [customer, otherApi, admin] = await Promise.all([auth(user.email, user.password), auth(other.email, other.password), auth(ADMIN_ACCOUNT.email, ADMIN_ACCOUNT.password, true)])
  const name = `S123 QA ${Date.now()} ${Math.floor(Math.random() * 100000)}`
  const category = await api<{ id: string }>(admin, 'post', '/admin/categories', { name, isActive: true })
  const product = await api<Product>(admin, 'post', '/admin/products', { name, categoryId: category.id, price: 125000, stock: 30, imageUrls: [], isActive: true })
  const unpaid = await makeOrder(customer, user, product.id, 2, 'cod')
  const paid = await makeOrder(customer, user, product.id, 3, 'vnpay')
  const stale = await makeOrder(customer, user, product.id, 1, 'cod')
  const foreign = await makeOrder(otherApi, other, product.id, 1, 'cod')
  const sandbox = await browser.newPage()
  await sandbox.goto(paid.paymentUrl!)
  await sandbox.getByRole('link', { name: 'Thanh toán thành công' }).click()
  await expect(sandbox.getByRole('heading', { name: 'Thanh toán thành công!' })).toBeVisible()
  await sandbox.close()
  const paidBefore = await api<Order>(customer, 'get', `/orders/${paid.order.id}`)
  expect(paidBefore).toMatchObject({ status: 'pending', paymentStatus: 'paid' })
  const stockBefore = await api<Product>(admin, 'get', `/admin/products/${product.id}`)
  expect(stockBefore.stock).toBe(23)
  expect((await customer.patch(`/api/v1/orders/${foreign.order.id}/cancel`, { data: {} })).status()).toBe(404)
  expect((await customer.patch('/api/v1/orders/00000000-0000-4000-8000-000000000001/cancel', { data: {} })).status()).toBe(404)

  await login(page, user)
  await openOrder(page, unpaid.order.id, unpaid.order.code)
  await page.getByRole('button', { name: 'Huỷ đơn hàng' }).click()
  await page.getByLabel(new RegExp(unpaid.order.code)).fill('Khong con nhu cau')
  await page.getByRole('button', { name: 'Giữ đơn' }).click()
  expect((await api<Order>(customer, 'get', `/orders/${unpaid.order.id}`)).status).toBe('pending')
  expect((await api<Product>(admin, 'get', `/admin/products/${product.id}`)).stock).toBe(23)
  await page.screenshot({ path: join(evidence, 'S123-before-unpaid.png'), fullPage: true })
  await page.getByRole('button', { name: 'Huỷ đơn hàng' }).click()
  await page.getByLabel(new RegExp(unpaid.order.code)).fill('Khong con nhu cau')
  await page.getByRole('button', { name: 'Huỷ đơn hàng', exact: true }).click()
  await expect(page.getByText('Bạn đã huỷ đơn hàng này')).toBeVisible()
  await page.reload()
  await expect(page.getByText('Bạn đã huỷ đơn hàng này')).toBeVisible()
  await page.screenshot({ path: join(evidence, 'S123-after-unpaid.png'), fullPage: true })
  const unpaidAfter = await api<Order>(customer, 'get', `/orders/${unpaid.order.id}`)
  const stockAfterUnpaid = await api<Product>(admin, 'get', `/admin/products/${product.id}`)
  expect(unpaidAfter).toMatchObject({ status: 'cancelled', paymentStatus: 'unpaid', cancelledBy: 'user', cancelReason: 'Khong con nhu cau', shippingCarrier: null, trackingCode: null })
  expect(stockAfterUnpaid.stock).toBe(25)
  expect((await customer.patch(`/api/v1/orders/${unpaid.order.id}/cancel`, { data: {} })).status()).toBe(400)
  expect((await api<Product>(admin, 'get', `/admin/products/${product.id}`)).stock).toBe(25)

  await openOrder(page, paid.order.id, paid.order.code)
  await page.getByRole('button', { name: 'Huỷ đơn hàng' }).click()
  await expect(page.getByText(/Đơn đã thanh toán trực tuyến/)).toBeVisible()
  await page.getByRole('button', { name: 'Huỷ đơn hàng', exact: true }).click()
  await expect(page.getByText('Bạn đã huỷ đơn hàng này')).toBeVisible()
  await expect(page.getByText('Chờ hoàn tiền', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByText('Chờ hoàn tiền', { exact: true })).toBeVisible()
  await page.screenshot({ path: join(evidence, 'S123-paid-refund-pending.png'), fullPage: true })
  const paidAfter = await api<Order>(customer, 'get', `/orders/${paid.order.id}`)
  const payments = await api<{ entries: Transaction[] }>(customer, 'get', `/payments?orderId=${paid.order.id}&limit=20`)
  expect(paidAfter).toMatchObject({ status: 'cancelled', paymentStatus: 'refund_pending', cancelledBy: 'user', shippingCarrier: null, trackingCode: null })
  expect(payments.entries.filter((t) => t.type === 'payment' && t.status === 'success')).toHaveLength(1)
  expect(payments.entries.filter((t) => t.type === 'refund' && t.status === 'pending')).toHaveLength(1)
  const stockAfterPaid = await api<Product>(admin, 'get', `/admin/products/${product.id}`)
  expect(stockAfterPaid.stock).toBe(28)
  expect((await customer.patch(`/api/v1/orders/${paid.order.id}/cancel`, { data: {} })).status()).toBe(400)
  expect((await api<Product>(admin, 'get', `/admin/products/${product.id}`)).stock).toBe(28)

  const adminPage = await browser.newPage()
  await adminPage.goto(`${ADMIN_URL}/login`)
  await adminPage.getByLabel('Email hoặc số điện thoại').fill(ADMIN_ACCOUNT.email)
  await adminPage.getByLabel('Mật khẩu', { exact: true }).fill(ADMIN_ACCOUNT.password)
  await adminPage.getByRole('button', { name: 'Đăng nhập' }).click()
  await expect(adminPage).toHaveURL(`${ADMIN_URL}/`)
  await adminPage.goto(`${ADMIN_URL}/orders/${paid.order.id}`)
  await expect(adminPage.getByText(paid.order.code).first()).toBeVisible()
  await expect(adminPage.getByText('Chờ hoàn tiền').first()).toBeVisible()
  await adminPage.reload()
  await expect(adminPage.getByText('Chờ hoàn tiền').first()).toBeVisible()
  await adminPage.screenshot({ path: join(evidence, 'S123-admin-refund-pending.png'), fullPage: true })
  const adminPaid = await api<Order>(admin, 'get', `/admin/orders/${paid.order.id}`)
  expect(adminPaid).toMatchObject({ status: 'cancelled', paymentStatus: 'refund_pending' })

  await openOrder(page, stale.order.id, stale.order.code)
  await page.getByRole('button', { name: 'Huỷ đơn hàng' }).click()
  await api(admin, 'patch', `/admin/orders/${stale.order.id}/status`, { status: 'confirmed' })
  const staleResponse = page.waitForResponse((r) => r.request().method() === 'PATCH' && r.url().includes(`/orders/${stale.order.id}/cancel`))
  await page.getByRole('button', { name: 'Huỷ đơn hàng', exact: true }).click()
  expect((await staleResponse).status()).toBe(400)
  await expect(page.getByText(/Đơn đã được cửa hàng xác nhận và đang chuẩn bị/)).toBeVisible()
  await page.reload()
  await expect(page.getByText(/Đơn đã được cửa hàng xác nhận và đang chuẩn bị/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Huỷ đơn hàng' })).toHaveCount(0)
  await page.screenshot({ path: join(evidence, 'S123-stale-rejected.png'), fullPage: true })
  const staleAfter = await api<Order>(customer, 'get', `/orders/${stale.order.id}`)
  expect(staleAfter.status).toBe('confirmed')
  expect((await api<Product>(admin, 'get', `/admin/products/${product.id}`)).stock).toBe(28)
  await writeFile(join(evidence, 'S123-api.json'), JSON.stringify({ stockBefore: stockBefore.stock, stockAfterUnpaid: stockAfterUnpaid.stock, stockAfterPaid: stockAfterPaid.stock, unpaidAfter, paidBefore, paidAfter, payments, adminPaid, staleAfter, note: 'Synthetic orders; VNPay is local simulator; refund is pending only.' }, null, 2))
  await adminPage.close()
  await Promise.all([customer.dispose(), otherApi.dispose(), admin.dispose()])
})
