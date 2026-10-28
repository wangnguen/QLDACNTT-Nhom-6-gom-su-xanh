import { defineConfig, devices } from '@playwright/test'

import { ADMIN_URL, CLIENT_URL, PORTS, ROOT_DIR, SERVER_URL } from './support/config'

const isCI = !!process.env.CI

// Client và admin chạy Vite dev server trên port riêng, proxy /api sang API server của E2E.
// API server, Postgres và SMTP giả do global-setup khởi động.
const viteServer = (filter: string, port: number, url: string) => ({
  command: `pnpm --filter ${filter} exec vite --port ${port}`,
  cwd: ROOT_DIR,
  url,
  env: { API_PROXY_TARGET: SERVER_URL },
  reuseExistingServer: !isCI,
  timeout: 120_000
})

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  globalSetup: './support/global-setup.ts',
  use: {
    locale: 'vi-VN',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  // Tách bằng testDir, không dùng glob testMatch: glob khớp cả đường dẫn tuyệt đối (vd C:\Users\Admin\...)
  projects: [
    {
      name: 'client',
      testDir: './tests/client',
      use: { ...devices['Desktop Chrome'], baseURL: CLIENT_URL }
    },
    {
      name: 'admin',
      testDir: './tests/admin',
      use: { ...devices['Desktop Chrome'], baseURL: ADMIN_URL }
    }
  ],
  webServer: [viteServer('@gsx/client', PORTS.client, CLIENT_URL), viteServer('@gsx/admin', PORTS.admin, ADMIN_URL)]
})
