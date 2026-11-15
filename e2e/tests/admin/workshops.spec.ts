import { expect, test } from '@playwright/test'
import { authenticatedApi, evidence, uniqueName } from '../../support/catalog'
import { ADMIN_ACCOUNT, CLIENT_URL } from '../../support/config'
import { createVerifiedUser, fillLoginForm, login } from '../../support/helpers'

const body = () => ({
  name: uniqueName('Workshop'),
  content: 'Tự tay làm gốm',
  artisan: 'Nghệ nhân E2E',
  startsAt: '2030-12-01T03:00:00Z',
  endsAt: '2030-12-01T05:00:00Z',
  capacity: 3,
  status: 'open'
})

test('SCRUM28–30 UI tạo sửa lớp → khách đăng ký → admin tìm và hủy', async ({ page, browser }, info) => {
  page.on('pageerror', (error) => console.log('Workshop browser error:', error.message))
  const api = await authenticatedApi()
  const customer = await createVerifiedUser()
  const context = await browser.newContext({ baseURL: CLIENT_URL })
  const v = body()
  try {
    await fillLoginForm(page, ADMIN_ACCOUNT.email, ADMIN_ACCOUNT.password)
    await expect(page).toHaveURL('/')
    await page.goto('/workshops')
    await page.getByLabel('Tên lớp', { exact: true }).fill(v.name)
    await page.getByLabel('Nội dung', { exact: true }).fill(v.content)
    await page.getByLabel('Nghệ nhân', { exact: true }).fill(v.artisan)
    await page.getByLabel('Bắt đầu', { exact: true }).fill('2030-12-01T10:00')
    await page.getByLabel('Kết thúc', { exact: true }).fill('2030-12-01T12:00')
    await page.getByLabel('Sức chứa', { exact: true }).fill('3')
    await page.getByRole('button', { name: 'Lưu lớp', exact: true }).click()
    await expect(page.getByText('Đã lưu lớp học', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: `Sửa lớp ${v.name}`, exact: true }).click()
    await page.getByLabel('Sức chứa', { exact: true }).fill('4')
    await page.getByRole('button', { name: 'Lưu lớp', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Tạo lớp', exact: true })).toBeVisible()
    await evidence(page, info, 'SCRUM28-admin-class')
    const client = await context.newPage()
    await login(client, customer)
    await client.goto('/workshops')
    const card = client.getByRole('article').filter({ has: client.getByRole('heading', { name: v.name, exact: true }) })
    await expect(card).toContainText('Còn 4/4 chỗ')
    await card.getByLabel('Số chỗ', { exact: true }).fill('2')
    await card.getByRole('button', { name: 'Đăng ký lớp', exact: true }).click()
    await expect(client.getByText('Đăng ký thành công', { exact: true })).toBeVisible()
    await expect(card).toContainText('Còn 2/4 chỗ')
    await evidence(client, info, 'SCRUM29-registration')
    await page.getByLabel('Lọc lớp', { exact: true }).selectOption({ label: v.name })
    await page.getByLabel('Tìm khách', { exact: true }).fill(customer.email)
    await page.getByRole('button', { name: 'Tìm đăng ký', exact: true }).click()
    const registration = page.getByRole('article').filter({ hasText: customer.email })
    await expect(registration).toContainText('2 chỗ')
    await expect(registration).toContainText('confirmed')
    await evidence(page, info, 'SCRUM30-admin-registration')
    await registration.getByRole('button', { name: 'Hủy đăng ký', exact: true }).click()
    await expect(registration).toContainText('cancelled')
    await client.reload()
    await expect(card).toContainText('Còn 4/4 chỗ')
  } finally {
    await context.close()
    await api.dispose()
  }
})

test('SCRUM28–30 validation, authorization, retry, sức chứa, hủy lặp và bảo toàn đăng ký', async ({ request }) => {
  const admin = await authenticatedApi()
  const customer = await authenticatedApi(await createVerifiedUser(), false)
  const v = body()
  try {
    const created = await admin.post('/api/v1/admin/workshops', { data: v })
    expect(created.status()).toBe(201)
    const w = (await created.json()).data
    for (const actor of [request, customer]) {
      const status = actor === request ? 401 : 403
      for (const response of [
        await actor.get('/api/v1/admin/workshops'),
        await actor.post('/api/v1/admin/workshops', { data: v }),
        await actor.patch(`/api/v1/admin/workshops/${w.id}`, { data: { ...v, capacity: 1 } }),
        await actor.get('/api/v1/admin/workshop-registrations')
      ])
        expect(response.status()).toBe(status)
    }
    expect((await admin.post('/api/v1/admin/workshops', { data: { ...v, capacity: 0 } })).status()).toBe(422)
    expect((await admin.post('/api/v1/admin/workshops', { data: { ...v, endsAt: v.startsAt } })).status()).toBe(422)
    expect(
      (
        await admin.post('/api/v1/admin/workshops', {
          data: { ...v, startsAt: '2020-01-01T01:00:00Z', endsAt: '2020-01-01T02:00:00Z' }
        })
      ).status()
    ).toBe(400)
    expect((await request.post(`/api/v1/workshops/${w.id}/registrations`, { data: { seats: 1 } })).status()).toBe(401)
    const first = await customer.post(`/api/v1/workshops/${w.id}/registrations`, { data: { seats: 2 } })
    expect(first.status()).toBe(200)
    const r = (await first.json()).data
    expect(
      (await (await customer.post(`/api/v1/workshops/${w.id}/registrations`, { data: { seats: 2 } })).json()).data.id
    ).toBe(r.id)
    expect((await customer.post(`/api/v1/workshops/${w.id}/registrations`, { data: { seats: 1 } })).status()).toBe(409)
    expect((await admin.patch(`/api/v1/admin/workshops/${w.id}`, { data: { ...v, capacity: 1 } })).status()).toBe(409)
    expect(
      (
        await admin.patch(`/api/v1/admin/workshops/${w.id}`, { data: { ...v, startsAt: '2030-12-01T02:00:00Z' } })
      ).status()
    ).toBe(409)
    for (const actor of [request, customer])
      expect(
        (await actor.patch(`/api/v1/admin/workshop-registrations/${r.id}`, { data: { status: 'cancelled' } })).status()
      ).toBe(actor === request ? 401 : 403)
    expect((await admin.patch(`/api/v1/admin/workshops/${w.id}`, { data: { ...v, status: 'hidden' } })).status()).toBe(
      200
    )
    expect(
      (await (await request.get('/api/v1/workshops')).json()).data.some((row: { id: string }) => row.id === w.id)
    ).toBe(false)
    expect((await customer.post(`/api/v1/workshops/${w.id}/registrations`, { data: { seats: 2 } })).status()).toBe(409)
    expect(
      (await admin.patch(`/api/v1/admin/workshops/${w.id}`, { data: { ...v, status: 'cancelled' } })).status()
    ).toBe(200)
    expect((await customer.post(`/api/v1/workshops/${w.id}/registrations`, { data: { seats: 2 } })).status()).toBe(409)
    expect(
      (await (await admin.get('/api/v1/admin/workshop-registrations', { params: { workshopId: w.id } })).json()).data
    ).toHaveLength(1)
    for (let i = 0; i < 2; i++)
      expect(
        (await admin.patch(`/api/v1/admin/workshop-registrations/${r.id}`, { data: { status: 'cancelled' } })).status()
      ).toBe(200)
    const row = (await (await admin.get('/api/v1/admin/workshops')).json()).data.find(
      (row: { id: string }) => row.id === w.id
    )
    expect(row).toMatchObject({ capacity: 3, remaining: 3, booked: 0, status: 'cancelled' })
  } finally {
    await admin.dispose()
    await customer.dispose()
  }
})

test('SCRUM29 hai request cạnh tranh chỗ cuối và kiểm tra tổng cuối qua API', async () => {
  const admin = await authenticatedApi()
  const a = await authenticatedApi(await createVerifiedUser(), false)
  const b = await authenticatedApi(await createVerifiedUser(), false)
  try {
    const w = (await (await admin.post('/api/v1/admin/workshops', { data: { ...body(), capacity: 1 } })).json()).data
    const results = await Promise.all(
      [a, b].map((api) => api.post(`/api/v1/workshops/${w.id}/registrations`, { data: { seats: 1 } }))
    )
    expect(results.map((r) => r.status()).sort()).toEqual([200, 409])
    const rows = (
      await (await admin.get('/api/v1/admin/workshop-registrations', { params: { workshopId: w.id } })).json()
    ).data
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ seats: 1, status: 'confirmed' })
    const final = (await (await admin.get('/api/v1/admin/workshops')).json()).data.find(
      (row: { id: string }) => row.id === w.id
    )
    expect(final).toMatchObject({ remaining: 0, booked: 1, capacity: 1 })
    const cancels = await Promise.all(
      [1, 2].map(() =>
        admin.patch(`/api/v1/admin/workshop-registrations/${rows[0].id}`, { data: { status: 'cancelled' } })
      )
    )
    expect(cancels.every((r) => r.ok())).toBe(true)
    const released = (await (await admin.get('/api/v1/admin/workshops')).json()).data.find(
      (row: { id: string }) => row.id === w.id
    )
    expect(released).toMatchObject({ remaining: 1, booked: 0 })
  } finally {
    await admin.dispose()
    await a.dispose()
    await b.dispose()
  }
})
