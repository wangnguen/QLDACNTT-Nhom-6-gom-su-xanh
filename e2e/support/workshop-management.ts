import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  expect,
  test as base,
  type APIRequestContext,
  type APIResponse,
  type Page,
  type TestInfo
} from '@playwright/test'
import { authenticatedApi, uniqueName } from './catalog'
import { TMP_DIR } from './config'

export const WORKSHOPS = '/api/v1/admin/workshops'
export const futureDate = (days = 14) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10)
export const iso = (date: string, time: string) => new Date(`${date}T${time}:00+07:00`).toISOString()
export const workshopBody = (overrides: Record<string, unknown> = {}) => ({
  name: uniqueName('SCRUM98 lớp gốm'),
  instructor: 'Nghệ nhân kiểm thử Hưng',
  location: 'Xưởng kiểm thử SCRUM98',
  description: 'Dữ liệu độc lập cho quản lý lớp',
  startsAt: iso(futureDate(), '09:00'),
  endsAt: iso(futureDate(), '11:00'),
  registrationDeadline: null,
  capacity: 12,
  price: 350000,
  imageUrls: [],
  isActive: true,
  ...overrides
})

// Chỉ ghi body nghiệp vụ Workshop, không ghi header, cookie, token hoặc response đăng nhập.
export class WorkshopEvidence {
  readonly records: object[] = []
  constructor(readonly info: TestInfo) {}
  directory() {
    const dir = join(
      TMP_DIR,
      'scrum98-20261121',
      process.env.SCRUM98_RUN ?? 'local',
      this.info.title.replace(/[^a-zA-Z0-9-]/g, '_')
    )
    mkdirSync(dir, { recursive: true })
    return dir
  }
  async response(label: string, response: Pick<APIResponse, 'json' | 'status'>, expectedStatus?: number) {
    const body = await response.json()
    this.records.push({ label, status: response.status(), body })
    if (expectedStatus !== undefined) expect(response.status(), JSON.stringify(body)).toBe(expectedStatus)
    return body.data
  }
  note(label: string, data: unknown) {
    this.records.push({ label, data })
  }
  async screenshot(page: Page, name: string) {
    const path = join(this.directory(), `${name}.png`)
    await page.screenshot({ path, fullPage: true })
    await this.info.attach(name, { path, contentType: 'image/png' })
  }
  async save() {
    const path = join(this.directory(), 'api-evidence.json')
    writeFileSync(
      path,
      JSON.stringify(
        {
          test: this.info.title,
          status: this.info.status,
          expectedStatus: this.info.expectedStatus,
          records: this.records
        },
        null,
        2
      )
    )
    await this.info.attach('api-evidence', { path, contentType: 'application/json' })
  }
}

export type Workshop = ReturnType<typeof workshopBody> & {
  id: string
  slug: string
  bookedSeats: number
  seatsLeft: number
}

export const test = base.extend<{
  admin: APIRequestContext
  audit: WorkshopEvidence
  classes: { create: (overrides?: Record<string, unknown>) => Promise<Workshop>; track: (id: string) => void }
}>({
  admin: async ({}, use) => {
    const api = await authenticatedApi()
    try {
      await use(api)
    } finally {
      await api.dispose()
    }
  },
  audit: async ({}, use, info) => {
    const audit = new WorkshopEvidence(info)
    try {
      await use(audit)
    } finally {
      await audit.save()
    }
  },
  classes: async ({ admin, audit }, use) => {
    const ids = new Set<string>()
    try {
      await use({
        track: (id) => {
          ids.add(id)
        },
        create: async (overrides = {}) => {
          const response = await admin.post(WORKSHOPS, { data: workshopBody(overrides) })
          const body = await response.json()
          if (response.status() === 201) ids.add(body.data.id)
          return (await audit.response('fixture create', response, 201)) as Workshop
        }
      })
    } finally {
      for (const id of ids) {
        const response = await admin.delete(`${WORKSHOPS}/${id}`)
        expect([200, 404, 409], await response.text()).toContain(response.status())
        // Có lịch sử đăng ký: giữ trong DB test riêng và ẩn; setup lần sau tạo lại DB này.
        if (response.status() === 409) {
          expect((await admin.patch(`${WORKSHOPS}/${id}`, { data: { isActive: false } })).status()).toBe(200)
        }
      }
    }
  }
})

export async function fillWorkshop(page: Page, name: string) {
  await page.getByLabel('Tên lớp', { exact: true }).fill(name)
  await page.getByLabel('Người hướng dẫn', { exact: true }).fill('Nghệ nhân kiểm thử Hưng')
  await page.getByLabel('Địa điểm', { exact: true }).fill('Xưởng kiểm thử SCRUM98')
  await page.getByLabel('Mô tả', { exact: true }).fill('Dữ liệu độc lập cho quản lý lớp')
  await page.getByLabel('Ngày học', { exact: true }).fill(futureDate())
  await page.getByLabel('Giờ bắt đầu', { exact: true }).fill('09:00')
  await page.getByLabel('Giờ kết thúc', { exact: true }).fill('11:00')
  await page.getByLabel('Học phí mỗi chỗ (VND)', { exact: true }).fill('350000')
  await page.getByLabel('Số chỗ', { exact: true }).fill('12')
}
