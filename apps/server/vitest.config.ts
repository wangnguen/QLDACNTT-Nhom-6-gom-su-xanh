import { resolve } from 'path'

import { defineConfig } from 'vitest/config'

const fromRoot = (path: string) => resolve(__dirname, path)

export default defineConfig({
  resolve: {
    alias: {
      '@common': fromRoot('src/common'),
      '@modules': fromRoot('src/modules'),
      '@entities': fromRoot('src/databases/entities'),
      '@databases': fromRoot('src/databases'),
      '@docs': fromRoot('src/docs')
    }
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Biến môi trường giả cho test: không đọc .env thật nên không bao giờ gửi mail thật hay kết nối DB
    env: {
      NODE_ENV: 'test',
      CLIENT_URL: 'http://localhost:5173',
      CLIENT_ORIGINS: 'http://localhost:5173',
      DATABASE_URL: 'postgres://test:test@localhost:5432/test',
      JWT_SECRET: 'test-jwt-secret-at-least-32-characters',
      JWT_REFRESH_SECRET: 'test-jwt-refresh-secret-at-least-32-chars',
      REFRESH_TOKEN_HASH_SECRET: 'test-refresh-token-hash-secret-32-chars',
      AUTH_TOKEN_HASH_SECRET: 'test-auth-token-hash-secret-at-least-32',
      SMTP_USER: '',
      SMTP_PASS: '',
      MAIL_FROM: ''
    }
  }
})
