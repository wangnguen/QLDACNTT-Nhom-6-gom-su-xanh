import { expect, request, test, type APIRequestContext } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ADMIN_ACCOUNT, CLIENT_URL, SERVER_URL, TMP_DIR } from '../../support/config'
import { createVerifiedUser, fillLoginForm, type TestUser } from '../../support/helpers'

type Order = { id: string; code: string; status: string; shippingCarrier: string | null; trackingCode: string | null }
const evidence = join(TMP_DIR, 'scrum138-20261127')

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
async function createOrder(ctx: APIRequestContext, user: TestUser, productId: string) {
  await api(ctx, 'post', '/cart/items', { productId, quantity: 1 })
  return (await api<{ order: Order }>(ctx, 'post', '/orders', { recipientName: user.fullName, recipientPhone: user.phone, shippingAddress: '12 Bat Trang Gia Lam Ha Noi', paymentMethod: 'cod', note: 'Hang gom test' })).order
}

test('S138-01: danh sách cố định và tracking nhập tay của hai đơn', async ({ page, browser }) => {
  test.setTimeout(120_000)
  await mkdir(evidence, { recursive: true })
  const user = await createVerifiedUser({ fullName: 'Khach QA S138' })
  const [customer, admin] = await Promise.all([auth(user.email, user.password), auth(ADMIN_ACCOUNT.email, ADMIN_ACCOUNT.password, true)])
  const name = `S138 Ceramic ${Date.now()} ${Math.floor(Math.random() * 100000)}`
  const category = await api<{ id: string }>(admin, 'post', '/admin/categories', { name, isActive: true })
  const product = await api<{ id: string }>(admin, 'post', '/admin/products', { name, categoryId: category.id, price: 125000, stock: 20, imageUrls: [], isActive: true })
  const first = await createOrder(customer, user, product.id)
  const second = await createOrder(customer, user, product.id)
  await api(admin, 'patch', `/admin/orders/${first.id}/status`, { status: 'confirmed' })
  await api(admin, 'patch', `/admin/orders/${second.id}/status`, { status: 'confirmed' })
  const guest = await request.newContext({ baseURL: SERVER_URL })
  expect((await guest.patch(`/api/v1/admin/orders/${first.id}/shipment`, { data: { action: 'ship', shippingCarrier: 'shop' } })).status()).toBe(401)
  expect((await customer.patch(`/api/v1/admin/orders/${first.id}/shipment`, { data: { action: 'ship', shippingCarrier: 'shop' } })).status()).toBe(403)
  await guest.dispose()

  await fillLoginForm(page, ADMIN_ACCOUNT.email, ADMIN_ACCOUNT.password)
  await expect(page).toHaveURL('/')
  await page.goto(`/orders/${first.id}`)
  await page.getByRole('button', { name: 'Giao cho đơn vị vận chuyển' }).click()
  const dialog = page.getByRole('dialog', { name: 'Giao cho đơn vị vận chuyển' })
  const carrier = dialog.getByLabel('Đơn vị vận chuyển')
  await expect(carrier.locator('option')).toHaveCount(6)
  await expect(carrier.locator('option')).toHaveText(['Giao Hàng Nhanh (GHN)', 'Giao Hàng Tiết Kiệm (GHTK)', 'Viettel Post', 'VNPost', 'J&T Express', 'Cửa hàng tự giao'])
  await page.screenshot({ path: join(evidence, 'S138-carrier-options.png'), fullPage: true })
  await dialog.getByRole('button', { name: 'Bắt đầu giao' }).click()
  await expect(dialog.getByText('Vui lòng nhập mã vận đơn')).toBeVisible()
  await dialog.getByLabel('Mã vận đơn').fill('MA KHONG HOP LE')
  await dialog.getByRole('button', { name: 'Bắt đầu giao' }).click()
  await expect(dialog.getByText(/Mã vận đơn chỉ gồm/)).toBeVisible()
  expect(await api<Order>(admin, 'get', `/admin/orders/${first.id}`)).toMatchObject({ status: 'confirmed', shippingCarrier: null, trackingCode: null })
  await dialog.getByLabel('Mã vận đơn').fill('TEST-S138-A')
  await dialog.getByRole('button', { name: 'Bắt đầu giao' }).click()
  await expect(dialog).toBeHidden()
  await page.reload()
  await expect(page.getByText('TEST-S138-A', { exact: true })).toBeVisible()
  await page.goto(`/orders/${second.id}`)
  await page.getByRole('button', { name: 'Giao cho đơn vị vận chuyển' }).click()
  await dialog.getByLabel('Đơn vị vận chuyển').selectOption('ghtk')
  await dialog.getByLabel('Mã vận đơn').fill('TEST-S138-B')
  await dialog.getByRole('button', { name: 'Bắt đầu giao' }).click()
  await expect(dialog).toBeHidden()
  await page.goto('/shipping')
  await page.getByRole('tab', { name: /Đang giao/ }).click()
  await expect(page.getByRole('tab', { name: /Đang giao/ })).toHaveAttribute('aria-selected', 'true')
  await page.getByLabel('Tìm đơn').fill('TEST-S138-A')
  const row = page.getByRole('row').filter({ hasText: first.code })
  await expect(row).toContainText('TEST-S138-A')
  await expect(row).toContainText('Giao Hàng Nhanh')
  await expect(page.getByRole('row').filter({ hasText: second.code })).toHaveCount(0)
  await page.reload()
  await expect(row).toContainText('TEST-S138-A')
  await page.screenshot({ path: join(evidence, 'S138-manual-tracking.png'), fullPage: true })
  await page.getByLabel('Tìm đơn').fill('TEST-S138-NOTFOUND')
  await expect(page.getByText('Không có đơn nào khớp bộ lọc')).toBeVisible()
  const repeat = await admin.patch(`/api/v1/admin/orders/${first.id}/shipment`, { data: { action: 'ship', shippingCarrier: 'ghn', trackingCode: 'TEST-S138-A' } })
  expect(repeat.status()).toBe(400)
  const firstAfter = await api<Order>(admin, 'get', `/admin/orders/${first.id}`)
  const secondAfter = await api<Order>(admin, 'get', `/admin/orders/${second.id}`)
  expect(firstAfter).toMatchObject({ status: 'shipping', shippingCarrier: 'ghn', trackingCode: 'TEST-S138-A' })
  expect(secondAfter).toMatchObject({ status: 'shipping', shippingCarrier: 'ghtk', trackingCode: 'TEST-S138-B' })
  const clientPage = await browser.newPage()
  await clientPage.goto(`${CLIENT_URL}/login`)
  await clientPage.getByLabel('Email hoặc số điện thoại').fill(user.email)
  await clientPage.getByLabel('Mật khẩu', { exact: true }).fill(user.password)
  await clientPage.getByRole('button', { name: 'Đăng nhập' }).click()
  await expect(clientPage).toHaveURL(`${CLIENT_URL}/`)
  await clientPage.goto(`${CLIENT_URL}/account/orders/${first.id}`)
  await expect(clientPage.getByText('TEST-S138-A', { exact: true })).toBeVisible()
  await expect(clientPage.getByText('TEST-S138-B', { exact: true })).toHaveCount(0)
  await clientPage.reload()
  await expect(clientPage.getByText('TEST-S138-A', { exact: true })).toBeVisible()
  await clientPage.screenshot({ path: join(evidence, 'S138-customer-order.png'), fullPage: true })
  await writeFile(join(evidence, 'S138-api.json'), JSON.stringify({ firstAfter, secondAfter, repeatStatus: repeat.status(), note: 'Carrier names and TEST codes are manual E2E data; no carrier was contacted.' }, null, 2))
  await clientPage.close()
  await Promise.all([customer.dispose(), admin.dispose()])
})
