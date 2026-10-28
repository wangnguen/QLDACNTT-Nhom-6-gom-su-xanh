import { expect, test } from '@playwright/test'

import { createVerifiedUser, fillLoginForm, login, logout, newUser, registerViaApi } from '../../../support/helpers'

test.describe('Đăng nhập / đăng xuất (US-02)', () => {
  test('đăng nhập bằng số điện thoại và vẫn giữ phiên sau khi tải lại trang', async ({ page }) => {
    const user = await createVerifiedUser()

    await fillLoginForm(page, user.phone, user.password)

    await expect(page).toHaveURL('/')
    await expect(page.getByRole('link', { name: user.fullName })).toBeVisible()

    await page.reload()
    await expect(page.getByRole('link', { name: user.fullName })).toBeVisible()
  })

  test('báo lỗi khi sai mật khẩu', async ({ page }) => {
    const user = await createVerifiedUser()

    await fillLoginForm(page, user.email, 'SaiMatKhau@1')

    await expect(page.getByRole('alert')).toHaveText('Email/số điện thoại hoặc mật khẩu không đúng')
    await expect(page).toHaveURL('/login')
  })

  test('tài khoản chưa xác thực email được nhắc đi xác thực', async ({ page }) => {
    const user = newUser()
    await registerViaApi(user)

    await fillLoginForm(page, user.email, user.password)

    await expect(page.getByRole('alert')).toContainText('Tài khoản chưa xác thực email')
    await page.getByRole('link', { name: 'Xác thực email ngay' }).click()
    await expect(page).toHaveURL(`/verify-email?email=${encodeURIComponent(user.email)}`)
  })

  test('trang tài khoản yêu cầu đăng nhập, đăng nhập xong quay lại đúng trang', async ({ page }) => {
    const user = await createVerifiedUser()

    await page.goto('/account')
    await expect(page).toHaveURL('/login')

    await page.getByLabel('Email hoặc số điện thoại').fill(user.email)
    await page.getByLabel('Mật khẩu', { exact: true }).fill(user.password)
    await page.getByRole('button', { name: 'Đăng nhập' }).click()

    await expect(page).toHaveURL('/account')
    await expect(page.getByRole('heading', { name: 'Tài khoản của tôi' })).toBeVisible()
  })

  test('đăng xuất thì mất phiên, tải lại trang vẫn chưa đăng nhập', async ({ page }) => {
    const user = await createVerifiedUser()
    await login(page, user)

    await logout(page)

    const header = page.getByRole('banner')
    await expect(header.getByRole('link', { name: 'Đăng nhập' })).toBeVisible()

    await page.reload()
    await expect(header.getByRole('link', { name: 'Đăng nhập' })).toBeVisible()
    await expect(header.getByRole('link', { name: user.fullName })).toBeHidden()
  })
})
