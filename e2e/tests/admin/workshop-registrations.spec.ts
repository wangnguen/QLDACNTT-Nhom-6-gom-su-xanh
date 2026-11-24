import { randomUUID } from 'node:crypto'
import { expect } from '@playwright/test'
import { uniqueName } from '../../support/catalog'
import { ADMIN_ACCOUNT, CLIENT_URL } from '../../support/config'
import { fillLoginForm } from '../../support/helpers'
import {
  test,
  ADMIN_UI,
  ADMIN_BOOKINGS,
  statusPath,
  rowFor,
  visibleCodes,
  expectIdentity,
  vnDate,
  type Registration
} from '../../support/workshop-operations'

test.use({ timezoneId: 'America/Los_Angeles', viewport: { width: 1600, height: 1000 } })

test('S30-01 UI correct row contact schedule confirmation and reload', async ({ page, operations, classes, audit }) => {
  const p = await operations.pair()
  const beforeA = await classes.snapshot(p.wA.id)
  const beforeB = await classes.snapshot(p.wB.id)
  await fillLoginForm(page, ADMIN_ACCOUNT.email, ADMIN_ACCOUNT.password)
  await expect(page).toHaveURL('/')
  await page.getByRole('link', { name: 'Đăng ký workshop', exact: true }).click()
  await page.getByLabel('Tìm đăng ký').fill(p.rA.code)
  await expect(page).toHaveURL((url) => url.searchParams.get('search') === p.rA.code)
  const row = rowFor(page, p.rA.code)
  await expect(visibleCodes(page)).toHaveText([p.rA.code])
  for (const value of [
    p.rA.contactName,
    p.rA.contactPhone,
    p.rA.contactEmail,
    p.rA.note!,
    p.wA.name,
    '09:00 – 11:00',
    vnDate(30).split('-').reverse().join('/')
  ])
    await expect(row).toContainText(value)
  await expect(row.getByRole('cell').nth(2)).toHaveText('2')
  await expect(row.getByRole('cell').nth(3)).toContainText('500.000')
  await expect(row.getByRole('cell').nth(4)).toContainText('Chờ xác nhận')
  const registeredTime = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(p.rA.registeredAt))
  await expect(row.getByRole('cell').nth(4)).toContainText(registeredTime)
  await expect(row.getByRole('button', { name: 'Check-in', exact: true })).toBeDisabled()
  await audit.screenshot(page, 'S30-01-found-registration')
  const changed = page.waitForResponse((r) => r.url().endsWith(statusPath(p.rA.id)) && r.request().method() === 'PATCH')
  await row.getByRole('button', { name: 'Xác nhận', exact: true }).click()
  const confirmed = (await audit.response('UI confirm', await changed, 200)) as Registration
  expect(confirmed.status).toBe('confirmed')
  expectIdentity(confirmed, p.rA)
  await page.reload()
  await expect(row).toContainText('Đã xác nhận')
  expectIdentity(await operations.mine(p.a, p.rA), p.rA)
  expect((await operations.mine(p.a, p.rA)).status).toBe('confirmed')
  expect((await classes.snapshot(p.wA.id)).workshop).toEqual(beforeA.workshop)
  expect(await classes.snapshot(p.wB.id)).toEqual(beforeB)
  await audit.screenshot(page, 'S30-01-confirmed-after-reload')
})

test('S30-02 UI cancel dialog dismiss confirm seats and customer view', async ({
  page,
  browser,
  operations,
  classes,
  audit,
  admin
}) => {
  const p = await operations.pair()
  const beforeA = await classes.snapshot(p.wA.id)
  const beforeB = await classes.snapshot(p.wB.id)
  await fillLoginForm(page, ADMIN_ACCOUNT.email, ADMIN_ACCOUNT.password)
  await expect(page).toHaveURL('/')
  await page.goto(`${ADMIN_UI}?workshopId=${p.wA.id}`)
  const row = rowFor(page, p.rA.code)
  for (const close of ['Giữ lại', 'Đóng', 'Escape']) {
    await row.getByRole('button', { name: 'Huỷ', exact: true }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText(p.rA.code)
    await dialog.getByLabel('Lý do huỷ (khách sẽ thấy)').fill('Nháp không được lưu')
    if (close === 'Escape') await page.keyboard.press('Escape')
    else await dialog.getByRole('button', { name: close, exact: true }).click()
    await expect(dialog).toHaveCount(0)
    expect(await classes.snapshot(p.wA.id)).toEqual(beforeA)
  }
  await row.getByRole('button', { name: 'Huỷ', exact: true }).click()
  const reason = 'Xưởng đổi lịch — fixture SCRUM30'
  await page.getByRole('dialog').getByLabel('Lý do huỷ (khách sẽ thấy)').fill(reason)
  const changed = page.waitForResponse((r) => r.url().endsWith(statusPath(p.rA.id)) && r.request().method() === 'PATCH')
  await page.getByRole('dialog').getByRole('button', { name: 'Huỷ đăng ký', exact: true }).click()
  const cancelled = (await audit.response('UI cancel', await changed, 200)) as Registration
  expect(cancelled).toMatchObject({ status: 'cancelled', cancelledBy: 'admin', cancelReason: reason })
  expect(cancelled.cancelledAt).not.toBeNull()
  expectIdentity(cancelled, p.rA)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.reload()
  await expect(row).toContainText('Đã huỷ')
  await expect(row).toContainText(reason)
  await expect(row.getByRole('button', { name: 'Huỷ', exact: true })).toHaveCount(0)
  await audit.screenshot(page, 'S30-02-admin-cancelled')
  const afterA = await classes.snapshot(p.wA.id)
  expect(afterA.workshop).toMatchObject({ bookedSeats: 0, seatsLeft: 30 })
  expect(afterA.registrations.entries).toHaveLength(1)
  expect(await classes.snapshot(p.wB.id)).toEqual(beforeB)
  expect(await operations.mine(p.a, p.rA)).toMatchObject({
    id: p.rA.id,
    status: 'cancelled',
    cancelReason: reason,
    cancelledBy: 'admin'
  })
  await audit.response(
    'repeat cancel denied',
    await admin.patch(statusPath(p.rA.id), { data: { status: 'cancelled', cancelReason: 'Không được ghi đè' } }),
    400
  )
  expect(await classes.snapshot(p.wA.id)).toEqual(afterA)
  const context = await browser.newContext({ baseURL: CLIENT_URL, locale: 'vi-VN' })
  try {
    const customerPage = await context.newPage()
    await fillLoginForm(customerPage, p.a.user.email, p.a.user.password)
    await expect(customerPage).toHaveURL('/')
    await customerPage.goto('/account/workshops')
    await expect(customerPage.getByText(p.rA.code, { exact: true })).toBeVisible()
    await expect(customerPage.getByText(reason, { exact: true })).toBeVisible()
    await audit.screenshot(customerPage, 'S30-02-customer-cancelled')
  } finally {
    await context.close()
  }
})

for (const from of ['pending', 'confirmed']) {
  test(`S30-03 UI check-in from ${from} within window`, async ({ page, operations, classes, audit }) => {
    const p = await operations.pair()
    if (from === 'confirmed') await operations.change(p.rA.id, 'confirmed')
    await classes.age(p.wA.id, 0.5, 2.5)
    const beforeA = await classes.snapshot(p.wA.id)
    const beforeB = await classes.snapshot(p.wB.id)
    await fillLoginForm(page, ADMIN_ACCOUNT.email, ADMIN_ACCOUNT.password)
    await expect(page).toHaveURL('/')
    await page.goto(`${ADMIN_UI}?workshopId=${p.wA.id}`)
    const row = rowFor(page, p.rA.code)
    await expect(row.getByRole('button', { name: 'Check-in', exact: true })).toBeEnabled()
    const changed = page.waitForResponse(
      (r) => r.url().endsWith(statusPath(p.rA.id)) && r.request().method() === 'PATCH'
    )
    await row.getByRole('button', { name: 'Check-in', exact: true }).click()
    const attended = (await audit.response('UI check-in', await changed, 200)) as Registration
    expect(attended.status).toBe('attended')
    expectIdentity(attended, beforeA.registrations.entries[0] as Registration)
    await page.reload()
    await expect(row).toContainText('Đã tham gia')
    await expect(row.getByRole('button', { name: 'Check-in', exact: true })).toHaveCount(0)
    expect((await classes.snapshot(p.wA.id)).workshop).toEqual(beforeA.workshop)
    expect(await classes.snapshot(p.wB.id)).toEqual(beforeB)
    expect((await operations.mine(p.a, p.rA)).status).toBe('attended')
    await audit.screenshot(page, `S30-03-attended-${from}`)
  })
}

test('S30-04 UI search all fields class status combinations pagination and reset', async ({
  page,
  operations,
  classes,
  people,
  audit,
  admin
}) => {
  test.setTimeout(90000)
  const prefix = uniqueName('S30search')
  const p = await operations.pair(prefix)
  await operations.change(p.rA.id, 'confirmed')
  const registrations = [p.rA, p.rB]
  for (let i = 0; i < 9; i++) {
    const actor = await people.create()
    const r = await operations.register(actor, p.wA.id, { contactName: `${prefix} An ${i}` })
    registrations.push(r)
    if (i === 8) await operations.change(r.id, 'cancelled', 'Fixture bộ lọc')
  }
  await fillLoginForm(page, ADMIN_ACCOUNT.email, ADMIN_ACCOUNT.password)
  await expect(page).toHaveURL('/')
  await page.goto(ADMIN_UI)
  for (const [term, code] of [
    [p.rA.code, p.rA.code],
    [p.rA.contactPhone, p.rA.code],
    [p.rB.contactEmail, p.rB.code],
    [`${prefix} Anh`, p.rB.code]
  ]) {
    await page.getByLabel('Tìm đăng ký').fill(term)
    await expect(page).toHaveURL((url) => url.searchParams.get('search') === term)
    await expect(visibleCodes(page)).toHaveText([code])
    audit.note('UI search matches intended fake customer', {
      kind:
        term === p.rA.code
          ? 'code'
          : term === p.rA.contactPhone
            ? 'phone'
            : term === p.rB.contactEmail
              ? 'email'
              : 'name',
      code
    })
  }
  await page.getByLabel('Tìm đăng ký').fill(prefix)
  await expect(page).toHaveURL((url) => url.searchParams.get('search') === prefix)
  await expect(visibleCodes(page)).toHaveText(
    registrations
      .slice(1)
      .reverse()
      .map((r) => r.code)
  )
  await page.getByRole('button', { name: 'Trang sau', exact: true }).click()
  await expect(visibleCodes(page)).toHaveText([p.rA.code])
  await page.getByRole('button', { name: 'Trang trước', exact: true }).click()
  await expect(visibleCodes(page)).toHaveCount(10)
  await page.getByLabel('Lọc theo lớp', { exact: true }).selectOption(p.wA.id)
  await expect(visibleCodes(page)).toHaveText([p.rA, ...registrations.slice(2)].reverse().map((r) => r.code))
  const expectedByStatus: Record<string, string[]> = {
    confirmed: [p.rA.code],
    cancelled: [registrations[10].code],
    attended: [],
    pending: registrations
      .slice(2, 10)
      .reverse()
      .map((r) => r.code)
  }
  for (const status of ['confirmed', 'cancelled', 'pending', 'attended']) {
    await page.getByLabel('Lọc theo trạng thái', { exact: true }).selectOption(status)
    await expect(page).toHaveURL(
      (url) => url.searchParams.get('status') === status && url.searchParams.get('workshopId') === p.wA.id
    )
    if (expectedByStatus[status].length) await expect(visibleCodes(page)).toHaveText(expectedByStatus[status])
    else await expect(page.getByText('Không có đăng ký nào khớp bộ lọc', { exact: true })).toBeVisible()
    const api = await audit.response(
      `API combined status ${status}`,
      await admin.get(ADMIN_BOOKINGS, { params: { search: prefix, workshopId: p.wA.id, status, limit: 100 } }),
      200
    )
    expect(api.entries.map((r: Registration) => r.code)).toEqual(expectedByStatus[status])
  }
  await page.getByLabel('Lọc theo trạng thái', { exact: true }).selectOption('pending')
  await page.getByLabel('Lọc theo lớp', { exact: true }).selectOption(p.wB.id)
  await expect(visibleCodes(page)).toHaveText([p.rB.code])
  await page.getByLabel('Tìm đăng ký').fill(uniqueName('S30none'))
  await expect(page.getByText('Không có đăng ký nào khớp bộ lọc', { exact: true })).toBeVisible()
  await audit.screenshot(page, 'S30-04-filter-empty')
  await page.getByRole('button', { name: 'Xoá bộ lọc', exact: true }).click()
  await expect(page).toHaveURL(ADMIN_UI)
  await expect(visibleCodes(page)).toHaveText(
    registrations
      .slice(1)
      .reverse()
      .map((r) => r.code)
  )
  await audit.screenshot(page, 'S30-04-reset-list')
  expect((await classes.snapshot(p.wB.id)).registrations.entries[0]).toMatchObject({ id: p.rB.id, status: 'pending' })
})

const invalidTransitions = [
  ['confirmed', 'confirmed', 400],
  ['attended', 'confirmed', 400],
  ['attended', 'attended', 400],
  ['attended', 'cancelled', 400],
  ['cancelled', 'confirmed', 400],
  ['cancelled', 'attended', 400],
  ['cancelled', 'cancelled', 400],
  ['confirmed', 'pending', 422],
  ['pending', 'done', 422],
  ['pending', 'missing-status', 422],
  ['pending', 'early-check-in', 400],
  ['confirmed', 'early-check-in', 400],
  ['pending', 'reason-over-limit', 422],
  ['pending', 'missing-id', 404],
  ['pending', 'invalid-id', 422]
] as const
for (const [from, action, expected] of invalidTransitions) {
  test(`S30-05 rejected ${from} to ${action}`, async ({ operations, classes, admin, audit }) => {
    const p = await operations.pair()
    if (from === 'attended') await classes.age(p.wA.id, 0.5, 2.5)
    if (from !== 'pending') await operations.change(p.rA.id, from)
    const beforeA = await classes.snapshot(p.wA.id)
    const beforeB = await classes.snapshot(p.wB.id)
    const mineBefore = await operations.mine(p.a, p.rA)
    const id = action === 'missing-id' ? randomUUID() : action === 'invalid-id' ? 'not-a-uuid' : p.rA.id
    const data =
      action === 'missing-status'
        ? {}
        : {
            status:
              action === 'early-check-in'
                ? 'attended'
                : action === 'reason-over-limit'
                  ? 'cancelled'
                  : ['missing-id', 'invalid-id'].includes(action)
                    ? 'confirmed'
                    : action,
            ...(action === 'reason-over-limit' ? { cancelReason: 'x'.repeat(256) } : {})
          }
    await audit.response('invalid operation denied', await admin.patch(statusPath(id), { data }), expected)
    expect(await classes.snapshot(p.wA.id)).toEqual(beforeA)
    expect(await classes.snapshot(p.wB.id)).toEqual(beforeB)
    expect(await operations.mine(p.a, p.rA)).toEqual(mineBefore)
  })
}

for (const reason of [null, '', '   ', 'x'.repeat(255)]) {
  const label = reason === null ? 'null' : reason.length === 0 ? 'empty' : reason.trim().length === 0 ? 'spaces' : '255'
  test(`S30-06 confirmed cancellation reason ${label}`, async ({ operations, classes }) => {
    const p = await operations.pair()
    await operations.change(p.rA.id, 'confirmed')
    const beforeB = await classes.snapshot(p.wB.id)
    const updated = await operations.change(p.rA.id, 'cancelled', reason)
    expect(updated).toMatchObject({
      id: p.rA.id,
      status: 'cancelled',
      cancelReason: reason?.trim() || null,
      cancelledBy: 'admin'
    })
    expectIdentity(updated, p.rA)
    expect((await classes.snapshot(p.wA.id)).workshop).toMatchObject({ bookedSeats: 0, seatsLeft: 30 })
    expect(await classes.snapshot(p.wB.id)).toEqual(beforeB)
    expect((await operations.mine(p.a, p.rA)).status).toBe('cancelled')
  })
}

for (const actor of ['guest', 'customer'] as const) {
  test(`S30-07 ${actor} cannot manage registrations`, async ({ operations, classes, request, audit, page }) => {
    const p = await operations.pair()
    const api = actor === 'guest' ? request : p.a.api
    const beforeA = await classes.snapshot(p.wA.id)
    const beforeB = await classes.snapshot(p.wB.id)
    const status = actor === 'guest' ? 401 : 403
    await audit.response('denied admin list', await api.get(ADMIN_BOOKINGS), status)
    for (const action of ['confirmed', 'attended', 'cancelled'])
      await audit.response(
        `denied admin ${action}`,
        await api.patch(statusPath(p.rA.id), { data: { status: action } }),
        status
      )
    expect(await classes.snapshot(p.wA.id)).toEqual(beforeA)
    expect(await classes.snapshot(p.wB.id)).toEqual(beforeB)
    await page.goto(ADMIN_UI)
    await expect(page).toHaveURL('/login')
    if (actor === 'customer') {
      const login = page.waitForResponse(
        (r) => r.url().endsWith('/api/v1/auth/admin/login') && r.request().method() === 'POST'
      )
      await fillLoginForm(page, p.a.user.email, p.a.user.password)
      expect((await login).status()).toBe(403)
      await expect(page).toHaveURL('/login')
      audit.note('customer admin UI login refused', { status: 403 })
    }
  })
}

for (const race of ['confirm-twice', 'cancel-twice', 'check-in-versus-cancel'] as const) {
  test(`S30-08 race ${race} consistent seats and other customer`, async ({ operations, classes, audit, admin }) => {
    const p = await operations.pair()
    if (race === 'check-in-versus-cancel') await classes.age(p.wA.id, 0.5, 2.5)
    const beforeA = await classes.snapshot(p.wA.id)
    const beforeB = await classes.snapshot(p.wB.id)
    const actions =
      race === 'confirm-twice'
        ? ['confirmed', 'confirmed']
        : race === 'cancel-twice'
          ? ['cancelled', 'cancelled']
          : ['attended', 'cancelled']
    const responses = await Promise.all(
      actions.map((status, index) =>
        admin.patch(statusPath(p.rA.id), { data: { status, cancelReason: `Race fixture ${index}` } })
      )
    )
    for (const [index, response] of responses.entries())
      await audit.response(`race request ${index} ${actions[index]}`, response)
    const success = responses.map((r) => r.status()).filter((s) => s === 200)
    expect(success).toHaveLength(1)
    for (const response of responses.filter((r) => r.status() !== 200)) expect([400, 409]).toContain(response.status())
    const winner = responses.findIndex((r) => r.status() === 200)
    const after = await classes.snapshot(p.wA.id)
    expect(after.registrations.entries).toHaveLength(1)
    const registration = after.registrations.entries[0] as Registration
    expect(registration.status).toBe(actions[winner])
    expectIdentity(registration, beforeA.registrations.entries[0] as Registration)
    const booked = registration.status === 'cancelled' ? 0 : 2
    expect(after.workshop).toMatchObject({ bookedSeats: booked, seatsLeft: 30 - booked })
    expect(await classes.snapshot(p.wB.id)).toEqual(beforeB)
    expect((await operations.mine(p.a, p.rA)).status).toBe(actions[winner])
    await audit.response(
      'repeat winning operation denied',
      await admin.patch(statusPath(p.rA.id), { data: { status: actions[winner] } }),
      400
    )
    expect(await classes.snapshot(p.wA.id)).toEqual(after)
    audit.note('race invariant', {
      actions,
      statuses: responses.map((r) => r.status()),
      finalStatus: registration.status,
      bookedSeats: booked,
      otherClassUnchanged: true
    })
  })
}

test('S30-09 invalid list queries do not change bookings', async ({ operations, classes, audit, admin }) => {
  const p = await operations.pair()
  const before = await classes.snapshot(p.wA.id)
  const invalidQueries: Record<string, string | number>[] = [
    { status: 'done' },
    { workshopId: 'bad' },
    { limit: 0 },
    { offset: -1 }
  ]
  for (const params of invalidQueries)
    await audit.response('invalid list query', await admin.get(ADMIN_BOOKINGS, { params }), 422)
  expect(await classes.snapshot(p.wA.id)).toEqual(before)
})

for (const action of ['confirmed', 'cancelled'] as const) {
  test(`S30-10 pending filter stays correct after UI ${action}`, async ({
    page,
    operations,
    classes,
    audit,
    admin
  }) => {
    const p = await operations.pair()
    await fillLoginForm(page, ADMIN_ACCOUNT.email, ADMIN_ACCOUNT.password)
    await expect(page).toHaveURL('/')
    await page.goto(`${ADMIN_UI}?workshopId=${p.wA.id}&status=pending`)
    const row = rowFor(page, p.rA.code)
    await expect(row).toContainText('Chờ xác nhận')
    const response = page.waitForResponse(
      (r) => r.url().endsWith(statusPath(p.rA.id)) && r.request().method() === 'PATCH'
    )
    if (action === 'confirmed') await row.getByRole('button', { name: 'Xác nhận', exact: true }).click()
    else {
      await row.getByRole('button', { name: 'Huỷ', exact: true }).click()
      await page.getByRole('dialog').getByRole('button', { name: 'Huỷ đăng ký', exact: true }).click()
    }
    await audit.response('UI operation under pending filter', await response, 200)
    await expect(page.getByLabel('Lọc theo trạng thái', { exact: true })).toHaveValue('pending')
    const filtered = await audit.response(
      'API pending filter after operation',
      await admin.get(ADMIN_BOOKINGS, { params: { workshopId: p.wA.id, status: 'pending' } }),
      200
    )
    expect(filtered.entries).toHaveLength(0)
    await audit.screenshot(page, `S30-10-pending-after-${action}`)
    // Kiểm kết quả cuối của UI, không chấp nhận row không còn khớp bộ lọc chỉ vì API đã lưu đúng.
    const staleRows = await row.count()
    audit.note('UI versus API before reload', {
      selectedStatus: 'pending',
      apiCount: filtered.total_count,
      uiRowsForChangedRegistration: staleRows
    })
    await page.reload()
    await expect(page.getByText('Không có đăng ký nào khớp bộ lọc', { exact: true })).toBeVisible()
    expect((await classes.snapshot(p.wA.id)).registrations.entries[0]).toMatchObject({ id: p.rA.id, status: action })
    expect(staleRows, 'UI must not retain a changed registration outside the selected pending filter').toBe(0)
  })
}
