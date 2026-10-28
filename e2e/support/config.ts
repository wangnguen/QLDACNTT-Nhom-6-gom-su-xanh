import { resolve } from 'node:path'

// Port riêng cho E2E: không đụng tới server/client dev đang chạy (8080, 3000, 3001)
export const PORTS = {
  postgres: 54329,
  smtp: 2526,
  mailApi: 2580,
  server: 8089,
  client: 3009,
  admin: 3010
} as const

export const ROOT_DIR = resolve(import.meta.dirname, '../..')
export const SERVER_DIR = resolve(ROOT_DIR, 'apps/server')
export const TMP_DIR = resolve(import.meta.dirname, '../.tmp')

export const SERVER_URL = `http://127.0.0.1:${PORTS.server}`
export const CLIENT_URL = `http://localhost:${PORTS.client}`
export const ADMIN_URL = `http://localhost:${PORTS.admin}`
export const MAIL_API_URL = `http://127.0.0.1:${PORTS.mailApi}`

export const DB_NAME = 'gsx_e2e'

export const ADMIN_ACCOUNT = {
  email: 'admin.e2e@gomsuxanh.test',
  password: 'Admin@2026',
  fullName: 'Quản trị E2E'
}

// Toàn bộ biến môi trường của server khi chạy E2E. Khai báo đủ để không phụ thuộc file .env của từng máy
// (dotenv không ghi đè biến đã có) — quan trọng nhất là DATABASE_URL và SMTP luôn trỏ vào môi trường giả.
export const SERVER_ENV: Record<string, string> = {
  NODE_ENV: 'test',
  PORT: String(PORTS.server),
  APP_NAME: 'Gốm Sứ Xanh',
  CLIENT_URL,
  CLIENT_ORIGINS: `${CLIENT_URL},${ADMIN_URL}`,
  ENABLE_DOCS: 'false',
  DATABASE_URL: `postgres://postgres:postgres@127.0.0.1:${PORTS.postgres}/${DB_NAME}`,
  DATABASE_SSL: 'false',
  JWT_SECRET: 'e2e-jwt-secret-at-least-32-characters-long',
  JWT_REFRESH_SECRET: 'e2e-jwt-refresh-secret-at-least-32-chars',
  REFRESH_TOKEN_HASH_SECRET: 'e2e-refresh-token-hash-secret-32-chars',
  AUTH_TOKEN_HASH_SECRET: 'e2e-auth-token-hash-secret-at-least-32',
  SMTP_HOST: '127.0.0.1',
  SMTP_PORT: String(PORTS.smtp),
  SMTP_USER: 'e2e',
  SMTP_PASS: 'e2e',
  MAIL_FROM: 'no-reply@gomsuxanh.test',
  ADMIN_EMAIL: ADMIN_ACCOUNT.email,
  ADMIN_PASSWORD: ADMIN_ACCOUNT.password,
  ADMIN_FULL_NAME: ADMIN_ACCOUNT.fullName
}
