import { expect } from '@playwright/test'

import { MAIL_API_URL } from './config'
import type { CapturedMail } from './mail-server'

// Tiêu đề mail server gửi (bỏ phần "[Gốm Sứ Xanh] " ở đầu)
export const SUBJECTS = {
  verifyEmail: 'Mã xác thực email của bạn',
  resetPassword: 'Mã đặt lại mật khẩu',
  changeEmail: 'Mã xác nhận đổi email',
  emailChanged: 'Email đăng nhập đã được thay đổi',
  passwordChanged: 'Mật khẩu đã được thay đổi'
} as const

export const fetchMails = async (to: string): Promise<CapturedMail[]> => {
  const res = await fetch(`${MAIL_API_URL}/messages?to=${encodeURIComponent(to)}`)
  return res.json()
}

// Mail gửi ngầm (không chờ) nên phải đợi tới khi mail tới hộp thư
export const waitForMail = async (to: string, subject: string): Promise<CapturedMail> => {
  let mail: CapturedMail | undefined
  await expect
    .poll(
      async () => {
        mail = (await fetchMails(to)).findLast((item) => item.subject.includes(subject))
        return mail
      },
      { message: `Không nhận được mail "${subject}" gửi tới ${to}`, timeout: 15_000 }
    )
    .toBeDefined()
  return mail!
}

export const waitForOtp = async (to: string, subject: string): Promise<string> => {
  const mail = await waitForMail(to, subject)
  const otp = mail.html.match(/class="code-value"[^>]*>\s*(\d{6})\s*</)?.[1]
  if (!otp) throw new Error(`Không tìm thấy mã OTP trong mail "${mail.subject}"`)
  return otp
}

// Mã sai chắc chắn khác mã thật: đổi chữ số đầu tiên
export const wrongOtp = (otp: string) => `${(Number(otp[0]) + 1) % 10}${otp.slice(1)}`
