import { z } from 'zod/v4'

const serverEnvSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(8080),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_NAME: z.string().min(1).default('Gốm Sứ Xanh'),
  CLIENT_URL: z.url(),
  CLIENT_ORIGINS: z
    .string()
    .transform((val) =>
      val
        .split(',')
        .map((url) => url.trim())
        .filter(Boolean)
    )
    .refine(
      (urls) => urls.length > 0 && urls.every((url) => z.url().safeParse(url).success),
      'Each CLIENT_ORIGINS must be a valid URL'
    ),
  ENABLE_DOCS: z.stringbool().default(true)
})

const databaseEnvSchema = z.object({
  DATABASE_URL: z.url(),
  DATABASE_SSL: z.stringbool().default(true)
})

const authEnvSchema = z.object({
  AUTH_TOKEN_HASH_SECRET: z.string().min(32),
  OTP_EXPIRE_MINUTES: z.coerce.number().int().positive().default(10)
})

const emailEnvSchema = z.object({
  MAIL_FROM: z.email().optional(),
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().int().default(587),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default('')
})

const envSchema = z.object({
  ...serverEnvSchema.shape,
  ...databaseEnvSchema.shape,
  ...authEnvSchema.shape,
  ...emailEnvSchema.shape
})

export type EnvSchema = z.infer<typeof envSchema>

const validateEnv = (): EnvSchema => {
  // `KEY=` trong .env cho ra chuỗi rỗng — coi như không khai báo để giá trị default được áp dụng
  const definedEnv = Object.fromEntries(Object.entries(process.env).filter(([, value]) => value !== ''))
  const result = envSchema.safeParse(definedEnv)

  if (!result.success) {
    console.error('Invalid environment variables:')
    console.error(z.prettifyError(result.error))
    process.exit(1)
  }

  return result.data
}

const env: EnvSchema = validateEnv()

export default env
