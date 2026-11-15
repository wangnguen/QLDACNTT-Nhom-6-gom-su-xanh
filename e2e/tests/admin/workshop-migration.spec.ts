import { randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import EmbeddedPostgres from 'embedded-postgres'
import type { QueryRunner } from '../../../apps/server/node_modules/typeorm'
import { AddWorkshops1794740000000 } from '../../../apps/server/src/databases/migrations/1794740000000-AddWorkshops'
import { DB_NAME, PORTS, TMP_DIR } from '../../support/config'
import { authenticatedApi, uniqueName } from '../../support/catalog'
import { createVerifiedUser } from '../../support/helpers'

test('SCRUM29 lớp đã bắt đầu không còn công khai và không nhận đăng ký', async ({ request }) => {
  const admin = await authenticatedApi()
  const customer = await authenticatedApi(await createVerifiedUser(), false)
  const pg = new EmbeddedPostgres({
    databaseDir: TMP_DIR,
    port: PORTS.postgres,
    user: 'postgres',
    password: 'postgres'
  })
  const client = pg.getPgClient(DB_NAME, '127.0.0.1')
  await client.connect()
  try {
    const created = await admin.post('/api/v1/admin/workshops', {
      data: {
        name: uniqueName('Expired'),
        content: 'Expiry',
        artisan: 'E2E',
        startsAt: '2030-01-01T00:00:00Z',
        endsAt: '2030-01-01T02:00:00Z',
        capacity: 1
      }
    })
    expect(created.status()).toBe(201)
    const w = (await created.json()).data
    // Test clock passage through test DB only; avoids sleeping until a real class begins.
    await client.query(
      "UPDATE workshops SET starts_at=now()-interval '2 hours',ends_at=now()-interval '1 hour' WHERE id=$1",
      [w.id]
    )
    expect((await customer.post(`/api/v1/workshops/${w.id}/registrations`, { data: { seats: 1 } })).status()).toBe(409)
    expect(
      (await (await request.get('/api/v1/workshops')).json()).data.some((r: { id: string }) => r.id === w.id)
    ).toBe(false)
    expect(
      (await (await admin.get('/api/v1/admin/workshop-registrations', { params: { workshopId: w.id } })).json()).data
    ).toHaveLength(0)
  } finally {
    await client.end()
    await customer.dispose()
    await admin.dispose()
  }
})

test('SCRUM28 migration up/down giữ dữ liệu đã tồn tại trong schema test riêng', async () => {
  const pg = new EmbeddedPostgres({
    databaseDir: TMP_DIR,
    port: PORTS.postgres,
    user: 'postgres',
    password: 'postgres'
  })
  const client = pg.getPgClient(DB_NAME, '127.0.0.1')
  await client.connect()
  const schema = `migration_${randomUUID().replaceAll('-', '')}`
  try {
    await client.query(`CREATE SCHEMA ${schema}`)
    await client.query(`SET search_path TO ${schema}`)
    await client.query('CREATE TABLE users(id uuid PRIMARY KEY,email text NOT NULL)')
    await client.query("INSERT INTO users VALUES(gen_random_uuid(),'existing@gomsuxanh.test')")
    const before = (await client.query('SELECT * FROM users')).rows
    const runner = { query: (sql: string) => client.query(sql) } as unknown as QueryRunner
    const migration = new AddWorkshops1794740000000()
    await migration.up(runner)
    expect((await client.query('SELECT * FROM users')).rows).toEqual(before)
    await client.query(
      "INSERT INTO workshops(name,content,artisan,starts_at,ends_at,capacity) VALUES('Demo','Content','Artist','2030-01-01','2030-01-02',2)"
    )
    expect((await client.query('SELECT * FROM workshops')).rowCount).toBe(1)
    await migration.down(runner)
    expect((await client.query('SELECT * FROM users')).rows).toEqual(before)
  } finally {
    await client.query('SET search_path TO public')
    // schema is generated locally above; never accepts environment/user paths or names.
    await client.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`)
    await client.end()
  }
})
