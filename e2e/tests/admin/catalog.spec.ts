import { expect, test } from '@playwright/test'
import { ADMIN_ACCOUNT } from '../../support/config'
import { authenticatedApi, catalogFixture, evidence, uniqueName } from '../../support/catalog'
import { createVerifiedUser, fillLoginForm } from '../../support/helpers'

test('US07 CRUD sản phẩm qua UI và tải lại dữ liệu', async ({ page }, info) => {
  const api = await authenticatedApi()
  const fixture = await catalogFixture(api)
  const name = uniqueName('UI pottery')
  try {
    await fillLoginForm(page, ADMIN_ACCOUNT.email, ADMIN_ACCOUNT.password)
    await expect(page).toHaveURL('/')
    await page.goto('/products/new')
    await page.getByLabel('Tên sản phẩm', { exact: true }).fill(name)
    await page.getByLabel('Danh mục', { exact: true }).selectOption(fixture.category.id)
    await page.getByLabel('Giá bán (VND)', { exact: true }).fill('125000')
    await page.getByLabel('Tồn kho', { exact: true }).fill('5')
    await page.getByRole('button', { name: 'Thêm sản phẩm', exact: true }).click()
    await expect(page).toHaveURL('/products')
    await page.getByLabel('Tìm sản phẩm', { exact: true }).fill(name)
    await page.getByRole('link', { name: `Sửa ${name}`, exact: true }).click()
    await page.getByLabel('Giá bán (VND)', { exact: true }).fill('225000')
    await page.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click()
    await expect(page).toHaveURL(/\/products\??/)
    await page.getByLabel('Tìm sản phẩm', { exact: true }).fill(name)
    await page.getByRole('link', { name: `Sửa ${name}`, exact: true }).click()
    await page.reload()
    await expect(page.getByLabel('Giá bán (VND)', { exact: true })).toHaveValue('225000')
    await evidence(page, info, 'US07-product-persisted')
    await page.goto(`/products?search=${encodeURIComponent(name)}`)
    await page.getByRole('button', { name: `Xoá ${name}`, exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Xoá', exact: true }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await page.reload()
    await expect(page.getByRole('link', { name: `Sửa ${name}`, exact: true })).toHaveCount(0)
  } finally {
    const result = (await (await api.get('/api/v1/admin/products', { params: { search: name } })).json()).data
    for (const product of result.entries)
      if (product.name === name) {
        expect((await api.delete(`/api/v1/admin/products/${product.id}`)).ok()).toBe(true)
      }
    await fixture.cleanup()
    await api.dispose()
  }
})

test('US07 CRUD danh mục rỗng qua UI, dữ liệu còn sau reload', async ({ page }, info) => {
  await fillLoginForm(page, ADMIN_ACCOUNT.email, ADMIN_ACCOUNT.password)
  await expect(page).toHaveURL('/')
  await page.goto('/categories')
  const name = uniqueName('UI category')
  const renamed = `${name} updated`
  const api = await authenticatedApi()
  try {
    await page.getByRole('button', { name: 'Thêm danh mục', exact: true }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Tên danh mục', { exact: true }).fill(name)
    await dialog.getByRole('button', { name: 'Thêm danh mục', exact: true }).click()
    await expect(dialog).toHaveCount(0)
    await page.reload()
    await page.getByRole('button', { name: `Sửa danh mục ${name}`, exact: true }).click()
    await dialog.getByLabel('Tên danh mục', { exact: true }).fill(renamed)
    await dialog.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click()
    await expect(dialog).toHaveCount(0)
    await page.reload()
    await expect(page.getByText(renamed, { exact: true })).toBeVisible()
    await evidence(page, info, 'US07-category-updated')
    await page.getByRole('button', { name: `Xoá danh mục ${renamed}`, exact: true }).click()
    await dialog.getByRole('button', { name: 'Xoá', exact: true }).click()
    await expect(dialog).toHaveCount(0)
    await page.reload()
    await expect(page.getByText(renamed, { exact: true })).toHaveCount(0)
  } finally {
    const categories = (await (await api.get('/api/v1/admin/categories')).json()).data
    for (const category of categories)
      if ([name, renamed].includes(category.name)) {
        expect((await api.delete(`/api/v1/admin/categories/${category.id}`)).ok()).toBe(true)
      }
    await api.dispose()
  }
})

test('US07 API thật: validation, CRUD sản phẩm, chặn xoá danh mục có hàng và phân quyền', async ({ request }) => {
  const api = await authenticatedApi()
  const fixture = await catalogFixture(api)
  try {
    for (const name of ['', '   ', '!!!']) {
      expect((await api.post('/api/v1/admin/categories', { data: { name } })).status()).toBe(422)
    }
    expect((await api.post('/api/v1/admin/categories', { data: { name: fixture.category.name } })).status()).toBe(409)
    const product = await fixture.product()
    expect((await api.delete(`/api/v1/admin/categories/${fixture.category.id}`)).status()).toBe(409)
    for (const body of [
      {},
      { name: '' },
      { price: 0 },
      { price: -1 },
      { price: 1.5 },
      { stock: -1 },
      { stock: 1.5 },
      { categoryId: 'bad' }
    ]) {
      const data = Object.keys(body).length
        ? { name: uniqueName('Invalid'), categoryId: fixture.category.id, price: 1000, ...body }
        : body
      expect((await api.post('/api/v1/admin/products', { data })).status()).toBe(422)
    }
    const missing = 'ffffffff-ffff-4fff-8fff-ffffffffffff'
    expect((await api.patch(`/api/v1/admin/products/${product.id}`, { data: { categoryId: missing } })).status()).toBe(
      400
    )
    expect((await api.patch(`/api/v1/admin/products/${product.id}`, { data: { price: 225000, stock: 7 } })).ok()).toBe(
      true
    )
    expect((await (await api.get(`/api/v1/admin/products/${product.id}`)).json()).data).toMatchObject({
      price: 225000,
      stock: 7
    })
    const customer = await authenticatedApi(await createVerifiedUser(), false)
    try {
      for (const path of ['/api/v1/admin/categories', '/api/v1/admin/products']) {
        expect((await request.get(path)).status()).toBe(401)
        expect((await customer.get(path)).status()).toBe(403)
        expect((await customer.post(path, { data: {} })).status()).toBe(403)
      }
    } finally {
      await customer.dispose()
    }
    expect((await api.delete(`/api/v1/admin/products/${product.id}`)).ok()).toBe(true)
    expect((await api.get(`/api/v1/admin/products/${product.id}`)).status()).toBe(404)
  } finally {
    await fixture.cleanup()
    await api.dispose()
  }
})
