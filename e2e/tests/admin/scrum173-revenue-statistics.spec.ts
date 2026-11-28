import { expect, request, test, type APIRequestContext, type Page } from '@playwright/test'
import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { ADMIN_ACCOUNT, DB_NAME, PORTS, SERVER_DIR, SERVER_URL, TMP_DIR } from '../../support/config'
import { createVerifiedUser, fillLoginForm } from '../../support/helpers'

type Stats = { summary: { revenue: number; deliveredOrders: number; averageOrderValue: number; workshopRevenue: number } }
type DbRow = Record<string, unknown>
type PgClient = { connect(): Promise<void>; end(): Promise<void>; query(sql: string, values?: unknown[]): Promise<{ rows: DbRow[] }> }
const requireFromServer = createRequire(join(SERVER_DIR, 'package.json'))
const Pg = requireFromServer('pg') as { Client: new (config: object) => PgClient }

async function api<T>(ctx: APIRequestContext, method: 'get' | 'post', path: string, data?: object): Promise<T> {
  const res = await ctx[method](`/api/v1${path}`, data ? { data } : undefined)
  expect(res.ok(), `${method} ${path}: ${res.status()} ${await res.text()}`).toBe(true)
  return (await res.json()).data as T
}

async function auth(identifier: string, password: string, admin = false) {
  const guest = await request.newContext({ baseURL: SERVER_URL })
  const { accessToken } = await api<{ accessToken: string }>(guest, 'post', admin ? '/auth/admin/login' : '/auth/login', { identifier, password })
  await guest.dispose()
  return request.newContext({ baseURL: SERVER_URL, extraHTTPHeaders: { Authorization: `Bearer ${accessToken}` } })
}

async function dashboardRange(page: Page, date: string) {
  await page.getByRole('tab', { name: 'Tuỳ chọn' }).click()
  await page.getByLabel('Đến ngày').fill(date)
  await page.getByLabel('Từ ngày').fill(date)
}

test('S173: doanh thu đơn và workshop theo kỳ VN, biên và quyền', async ({ page }) => {
  test.setTimeout(120_000)
  const dir = join(TMP_DIR, 'scrum173', process.env.S173_RUN_ID || `run-${Date.now()}-${process.pid}`)
  await mkdir(dir, { recursive: true })
  const a = await createVerifiedUser({ fullName: 'Khach E2E S173 A' })
  const b = await createVerifiedUser({ fullName: 'Khach E2E S173 B' })
  const [admin, customer, guest] = await Promise.all([
    auth(ADMIN_ACCOUNT.email, ADMIN_ACCOUNT.password, true), auth(a.email, a.password), request.newContext({ baseURL: SERVER_URL })
  ])

  // Safety gate before writes: this spec may only seed the embedded E2E database.
  expect(DB_NAME).toBe('gsx_e2e')
  expect(PORTS.postgres).toBe(54329)
  const db = new Pg.Client({ host: '127.0.0.1', port: PORTS.postgres, database: DB_NAME, user: 'postgres', password: 'postgres' })
  await db.connect()
  const identity = (await db.query("SELECT current_database() AS name, inet_server_port() AS port, current_setting('server_encoding') AS encoding")).rows[0]
  expect(identity).toMatchObject({ name: 'gsx_e2e', port: 54329, encoding: 'UTF8' })
  const users = await db.query('SELECT id, email FROM users WHERE email = ANY($1::text[])', [[a.email, b.email]])
  const userA = users.rows.find(row => row.email === a.email)?.id
  const userB = users.rows.find(row => row.email === b.email)?.id
  expect(userA).toBeTruthy()
  expect(userB).toBeTruthy()

  const tag = randomUUID().replaceAll('-', '').slice(0, 7)
  const orderRows = [
    { suffix: 'A', status: 'delivered', amount: 100000, at: '2042-05-11T17:00:00.000Z' },
    { suffix: 'B', status: 'delivered', amount: 200000, at: '2042-05-12T16:59:59.999Z' },
    { suffix: 'P', status: 'pending', amount: 400000, at: '2042-05-12T12:00:00.000Z' },
    { suffix: 'L', status: 'delivered', amount: 7000, at: '2042-05-11T16:59:59.999Z' },
    { suffix: 'R', status: 'delivered', amount: 11000, at: '2042-05-12T17:00:00.000Z' }
  ]
  const workshops = [
    { suffix: 'I', at: '2042-05-11T17:00:00.000Z', amount: 150000 },
    { suffix: 'L', at: '2042-05-11T16:59:59.999Z', amount: 7000 },
    { suffix: 'R', at: '2042-05-12T17:00:00.000Z', amount: 11000 }
  ]
  await db.query('BEGIN')
  try {
    for (const row of orderRows) {
      await db.query(`INSERT INTO orders (code,user_id,status,payment_method,payment_status,subtotal,shipping_fee,total,recipient_name,recipient_phone,shipping_address,delivered_at)
        VALUES ($1,$2,$3,'cod','unpaid',$4,0,$4,'S173 fixture','0900000000','Test only',$5)`,
      [`S173${tag}${row.suffix}`, userA, row.status, row.amount, row.at])
    }
    for (const row of workshops) {
      const inserted = await db.query(`INSERT INTO workshops (name,slug,location,starts_at,ends_at,price,capacity,image_urls)
        VALUES ($1,$2,'E2E only',$3,$3::timestamptz + interval '1 hour',$4,10,ARRAY[]::text[]) RETURNING id`,
      [`S173 ${tag} ${row.suffix}`, `s173-${tag}-${row.suffix.toLowerCase()}`, row.at, row.amount])
      const workshopId = inserted.rows[0].id
      await db.query(`INSERT INTO workshop_registrations (code,workshop_id,user_id,seats,unit_price,total_price,contact_name,contact_phone,contact_email,status)
        VALUES ($1,$2,$3,1,$4,$4,'S173 fake','0900000000','fixture@gomsuxanh.test','attended')`,
      [`W173${tag}${row.suffix}`, workshopId, userA, row.amount])
      if (row.suffix === 'I') {
        await db.query(`INSERT INTO workshop_registrations (code,workshop_id,user_id,seats,unit_price,total_price,contact_name,contact_phone,contact_email,status)
          VALUES ($1,$2,$3,1,250000,250000,'S173 fake','0900000001','fixture2@gomsuxanh.test','pending')`,
        [`W173${tag}P`, workshopId, userB])
      }
    }
    await db.query('COMMIT')
  } catch (error) {
    await db.query('ROLLBACK')
    throw error
  }
  const savedOrders = (await db.query('SELECT code,status,total,delivered_at FROM orders WHERE code LIKE $1 ORDER BY code', [`S173${tag}%`])).rows
  const savedRegistrations = (await db.query(`SELECT r.code,r.status,r.total_price,w.starts_at FROM workshop_registrations r
    JOIN workshops w ON w.id=r.workshop_id WHERE r.code LIKE $1 ORDER BY r.code`, [`W173${tag}%`])).rows
  expect(savedOrders).toHaveLength(5)
  expect(savedRegistrations).toHaveLength(4)
  expect(savedOrders.map(r => [r.status, r.total])).toEqual(expect.arrayContaining([
    ['delivered', 100000], ['delivered', 200000], ['pending', 400000], ['delivered', 7000], ['delivered', 11000]
  ]))
  expect(savedRegistrations.map(r => [r.status, r.total_price])).toEqual(expect.arrayContaining([
    ['attended', 150000], ['pending', 250000], ['attended', 7000], ['attended', 11000]
  ]))
  for (const expected of orderRows) {
    const row = savedOrders.find(r => r.code === `S173${tag}${expected.suffix}`)
    expect(row).toMatchObject({ status: expected.status, total: expected.amount })
    expect((row?.delivered_at as Date).toISOString()).toBe(expected.at)
  }
  for (const expected of workshops) {
    const row = savedRegistrations.find(r => r.code === `W173${tag}${expected.suffix}`)
    expect(row).toMatchObject({ status: 'attended', total_price: expected.amount })
    expect((row?.starts_at as Date).toISOString()).toBe(expected.at)
  }
  const pending = savedRegistrations.find(r => r.code === `W173${tag}P`)
  expect(pending).toMatchObject({ status: 'pending', total_price: 250000 })
  expect((pending?.starts_at as Date).toISOString()).toBe('2042-05-11T17:00:00.000Z')
  await writeFile(join(dir, 'S173-fixture.json'), JSON.stringify({ identity, orders: savedOrders, registrations: savedRegistrations }, null, 2))
  await db.end()

  const stats = (date: string) => api<Stats>(admin, 'get', `/admin/stats/revenue?from=${date}&to=${date}&groupBy=day`)
  const main = await stats('2042-05-12')
  expect(main.summary).toMatchObject({ revenue: 300000, deliveredOrders: 2, averageOrderValue: 150000, workshopRevenue: 150000 })
  const before = await stats('2042-05-11')
  expect(before.summary).toMatchObject({ revenue: 7000, deliveredOrders: 1, workshopRevenue: 7000 })
  const after = await stats('2042-05-13')
  expect(after.summary).toMatchObject({ revenue: 11000, deliveredOrders: 1, workshopRevenue: 11000 })
  const empty = await stats('2042-06-01')
  expect(empty.summary).toMatchObject({ revenue: 0, deliveredOrders: 0, workshopRevenue: 0 })
  const path = '/api/v1/admin/stats/revenue?from=2042-05-12&to=2042-05-12&groupBy=day'
  const guestStatus = (await guest.get(path)).status()
  const customerStatus = (await customer.get(path)).status()
  expect(guestStatus).toBe(401)
  expect(customerStatus).toBe(403)
  expect((await stats('2042-05-12')).summary).toMatchObject({ revenue: 300000, deliveredOrders: 2, workshopRevenue: 150000 })
  await writeFile(join(dir, 'S173-api.json'), JSON.stringify({ main: main.summary, before: before.summary, after: after.summary, empty: empty.summary, guestStatus, customerStatus }, null, 2))

  await fillLoginForm(page, ADMIN_ACCOUNT.email, ADMIN_ACCOUNT.password)
  await expect(page).toHaveURL('/')
  await dashboardRange(page, '2042-05-12')
  const revenueTile = page.getByText('Doanh thu', { exact: true }).first().locator('..')
  const workshopTile = page.getByText('Học phí workshop', { exact: true }).locator('..')
  const deliveredTile = page.getByText('Đơn giao thành công', { exact: true }).locator('..')
  await expect(revenueTile).toContainText('300.000')
  await expect(workshopTile).toContainText('150.000')
  await expect(deliveredTile).toContainText('2')
  await page.screenshot({ path: join(dir, 'S173-dashboard-main.png'), fullPage: true })
  await page.getByLabel('Đến ngày').fill('2042-06-01')
  await page.getByLabel('Từ ngày').fill('2042-06-01')
  await expect(revenueTile).toContainText('0 ₫')
  await expect(workshopTile).toContainText('0 ₫')
  await page.screenshot({ path: join(dir, 'S173-dashboard-empty.png'), fullPage: true })
  await Promise.all([admin.dispose(), customer.dispose(), guest.dispose()])
})
