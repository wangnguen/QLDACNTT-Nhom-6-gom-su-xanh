import { expect, request, test, type APIRequestContext, type Page } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ADMIN_ACCOUNT, SERVER_URL, TMP_DIR } from '../../../support/config'
import { createVerifiedUser, fillLoginForm, login, logout, type TestUser } from '../../../support/helpers'

type Item = { productId: string; productName: string; unitPrice: number; quantity: number; lineTotal: number }
type Order = { id: string; code: string; subtotal: number; shippingFee: number; total: number; status: string; paymentStatus: string; paymentMethod: string; recipientName: string; recipientPhone: string; shippingAddress: string; note: string | null; items: Item[] }
const evidence = join(TMP_DIR, 'scrum34-20261127')
const oldAddress = '12 Bat Trang Gia Lam Ha Noi'

async function api<T>(ctx: APIRequestContext, method: 'get' | 'post' | 'patch', path: string, data?: object): Promise<T> {
  const res = await ctx[method](`/api/v1${path}`, data ? { data } : undefined)
  expect(res.ok(), `${method} ${path}: ${res.status()} ${await res.text()}`).toBe(true)
  return (await res.json()).data as T
}

async function auth(identifier: string, password: string, admin = false) {
  const tmp = await request.newContext({ baseURL: SERVER_URL })
  const result = await api<{ accessToken: string }>(tmp, 'post', admin ? '/auth/admin/login' : '/auth/login', { identifier, password })
  await tmp.dispose()
  return request.newContext({ baseURL: SERVER_URL, extraHTTPHeaders: { Authorization: `Bearer ${result.accessToken}` } })
}

async function createOrder(ctx: APIRequestContext, user: TestUser, lines: { id: string; quantity: number }[], method: 'cod' | 'vnpay') {
  for (const line of lines) await api(ctx, 'post', '/cart/items', { productId: line.id, quantity: line.quantity })
  const result = await api<{ order: Order }>(ctx, 'post', '/orders', {
    recipientName: user.fullName, recipientPhone: user.phone, shippingAddress: oldAddress, note: 'Giao gio hanh chinh', paymentMethod: method
  })
  return result.order
}

async function openFromList(page: Page, order: Order) {
  await page.goto('/account/orders')
  await page.getByRole('link').filter({ hasText: order.code }).click()
  await expect(page).toHaveURL(`/account/orders/${order.id}`)
  await expect(page.getByRole('heading', { name: `Đơn ${order.code}` })).toBeVisible()
}

test('S34-01: chi tiết đơn nhiều dòng, snapshot và giới hạn quyền A/B', async ({ page }) => {
  test.setTimeout(120_000)
  await mkdir(evidence, { recursive: true })
  const [a, b] = await Promise.all([createVerifiedUser({ fullName: 'Khach A S34' }), createVerifiedUser({ fullName: 'Khach B S34' })])
  const [apiA, apiB, admin] = await Promise.all([auth(a.email, a.password), auth(b.email, b.password), auth(ADMIN_ACCOUNT.email, ADMIN_ACCOUNT.password, true)])
  const suffix = `${Date.now()} ${Math.floor(Math.random() * 100000)}`
  const category = await api<{ id: string }>(admin, 'post', '/admin/categories', { name: `S34 Category ${suffix}`, isActive: true })
  const p1 = await api<{ id: string; name: string }>(admin, 'post', '/admin/products', { name: `S34 Cup ${suffix}`, categoryId: category.id, price: 120500, stock: 20, imageUrls: [], isActive: true })
  const p2 = await api<{ id: string; name: string }>(admin, 'post', '/admin/products', { name: `S34 Bowl ${suffix}`, categoryId: category.id, price: 70500, stock: 20, imageUrls: [], isActive: true })
  const a1 = await createOrder(apiA, a, [{ id: p1.id, quantity: 2 }, { id: p2.id, quantity: 3 }], 'vnpay')
  const a2 = await createOrder(apiA, a, [{ id: p1.id, quantity: 1 }], 'cod')
  const b1 = await createOrder(apiB, b, [{ id: p2.id, quantity: 1 }], 'cod')
  const calculated = { lines: [{ name: p1.name, unitPrice: 120500, quantity: 2, total: 241000 }, { name: p2.name, unitPrice: 70500, quantity: 3, total: 211500 }], subtotal: 452500, shipping: 30000, total: 482500, currency: 'VND' }
  expect(a1).toMatchObject({ subtotal: calculated.subtotal, shippingFee: calculated.shipping, total: calculated.total, status: 'pending', paymentStatus: 'unpaid', paymentMethod: 'vnpay', shippingAddress: oldAddress })
  expect(a1.items).toHaveLength(2)
  expect(a1.items).toEqual(expect.arrayContaining([
    expect.objectContaining({ productId: p1.id, unitPrice: 120500, quantity: 2, lineTotal: 241000 }),
    expect.objectContaining({ productId: p2.id, unitPrice: 70500, quantity: 3, lineTotal: 211500 })
  ]))
  await api(admin, 'patch', `/admin/products/${p1.id}`, { price: 999999 })
  await api(apiA, 'patch', '/users/me', { address: '99 Dia chi moi Ha Noi' })
  const after = await api<Order>(apiA, 'get', `/orders/${a1.id}`)
  expect(after).toMatchObject({ subtotal: 452500, shippingFee: 30000, total: 482500, shippingAddress: oldAddress })
  expect(after.items.find((item) => item.productId === p1.id)).toMatchObject({ unitPrice: 120500, quantity: 2, lineTotal: 241000 })

  const guest = await request.newContext({ baseURL: SERVER_URL })
  expect((await guest.get(`/api/v1/orders/${a1.id}`)).status()).toBe(401)
  expect((await apiB.get(`/api/v1/orders/${a1.id}`)).status()).toBe(404)
  expect((await apiA.get(`/api/v1/orders/${b1.id}`)).status()).toBe(404)
  await guest.dispose()
  await page.goto(`/account/orders/${a1.id}`)
  await expect(page).toHaveURL(/\/login/)
  await fillLoginForm(page, a.email, a.password)
  await expect(page).toHaveURL(`/account/orders/${a1.id}`)
  await openFromList(page, a1)
  const products = page.getByRole('region', { name: 'Sản phẩm' })
  for (const line of calculated.lines) {
    const row = products.locator('li').filter({ hasText: line.name })
    await expect(row).toContainText(new Intl.NumberFormat('vi-VN').format(line.unitPrice))
    await expect(row).toContainText(`× ${line.quantity}`)
    await expect(row).toContainText(new Intl.NumberFormat('vi-VN').format(line.total))
  }
  await expect(products).toContainText('452.500')
  await expect(products).toContainText('30.000')
  await expect(products).toContainText('482.500')
  await expect(page.getByText(oldAddress)).toBeVisible()
  await expect(page.getByText(a.fullName, { exact: true }).last()).toBeVisible()
  await expect(page.getByText(a.phone, { exact: true })).toBeVisible()
  await expect(page.getByText('Giao gio hanh chinh')).toBeVisible()
  await expect(page.getByText('Chờ xác nhận', { exact: true })).toBeVisible()
  await expect(page.getByText('Chưa thanh toán', { exact: true })).toBeVisible()
  await expect(page.getByText('Thanh toán trực tuyến qua VNPay', { exact: true })).toBeVisible()
  await page.screenshot({ path: join(evidence, 'S34-A-multi-line.png'), fullPage: true })
  await page.reload()
  await expect(page.getByRole('heading', { name: `Đơn ${a1.code}` })).toBeVisible()
  await expect(page.getByText(oldAddress)).toBeVisible()
  await page.getByRole('button', { name: 'Huỷ đơn hàng' }).click()
  await expect(page.getByLabel(new RegExp(a1.code))).toBeVisible()
  await page.getByRole('button', { name: 'Giữ đơn' }).click()
  const paymentRequest = page.waitForRequest((r) => r.method() === 'POST' && r.url().includes(`/orders/${a1.id}/payment`))
  await page.getByRole('button', { name: /Thanh toán 482/ }).click()
  await paymentRequest
  await page.waitForURL(/payments\/sandbox/)
  await page.goto(`/account/orders/${a1.id}`)
  await expect(page.getByRole('heading', { name: `Đơn ${a1.code}` })).toBeVisible()
  await openFromList(page, a2)
  await expect(page.getByText('Thanh toán khi nhận hàng (COD)', { exact: true })).toBeVisible()
  await expect(page.getByText('150.500').first()).toBeVisible()
  await expect(page.getByRole('region', { name: 'Sản phẩm' })).toContainText(p1.name)
  await expect(page.getByRole('region', { name: 'Sản phẩm' })).toContainText('120.500')
  await expect(page.getByRole('region', { name: 'Sản phẩm' })).toContainText('× 1')
  await expect(page.getByText(oldAddress)).toBeVisible()
  await expect(page.getByText('Chưa thanh toán', { exact: true })).toBeVisible()
  await page.goto('/account/orders/00000000-0000-4000-8000-000000000001')
  await expect(page.getByText('Không tìm thấy đơn hàng')).toBeVisible()
  await logout(page)
  await login(page, b)
  await openFromList(page, b1)
  await expect(page.getByText(b.fullName, { exact: true }).last()).toBeVisible()
  await expect(page.getByRole('region', { name: 'Sản phẩm' })).toContainText(p2.name)
  await expect(page.getByRole('region', { name: 'Sản phẩm' })).toContainText('70.500')
  await expect(page.getByRole('region', { name: 'Sản phẩm' })).toContainText('× 1')
  await expect(page.getByRole('region', { name: 'Sản phẩm' })).toContainText('100.500')
  await expect(page.getByText(oldAddress)).toBeVisible()
  await expect(page.getByText('Chưa thanh toán', { exact: true })).toBeVisible()
  await page.goto(`/account/orders/${a1.id}`)
  await expect(page.getByText('Không tìm thấy đơn hàng')).toBeVisible()
  await expect(page.getByText(a1.code, { exact: true })).toHaveCount(0)
  await writeFile(join(evidence, 'S34-calculation.json'), JSON.stringify({ calculated, a1: after, a2, b1, note: 'Fixture orders created via API; no real payment.' }, null, 2))
  await Promise.all([apiA.dispose(), apiB.dispose(), admin.dispose()])
})
