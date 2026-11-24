import { randomUUID } from 'node:crypto'
import { expect, request, type APIRequestContext, type Page, type TestInfo } from '@playwright/test'
import { ADMIN_ACCOUNT, SERVER_URL } from './config'

export const uniqueName = (prefix: string) => `${prefix} ${randomUUID().replaceAll('-', '')}`

export async function authenticatedApi(account = ADMIN_ACCOUNT, admin = true) {
  const api = await request.newContext({ baseURL: SERVER_URL })
  const response = await api.post(`/api/v1/auth/${admin ? 'admin/' : ''}login`, {
    data: { identifier: account.email, password: account.password }
  })
  expect(response.ok(), await response.text()).toBe(true)
  const { data } = await response.json()
  await api.dispose()
  return request.newContext({
    baseURL: SERVER_URL,
    extraHTTPHeaders: { Authorization: `Bearer ${data.accessToken}` }
  })
}

export async function catalogFixture(api: APIRequestContext) {
  const response = await api.post('/api/v1/admin/categories', { data: { name: uniqueName('E2E category') } })
  expect(response.status(), await response.text()).toBe(201)
  const category = (await response.json()).data as { id: string; name: string; slug: string }
  const products: { id: string; name: string; slug: string; price: number }[] = []
  return {
    category,
    async product(overrides: Record<string, unknown> = {}) {
      const response = await api.post('/api/v1/admin/products', {
        data: {
          name: uniqueName('E2E pottery'),
          categoryId: category.id,
          price: 125000,
          stock: 5,
          description: 'Mô tả kiểm thử độc lập',
          imageUrls: [],
          ...overrides
        }
      })
      expect(response.status(), await response.text()).toBe(201)
      const product = (await response.json()).data
      products.push(product)
      return product as (typeof products)[number]
    },
    async cleanup() {
      for (const product of products) {
        const response = await api.delete(`/api/v1/admin/products/${product.id}`)
        expect([200, 204, 404]).toContain(response.status())
      }
      const response = await api.delete(`/api/v1/admin/categories/${category.id}`)
      expect([200, 204, 404]).toContain(response.status())
    }
  }
}

export async function evidence(page: Page, info: TestInfo, name: string) {
  const path = info.outputPath(`${name}.png`)
  await page.screenshot({ path, fullPage: true })
  await info.attach(name, { path, contentType: 'image/png' })
}
