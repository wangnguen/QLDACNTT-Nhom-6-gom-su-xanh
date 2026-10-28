import { expect, test, type Page } from '@playwright/test'

import { createVerifiedUser, fillOtp, newUser, registerViaApi, type TestUser } from '../../../support/helpers'
import { SUBJECTS, waitForOtp, wrongOtp } from '../../../support/mailbox'

const fillRegisterForm = async (page: Page, user: TestUser) => {
  await page.goto('/register')
  await page.getByLabel('Họ và tên').fill(user.fullName)
  await page.getByLabel('Email', { exact: true }).fill(user.email)
  await page.getByLabel('Số điện thoại').fill(user.phone)
  await page.getByLabel('Mật khẩu', { exact: true }).fill(user.password)
  await page.getByLabel('Xác nhận mật khẩu').fill(user.password)
  await page.getByLabel(/Tôi đồng ý/).check()
  await page.getByRole('button', { name: 'Đăng ký' }).click()
}

test.describe('Đăng ký tài khoản (US-01)', () => {
  test('đăng ký, nhận OTP qua email, xác thực rồi đăng nhập', async ({ page }) => {
    const user = newUser()

    await fillRegisterForm(page, user)
    await expect(page).toHaveURL(`/verify-email?email=${encodeURIComponent(user.email)}`)

    const otp = await waitForOtp(user.email, SUBJECTS.verifyEmail)
    await fillOtp(page, otp)
    await page.getByRole('button', { name: 'Xác thực', exact: true }).click()

    await expect(page.getByText('Xác thực email thành công! Mời bạn đăng nhập')).toBeVisible()
    await expect(page).toHaveURL(/\/login\?email=/)
    await expect(page.getByLabel('Email hoặc số điện thoại')).toHaveValue(user.email)

    await page.getByLabel('Mật khẩu', { exact: true }).fill(user.password)
    await page.getByRole('button', { name: 'Đăng nhập' }).click()

    await expect(page).toHaveURL('/')
    await expect(page.getByRole('link', { name: user.fullName })).toBeVisible()
  })

  test('kiểm tra dữ liệu ngay trên form, không gửi lên server', async ({ page }) => {
    await page.goto('/register')
    await page.getByRole('button', { name: 'Đăng ký' }).click()

    await expect(page.getByText('Vui lòng nhập họ và tên')).toBeVisible()
    await expect(page.getByText('Vui lòng nhập email')).toBeVisible()
    await expect(page.getByText('Bạn cần đồng ý với điều khoản sử dụng')).toBeVisible()
    await expect(page).toHaveURL('/register')
  })

  test('báo lỗi khi email đã được đăng ký', async ({ page }) => {
    const existing = await createVerifiedUser()

    await fillRegisterForm(page, newUser({ email: existing.email }))

    await expect(page.getByRole('alert')).toHaveText('Email này đã được đăng ký')
    await expect(page).toHaveURL('/register')
  })

  test('nhập sai OTP thì không xác thực được', async ({ page }) => {
    const user = newUser()
    await registerViaApi(user)
    const otp = await waitForOtp(user.email, SUBJECTS.verifyEmail)

    await page.goto(`/verify-email?email=${encodeURIComponent(user.email)}`)
    await fillOtp(page, wrongOtp(otp))
    await page.getByRole('button', { name: 'Xác thực', exact: true }).click()

    await expect(page.getByRole('alert')).toHaveText('Mã OTP không đúng hoặc đã hết hạn')
    await expect(page).toHaveURL(/\/verify-email/)
  })
})
