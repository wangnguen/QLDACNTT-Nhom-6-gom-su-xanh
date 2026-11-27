import { expect, request, test, type APIRequestContext, type Page } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { ADMIN_ACCOUNT, SERVER_URL, TMP_DIR } from '../../../support/config'
import { createVerifiedUser, login, newUser } from '../../../support/helpers'

type ApiEnvelope<T> = { data: T }
type PaymentMethodOption = { method: string; enabled: boolean; sandbox: boolean }
type Order = {
  id: string
  code: string
  total: number
  paymentMethod: string
  paymentStatus: string
  status: string
}
type Transaction = {
  id: string
  code: string
  method: string
  amount: number
  status: string
  gatewayTransactionNo: string | null
  responseCode: string | null
}

const evidenceRoot = join(TMP_DIR, 'scrum113-20261127')

async function apiJson<T>(api: APIRequestContext, method: 'get' | 'post', path: string, data?: object) {
  const response = await api[method](`/api/v1${path}`, data ? { data } : undefined)
  expect(response.ok(), `${method.toUpperCase()} ${path}: ${response.status()} ${await response.text()}`).toBe(true)
  return (await response.json()) as ApiEnvelope<T>
}

async function createPaymentFixture() {
  const api = await request.newContext({ baseURL: SERVER_URL })
  const adminLogin = await apiJson<{ accessToken: string }>(api, 'post', '/auth/admin/login', {
    identifier: ADMIN_ACCOUNT.email,
    password: ADMIN_ACCOUNT.password
  })
  const adminApi = await request.newContext({
    baseURL: SERVER_URL,
    extraHTTPHeaders: { Authorization: `Bearer ${adminLogin.data.accessToken}` }
  })
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  const category = await apiJson<{ id: string }>(adminApi, 'post', '/admin/categories', {
    name: `QA SCRUM-113 ${suffix}`,
    description: 'QA data for online payment',
    imageUrl: null,
    isActive: true
  })
  const product = await apiJson<{ id: string; slug: string; price: number }>(adminApi, 'post', '/admin/products', {
    name: `QA SCRUM-113 product ${suffix}`,
    categoryId: category.data.id,
    price: 125000,
    stock: 10,
    description: 'Product used only by E2E SCRUM-113',
    material: 'Ceramic',
    dimensions: '10cm',
    imageUrls: [],
    isActive: true
  })
  await adminApi.dispose()
  await api.dispose()
  return product.data
}

async function loginApi(email: string, password: string) {
  const api = await request.newContext({ baseURL: SERVER_URL })
  const result = await apiJson<{ accessToken: string }>(api, 'post', '/auth/login', { identifier: email, password })
  return {
    api: await request.newContext({
      baseURL: SERVER_URL,
      extraHTTPHeaders: { Authorization: `Bearer ${result.data.accessToken}` }
    }),
    source: api
  }
}

async function addProductAndOpenCheckout(page: Page, slug: string) {
  await page.goto(`/products/${slug}`)
  await page.getByRole('button', { name: /Thêm vào giỏ hàng/i }).click()
  await page.goto('/checkout')
  await expect(page.getByRole('heading', { name: 'Đặt hàng' })).toBeVisible()
  await page.getByLabel('Địa chỉ giao hàng').fill('12 Bat Trang, Gia Lam, Ha Noi')
  await expect(page.getByText('Thanh toán trực tuyến qua VNPay')).toBeVisible()
  await page.getByText('Thanh toán trực tuyến qua VNPay').click()
}

async function writeEvidence(name: string, value: unknown) {
  await mkdir(evidenceRoot, { recursive: true })
  await writeFile(join(evidenceRoot, name), JSON.stringify(value, null, 2), 'utf8')
}

test.describe('SCRUM-113 — thanh toán trực tuyến', () => {
  test('S113-01: VNPAY sandbox thành công, đối chiếu đơn/giao dịch và reload', async ({ page }) => {
    const product = await createPaymentFixture()
    const user = await createVerifiedUser(newUser({ fullName: 'QA Customer S113 01' }))
    await login(page, user)
    await addProductAndOpenCheckout(page, product.slug)

    const methodsResponse = await page.request.get(`${SERVER_URL}/api/v1/payments/methods`)
    expect(methodsResponse.ok()).toBe(true)
    const methods = (await methodsResponse.json()).data as PaymentMethodOption[]
    expect(methods).toEqual(
      expect.arrayContaining([
        { method: 'vnpay', enabled: true, sandbox: true },
        { method: 'cod', enabled: true, sandbox: false }
      ])
    )
    expect(methods.some((method) => method.method === 'momo')).toBe(false)
    expect(methods.some((method) => method.method === 'banking')).toBe(false)

    const submit = page.getByRole('button', { name: 'Đặt hàng' })
    await expect(page.getByText(/155\.000/)).toBeVisible()
    await mkdir(evidenceRoot, { recursive: true })
    await page.screenshot({ path: join(evidenceRoot, 'S113-01-checkout.png'), fullPage: true })
    await Promise.all([page.waitForURL(/payments\/sandbox/), submit.click(), submit.click()])
    const gateway = new URL(page.url())
    expect(gateway.searchParams.get('vnp_CurrCode')).toBe('VND')
    expect(gateway.searchParams.get('vnp_Amount')).toBe('15500000')
    await expect(page.getByText('Cổng thanh toán giả lập')).toBeVisible()
    await expect(page.getByText(/155\.000/)).toBeVisible()
    await page.screenshot({ path: join(evidenceRoot, 'S113-01-method-and-sandbox.png'), fullPage: true })

    await page.getByRole('link', { name: /Thanh toán thành công/i }).click()
    await expect(page).toHaveURL(/\/payment\/result\?vnp_/)
    await expect(page.getByRole('heading', { name: 'Thanh toán thành công!' })).toBeVisible()
    await expect(page.getByText('Mã đơn hàng')).toBeVisible()
    await expect(page.getByText('Mã giao dịch', { exact: true })).toBeVisible()
    await page.screenshot({ path: join(evidenceRoot, 'S113-01-success.png'), fullPage: true })

    const auth = await loginApi(user.email, user.password)
    const orders = await apiJson<{ entries: Order[] }>(auth.api, 'get', '/orders?limit=20&offset=0')
    const order = orders.data.entries[0]
    const transactions = await apiJson<{ entries: Transaction[] }>(auth.api, 'get', '/payments?limit=20&offset=0')
    const transaction = transactions.data.entries[0]
    expect(orders.data.entries).toHaveLength(1)
    expect(transactions.data.entries).toHaveLength(1)
    expect(gateway.searchParams.get('vnp_TxnRef')).toBe(transaction.code)
    expect(gateway.searchParams.get('vnp_OrderInfo')).toContain(order.code)
    expect(order).toMatchObject({ total: 155000, paymentMethod: 'vnpay', paymentStatus: 'paid' })
    expect(transaction).toMatchObject({ method: 'vnpay', amount: 155000, status: 'success', responseCode: '00' })
    expect(transaction.gatewayTransactionNo).toMatch(/^\d{8}$/)
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Thanh toán thành công!' })).toBeVisible()
    await writeEvidence('S113-01-api.json', { methods, order, transaction })
    await auth.api.dispose()
    await auth.source.dispose()
  })

  test('S113-02: khách hủy tại sandbox, kết quả failed và không ghi nhận paid', async ({ page }) => {
    const product = await createPaymentFixture()
    const user = await createVerifiedUser(newUser({ fullName: 'QA Customer S113 02' }))
    await login(page, user)
    await addProductAndOpenCheckout(page, product.slug)
    await page.getByRole('button', { name: 'Đặt hàng' }).click()
    await page.waitForURL(/payments\/sandbox/)
    await page.locator('a.cancel').click()
    await expect(page.getByRole('heading', { name: 'Thanh toán chưa thành công' })).toBeVisible()
    await page.screenshot({ path: join(evidenceRoot, 'S113-02-cancelled.png'), fullPage: true })

    await page.reload()
    await expect(page.getByRole('heading', { name: 'Thanh toán chưa thành công' })).toBeVisible()
    const auth = await loginApi(user.email, user.password)
    const beforeOrders = await apiJson<{ entries: Order[] }>(auth.api, 'get', '/orders?limit=20&offset=0')
    const beforeTransactions = await apiJson<{ entries: Transaction[] }>(auth.api, 'get', '/payments?limit=20&offset=0')
    expect(beforeOrders.data.entries).toHaveLength(1)
    expect(beforeOrders.data.entries[0]).toMatchObject({ total: 155000, paymentMethod: 'vnpay', paymentStatus: 'unpaid' })
    expect(beforeTransactions.data.entries).toHaveLength(1)
    expect(beforeTransactions.data.entries[0]).toMatchObject({ method: 'vnpay', amount: 155000, status: 'failed', responseCode: '24' })
    await page.getByRole('button', { name: /Thanh toán lại/i }).click()
    await page.waitForURL(/payments\/sandbox/)
    const retryRef = new URL(page.url()).searchParams.get('vnp_TxnRef')
    const pendingTransactions = await apiJson<{ entries: Transaction[] }>(auth.api, 'get', '/payments?limit=20&offset=0')
    expect(pendingTransactions.data.entries).toHaveLength(2)
    expect(pendingTransactions.data.entries.find((item) => item.code === beforeTransactions.data.entries[0].code)?.status).toBe('failed')
    expect(pendingTransactions.data.entries.find((item) => item.code === retryRef)).toMatchObject({ status: 'pending', method: 'vnpay', amount: 155000 })
    await page.locator('a.cancel').click()
    await expect(page.getByRole('heading', { name: 'Thanh toán chưa thành công' })).toBeVisible()

    const orders = await apiJson<{ entries: Order[] }>(auth.api, 'get', '/orders?limit=20&offset=0')
    const transactions = await apiJson<{ entries: Transaction[] }>(auth.api, 'get', '/payments?limit=20&offset=0')
    expect(orders.data.entries).toHaveLength(1)
    expect(orders.data.entries[0]).toMatchObject({ paymentMethod: 'vnpay', paymentStatus: 'unpaid' })
    expect(transactions.data.entries).toHaveLength(2)
    expect(transactions.data.entries.every((item) => item.method === 'vnpay' && item.amount === 155000 && item.status === 'failed' && item.responseCode === '24')).toBe(true)
    await writeEvidence('S113-02-api.json', { beforeOrders: beforeOrders.data.entries, beforeTransactions: beforeTransactions.data.entries, pendingTransactions: pendingTransactions.data.entries, order: orders.data.entries[0], transactions: transactions.data.entries })
    await auth.api.dispose()
    await auth.source.dispose()
  })
})
