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
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  REFRESH_TOKEN_HASH_SECRET: z.string().min(32),
  AUTH_TOKEN_HASH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.coerce
    .number()
    .int()
    .positive()
    .default(15 * 60),
  JWT_REFRESH_EXPIRES_IN: z.coerce
    .number()
    .int()
    .positive()
    .default(7 * 24 * 60 * 60),
  MAX_SESSION_LIFETIME_IN: z.coerce
    .number()
    .int()
    .positive()
    .default(30 * 24 * 60 * 60),
  OTP_EXPIRE_MINUTES: z.coerce.number().int().positive().default(10)
})

const emailEnvSchema = z.object({
  MAIL_FROM: z.email().optional(),
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().int().default(587),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default('')
})

// Cổng thanh toán VNPay — để trống TMN_CODE/HASH_SECRET thì (ngoài production) dùng cổng thanh toán giả lập
const paymentEnvSchema = z.object({
  VNPAY_TMN_CODE: z.string().default(''),
  VNPAY_HASH_SECRET: z.string().default(''),
  VNPAY_URL: z.url().default('https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'),
  // Trang client nhận kết quả thanh toán; mặc định CLIENT_URL/payment/result
  VNPAY_RETURN_URL: z.url().optional()
})

const envSchema = z.object({
  ...serverEnvSchema.shape,
  ...databaseEnvSchema.shape,
  ...authEnvSchema.shape,
  ...emailEnvSchema.shape,
  ...paymentEnvSchema.shape
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
