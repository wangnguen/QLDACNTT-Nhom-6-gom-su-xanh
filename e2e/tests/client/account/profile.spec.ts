import { expect, test } from '@playwright/test'

import { createVerifiedUser, login, newUser } from '../../../support/helpers'

test.describe('Hồ sơ cá nhân (US-06)', () => {
  test('cập nhật thông tin và vẫn giữ nguyên sau khi tải lại trang', async ({ page }) => {
    const user = await createVerifiedUser()
    const { phone } = newUser()
    await login(page, user)
    await page.goto('/account')

    const saveButton = page.getByRole('button', { name: 'Lưu thay đổi' })
    await expect(saveButton).toBeDisabled()

    await page.getByLabel('Họ và tên').fill('Trần Thị Bình')
    await page.getByLabel('Số điện thoại').fill(phone)
    await page.getByText('Nữ', { exact: true }).click()
    await page.getByLabel('Địa chỉ').fill('12 Bát Tràng, Gia Lâm, Hà Nội')
    await saveButton.click()

    await expect(page.getByText('Đã lưu thông tin cá nhân')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Trần Thị Bình' })).toBeVisible()

    await page.reload()
    await expect(page.getByLabel('Họ và tên')).toHaveValue('Trần Thị Bình')
    await expect(page.getByLabel('Số điện thoại')).toHaveValue(phone)
    await expect(page.getByLabel('Nữ')).toBeChecked()
    await expect(page.getByLabel('Địa chỉ')).toHaveValue('12 Bát Tràng, Gia Lâm, Hà Nội')
  })

  test('báo trùng khi số điện thoại đã thuộc tài khoản khác', async ({ page }) => {
    const [user, other] = await Promise.all([createVerifiedUser(), createVerifiedUser()])
    await login(page, user)
    await page.goto('/account')

    await page.getByLabel('Số điện thoại').fill(other.phone)
    await page.getByRole('button', { name: 'Lưu thay đổi' }).click()

    await expect(page.getByRole('alert')).toHaveText('Số điện thoại này đã được sử dụng bởi tài khoản khác')
  })
})
