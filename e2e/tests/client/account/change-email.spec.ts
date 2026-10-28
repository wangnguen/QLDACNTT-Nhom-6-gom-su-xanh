import { expect, test } from '@playwright/test'

import { createVerifiedUser, fillOtp, login, logout, newUser } from '../../../support/helpers'
import { SUBJECTS, waitForMail, waitForOtp } from '../../../support/mailbox'

test.describe('Đổi email (US-04)', () => {
  test('nhận OTP ở email mới, đổi email và báo về email cũ', async ({ page }) => {
    const user = await createVerifiedUser()
    const newEmail = newUser().email
    await login(page, user)
    await page.goto('/account/email')

    await page.getByLabel('Email mới').fill(newEmail)
    await page.getByLabel('Mật khẩu hiện tại').fill(user.password)
    await page.getByRole('button', { name: 'Gửi mã xác nhận' }).click()

    await expect(page.getByText('Mã xác nhận 6 số đã được gửi tới')).toContainText(newEmail)

    const otp = await waitForOtp(newEmail, SUBJECTS.changeEmail)
    await fillOtp(page, otp)
    await page.getByRole('button', { name: 'Xác nhận đổi email' }).click()

    await expect(page.getByText('Đổi email thành công. Từ giờ hãy đăng nhập bằng email mới')).toBeVisible()
    await expect(page).toHaveURL('/account')
    await expect(page.getByRole('main').getByText(newEmail).first()).toBeVisible()

    const notice = await waitForMail(user.email, SUBJECTS.emailChanged)
    expect(notice.html).toContain(newEmail)

    await logout(page)
    await login(page, { email: newEmail, password: user.password })
  })

  test('báo lỗi khi nhập sai mật khẩu', async ({ page }) => {
    const user = await createVerifiedUser()
    await login(page, user)
    await page.goto('/account/email')

    await page.getByLabel('Email mới').fill(newUser().email)
    await page.getByLabel('Mật khẩu hiện tại').fill('SaiMatKhau@1')
    await page.getByRole('button', { name: 'Gửi mã xác nhận' }).click()

    await expect(page.getByRole('alert')).toHaveText('Mật khẩu không đúng')
  })

  test('báo trùng khi email mới đã thuộc tài khoản khác', async ({ page }) => {
    const [user, other] = await Promise.all([createVerifiedUser(), createVerifiedUser()])
    await login(page, user)
    await page.goto('/account/email')

    await page.getByLabel('Email mới').fill(other.email)
    await page.getByLabel('Mật khẩu hiện tại').fill(user.password)
    await page.getByRole('button', { name: 'Gửi mã xác nhận' }).click()

    await expect(page.getByRole('alert')).toHaveText('Email này đã được sử dụng bởi tài khoản khác')
  })
})
