import { expect, request, type Page } from '@playwright/test'

import { SERVER_URL } from './config'
import { SUBJECTS, waitForOtp } from './mailbox'

export type TestUser = {
  fullName: string
  email: string
  phone: string
  password: string
}

let counter = 0

// Email và số điện thoại không trùng giữa các test (kể cả khi chạy song song nhiều worker)
export const newUser = (overrides: Partial<TestUser> = {}): TestUser => {
  const id = `${Date.now().toString(36)}${process.pid}${counter++}`
  return {
    fullName: 'Khách Hàng E2E',
    email: `e2e.${id}@gomsuxanh.test`,
    phone: `0${String(Math.floor(Math.random() * 1e9)).padStart(9, '0')}`,
    password: 'GomSu@2026',
    ...overrides
  }
}

const postToApi = async (path: string, data: object) => {
  const api = await request.newContext({ baseURL: SERVER_URL })
  try {
    const res = await api.post(`/api/v1${path}`, { data })
    expect(res.ok(), `POST ${path} → ${res.status()}: ${await res.text()}`).toBe(true)
  } finally {
    await api.dispose()
  }
}

// Tạo dữ liệu qua API cho nhanh — chỉ các test về chính luồng đó mới thao tác trên giao diện
export const registerViaApi = async (user: TestUser) => {
  await postToApi('/auth/register', { ...user, confirmPassword: user.password })
}

export const createVerifiedUser = async (overrides: Partial<TestUser> = {}) => {
  const user = newUser(overrides)
  await registerViaApi(user)
  const otp = await waitForOtp(user.email, SUBJECTS.verifyEmail)
  await postToApi('/auth/verify-email', { email: user.email, otp })
  return user
}

export const fillLoginForm = async (page: Page, identifier: string, password: string) => {
  await page.goto('/login')
  await page.getByLabel('Email hoặc số điện thoại').fill(identifier)
  await page.getByLabel('Mật khẩu', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Đăng nhập' }).click()
}

export const login = async (page: Page, user: Pick<TestUser, 'email' | 'password'>) => {
  await fillLoginForm(page, user.email, user.password)
  await expect(page).toHaveURL('/')
}

// Phải chờ đăng xuất xong mới chuyển trang, nếu không request logout bị huỷ giữa chừng và phiên vẫn còn
export const logout = async (page: Page) => {
  await page.getByRole('banner').getByRole('button', { name: 'Đăng xuất' }).click()
  await expect(page.getByText('Đã đăng xuất')).toBeVisible()
}

export const fillOtp = async (page: Page, otp: string) => {
  for (const [index, digit] of [...otp].entries()) {
    await page.getByLabel(`Chữ số thứ ${index + 1}`, { exact: true }).fill(digit)
  }
}
