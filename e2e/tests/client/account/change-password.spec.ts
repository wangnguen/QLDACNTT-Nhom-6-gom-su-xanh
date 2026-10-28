import { expect, test } from '@playwright/test'

import { createVerifiedUser, fillLoginForm, login, logout } from '../../../support/helpers'
import { SUBJECTS, waitForMail } from '../../../support/mailbox'

test.describe('Đổi mật khẩu (US-05)', () => {
  test('đổi mật khẩu, nhận mail thông báo và đăng nhập lại bằng mật khẩu mới', async ({ page }) => {
    const user = await createVerifiedUser()
    const newPassword = 'GomSu@2027'
    await login(page, user)
    await page.goto('/account/password')

    await page.getByLabel('Mật khẩu hiện tại').fill(user.password)
    await page.getByLabel('Mật khẩu mới', { exact: true }).fill(newPassword)
    await page.getByLabel('Xác nhận mật khẩu mới').fill(newPassword)
    await page.getByRole('button', { name: 'Đổi mật khẩu' }).click()

    await expect(page.getByText('Đổi mật khẩu thành công. Các thiết bị khác đã được đăng xuất')).toBeVisible()
    await waitForMail(user.email, SUBJECTS.passwordChanged)

    // Thiết bị đang dùng vẫn giữ phiên sau khi đổi mật khẩu
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Tài khoản của tôi' })).toBeVisible()

    await logout(page)
    await fillLoginForm(page, user.email, user.password)
    await expect(page.getByRole('alert')).toHaveText('Email/số điện thoại hoặc mật khẩu không đúng')

    await login(page, { email: user.email, password: newPassword })
  })

  test('báo lỗi khi nhập sai mật khẩu hiện tại', async ({ page }) => {
    const user = await createVerifiedUser()
    await login(page, user)
    await page.goto('/account/password')

    await page.getByLabel('Mật khẩu hiện tại').fill('SaiMatKhau@1')
    await page.getByLabel('Mật khẩu mới', { exact: true }).fill('GomSu@2027')
    await page.getByLabel('Xác nhận mật khẩu mới').fill('GomSu@2027')
    await page.getByRole('button', { name: 'Đổi mật khẩu' }).click()

    await expect(page.getByRole('alert')).toHaveText('Mật khẩu hiện tại không đúng')
    // Sai mật khẩu không làm mất phiên đăng nhập
    await expect(page).toHaveURL('/account/password')
  })
})
