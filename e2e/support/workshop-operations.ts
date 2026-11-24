import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { expect, type APIRequestContext, type Locator, type Page } from '@playwright/test'
import { authenticatedApi, uniqueName } from './catalog'
import { createVerifiedUser } from './helpers'
import { TMP_DIR } from './config'
import {
  test as bookingTest,
  BookingEvidence,
  BOOKINGS,
  ADMIN_BOOKINGS,
  bookingBody,
  vnDate,
  vnIso,
  type Customer
} from './workshop-booking'

export { BOOKINGS, ADMIN_BOOKINGS, vnDate, vnIso }
export const ADMIN_UI = '/workshop-registrations'
export const statusPath = (id: string) => `${ADMIN_BOOKINGS}/${id}/status`
export const rowFor = (page: Page, code: string): Locator =>
  page.getByRole('row').filter({ has: page.getByText(code, { exact: true }) })
export const visibleCodes = (page: Page) => page.locator('tbody tr td:first-child > p:first-child')

export type Registration = {
  id: string
  code: string
  status: string
  seats: number
  unitPrice: number
  totalPrice: number
  contactName: string
  contactPhone: string
  contactEmail: string
  note: string | null
  registeredAt: string
  cancelledAt: string | null
  cancelledBy: string | null
  cancelReason: string | null
  workshop: { id: string; name: string; slug: string; startsAt: string; endsAt: string }
}
type Workshop = { id: string; name: string; slug: string; startsAt: string; endsAt: string; capacity: number }
type Pair = { group: string; wA: Workshop; wB: Workshop; a: Customer; b: Customer; rA: Registration; rB: Registration }

export function expectIdentity(actual: Registration, before: Registration) {
  for (const key of [
    'id',
    'code',
    'seats',
    'unitPrice',
    'totalPrice',
    'contactName',
    'contactPhone',
    'contactEmail',
    'note',
    'registeredAt',
    'workshop'
  ] as const) {
    expect(actual[key], `unchanged ${key}`).toEqual(before[key])
  }
}

class OperationsEvidence extends BookingEvidence {
  override directory() {
    const dir = join(
      TMP_DIR,
      'scrum30-20261121',
      process.env.SCRUM30_RUN ?? 'local',
      this.info.title.replace(/[^a-zA-Z0-9-]/g, '_')
    )
    mkdirSync(dir, { recursive: true })
    return dir
  }
}

export const test = bookingTest.extend<{
  operations: {
    pair: (prefix?: string) => Promise<Pair>
    register: (actor: Customer, workshopId: string, overrides?: Record<string, unknown>) => Promise<Registration>
    change: (id: string, status: string, cancelReason?: string | null) => Promise<Registration>
    mine: (actor: Customer, registration: Registration) => Promise<Registration>
  }
}>({
  audit: async ({}, use, info) => {
    const audit = new OperationsEvidence(info)
    try {
      await use(audit)
    } finally {
      await audit.save()
    }
  },
  people: async ({}, use) => {
    const clients: APIRequestContext[] = []
    let count = 0
    try {
      await use({
        create: async () => {
          const suffix = count === 0 ? 'An' : count === 1 ? 'Anh' : `An ${count}`
          count++
          const user = await createVerifiedUser({ fullName: `Khách SCRUM30 ${suffix}` })
          const api = await authenticatedApi(user, false)
          clients.push(api)
          return { user, api }
        }
      })
    } finally {
      for (const api of clients) await api.dispose()
    }
  },
  operations: async ({ classes, people, admin, audit }, use) => {
    const register = async (actor: Customer, workshopId: string, overrides: Record<string, unknown> = {}) =>
      (await audit.response(
        'official booking fixture',
        await actor.api.post(BOOKINGS, {
          data: bookingBody(workshopId, actor.user, { note: 'Fixture vận hành SCRUM30', ...overrides })
        }),
        201
      )) as Registration
    await use({
      register,
      pair: async (prefix) => {
        const group = uniqueName('S30')
        const wA = await classes.create({
          name: `${group} Lớp A`,
          instructor: 'Nghệ nhân SCRUM30 A',
          location: 'Xưởng test A',
          capacity: 30,
          startsAt: vnIso(vnDate(30), '09:00'),
          endsAt: vnIso(vnDate(30), '11:00')
        })
        const wB = await classes.create({
          name: `${group} Lớp A2`,
          instructor: 'Nghệ nhân SCRUM30 A2',
          location: 'Xưởng test A2',
          capacity: 30,
          price: 300000,
          startsAt: vnIso(vnDate(31), '14:00'),
          endsAt: vnIso(vnDate(31), '16:00')
        })
        const a = await people.create()
        const b = await people.create()
        const rA = await register(a, wA.id, { seats: 2, ...(prefix ? { contactName: `${prefix} An` } : {}) })
        const rB = await register(b, wB.id, { seats: 3, ...(prefix ? { contactName: `${prefix} Anh` } : {}) })
        return { group, wA, wB, a, b, rA, rB }
      },
      change: async (id, status, cancelReason = null) =>
        (await audit.response(
          `admin change ${status}`,
          await admin.patch(statusPath(id), { data: { status, cancelReason } }),
          200
        )) as Registration,
      mine: async (actor, registration) => {
        const result = await audit.response(
          'customer reads current registration',
          await actor.api.get(BOOKINGS, { params: { workshopId: registration.workshop.id } }),
          200
        )
        const entry = result.entries.find((r: Registration) => r.id === registration.id)
        expect(entry).toBeTruthy()
        return entry as Registration
      }
    })
  }
})
