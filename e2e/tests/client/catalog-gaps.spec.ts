import { expect, test } from '@playwright/test'
import { authenticatedApi, catalogFixture, evidence } from '../../support/catalog'
import { CLIENT_URL } from '../../support/config'
import { createVerifiedUser, fillLoginForm, logout } from '../../support/helpers'

test('SCRUM24 admin detail/PATCH/DELETE từ chối và dữ liệu không đổi', async ({ request }) => {
  const admin = await authenticatedApi()
  const fixture = await catalogFixture(admin)
  const customer = await authenticatedApi(await createVerifiedUser(), false)
  try {
    const p = await fixture.product()
    for (const actor of [request, customer]) {
      const status = actor === request ? 401 : 403
      for (const path of [`/api/v1/admin/products/${p.id}`, `/api/v1/admin/categories/${fixture.category.id}`]) {
        const responses = [
          await actor.get(path),
          await actor.patch(path, { data: { name: 'Unauthorized', price: 1 } }),
          await actor.delete(path)
        ]
        for (const response of responses) {
          expect(response.status()).toBe(status)
          expect(await response.json()).toMatchObject({ statusCode: status, message: expect.any(String) })
        }
      }
    }
    expect((await (await admin.get(`/api/v1/admin/products/${p.id}`)).json()).data).toMatchObject({
      name: p.name,
      price: p.price
    })
    const categories = (await (await admin.get('/api/v1/admin/categories')).json()).data
    expect(categories.find((c: { id: string }) => c.id === fixture.category.id)).toMatchObject({
      name: fixture.category.name
    })
  } finally {
    await fixture.cleanup()
    await admin.dispose()
    await customer.dispose()
  }
})

test('SCRUM25 danh mục ẩn chứa hàng active không công khai', async ({ page, request }, info) => {
  const admin = await authenticatedApi()
  const fixture = await catalogFixture(admin)
  try {
    const p = await fixture.product()
    expect(
      (await admin.patch(`/api/v1/admin/categories/${fixture.category.id}`, { data: { isActive: false } })).ok()
    ).toBe(true)
    const categories = (await (await request.get('/api/v1/categories')).json()).data
    expect(categories.some((c: { id: string }) => c.id === fixture.category.id)).toBe(false)
    for (const params of [{ search: p.name }, { category: fixture.category.slug }] as Record<string, string>[]) {
      expect((await (await request.get('/api/v1/products', { params })).json()).data.entries).toHaveLength(0)
    }
    await page.goto(`/products?category=${fixture.category.slug}`)
    await expect(page.getByText('Không tìm thấy sản phẩm phù hợp')).toBeVisible()
    await expect(page.getByRole('button', { name: fixture.category.name })).toHaveCount(0)
    await evidence(page, info, 'SCRUM25-hidden-category')
  } finally {
    await fixture.cleanup()
    await admin.dispose()
  }
})

for (const width of [1280, 390])
  test(`SCRUM26 ảnh lỗi/gallery và FE01 regression ${width}`, async ({ page }, info) => {
    const admin = await authenticatedApi()
    const fixture = await catalogFixture(admin)
    try {
      await page.setViewportSize({ width, height: 844 })
      const base = CLIENT_URL.replace('localhost', 'gsx-assets.test')
      const p = await fixture.product({
        name: 'Gốm ' + 'X'.repeat(140),
        imageUrls: [`${base}/missing-fixture.png`, `${base}/logo.png`],
        description: 'Mô tả ảnh gallery'
      })
      await page.goto(`/products/${p.slug}`)
      const galleryImage = page.getByRole('img', { name: p.name, exact: true }).first()
      await expect(galleryImage).toHaveAttribute('role', 'img')
      await page.getByRole('button', { name: 'Xem ảnh 2', exact: true }).click()
      await expect(galleryImage).toHaveAttribute('src', `${base}/logo.png`)
      await expect.poll(() => galleryImage.evaluate((n) => (n as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
      await expect(page.getByText('Mô tả ảnh gallery', { exact: true })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Thêm vào giỏ hàng', exact: true })).toBeEnabled()
      await expect(page.getByText(/125\.000/).first()).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      await evidence(page, info, `SCRUM26-layout-${width}`)
    } finally {
      await fixture.cleanup()
      await admin.dispose()
    }
  })

test('SCRUM27 guest quay lại, nhiều dòng/tổng tiền, reload/login lại và xóa tất cả', async ({ page }, info) => {
  const admin = await authenticatedApi()
  const fixture = await catalogFixture(admin)
  const user = await createVerifiedUser()
  try {
    const a = await fixture.product({ price: 100000 })
    const b = await fixture.product({ price: 250000 })
    await page.goto(`/products/${a.slug}`)
    await page.getByRole('button', { name: 'Thêm vào giỏ hàng', exact: true }).click()
    await expect(page).toHaveURL('/login')
    await page.getByLabel('Email hoặc số điện thoại').fill(user.email)
    await page.getByLabel('Mật khẩu', { exact: true }).fill(user.password)
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
    await expect(page).toHaveURL(`/products/${a.slug}`)
    await page.getByRole('button', { name: 'Thêm vào giỏ hàng', exact: true }).click()
    await expect(page.getByText('Giỏ hàng đã có 1 sản phẩm này.', { exact: false })).toBeVisible()
    await page.goto(`/products/${b.slug}`)
    await page.getByRole('spinbutton', { name: 'Số lượng', exact: true }).fill('2')
    await page.getByRole('spinbutton', { name: 'Số lượng', exact: true }).press('Tab')
    await page.getByRole('button', { name: 'Thêm vào giỏ hàng', exact: true }).click()
    await expect(page.getByText('Giỏ hàng đã có 2 sản phẩm này.', { exact: false })).toBeVisible()
    await page.goto('/cart')
    const lineA = page.locator('li').filter({ has: page.getByRole('link', { name: a.name, exact: true }) })
    const lineB = page.locator('li').filter({ has: page.getByRole('link', { name: b.name, exact: true }) })
    await expect(lineA).toContainText('100.000')
    await expect(lineB).toContainText('500.000')
    const total = page.locator('dd').last()
    await expect(total).toContainText('600.000')
    await lineA.getByRole('button', { name: 'Tăng số lượng', exact: true }).click()
    await expect(total).toContainText('700.000')
    await lineB.getByRole('button', { name: 'Giảm số lượng', exact: true }).click()
    await expect(total).toContainText('450.000')
    await page.reload()
    await expect(total).toContainText('450.000')
    await logout(page)
    await fillLoginForm(page, user.email, user.password)
    await expect(page).toHaveURL('/')
    await page.goto('/cart')
    await expect(total).toContainText('450.000')
    await lineA.getByRole('button', { name: `Xoá ${a.name} khỏi giỏ hàng`, exact: true }).click()
    await expect(total).toContainText('250.000')
    await evidence(page, info, 'SCRUM27-multiline')
    await page.getByRole('button', { name: 'Xoá tất cả', exact: true }).click()
    await page.getByRole('button', { name: 'Xoá tất cả', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Giỏ hàng đang trống' })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Giỏ hàng đang trống' })).toBeVisible()
  } finally {
    await fixture.cleanup()
    await admin.dispose()
  }
})
