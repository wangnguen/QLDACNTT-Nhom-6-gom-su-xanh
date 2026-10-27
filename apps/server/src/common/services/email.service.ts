import nodemailer from 'nodemailer'

import { env, logger } from '@common/config'
import { OTP_EXPIRE_MINUTES } from '@common/constants'

import TemplateService from './template.service'

const formatDateTime = (date: Date) =>
  date.toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

type EmailSender = {
  send(to: string, subject: string, html: string): Promise<void>
}

class NodemailerSender implements EmailSender {
  private transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    }
  })

  async send(to: string, subject: string, html: string): Promise<void> {
    await this.transporter.sendMail({
      from: `"${env.APP_NAME}" <${env.MAIL_FROM ?? env.SMTP_USER}>`,
      to,
      subject,
      html
    })
  }
}

class EmailService {
  // null = chưa cấu hình SMTP ở môi trường dev: không gửi mail, in mã OTP ra console để vẫn test được luồng
  private sender: EmailSender | null
  private templateService: TemplateService

  constructor() {
    if (!env.SMTP_USER && env.NODE_ENV === 'production') {
      throw new Error('SMTP_USER/SMTP_PASS must be configured in production')
    }
    this.sender = env.SMTP_USER ? new NodemailerSender() : null
    this.templateService = new TemplateService()
  }

  async sendVerifyEmailOtp(email: string, code: string, name?: string): Promise<void> {
    const html = this.templateService.verifyEmail({
      name: name || 'bạn',
      code,
      actionUrl: `${env.CLIENT_URL}/verify-email?email=${encodeURIComponent(email)}`,
      expireMinutes: OTP_EXPIRE_MINUTES,
      appName: env.APP_NAME,
      supportEmail: env.MAIL_FROM ?? env.SMTP_USER
    })

    return this.sendEmail(email, `[${env.APP_NAME}] Mã xác thực email của bạn`, html, code)
  }

  async sendResetPasswordOtp(email: string, code: string, name?: string): Promise<void> {
    const html = this.templateService.resetPassword({
      name: name || 'bạn',
      code,
      actionUrl: `${env.CLIENT_URL}/reset-password?email=${encodeURIComponent(email)}`,
      expireMinutes: OTP_EXPIRE_MINUTES,
      appName: env.APP_NAME,
      supportEmail: env.MAIL_FROM ?? env.SMTP_USER
    })

    return this.sendEmail(email, `[${env.APP_NAME}] Mã đặt lại mật khẩu`, html, code)
  }

  // Gửi tới email MỚI để chứng minh người dùng sở hữu địa chỉ đó
  async sendChangeEmailOtp(newEmail: string, code: string, name?: string): Promise<void> {
    const html = this.templateService.changeEmail({
      name: name || 'bạn',
      code,
      actionUrl: `${env.CLIENT_URL}/account/email`,
      expireMinutes: OTP_EXPIRE_MINUTES,
      appName: env.APP_NAME,
      supportEmail: env.MAIL_FROM ?? env.SMTP_USER
    })

    return this.sendEmail(newEmail, `[${env.APP_NAME}] Mã xác nhận đổi email`, html, code)
  }

  // Báo về email CŨ: nếu không phải chủ tài khoản đổi thì chủ thật vẫn biết để xử lý
  async sendEmailChangedNotice(oldEmail: string, newEmail: string, name?: string): Promise<void> {
    const html = this.templateService.emailChanged({
      name: name || 'bạn',
      newEmail,
      changedAt: formatDateTime(new Date()),
      actionUrl: `${env.CLIENT_URL}/login`,
      appName: env.APP_NAME,
      supportEmail: env.MAIL_FROM ?? env.SMTP_USER
    })

    return this.sendEmail(oldEmail, `[${env.APP_NAME}] Email đăng nhập đã được thay đổi`, html)
  }

  async sendPasswordChangedNotice(email: string, name?: string): Promise<void> {
    const html = this.templateService.passwordChanged({
      name: name || 'bạn',
      changedAt: formatDateTime(new Date()),
      actionUrl: `${env.CLIENT_URL}/forgot-password`,
      appName: env.APP_NAME,
      supportEmail: env.MAIL_FROM ?? env.SMTP_USER
    })

    return this.sendEmail(email, `[${env.APP_NAME}] Mật khẩu đã được thay đổi`, html)
  }

  private async sendEmail(to: string, subject: string, html: string, code?: string): Promise<void> {
    if (!this.sender) {
      logger.warn(`[DEV EMAIL] ${subject} → ${to}${code ? ` | OTP: ${code}` : ''}`)
      return
    }
    return this.sender.send(to, subject, html)
  }
}

export default EmailService
