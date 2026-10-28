import { afterEach, describe, expect, it, vi } from 'vitest'

// nodemailer giả: ghi nhận mail thay vì gửi thật qua SMTP
const { createTransport, sendMail } = vi.hoisted(() => {
  const sendMail = vi.fn(async (_mail: Record<string, string>) => ({ messageId: 'test' }))
  return { sendMail, createTransport: vi.fn(() => ({ sendMail })) }
})

vi.mock('nodemailer', () => ({ default: { createTransport } }))

const SMTP_ENV = {
  SMTP_HOST: 'smtp.gmail.com',
  SMTP_PORT: '587',
  SMTP_USER: 'shop.gomsuxanh@gmail.com',
  SMTP_PASS: 'app-password',
  MAIL_FROM: 'no-reply@gomsuxanh.vn',
  APP_NAME: 'Gốm Sứ Xanh'
}

// env được đọc lúc import nên phải nạp lại module sau khi đổi biến môi trường
const loadEmailService = async (overrides: Record<string, string> = {}) => {
  for (const [key, value] of Object.entries({ ...SMTP_ENV, ...overrides })) vi.stubEnv(key, value)
  vi.resetModules()

  const { default: EmailService } = await import('@common/services/email.service')
  const { logger } = await import('@common/config')
  return { EmailService, logger }
}

const lastMail = () => sendMail.mock.lastCall?.[0] ?? {}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.clearAllMocks()
})

describe('EmailService khi đã cấu hình SMTP', () => {
  it('tạo transporter từ biến môi trường SMTP', async () => {
    const { EmailService } = await loadEmailService()
    new EmailService()

    expect(createTransport).toHaveBeenCalledWith({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: { user: 'shop.gomsuxanh@gmail.com', pass: 'app-password' }
    })
  })

  it('dùng kết nối SSL khi SMTP_PORT là 465', async () => {
    const { EmailService } = await loadEmailService({ SMTP_PORT: '465' })
    new EmailService()

    expect(createTransport).toHaveBeenCalledWith(expect.objectContaining({ port: 465, secure: true }))
  })

  it('gửi OTP xác thực tới bất kỳ địa chỉ người nhận nào, không chỉ email của shop', async () => {
    const { EmailService } = await loadEmailService()
    await new EmailService().sendVerifyEmailOtp('binh.tran@yahoo.com', '482913', 'Trần Thị Bình')

    expect(sendMail).toHaveBeenCalledTimes(1)
    expect(lastMail()).toMatchObject({
      from: '"Gốm Sứ Xanh" <no-reply@gomsuxanh.vn>',
      to: 'binh.tran@yahoo.com',
      subject: '[Gốm Sứ Xanh] Mã xác thực email của bạn'
    })
    expect(lastMail().html).toContain('482913')
    expect(lastMail().html).toContain('Trần Thị Bình')
  })

  it('dùng SMTP_USER làm người gửi khi không khai báo MAIL_FROM', async () => {
    const { EmailService } = await loadEmailService({ MAIL_FROM: '' })
    await new EmailService().sendVerifyEmailOtp('binh.tran@yahoo.com', '482913')

    expect(lastMail().from).toBe('"Gốm Sứ Xanh" <shop.gomsuxanh@gmail.com>')
  })

  it('gọi người nhận là "bạn" khi không có tên', async () => {
    const { EmailService } = await loadEmailService()
    await new EmailService().sendVerifyEmailOtp('binh.tran@yahoo.com', '482913')

    expect(lastMail().html).toContain('Xin chào bạn')
  })

  it('gửi OTP đặt lại mật khẩu', async () => {
    const { EmailService } = await loadEmailService()
    await new EmailService().sendResetPasswordOtp('an.nguyen@gmail.com', '111222', 'An')

    expect(lastMail()).toMatchObject({ to: 'an.nguyen@gmail.com', subject: '[Gốm Sứ Xanh] Mã đặt lại mật khẩu' })
    expect(lastMail().html).toContain('111222')
  })

  it('gửi OTP đổi email tới địa chỉ email MỚI', async () => {
    const { EmailService } = await loadEmailService()
    await new EmailService().sendChangeEmailOtp('email.moi@gmail.com', '333444', 'An')

    expect(lastMail()).toMatchObject({ to: 'email.moi@gmail.com', subject: '[Gốm Sứ Xanh] Mã xác nhận đổi email' })
    expect(lastMail().html).toContain('333444')
  })

  it('báo đổi email về địa chỉ email CŨ, có ghi email mới', async () => {
    const { EmailService } = await loadEmailService()
    await new EmailService().sendEmailChangedNotice('email.cu@gmail.com', 'email.moi@gmail.com', 'An')

    expect(lastMail()).toMatchObject({
      to: 'email.cu@gmail.com',
      subject: '[Gốm Sứ Xanh] Email đăng nhập đã được thay đổi'
    })
    expect(lastMail().html).toContain('email.moi@gmail.com')
  })

  it('gửi thông báo đã đổi mật khẩu', async () => {
    const { EmailService } = await loadEmailService()
    await new EmailService().sendPasswordChangedNotice('an.nguyen@gmail.com', 'An')

    expect(lastMail()).toMatchObject({
      to: 'an.nguyen@gmail.com',
      subject: '[Gốm Sứ Xanh] Mật khẩu đã được thay đổi'
    })
  })

  it('ném lỗi ra ngoài khi SMTP gửi thất bại', async () => {
    const { EmailService } = await loadEmailService()
    sendMail.mockRejectedValueOnce(new Error('Invalid login: 535 Username and Password not accepted'))

    await expect(new EmailService().sendVerifyEmailOtp('binh.tran@yahoo.com', '482913')).rejects.toThrow(
      'Invalid login'
    )
  })
})

describe('EmailService khi chưa cấu hình SMTP', () => {
  it('ở môi trường dev: không gửi mail mà in mã OTP ra log', async () => {
    const { EmailService, logger } = await loadEmailService({ SMTP_USER: '', NODE_ENV: 'development' })
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {})

    await new EmailService().sendVerifyEmailOtp('binh.tran@yahoo.com', '482913')

    expect(createTransport).not.toHaveBeenCalled()
    expect(sendMail).not.toHaveBeenCalled()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('binh.tran@yahoo.com | OTP: 482913'))
  })

  it('ở môi trường production: báo lỗi ngay khi khởi tạo', async () => {
    const { EmailService } = await loadEmailService({ SMTP_USER: '', NODE_ENV: 'production' })

    expect(() => new EmailService()).toThrow('SMTP_USER/SMTP_PASS must be configured in production')
  })
})
