import { join, resolve } from 'path'

import pug from 'pug'

import { EmailChangedParams, NoticeEmailParams, OtpEmailParams } from '@common/types'

const TEMPLATES_DIR = resolve(__dirname, '../../assets/templates/emails')

class TemplateService {
  private renderTemplate(templateName: string, locals: Record<string, unknown>): string {
    const templatePath = join(TEMPLATES_DIR, `${templateName}.pug`)
    return pug.renderFile(templatePath, locals)
  }

  verifyEmail(params: OtpEmailParams): string {
    return this.renderTemplate('auth/verify-email', params)
  }

  resetPassword(params: OtpEmailParams): string {
    return this.renderTemplate('auth/reset-password', params)
  }

  changeEmail(params: OtpEmailParams): string {
    return this.renderTemplate('auth/change-email', params)
  }

  emailChanged(params: EmailChangedParams): string {
    return this.renderTemplate('auth/email-changed', params)
  }

  passwordChanged(params: NoticeEmailParams): string {
    return this.renderTemplate('auth/password-changed', params)
  }
}

export default TemplateService
