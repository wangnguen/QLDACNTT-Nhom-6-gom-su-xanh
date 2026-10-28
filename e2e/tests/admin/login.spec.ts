import { expect, test } from '@playwright/test'

import { ADMIN_ACCOUNT } from '../../support/config'
import { createVerifiedUser, fillLoginForm } from '../../support/helpers'

test.describe('Đăng nhập trang quản trị', () => {
  test('tài khoản admin đăng nhập được', async ({ page }) => {
    await fillLoginForm(page, ADMIN_ACCOUNT.email, ADMIN_ACCOUNT.password)

    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { name: `Xin chào, ${ADMIN_ACCOUNT.fullName}!` })).toBeVisible()
  })

  test('tài khoản khách hàng không vào được trang quản trị', async ({ page }) => {
    const user = await createVerifiedUser()

    await fillLoginForm(page, user.email, user.password)

    await expect(page.getByRole('alert')).toHaveText('Tài khoản không có quyền truy cập trang quản trị')
    await expect(page).toHaveURL('/login')
  })
})
