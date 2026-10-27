import 'dotenv/config'
import { z } from 'zod/v4'

import { logger } from '@common/config'
import { USER_ROLE } from '@common/constants'
import { hashPassword } from '@common/utils/password'
import { emailSchema, fullNameSchema, passwordSchema } from '@common/validators'

import { User } from '@entities/user.entity'

import AppDataSource from '@databases/data-source'

const adminEnvSchema = z.object({
  ADMIN_EMAIL: emailSchema,
  ADMIN_PASSWORD: passwordSchema,
  ADMIN_FULL_NAME: fullNameSchema.default('Quản trị viên')
})

// Tạo (hoặc cập nhật) tài khoản admin từ biến môi trường ADMIN_*.
// Chạy lại lệnh này cũng là cách đặt lại mật khẩu admin.
const seedAdmin = async () => {
  const definedEnv = Object.fromEntries(Object.entries(process.env).filter(([, value]) => value !== ''))
  const result = adminEnvSchema.safeParse(definedEnv)
  if (!result.success) {
    console.error('Invalid ADMIN_* environment variables:')
    console.error(z.prettifyError(result.error))
    process.exit(1)
  }
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_FULL_NAME } = result.data

  const dataSource = await AppDataSource.connect()
  const userRepo = dataSource.getRepository(User)

  const existing = await userRepo.findOne({ where: { email: ADMIN_EMAIL }, withDeleted: true })
  await userRepo.save(
    userRepo.create({
      id: existing?.id,
      email: ADMIN_EMAIL,
      fullName: ADMIN_FULL_NAME,
      password: await hashPassword(ADMIN_PASSWORD),
      role: USER_ROLE.ADMIN,
      isEmailVerified: true,
      deletedAt: null
    })
  )

  logger.info(`${existing ? 'Updated' : 'Created'} admin account: ${ADMIN_EMAIL}`)
  await dataSource.destroy()
}

seedAdmin().catch((err) => {
  logger.fatal(err, 'Failed to seed admin account')
  process.exit(1)
})
