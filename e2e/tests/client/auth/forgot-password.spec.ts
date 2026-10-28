import { expect, test } from '@playwright/test'

import { createVerifiedUser, fillLoginForm, fillOtp, login, newUser } from '../../../support/helpers'
import { SUBJECTS, waitForOtp } from '../../../support/mailbox'

test.describe('Quên mật khẩu (US-03)', () => {
  test('nhận OTP qua email, đặt mật khẩu mới rồi đăng nhập bằng mật khẩu mới', async ({ page }) => {
    const user = await createVerifiedUser()
    const newPassword = 'GomSu@2027'

    await page.goto('/forgot-password')
    await page.getByLabel('Email', { exact: true }).fill(user.email)
    await page.getByRole('button', { name: 'Gửi mã OTP' }).click()
    await expect(page).toHaveURL(`/reset-password?email=${encodeURIComponent(user.email)}`)

    const otp = await waitForOtp(user.email, SUBJECTS.resetPassword)
    await fillOtp(page, otp)
    await page.getByLabel('Mật khẩu mới', { exact: true }).fill(newPassword)
    await page.getByLabel('Xác nhận mật khẩu mới').fill(newPassword)
    await page.getByRole('button', { name: 'Đặt lại mật khẩu' }).click()

    await expect(page.getByRole('heading', { name: 'Đặt lại mật khẩu thành công' })).toBeVisible()

    await fillLoginForm(page, user.email, user.password)
    await expect(page.getByRole('alert')).toHaveText('Email/số điện thoại hoặc mật khẩu không đúng')

    await login(page, { email: user.email, password: newPassword })
  })

  test('email chưa đăng ký vẫn báo đã gửi để không lộ thông tin tài khoản', async ({ page }) => {
    const email = newUser().email

    await page.goto('/forgot-password')
    await page.getByLabel('Email', { exact: true }).fill(email)
    await page.getByRole('button', { name: 'Gửi mã OTP' }).click()

    await expect(page.getByText('Nếu email đã đăng ký, mã OTP đã được gửi tới hộp thư của bạn')).toBeVisible()
    await expect(page).toHaveURL(`/reset-password?email=${encodeURIComponent(email)}`)
  })
})
