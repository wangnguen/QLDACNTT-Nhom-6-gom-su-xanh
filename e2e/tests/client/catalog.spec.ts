import { expect, test } from '@playwright/test'
import { authenticatedApi, catalogFixture, evidence, uniqueName } from '../../support/catalog'
import { CLIENT_URL } from '../../support/config'

test('US08 danh sách, tìm kiếm, kết hợp lọc, phân trang và rỗng', async ({ page }, info) => {
  const api = await authenticatedApi()
  const fixture = await catalogFixture(api)
  try {
    const keyword = uniqueName('Catalog')
    for (let i = 0; i < 13; i++) await fixture.product({ name: `${keyword} ${i}`, price: 100000 + i * 1000 })
    const hidden = await fixture.product({ name: `${keyword} hidden`, isActive: false })
    await page.goto('/products')
    await page.getByRole('searchbox', { name: 'Tìm sản phẩm' }).fill(keyword)
    await expect(page).toHaveURL(new RegExp(`search=${encodeURIComponent(keyword).replaceAll('%20', '\\+')}`))
    await expect(page.getByRole('heading', { level: 3 })).toHaveCount(12)
    await page.getByRole('button', { name: 'Trang sau', exact: true }).click()
    await expect(page.getByRole('heading', { level: 3 })).toHaveCount(1)
    await page.getByRole('button', { name: fixture.category.name }).click()
    await expect(page).toHaveURL(new RegExp(`category=${fixture.category.slug}`))
    await page.getByLabel('Giá từ', { exact: true }).fill('100000')
    await page.getByLabel('Giá đến', { exact: true }).fill('102000')
    await page.getByRole('button', { name: 'Áp dụng', exact: true }).click()
    await expect(page).toHaveURL(/maxPrice=102000/)
    await expect(page.getByRole('heading', { level: 3 })).toHaveCount(3)
    await page.getByLabel('Chỉ hiện sản phẩm còn hàng').click()
    await expect(page.getByLabel('Chỉ hiện sản phẩm còn hàng')).toBeChecked()
    await expect(page).toHaveURL(/inStock=1/)
    await page.getByLabel('Sắp xếp', { exact: true }).selectOption('price_asc')
    await expect(page.getByRole('heading', { level: 3 })).toHaveText([`${keyword} 0`, `${keyword} 1`, `${keyword} 2`])
    await expect(page.getByRole('heading', { name: hidden.name, exact: true })).toHaveCount(0)
    await evidence(page, info, 'US08-combined-filters')
    await page.getByRole('searchbox').fill(uniqueName('NoResult'))
    await expect(page.getByText('Không tìm thấy sản phẩm phù hợp')).toBeVisible()
  } finally {
    await fixture.cleanup()
    await api.dispose()
  }
})

test('US09 mở đúng chi tiết, URL trực tiếp và slug không tồn tại/ẩn', async ({ page }, info) => {
  const api = await authenticatedApi()
  const fixture = await catalogFixture(api)
  try {
    const imageUrl = `${CLIENT_URL.replace('localhost', 'gsx-assets.test')}/logo.png`
    const product = await fixture.product({ imageUrls: [imageUrl] })
    await page.goto(`/products?search=${encodeURIComponent(product.name)}`)
    await page.getByRole('heading', { name: product.name, exact: true }).click()
    await expect(page).toHaveURL(`/products/${product.slug}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(product.name)
    const image = page.getByRole('img', { name: product.name, exact: true }).first()
    await expect(image).toHaveAttribute('src', imageUrl)
    await expect.poll(() => image.evaluate((node) => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
    await expect(page.getByText('Mô tả kiểm thử độc lập', { exact: true })).toBeVisible()
    await expect(page.getByText(/125\.000/).first()).toBeVisible()
    await page.reload()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(product.name)
    await evidence(page, info, 'US09-detail')
    const hidden = await fixture.product({ isActive: false })
    for (const slug of [hidden.slug, uniqueName('missing').replaceAll(' ', '-')]) {
      await page.goto(`/products/${slug}`)
      await expect(page.getByRole('heading', { name: 'Không tìm thấy sản phẩm', exact: true })).toBeVisible()
    }
  } finally {
    await fixture.cleanup()
    await api.dispose()
  }
})
