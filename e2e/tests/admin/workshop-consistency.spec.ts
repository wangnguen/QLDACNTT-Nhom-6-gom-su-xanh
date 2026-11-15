import { expect, test, type APIRequestContext, type APIResponse, type TestInfo } from '@playwright/test'
import EmbeddedPostgres from 'embedded-postgres'
import { authenticatedApi, uniqueName } from '../../support/catalog'
import { DB_NAME, PORTS, TMP_DIR } from '../../support/config'
import { createVerifiedUser } from '../../support/helpers'

type Registration = { id: string; user_id: string; seats: number; status: string; created_at: string }
type Summary = { capacity: number; status: string; booked: number; remaining: number }
const classBody = () => ({
  name: uniqueName('Consistency'),
  content: 'Workshop consistency test',
  artisan: 'Nghệ nhân E2E',
  startsAt: new Date(Date.now() + 30 * 86400000).toISOString(),
  endsAt: new Date(Date.now() + 30 * 86400000 + 7200000).toISOString(),
  capacity: 4,
  status: 'open'
})

async function fixture() {
  const contexts: APIRequestContext[] = []
  const ids: string[] = []
  const pg = new EmbeddedPostgres({
    databaseDir: TMP_DIR,
    port: PORTS.postgres,
    user: 'postgres',
    password: 'postgres'
  })
  const db = pg.getPgClient(DB_NAME, '127.0.0.1')
  await db.connect()
  const admin = await authenticatedApi()
  contexts.push(admin)
  return {
    db,
    pg,
    admin,
    async customer() {
      const api = await authenticatedApi(await createVerifiedUser(), false)
      contexts.push(api)
      return api
    },
    async workshop(capacity = 4) {
      const body = { ...classBody(), capacity }
      const response = await admin.post('/api/v1/admin/workshops', { data: body })
      expect(response.status(), await response.text()).toBe(201)
      const { id } = (await response.json()).data as { id: string }
      ids.push(id)
      return { id, body }
    },
    async register(api: APIRequestContext, id: string, seats: number) {
      const response = await api.post(`/api/v1/workshops/${id}/registrations`, { data: { seats } })
      expect(response.status(), await response.text()).toBe(200)
      return (await response.json()).data as Registration
    },
    async cancel(id: string) {
      const response = await admin.patch(`/api/v1/admin/workshop-registrations/${id}`, {
        data: { status: 'cancelled' }
      })
      expect(response.status(), await response.text()).toBe(200)
    },
    async state(id: string) {
      const registrations = (
        await db.query<Registration>(
          'SELECT id,user_id,seats,status,created_at FROM workshop_registrations WHERE workshop_id=$1 ORDER BY id',
          [id]
        )
      ).rows as Registration[]
      const summary = (
        await db.query<Summary>(
          `SELECT w.capacity,w.status,
        COALESCE(SUM(r.seats) FILTER(WHERE r.status='confirmed'),0)::int AS booked,
        w.capacity-COALESCE(SUM(r.seats) FILTER(WHERE r.status='confirmed'),0)::int AS remaining
        FROM workshops w LEFT JOIN workshop_registrations r ON r.workshop_id=w.id WHERE w.id=$1 GROUP BY w.id`,
          [id]
        )
      ).rows[0] as Summary
      expect(summary.booked).toBeGreaterThanOrEqual(0)
      expect(summary.booked).toBeLessThanOrEqual(summary.capacity)
      expect(summary.remaining).toBe(summary.capacity - summary.booked)
      expect(new Set(registrations.map((r) => r.user_id)).size).toBe(registrations.length)
      const response = await admin.get('/api/v1/admin/workshops')
      expect(response.ok(), await response.text()).toBe(true)
      const apiRows = (await response.json()).data as (Summary & { id: string })[]
      expect(apiRows.find((w) => w.id === id)).toMatchObject(summary)
      const list = await admin.get('/api/v1/admin/workshop-registrations', { params: { workshopId: id } })
      expect(list.ok(), await list.text()).toBe(true)
      const apiRegistrations = (await list.json()).data as Registration[]
      expect(apiRegistrations.map((r) => r.id).sort()).toEqual(registrations.map((r) => r.id).sort())
      return { summary, registrations }
    },
    async cleanup() {
      try {
        // Fixed E2E DB only; delete only IDs created by this fixture, children before parent.
        await db.query('BEGIN')
        await db.query('DELETE FROM workshop_registrations WHERE workshop_id=ANY($1::uuid[])', [ids])
        await db.query('DELETE FROM workshops WHERE id=ANY($1::uuid[])', [ids])
        await db.query('COMMIT')
      } catch (e) {
        await db.query('ROLLBACK')
        throw e
      } finally {
        await Promise.allSettled(contexts.map((api) => api.dispose()))
        await db.end()
      }
    }
  }
}

const evidence = (info: TestInfo, data: unknown) =>
  info.attach('API-and-database-state', {
    body: JSON.stringify(data, null, 2),
    contentType: 'application/json'
  })

test('SCRUM29/30 hủy rồi đăng ký lại giữ ID, thay số chỗ và retry đồng thời không trùng', async ({}, info) => {
  const f = await fixture()
  try {
    const customer = await f.customer()
    const w = await f.workshop()
    const original = await f.register(customer, w.id, 1)
    await f.cancel(original.id)
    await f.cancel(original.id)
    const cancelled = await f.state(w.id)
    expect(cancelled.summary).toMatchObject({ booked: 0, remaining: 4 })
    expect(cancelled.registrations).toEqual([
      expect.objectContaining({ id: original.id, status: 'cancelled', seats: 1 })
    ])
    const retried = await Promise.all([1, 2].map(() => f.register(customer, w.id, 2)))
    expect(retried.map((r) => r.id)).toEqual([original.id, original.id])
    expect(retried.map((r) => r.created_at)).toEqual([original.created_at, original.created_at])
    const final = await f.state(w.id)
    expect(final.summary).toMatchObject({ booked: 2, remaining: 2 })
    expect(final.registrations).toEqual([expect.objectContaining({ id: original.id, seats: 2, status: 'confirmed' })])
    await evidence(info, { original, cancelled, retried, final })
  } finally {
    await f.cleanup()
  }
})

test('SCRUM29/30 đăng ký lại bị chặn khi đầy, sau trả chỗ vẫn dùng ID cũ', async ({}, info) => {
  const f = await fixture()
  try {
    const a = await f.customer()
    const b = await f.customer()
    const w = await f.workshop(2)
    const original = await f.register(a, w.id, 2)
    await f.cancel(original.id)
    const other = await f.register(b, w.id, 2)
    const before = await f.state(w.id)
    expect(before.summary).toMatchObject({ booked: 2, remaining: 0 })
    const denied = await a.post(`/api/v1/workshops/${w.id}/registrations`, { data: { seats: 2 } })
    expect(denied.status()).toBe(409)
    expect((await denied.json()).message).toBe('Lớp không đủ chỗ')
    expect(await f.state(w.id)).toEqual(before)
    await f.cancel(other.id)
    const restored = await f.register(a, w.id, 1)
    expect(restored.id).toBe(original.id)
    const final = await f.state(w.id)
    expect(final.summary).toMatchObject({ booked: 1, remaining: 1 })
    expect(final.registrations).toHaveLength(2)
    expect(final.registrations.find((r) => r.id === original.id)).toMatchObject({ status: 'confirmed', seats: 1 })
    await evidence(info, { original, other, before, restored, final })
  } finally {
    await f.cleanup()
  }
})

for (const status of ['hidden', 'cancelled']) {
  test(`SCRUM29/30 đăng ký lại không tái kích hoạt dòng khi lớp ${status}`, async ({}, info) => {
    const f = await fixture()
    try {
      const customer = await f.customer()
      const w = await f.workshop(2)
      const original = await f.register(customer, w.id, 1)
      await f.cancel(original.id)
      const updated = await f.admin.patch(`/api/v1/admin/workshops/${w.id}`, { data: { ...w.body, status } })
      expect(updated.status()).toBe(200)
      const before = await f.state(w.id)
      const denied = await customer.post(`/api/v1/workshops/${w.id}/registrations`, { data: { seats: 1 } })
      expect(denied.status()).toBe(409)
      expect((await denied.json()).message).toBe('Lớp không còn nhận đăng ký')
      const final = await f.state(w.id)
      expect(final).toEqual(before)
      expect(final.summary).toMatchObject({ status, booked: 0, remaining: 2 })
      expect(final.registrations).toEqual([expect.objectContaining({ id: original.id, status: 'cancelled' })])
      await evidence(info, { original, final })
    } finally {
      await f.cleanup()
    }
  })
}

for (const change of ['capacity', 'cancel'] as const) {
  for (const first of ['register', 'admin'] as const) {
    test(`SCRUM28/29 race ${change}, ${first} lấy khóa trước`, async ({}, info) => {
      const f = await fixture()
      const gate = f.pg.getPgClient(DB_NAME, '127.0.0.1')
      const pending: Promise<APIResponse>[] = []
      let locked = false
      await gate.connect()
      try {
        const customer = await f.customer()
        const newcomer = change === 'cancel' ? await f.customer() : undefined
        const w = await f.workshop(2)
        const gatePid = (await gate.query<{ pid: number }>('SELECT pg_backend_pid() AS pid')).rows[0].pid
        await gate.query('BEGIN')
        locked = true
        await gate.query('SELECT id FROM workshops WHERE id=$1 FOR UPDATE', [w.id])
        const adminChange = () =>
          f.admin.patch(`/api/v1/admin/workshops/${w.id}`, {
            data: { ...w.body, ...(change === 'capacity' ? { capacity: 1 } : { status: 'cancelled' }) }
          })
        const register = () => customer.post(`/api/v1/workshops/${w.id}/registrations`, { data: { seats: 2 } })
        const start = (action: () => Promise<APIResponse>) => {
          const response = action()
          // Keep rejection handled even if a lock-barrier assertion fails before Promise.all below.
          void response.catch(() => {})
          pending.push(response)
          return response
        }
        const waiters = async (blockers: number[]) => {
          const rows = (
            await f.db.query<{ pid: number; blockers: number[] }>(`SELECT pid,pg_blocking_pids(pid) AS blockers
            FROM pg_stat_activity WHERE datname=current_database() AND wait_event_type='Lock'
            AND query='SELECT * FROM workshops WHERE id=$1 FOR UPDATE'`)
          ).rows as { pid: number; blockers: number[] }[]
          return rows.filter((r) => r.blockers.some((pid) => blockers.includes(pid))).map((r) => r.pid)
        }
        // Queue the first API transaction on a real row lock, then the second behind it.
        // No sleep, mocked response, or test-only change to production locking.
        let firstPids: number[] = []
        start(first === 'register' ? register : adminChange)
        await expect
          .poll(
            async () => {
              firstPids = await waiters([gatePid])
              return firstPids.length
            },
            { timeout: 5000 }
          )
          .toBe(1)
        start(first === 'register' ? adminChange : register)
        await expect.poll(async () => (await waiters([gatePid, ...firstPids])).length, { timeout: 5000 }).toBe(2)
        await gate.query('COMMIT')
        locked = false
        const responses = await Promise.all(pending)
        const [regResponse, adminResponse] = first === 'register' ? responses : [responses[1], responses[0]]
        const expectedReg = first === 'register' ? 200 : 409
        const expectedAdmin = change === 'capacity' && first === 'register' ? 409 : 200
        expect(regResponse.status(), await regResponse.text()).toBe(expectedReg)
        expect(adminResponse.status(), await adminResponse.text()).toBe(expectedAdmin)
        const final = await f.state(w.id)
        expect(final.summary).toEqual({
          capacity: change === 'capacity' && first === 'admin' ? 1 : 2,
          status: change === 'cancel' ? 'cancelled' : 'open',
          booked: first === 'register' ? 2 : 0,
          remaining: first === 'register' ? 0 : change === 'capacity' ? 1 : 2
        })
        expect(final.registrations).toHaveLength(first === 'register' ? 1 : 0)
        if (first === 'register') expect(final.registrations[0]).toMatchObject({ status: 'confirmed', seats: 2 })
        if (newcomer) {
          const denied = await newcomer.post(`/api/v1/workshops/${w.id}/registrations`, { data: { seats: 1 } })
          expect(denied.status()).toBe(409)
          expect((await denied.json()).message).toBe('Lớp không còn nhận đăng ký')
          expect(await f.state(w.id)).toEqual(final)
        }
        await evidence(info, {
          change,
          first,
          queuedTransactions: 2,
          registerStatus: regResponse.status(),
          adminStatus: adminResponse.status(),
          final
        })
      } finally {
        try {
          if (locked) await gate.query('ROLLBACK')
          await Promise.allSettled(pending)
        } finally {
          await gate.end()
          await f.cleanup()
        }
      }
    })
  }
}
