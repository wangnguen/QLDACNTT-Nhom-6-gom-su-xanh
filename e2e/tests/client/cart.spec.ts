import { expect, test } from '@playwright/test'
import { authenticatedApi, catalogFixture, evidence } from '../../support/catalog'
import { createVerifiedUser, login } from '../../support/helpers'
import { CLIENT_URL } from '../../support/config'

test('US10 giỏ hàng: cộng dồn, số lượng, tổng tiền, reload, tách tài khoản và xoá', async ({ page, browser }, info) => {
  const admin = await authenticatedApi()
  const fixture = await catalogFixture(admin)
  const second = await browser.newContext({ baseURL: CLIENT_URL })
  try {
    const product = await fixture.product()
    const user = await createVerifiedUser()
    const other = await createVerifiedUser()
    await login(page, user)
    await page.goto(`/products/${product.slug}`)
    const add = page.getByRole('button', { name: 'Thêm vào giỏ hàng', exact: true })
    await add.click()
    await expect(page.getByText('Giỏ hàng đã có 1 sản phẩm này.', { exact: false })).toBeVisible()
    await add.click()
    await expect(page.getByText('Giỏ hàng đã có 2 sản phẩm này.', { exact: false })).toBeVisible()
    await page.goto('/cart')
    const quantity = page.getByRole('spinbutton', { name: `Số lượng ${product.name}`, exact: true })
    await expect(quantity).toHaveValue('2')
    await expect(page.locator('dd').filter({ hasText: /250\.000/ })).toBeVisible()
    await page.getByRole('button', { name: 'Tăng số lượng', exact: true }).click()
    await expect(quantity).toHaveValue('3')
    await page.getByRole('button', { name: 'Giảm số lượng', exact: true }).click()
    await expect(quantity).toHaveValue('2')
    await page.reload()
    await expect(quantity).toHaveValue('2')
    await evidence(page, info, 'US10-cart-persisted')
    const api = await authenticatedApi(user, false)
    try {
      const response = await api.patch(`/api/v1/cart/items/${product.id}`, { data: { quantity: 6 } })
      expect(response.status()).toBe(400)
      const cart = (await (await api.get('/api/v1/cart')).json()).data
      expect(cart).toMatchObject({ totalQuantity: 2, subtotal: 250000 })
    } finally {
      await api.dispose()
    }
    const otherPage = await second.newPage()
    await otherPage.goto(page.url().replace('/cart', '/login'))
    await login(otherPage, other)
    await otherPage.goto('/cart')
    await expect(otherPage.getByRole('heading', { name: 'Giỏ hàng đang trống' })).toBeVisible()
    await page.getByRole('button', { name: `Xoá ${product.name} khỏi giỏ hàng`, exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Giỏ hàng đang trống' })).toBeVisible()
  } finally {
    await second.close()
    await fixture.cleanup()
    await admin.dispose()
  }
})

test('US10 chưa đăng nhập: chuyển đến đăng nhập và API từ chối', async ({ page, request }) => {
  const admin = await authenticatedApi()
  const fixture = await catalogFixture(admin)
  try {
    const product = await fixture.product()
    expect((await request.get('/api/v1/cart')).status()).toBe(401)
    await page.goto(`/products/${product.slug}`)
    await page.getByRole('button', { name: 'Thêm vào giỏ hàng', exact: true }).click()
    await expect(page).toHaveURL('/login')
  } finally {
    await fixture.cleanup()
    await admin.dispose()
  }
})
