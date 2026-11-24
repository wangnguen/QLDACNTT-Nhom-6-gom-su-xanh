import { mkdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
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
import { createVerifiedUser, type TestUser } from './helpers'
import { DB_NAME, PORTS, SERVER_DIR, SERVER_ENV, TMP_DIR } from './config'

export const PUBLIC_CLASSES = '/api/v1/workshops'
export const ADMIN_CLASSES = '/api/v1/admin/workshops'
export const BOOKINGS = '/api/v1/workshop-registrations'
export const ADMIN_BOOKINGS = '/api/v1/admin/workshop-registrations'
export const vnDate = (days = 14) => new Date(Date.now() + (days * 24 + 7) * 3600000).toISOString().slice(0, 10)
export const vnIso = (date: string, time: string) => new Date(`${date}T${time}:00+07:00`).toISOString()

export const classBody = (overrides: Record<string, unknown> = {}) => ({
  name: uniqueName('SCRUM29 trải nghiệm'),
  instructor: 'Nghệ nhân thử nghiệm SCRUM29',
  location: 'Xưởng test riêng SCRUM29',
  description: 'Lớp trải nghiệm độc lập của SCRUM29',
  startsAt: vnIso(vnDate(), '09:00'),
  endsAt: vnIso(vnDate(), '11:30'),
  registrationDeadline: null,
  price: 250000,
  capacity: 12,
  imageUrls: [],
  isActive: true,
  ...overrides
})

export type Customer = { user: TestUser; api: APIRequestContext }
export const bookingBody = (workshopId: string, user: TestUser, overrides: Record<string, unknown> = {}) => ({
  workshopId,
  seats: 1,
  contactName: user.fullName,
  contactPhone: user.phone,
  note: 'Fixture SCRUM29',
  ...overrides
})

// Không lưu contact/token/cookie. Giữ ID/mã, lịch, trạng thái, giá, số chỗ để đối chiếu.
const privateKeys = new Set([
  'contactName',
  'contactPhone',
  'contactEmail',
  'email',
  'phone',
  'password',
  'accessToken',
  'refreshToken'
])
export function safeEvidence(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) return value.map(safeEvidence)
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !privateKeys.has(key))
        .map(([key, item]) => [key, safeEvidence(item)])
    )
  return value
}

export class BookingEvidence {
  readonly records: object[] = []
  constructor(readonly info: TestInfo) {}
  directory() {
    const dir = join(
      TMP_DIR,
      'scrum29-20261121',
      process.env.SCRUM29_RUN ?? 'local',
      this.info.title.replace(/[^a-zA-Z0-9-]/g, '_')
    )
    mkdirSync(dir, { recursive: true })
    return dir
  }
  note(label: string, data: unknown) {
    this.records.push({ label, data: safeEvidence(data) })
  }
  async response(label: string, response: Pick<APIResponse, 'status' | 'json'>, expected?: number) {
    const body = await response.json()
    this.records.push({ label, status: response.status(), body: safeEvidence(body) })
    if (expected !== undefined) expect(response.status(), JSON.stringify(safeEvidence(body))).toBe(expected)
    return body.data
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
      JSON.stringify({ test: this.info.title, status: this.info.status, records: this.records }, null, 2)
    )
    await this.info.attach('safe-api-evidence', { path, contentType: 'application/json' })
  }
}

type Workshop = ReturnType<typeof classBody> & { id: string; slug: string; bookedSeats: number; seatsLeft: number }
type Classes = {
  create: (overrides?: Record<string, unknown>) => Promise<Workshop>
  age: (id: string, startHours: number, endHours: number) => Promise<void>
  snapshot: (
    id: string
  ) => Promise<{ workshop: Workshop; registrations: { total_count: number; entries: Record<string, unknown>[] } }>
}

export const test = base.extend<{
  admin: APIRequestContext
  audit: BookingEvidence
  people: { create: () => Promise<Customer> }
  customer: Customer
  classes: Classes
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
    const audit = new BookingEvidence(info)
    try {
      await use(audit)
    } finally {
      await audit.save()
    }
  },
  people: async ({}, use) => {
    const clients: APIRequestContext[] = []
    try {
      await use({
        create: async () => {
          const user = await createVerifiedUser({ fullName: 'Khách thử nghiệm SCRUM29' })
          const api = await authenticatedApi(user, false)
          clients.push(api)
          return { user, api }
        }
      })
    } finally {
      for (const api of clients) await api.dispose()
    }
  },
  customer: async ({ people }, use) => {
    await use(await people.create())
  },
  classes: async ({ admin, audit }, use) => {
    const ids = new Set<string>()
    try {
      await use({
        create: async (overrides = {}) => {
          const response = await admin.post(ADMIN_CLASSES, { data: classBody(overrides) })
          const body = await response.json()
          if (response.status() === 201) ids.add(body.data.id)
          return (await audit.response('fixture class create', response, 201)) as Workshop
        },
        age: async (id, startHours, endHours) => {
          // API tạo lớp cấm lịch quá khứ. Chỉ dịch thời gian fixture đã tạo qua API trong DB E2E riêng.
          expect(ids.has(id)).toBe(true)
          const target = new URL(SERVER_ENV.DATABASE_URL)
          expect([target.hostname, target.port, target.pathname, SERVER_ENV.NODE_ENV, SERVER_ENV.DATABASE_SSL]).toEqual(
            ['127.0.0.1', String(PORTS.postgres), `/${DB_NAME}`, 'test', 'false']
          )
          const { Client } = createRequire(join(SERVER_DIR, 'package.json'))('pg')
          const client = new Client({ connectionString: SERVER_ENV.DATABASE_URL, ssl: false })
          await client.connect()
          try {
            const startsAt = new Date(Date.now() + startHours * 3600000).toISOString()
            const endsAt = new Date(Date.now() + endHours * 3600000).toISOString()
            const result = await client.query(
              'UPDATE workshops SET starts_at=$1, ends_at=$2, registration_deadline=NULL WHERE id=$3 RETURNING id, starts_at, ends_at',
              [startsAt, endsAt, id]
            )
            expect(result.rowCount).toBe(1)
            audit.note('test-only time fixture in gsx_e2e 127.0.0.1:54329', result.rows)
          } finally {
            await client.end()
          }
        },
        snapshot: async (id) => ({
          workshop: await audit.response('read class snapshot', await admin.get(`${ADMIN_CLASSES}/${id}`), 200),
          registrations: await audit.response(
            'read admin registrations snapshot',
            await admin.get(ADMIN_BOOKINGS, { params: { workshopId: id, limit: 100 } }),
            200
          )
        })
      })
    } finally {
      for (const id of ids) {
        const response = await admin.delete(`${ADMIN_CLASSES}/${id}`)
        expect([200, 404, 409], await response.text()).toContain(response.status())
        if (response.status() === 409)
          expect((await admin.patch(`${ADMIN_CLASSES}/${id}`, { data: { isActive: false } })).status()).toBe(200)
      }
    }
  }
})
