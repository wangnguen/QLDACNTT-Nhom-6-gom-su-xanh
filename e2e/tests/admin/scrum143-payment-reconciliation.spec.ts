import { expect, request, test, type APIRequestContext, type Page } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ADMIN_ACCOUNT, SERVER_URL, TMP_DIR } from '../../support/config'
import { createVerifiedUser, fillLoginForm, type TestUser } from '../../support/helpers'

type Transaction = { id: string; code: string; type: string; status: string; amount: number; method: string; gatewayTransactionNo: string | null; completedAt: string | null; order: { id: string; code: string } }
type Listing = { entries: Transaction[]; total_count: number }
const evidence = join(TMP_DIR, 'scrum143-20261127')

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

async function createProduct(admin: APIRequestContext) {
  const name = `QA S143 ${Date.now()} ${Math.floor(Math.random() * 100000)}`
  const category = await api<{ id: string }>(admin, 'post', '/admin/categories', { name, isActive: true })
  return api<{ id: string }>(admin, 'post', '/admin/products', { name, categoryId: category.id, price: 125000, stock: 20, imageUrls: [], isActive: true })
}

async function pendingRefund(page: Page, customer: APIRequestContext, user: TestUser, productId: string) {
  await api(customer, 'post', '/cart/items', { productId, quantity: 1 })
  const created = await api<{ order: { id: string; code: string }; paymentUrl: string }>(customer, 'post', '/orders', {
    recipientName: user.fullName, recipientPhone: user.phone, shippingAddress: '12 Bat Trang Gia Lam Ha Noi', paymentMethod: 'vnpay', note: null
  })
  await page.goto(created.paymentUrl)
  await page.getByRole('link', { name: 'Thanh toán thành công' }).click()
  await expect(page.getByRole('heading', { name: 'Thanh toán thành công!' })).toBeVisible()
  await api(customer, 'patch', `/orders/${created.order.id}/cancel`, { reason: 'Du lieu kiem thu' })
  const list = await api<Listing>(customer, 'get', `/payments?orderId=${created.order.id}&limit=20&offset=0`)
  const refund = list.entries.find((t) => t.type === 'refund')
  const payment = list.entries.find((t) => t.type === 'payment')
  expect(refund).toMatchObject({ status: 'pending', amount: 155000, method: 'vnpay' })
  expect(payment).toMatchObject({ status: 'success', amount: 155000 })
  return { order: created.order, refund: refund!, payment: payment! }
}

test('S143-01: admin xác nhận hoàn tiền đơn, quyền, lặp và cạnh tranh', async ({ page, browser }) => {
  test.setTimeout(120_000)
  await mkdir(evidence, { recursive: true })
  const user = await createVerifiedUser({ fullName: 'Khach QA S143' })
  const [customer, admin1, admin2] = await Promise.all([
    auth(user.email, user.password), auth(ADMIN_ACCOUNT.email, ADMIN_ACCOUNT.password, true), auth(ADMIN_ACCOUNT.email, ADMIN_ACCOUNT.password, true)
  ])
  const product = await createProduct(admin1)
  const sandboxPage = await browser.newPage()
  const one = await pendingRefund(sandboxPage, customer, user, product.id)
  const two = await pendingRefund(sandboxPage, customer, user, product.id)
  const race = await pendingRefund(sandboxPage, customer, user, product.id)
  await sandboxPage.close()
  expect(new Set([one.payment.gatewayTransactionNo, two.payment.gatewayTransactionNo, race.payment.gatewayTransactionNo]).size).toBe(3)
  const guest = await request.newContext({ baseURL: SERVER_URL })
  expect((await guest.get('/api/v1/admin/payments')).status()).toBe(401)
  expect((await customer.get('/api/v1/admin/payments')).status()).toBe(403)
  expect((await customer.patch(`/api/v1/admin/payments/${one.refund.id}/refund`, { data: { referenceNo: 'FAKE' } })).status()).toBe(403)
  await guest.dispose()

  await page.goto('/payments')
  await expect(page).toHaveURL(/\/login/)
  await fillLoginForm(page, ADMIN_ACCOUNT.email, ADMIN_ACCOUNT.password)
  await expect(page).toHaveURL('/')
  await page.goto('/payments')
  await expect(page).toHaveURL('/payments')
  const search = page.getByLabel('Tìm giao dịch')
  await search.fill(one.payment.gatewayTransactionNo!)
  const paymentRow = page.getByRole('row').filter({ hasText: one.payment.code })
  await expect(paymentRow).toContainText(one.order.code)
  await expect(paymentRow).toContainText(one.payment.gatewayTransactionNo!)
  await expect(page.getByRole('row').filter({ hasText: two.payment.code })).toHaveCount(0)
  await paymentRow.getByRole('link', { name: one.order.code }).click()
  await expect(page).toHaveURL(new RegExp(`/orders/${one.order.id}$`))
  await page.goto('/payments')
  await page.getByLabel('Loại giao dịch').selectOption('refund')
  await page.getByLabel('Trạng thái').selectOption('pending')
  await page.getByLabel('Phương thức').selectOption('vnpay')
  await search.fill(one.refund.code)
  const row = page.getByRole('row').filter({ hasText: one.refund.code })
  await expect(row).toContainText(one.order.code)
  await expect(row).toContainText('155.000')
  await expect(row).toContainText('VNPay')
  await expect(row).toContainText('Đang xử lý')
  await page.screenshot({ path: join(evidence, 'S143-order-before.png'), fullPage: true })
  await row.getByRole('button', { name: 'Đã hoàn tiền' }).click()
  const dialog = page.getByRole('dialog', { name: 'Xác nhận đã hoàn tiền' })
  await dialog.getByLabel(/Mã giao dịch ngân hàng/).fill('TEST-S143-NO-TRANSFER')
  await dialog.locator('form').getByRole('button', { name: 'Đóng', exact: true }).click()
  const before = await api<Listing>(admin1, 'get', `/admin/payments?search=${one.refund.code}`)
  expect(before.entries[0]).toMatchObject({ id: one.refund.id, status: 'pending' })
  await row.getByRole('button', { name: 'Đã hoàn tiền' }).click()
  await dialog.getByLabel(/Mã giao dịch ngân hàng/).fill('TEST-S143-NO-TRANSFER')
  await dialog.getByLabel(/Ghi chú/).fill('E2E fixture only no real refund')
  await dialog.getByRole('button', { name: 'Đã hoàn tiền' }).click()
  await expect(dialog).toBeHidden()
  await expect(row).toContainText('Thành công')
  await page.screenshot({ path: join(evidence, 'S143-pending-filter-stale.png'), fullPage: true })
  await page.reload()
  await expect(row).toHaveCount(0)
  await page.getByLabel('Trạng thái').selectOption('')
  await expect(row).toContainText('Thành công')
  await expect(row).toContainText('TEST-S143-NO-TRANSFER')
  await expect(row.getByRole('button', { name: 'Đã hoàn tiền' })).toHaveCount(0)
  await page.screenshot({ path: join(evidence, 'S143-order-after.png'), fullPage: true })
  const after = await api<Listing>(admin1, 'get', `/admin/payments?search=${one.refund.code}`)
  const control = await api<Listing>(admin1, 'get', `/admin/payments?search=${two.refund.code}`)
  const order = await api<{ paymentStatus: string }>(customer, 'get', `/orders/${one.order.id}`)
  const orderControl = await api<{ paymentStatus: string }>(customer, 'get', `/orders/${two.order.id}`)
  expect(after.entries[0]).toMatchObject({ id: one.refund.id, status: 'success', gatewayTransactionNo: 'TEST-S143-NO-TRANSFER' })
  expect(after.entries[0].completedAt).toBeTruthy()
  expect(control.entries[0]).toMatchObject({ id: two.refund.id, status: 'pending', amount: 155000 })
  expect(order.paymentStatus).toBe('refunded')
  expect(orderControl.paymentStatus).toBe('refund_pending')
  expect((await admin1.patch(`/api/v1/admin/payments/${one.refund.id}/refund`, { data: {} })).status()).toBe(400)
  expect((await admin1.patch(`/api/v1/admin/payments/${one.payment.id}/refund`, { data: {} })).status()).toBe(400)
  const [r1, r2] = await Promise.all([
    admin1.patch(`/api/v1/admin/payments/${race.refund.id}/refund`, { data: { referenceNo: 'TEST-RACE-A' } }),
    admin2.patch(`/api/v1/admin/payments/${race.refund.id}/refund`, { data: { referenceNo: 'TEST-RACE-B' } })
  ])
  expect([r1.status(), r2.status()].filter((status) => status === 200)).toHaveLength(1)
  expect([r1.status(), r2.status()].filter((status) => status === 400 || status === 409)).toHaveLength(1)
  const raceAfter = await api<Listing>(admin1, 'get', `/admin/payments?search=${race.refund.code}`)
  expect(raceAfter.entries[0].status).toBe('success')
  await writeFile(join(evidence, 'S143-api.json'), JSON.stringify({ one, two, race, before, after, control, order, orderControl, raceStatuses: [r1.status(), r2.status()], raceAfter, note: 'All refunds are simulated database confirmations; no real refund or transfer.' }, null, 2))
  await Promise.all([customer.dispose(), admin1.dispose(), admin2.dispose()])
})

test('S143-02: giao dịch hoàn tất rời khỏi bộ lọc pending ngay sau xác nhận', async ({ page, browser }) => {
  test.setTimeout(90_000)
  await mkdir(evidence, { recursive: true })
  const user = await createVerifiedUser({ fullName: 'Khach QA S143 Filter' })
  const [customer, admin] = await Promise.all([auth(user.email, user.password), auth(ADMIN_ACCOUNT.email, ADMIN_ACCOUNT.password, true)])
  const product = await createProduct(admin)
  const sandboxPage = await browser.newPage()
  const item = await pendingRefund(sandboxPage, customer, user, product.id)
  await sandboxPage.close()
  await fillLoginForm(page, ADMIN_ACCOUNT.email, ADMIN_ACCOUNT.password)
  await expect(page).toHaveURL('/')
  await page.goto('/payments')
  await page.getByLabel('Trạng thái').selectOption('pending')
  await page.getByLabel('Tìm giao dịch').fill(item.refund.code)
  const row = page.getByRole('row').filter({ hasText: item.refund.code })
  await expect(row).toContainText('Đang xử lý')
  await row.getByRole('button', { name: 'Đã hoàn tiền' }).click()
  const dialog = page.getByRole('dialog', { name: 'Xác nhận đã hoàn tiền' })
  await dialog.getByLabel(/Mã giao dịch ngân hàng/).fill('TEST-S143-FILTER')
  await dialog.getByRole('button', { name: 'Đã hoàn tiền' }).click()
  await expect(dialog).toBeHidden()
  await expect(row).toContainText('Thành công')
  await page.screenshot({ path: join(evidence, 'S143-bug-pending-filter.png'), fullPage: true })
  await expect(row, 'Giao dịch success không được nằm trong kết quả lọc pending').toHaveCount(0)
  await Promise.all([customer.dispose(), admin.dispose()])
})
