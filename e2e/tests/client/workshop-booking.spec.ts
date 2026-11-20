import { randomUUID } from 'node:crypto'
import { expect } from '@playwright/test'
import { uniqueName } from '../../support/catalog'
import { fillLoginForm } from '../../support/helpers'
import {
  test,
  PUBLIC_CLASSES,
  ADMIN_CLASSES,
  BOOKINGS,
  ADMIN_BOOKINGS,
  bookingBody,
  vnDate,
  vnIso
} from '../../support/workshop-booking'

test.use({ timezoneId: 'America/Los_Angeles' })

test('S29-01 public menu list detail and missing class', async ({ page, request, classes, audit }) => {
  const workshop = await classes.create()
  const hidden = await classes.create({ isActive: false })
  await page.goto('/')
  await page.getByRole('navigation').getByRole('link', { name: 'Workshop', exact: true }).click()
  await expect(page).toHaveURL('/workshops')
  await page.getByLabel('Tìm lớp workshop').fill(workshop.name)
  await expect(page).toHaveURL((url) => url.searchParams.get('search') === workshop.name)
  await expect(page.getByRole('heading', { name: workshop.name, exact: true })).toBeVisible()
  const card = page.locator(`a[href='/workshops/${workshop.slug}']`)
  await expect(card).toContainText('09:00 – 11:30')
  await expect(card).toContainText('Còn 12/12 chỗ')
  await expect(card).toContainText('250.000')
  await audit.screenshot(page, 'S29-01-list')
  await card.click()
  await expect(page).toHaveURL(`/workshops/${workshop.slug}`)
  await expect(page.getByRole('heading', { name: workshop.name, exact: true })).toBeVisible()
  await expect(page.locator('dl')).toContainText(workshop.instructor)
  await expect(page.locator('dl')).toContainText(vnDate().split('-').reverse().join('/'))
  await expect(page.locator('dl')).toContainText('09:00 – 11:30')
  await expect(page.locator('dl')).toContainText('12 người')
  await expect(page.getByRole('link', { name: 'Đăng nhập để đăng ký' })).toBeVisible()
  expect(
    await audit.response('public detail', await request.get(`${PUBLIC_CLASSES}/${workshop.slug}`), 200)
  ).toMatchObject({
    id: workshop.id,
    startsAt: workshop.startsAt,
    endsAt: workshop.endsAt,
    capacity: 12,
    price: 250000,
    instructor: workshop.instructor
  })
  await audit.screenshot(page, 'S29-01-detail')
  await page.reload()
  await expect(page.getByRole('heading', { name: workshop.name, exact: true })).toBeVisible()
  for (const slug of [hidden.slug, randomUUID()]) {
    await audit.response('missing or hidden detail', await request.get(`${PUBLIC_CLASSES}/${slug}`), 404)
    await page.goto(`/workshops/${slug}`)
    await expect(page.getByRole('heading', { name: 'Không tìm thấy lớp workshop', exact: true })).toBeVisible()
  }
})

test('S29-02 actual search filters sorting pagination and empty', async ({
  page,
  classes,
  customer,
  audit,
  request
}) => {
  test.setTimeout(60000)
  const prefix = uniqueName('S29list')
  const near = []
  for (let i = 0; i < 10; i++)
    near.push(
      await classes.create({
        name: `${prefix} L${i}`,
        startsAt: vnIso(vnDate(2), '09:00'),
        endsAt: vnIso(vnDate(2), '11:30'),
        price: 100000 + i * 1000,
        capacity: i === 0 ? 1 : 12,
        registrationDeadline: i === 1 ? new Date(Date.now() - 3600000).toISOString() : null
      })
    )
  await audit.response(
    'fill control class',
    await customer.api.post(BOOKINGS, { data: bookingBody(near[0].id, customer.user) }),
    201
  )
  const far = await classes.create({ name: `${prefix} far`, price: 999000 })
  const hidden = await classes.create({ name: `${prefix} hidden`, isActive: false })
  await page.goto('/workshops')
  await page.getByLabel('Tìm lớp workshop').fill(prefix)
  await expect(page).toHaveURL((url) => url.searchParams.get('search') === prefix)
  await expect(page.getByRole('heading', { level: 3 })).toHaveCount(9)
  await expect(page.getByText('11 lớp sắp diễn ra', { exact: false })).toBeVisible()
  const firstPage = await page.getByRole('heading', { level: 3 }).allTextContents()
  await page.getByRole('button', { name: 'Trang sau', exact: true }).click()
  await expect(page.getByRole('heading', { level: 3 })).toHaveCount(2)
  const secondPage = await page.getByRole('heading', { level: 3 }).allTextContents()
  expect([...firstPage, ...secondPage].sort()).toEqual([...near.map((w) => w.name), far.name].sort())
  expect([...firstPage, ...secondPage]).not.toContain(hidden.name)
  await page.getByRole('button', { name: '7 ngày tới', exact: true }).click()
  await expect(page).toHaveURL(
    (url) => url.searchParams.get('period') === 'week' && url.searchParams.get('search') === prefix
  )
  await expect(page.getByText('10 lớp sắp diễn ra', { exact: false })).toBeVisible()
  await page.getByLabel('Sắp xếp', { exact: true }).selectOption('price_desc')
  await expect(page.getByRole('heading', { level: 3 }).first()).toHaveText(near[9].name)
  expect(await page.getByRole('heading', { level: 3 }).allTextContents()).toEqual(
    near
      .slice(1)
      .reverse()
      .map((w) => w.name)
  )
  await page.getByLabel('Chỉ lớp còn nhận đăng ký').click()
  await expect(page.getByLabel('Chỉ lớp còn nhận đăng ký')).toBeChecked()
  await expect(page).toHaveURL(
    (url) => url.searchParams.get('available') === '1' && url.searchParams.get('period') === 'week'
  )
  await expect(page.getByRole('heading', { level: 3 })).toHaveCount(8)
  expect(await page.getByRole('heading', { level: 3 }).allTextContents()).toEqual(
    near
      .slice(2)
      .reverse()
      .map((w) => w.name)
  )
  const apiList = await audit.response(
    'matching filtered API',
    await request.get(PUBLIC_CLASSES, {
      params: { search: prefix, from: vnDate(0), to: vnDate(6), availableOnly: true, sort: 'price_desc' }
    }),
    200
  )
  expect(apiList.entries.map((w: { id: string }) => w.id)).toEqual(
    near
      .slice(2)
      .reverse()
      .map((w) => w.id)
  )
  await audit.screenshot(page, 'S29-02-filters')
  await page.getByLabel('Tìm lớp workshop').fill(uniqueName('S29nomatch'))
  await expect(page.getByText('Không có lớp nào phù hợp', { exact: true })).toBeVisible()
  await audit.screenshot(page, 'S29-02-empty')
})

test('S29-03 guest login return and successful UI booking persists', async ({
  page,
  request,
  classes,
  customer,
  audit,
  admin
}) => {
  const workshop = await classes.create()
  const before = await classes.snapshot(workshop.id)
  await page.goto(`/workshops/${workshop.slug}`)
  await audit.response(
    'guest POST denied',
    await request.post(BOOKINGS, { data: bookingBody(workshop.id, customer.user) }),
    401
  )
  await audit.response('guest personal list denied', await request.get(BOOKINGS), 401)
  expect(await classes.snapshot(workshop.id)).toEqual(before)
  await page.getByRole('link', { name: 'Đăng nhập để đăng ký', exact: true }).click()
  await expect(page).toHaveURL('/login')
  await page.getByLabel('Email hoặc số điện thoại').fill(customer.user.email)
  await page.getByLabel('Mật khẩu', { exact: true }).fill(customer.user.password)
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
  await expect(page).toHaveURL(`/workshops/${workshop.slug}`)
  await expect(page.getByLabel('Họ và tên', { exact: true })).toHaveValue(customer.user.fullName)
  await expect(page.getByLabel('Số điện thoại', { exact: true })).toHaveValue(customer.user.phone)
  expect(await classes.snapshot(workshop.id)).toEqual(before)
  const quantity = page.getByRole('spinbutton', { name: 'Số người tham gia', exact: true })
  await quantity.fill('2')
  await quantity.press('Tab')
  await page.getByLabel('Ghi chú (không bắt buộc)').fill('Đăng ký UI SCRUM29')
  const submitted = page.waitForResponse((r) => r.url().endsWith(BOOKINGS) && r.request().method() === 'POST')
  await page.getByRole('button', { name: 'Đăng ký giữ chỗ', exact: true }).click()
  const registration = await audit.response('UI booking created', await submitted, 201)
  expect(registration).toMatchObject({
    seats: 2,
    status: 'pending',
    unitPrice: 250000,
    totalPrice: 500000,
    workshop: { id: workshop.id, startsAt: workshop.startsAt, endsAt: workshop.endsAt }
  })
  expect(registration.contactEmail).toBe(customer.user.email)
  audit.note('registration belongs to authenticated customer', {
    accountMatches: true,
    registrationId: registration.id
  })
  await expect(page.getByRole('heading', { name: 'Đăng ký thành công!', exact: true })).toBeVisible()
  await expect(page.getByText(registration.code, { exact: true })).toBeVisible()
  await expect(page.getByText('Chờ xác nhận', { exact: true })).toBeVisible()
  await audit.screenshot(page, 'S29-03-confirmation')
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Bạn đã đăng ký lớp này', exact: true })).toBeVisible()
  await expect(page.getByText(registration.code, { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Đăng ký giữ chỗ', exact: true })).toHaveCount(0)
  await audit.screenshot(page, 'S29-03-after-reload')
  await page.getByRole('link', { name: 'Xem lịch workshop của tôi', exact: true }).click()
  await expect(page).toHaveURL('/account/workshops')
  await expect(page.getByText(registration.code, { exact: true })).toBeVisible()
  await expect(page.getByText('09:00 – 11:30', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByText(registration.code, { exact: true })).toBeVisible()
  await audit.screenshot(page, 'S29-03-my-workshops')
  const mine = await audit.response(
    'customer list',
    await customer.api.get(BOOKINGS, { params: { workshopId: workshop.id } }),
    200
  )
  expect(mine.entries).toHaveLength(1)
  expect(mine.entries[0]).toEqual(registration)
  const adminList = await audit.response(
    'admin reads same booking',
    await admin.get(ADMIN_BOOKINGS, { params: { workshopId: workshop.id } }),
    200
  )
  expect(adminList.entries).toHaveLength(1)
  expect(adminList.entries[0]).toEqual(registration)
  expect((await classes.snapshot(workshop.id)).workshop).toMatchObject({ bookedSeats: 2, seatsLeft: 10 })
  await audit.response(
    'replay same request',
    await customer.api.post(BOOKINGS, { data: bookingBody(workshop.id, customer.user, { seats: 2 }) }),
    409
  )
  expect((await classes.snapshot(workshop.id)).registrations.entries).toHaveLength(1)
})

test('S29-04 UI invalid contact and quantity limits do not book', async ({ page, classes, customer, audit }) => {
  const workshop = await classes.create({ capacity: 3 })
  await fillLoginForm(page, customer.user.email, customer.user.password)
  await expect(page).toHaveURL('/')
  const before = await classes.snapshot(workshop.id)
  for (const [label, value, message] of [
    ['Họ và tên', '', 'Vui lòng nhập họ và tên'],
    ['Họ và tên', '   ', 'Vui lòng nhập họ và tên'],
    ['Số điện thoại', '', 'Số điện thoại gồm 10 chữ số, bắt đầu bằng 0'],
    ['Số điện thoại', '12345', 'Số điện thoại gồm 10 chữ số, bắt đầu bằng 0'],
    ['Ghi chú (không bắt buộc)', 'x'.repeat(501), 'Ghi chú tối đa 500 ký tự']
  ]) {
    await page.goto(`/workshops/${workshop.slug}`)
    await expect(page.getByLabel('Họ và tên', { exact: true })).toHaveValue(customer.user.fullName)
    await page.getByLabel(label, { exact: true }).fill(value)
    await page.getByRole('button', { name: 'Đăng ký giữ chỗ', exact: true }).click()
    await expect(page.getByText(message, { exact: true })).toBeVisible()
    expect(await classes.snapshot(workshop.id)).toEqual(before)
    audit.note('UI rejected validation', { label, length: value.length, message, noRegistrationOrSeatChange: true })
  }
  await audit.screenshot(page, 'S29-04-validation')
  await page.goto(`/workshops/${workshop.slug}`)
  const quantity = page.getByRole('spinbutton', { name: 'Số người tham gia', exact: true })
  await expect(quantity).toHaveValue('1')
  await expect(page.getByRole('button', { name: 'Giảm số lượng', exact: true })).toBeDisabled()
  for (const [raw, expected] of [
    ['0', '1'],
    ['-1', '1'],
    ['1.5', '1'],
    ['11', '3']
  ]) {
    await quantity.fill(raw)
    await quantity.press('Tab')
    await expect(quantity).toHaveValue(expected)
    audit.note('UI quantity normalization observation', { raw, observed: expected })
  }
  await expect(page.getByRole('button', { name: 'Tăng số lượng', exact: true })).toBeDisabled()
  expect(await classes.snapshot(workshop.id)).toEqual(before)
})

const invalid = [
  { id: 'missing-workshop', patch: { workshopId: undefined } },
  { id: 'invalid-workshop', patch: { workshopId: 'not-a-uuid' } },
  { id: 'missing-name', patch: { contactName: undefined } },
  { id: 'empty-name', patch: { contactName: '' } },
  { id: 'spaces-name', patch: { contactName: '   ' } },
  { id: 'missing-phone', patch: { contactPhone: undefined } },
  { id: 'invalid-phone', patch: { contactPhone: '12345' } },
  { id: 'empty-phone', patch: { contactPhone: '' } },
  { id: 'seats-zero', patch: { seats: 0 } },
  { id: 'seats-negative', patch: { seats: -1 } },
  { id: 'seats-fraction', patch: { seats: 1.5 } },
  { id: 'seats-string', patch: { seats: '2' } },
  { id: 'seats-over-max', patch: { seats: 11 } },
  { id: 'note-over-max', patch: { note: 'x'.repeat(501) } }
]
for (const scenario of invalid) {
  test(`S29-05 API validation ${scenario.id}`, async ({ classes, customer, audit }) => {
    const workshop = await classes.create()
    const before = await classes.snapshot(workshop.id)
    const mineBefore = await audit.response('mine before', await customer.api.get(BOOKINGS), 200)
    audit.note('invalid variant', { variant: scenario.id, seats: 'seats' in scenario.patch ? scenario.patch.seats : 1 })
    await audit.response(
      'invalid booking',
      await customer.api.post(BOOKINGS, { data: bookingBody(workshop.id, customer.user, scenario.patch) }),
      422
    )
    expect(await classes.snapshot(workshop.id)).toEqual(before)
    expect(await audit.response('mine unchanged', await customer.api.get(BOOKINGS), 200)).toEqual(mineBefore)
  })
}

for (const seats of [1, 9, 10]) {
  test(`S29-06 API successful boundary seats ${seats}`, async ({ classes, customer, audit }) => {
    const workshop = await classes.create({ capacity: 10, price: seats === 1 ? 0 : 250000 })
    const payload = bookingBody(workshop.id, customer.user, { seats, note: 'x'.repeat(500) })
    const registration = await audit.response(
      'valid boundary booking',
      await customer.api.post(BOOKINGS, { data: payload }),
      201
    )
    expect(registration).toMatchObject({
      seats,
      status: 'pending',
      totalPrice: workshop.price * seats,
      workshop: { id: workshop.id }
    })
    const after = await classes.snapshot(workshop.id)
    expect(after.workshop).toMatchObject({ bookedSeats: seats, seatsLeft: 10 - seats })
    expect(after.registrations.entries).toHaveLength(1)
    expect(after.registrations.entries[0]).toEqual(registration)
  })
}

test('S29-07 default seat and UI maximum ten', async ({ page, customer, classes, audit }) => {
  const workshop = await classes.create({ capacity: 20 })
  await fillLoginForm(page, customer.user.email, customer.user.password)
  await expect(page).toHaveURL('/')
  await page.goto(`/workshops/${workshop.slug}`)
  const quantity = page.getByRole('spinbutton', { name: 'Số người tham gia', exact: true })
  await quantity.fill('11')
  await quantity.press('Tab')
  await expect(quantity).toHaveValue('10')
  await expect(page.getByRole('button', { name: 'Tăng số lượng', exact: true })).toBeDisabled()
  expect((await classes.snapshot(workshop.id)).registrations.entries).toHaveLength(0)
  const data: Record<string, unknown> = bookingBody(workshop.id, customer.user)
  delete data.seats
  const registration = await audit.response('default seats', await customer.api.post(BOOKINGS, { data }), 201)
  expect(registration.seats).toBe(1)
  expect((await classes.snapshot(workshop.id)).workshop).toMatchObject({ bookedSeats: 1, seatsLeft: 19 })
})

for (const state of [
  'full',
  'closed-deadline',
  'hidden',
  'started',
  'ended',
  'deleted',
  'missing',
  'insufficient'
] as const) {
  test(`S29-08 unavailable ${state} no record or lost seats`, async ({
    classes,
    customer,
    people,
    audit,
    page,
    admin
  }) => {
    const workshop = await classes.create({
      capacity: state === 'full' ? 1 : 3,
      isActive: state !== 'hidden',
      registrationDeadline: state === 'closed-deadline' ? new Date(Date.now() - 3600000).toISOString() : null
    })
    if (state === 'full') {
      const holder = await people.create()
      await audit.response(
        'fill last place',
        await holder.api.post(BOOKINGS, { data: bookingBody(workshop.id, holder.user) }),
        201
      )
    }
    if (state === 'started') await classes.age(workshop.id, -1, 1)
    if (state === 'ended') await classes.age(workshop.id, -3, -1)
    if (state === 'deleted')
      await audit.response('delete fixture', await admin.delete(`${ADMIN_CLASSES}/${workshop.id}`), 200)
    const missing = state === 'missing' ? randomUUID() : workshop.id
    const before = ['deleted'].includes(state) ? null : await classes.snapshot(workshop.id)
    const mineBefore = await audit.response('mine before rejected', await customer.api.get(BOOKINGS), 200)
    const expected = ['hidden', 'deleted', 'missing'].includes(state) ? 404 : 400
    await audit.response(
      'unavailable booking rejected',
      await customer.api.post(BOOKINGS, {
        data: bookingBody(missing, customer.user, { seats: state === 'insufficient' ? 4 : 1 })
      }),
      expected
    )
    if (before) expect(await classes.snapshot(workshop.id)).toEqual(before)
    else {
      await audit.response('deleted remains absent', await admin.get(`${ADMIN_CLASSES}/${workshop.id}`), 404)
      expect(
        (
          await audit.response(
            'deleted registrations empty',
            await admin.get(ADMIN_BOOKINGS, { params: { workshopId: workshop.id } }),
            200
          )
        ).entries
      ).toHaveLength(0)
    }
    expect(await audit.response('mine no additional registration', await customer.api.get(BOOKINGS), 200)).toEqual(
      mineBefore
    )
    if (state === 'insufficient') return
    await fillLoginForm(page, customer.user.email, customer.user.password)
    await expect(page).toHaveURL('/')
    await page.goto(`/workshops/${state === 'missing' ? randomUUID() : workshop.slug}`)
    if (expected === 404)
      await expect(page.getByRole('heading', { name: 'Không tìm thấy lớp workshop', exact: true })).toBeVisible()
    else
      await expect(
        page.getByRole('button', { name: state === 'full' ? 'Lớp đã hết chỗ' : 'Đã hết hạn đăng ký', exact: true })
      ).toBeDisabled()
    await audit.screenshot(page, `S29-08-${state}`)
  })
}

test('S29-09 same customer concurrent duplicate and replay', async ({ classes, customer, audit }) => {
  const workshop = await classes.create()
  const data = bookingBody(workshop.id, customer.user, { seats: 2 })
  const responses = await Promise.all([customer.api.post(BOOKINGS, { data }), customer.api.post(BOOKINGS, { data })])
  for (const [index, response] of responses.entries()) await audit.response(`simultaneous duplicate ${index}`, response)
  expect(responses.map((r) => r.status()).sort()).toEqual([201, 409])
  const beforeReplay = await classes.snapshot(workshop.id)
  expect(beforeReplay.workshop).toMatchObject({ bookedSeats: 2, seatsLeft: 10 })
  expect(beforeReplay.registrations.entries).toHaveLength(1)
  await audit.response('replay', await customer.api.post(BOOKINGS, { data }), 409)
  expect(await classes.snapshot(workshop.id)).toEqual(beforeReplay)
})

test('S29-10 two customers race for final place', async ({ classes, people, audit }) => {
  const workshop = await classes.create({ capacity: 1 })
  const actors = [await people.create(), await people.create()]
  const responses = await Promise.all(
    actors.map((actor) => actor.api.post(BOOKINGS, { data: bookingBody(workshop.id, actor.user) }))
  )
  for (const [index, response] of responses.entries()) await audit.response(`race actor ${index}`, response)
  expect(responses.map((r) => r.status()).sort()).toEqual([201, 400])
  const after = await classes.snapshot(workshop.id)
  expect(after.workshop).toMatchObject({ capacity: 1, bookedSeats: 1, seatsLeft: 0, availability: 'full' })
  expect(after.registrations.total_count).toBe(1)
  const winner = (await responses.find((r) => r.status() === 201)!.json()).data
  expect(after.registrations.entries).toEqual([winner])
  let sum = 0
  for (const [index, actor] of actors.entries()) {
    const mine = await audit.response(
      `race actor ${index} personal list`,
      await actor.api.get(BOOKINGS, { params: { workshopId: workshop.id } }),
      200
    )
    const success = responses[index].status() === 201
    expect(mine.entries).toHaveLength(success ? 1 : 0)
    if (success) expect(mine.entries[0].id).toBe(winner.id)
    sum += mine.entries.reduce((n: number, r: { seats: number }) => n + r.seats, 0)
  }
  expect(sum).toBe(1)
  audit.note('final capacity invariant', {
    requested: 2,
    successful: 1,
    denied: 1,
    bookedSeats: after.workshop.bookedSeats,
    totalPersonalSeats: sum
  })
})

test('S29-11 private calendars stay with each customer', async ({ browser, classes, people, audit }) => {
  const actors = [await people.create(), await people.create()]
  const workshops = [await classes.create(), await classes.create()]
  const registrations = []
  for (const [index, actor] of actors.entries())
    registrations.push(
      await audit.response(
        `actor ${index} own booking`,
        await actor.api.post(BOOKINGS, { data: bookingBody(workshops[index].id, actor.user) }),
        201
      )
    )
  for (const [index, actor] of actors.entries()) {
    const other = 1 - index
    const mine = await audit.response(`actor ${index} list`, await actor.api.get(BOOKINGS), 200)
    expect(mine.entries.map((r: { id: string }) => r.id)).toEqual([registrations[index].id])
    expect(mine.entries[0].contactEmail).toBe(actor.user.email)
    expect(
      (
        await audit.response(
          `actor ${index} filter other class`,
          await actor.api.get(BOOKINGS, { params: { workshopId: workshops[other].id } }),
          200
        )
      ).entries
    ).toHaveLength(0)
    const context = await browser.newContext({ locale: 'vi-VN', timezoneId: 'America/Los_Angeles' })
    try {
      const page = await context.newPage()
      await fillLoginForm(page, actor.user.email, actor.user.password)
      await expect(page).toHaveURL('/')
      await page.goto('/account/workshops')
      await expect(page.getByText(registrations[index].code, { exact: true })).toBeVisible()
      await expect(page.getByText(registrations[other].code, { exact: true })).toHaveCount(0)
      await page.reload()
      await expect(page.getByText(registrations[index].code, { exact: true })).toBeVisible()
      await expect(page.getByText(registrations[other].code, { exact: true })).toHaveCount(0)
      await audit.screenshot(page, `S29-11-private-${index}`)
    } finally {
      await context.close()
    }
    audit.note(`actor ${index} ownership`, {
      accountMatches: true,
      ownId: registrations[index].id,
      otherIdAbsent: registrations[other].id
    })
  }
})
