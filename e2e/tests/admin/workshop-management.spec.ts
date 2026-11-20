import { randomUUID } from 'node:crypto'
import { expect } from '@playwright/test'
import { authenticatedApi, uniqueName } from '../../support/catalog'
import { ADMIN_ACCOUNT } from '../../support/config'
import { createVerifiedUser, fillLoginForm } from '../../support/helpers'
import { test, WORKSHOPS, fillWorkshop, futureDate, iso, workshopBody } from '../../support/workshop-management'

test.use({ timezoneId: 'America/Los_Angeles' })

test('S98-01 UI create edit cancel timezone and isolation', async ({ page, admin, audit, classes }) => {
  test.setTimeout(90000)
  const other = await classes.create()
  const otherBefore = await audit.response('other before', await admin.get(`${WORKSHOPS}/${other.id}`), 200)
  const name = uniqueName('SCRUM98 UI')
  await fillLoginForm(page, ADMIN_ACCOUNT.email, ADMIN_ACCOUNT.password)
  await expect(page).toHaveURL('/')
  await page.getByRole('link', { name: 'Workshop', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Lớp workshop', exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'Thêm lớp', exact: true }).click()
  await fillWorkshop(page, name)
  const createdResponse = page.waitForResponse((r) => r.url().endsWith(WORKSHOPS) && r.request().method() === 'POST')
  await page.getByRole('button', { name: 'Thêm lớp', exact: true }).click()
  const created = await audit.response('UI create', await createdResponse, 201)
  classes.track(created.id)
  const expected = { ...workshopBody(), name }
  await expect(page).toHaveURL('/workshops')
  await page.getByLabel('Tìm lớp', { exact: true }).fill(name)
  const row = page.getByRole('row').filter({ has: page.getByRole('link', { name, exact: true }) })
  await expect(row).toContainText('09:00 – 11:00')
  await expect(row).toContainText(futureDate().split('-').reverse().join('/'))
  await expect(row).toContainText('Nghệ nhân kiểm thử Hưng')
  await expect(row).toContainText('0/12')
  await audit.screenshot(page, 'S98-01-created-list')
  expect(await audit.response('read created', await admin.get(`${WORKSHOPS}/${created.id}`), 200)).toMatchObject(
    expected
  )
  await page.getByRole('link', { name: `Sửa ${name}`, exact: true }).click()
  await page.reload()
  await expect(page.getByLabel('Ngày học', { exact: true })).toHaveValue(futureDate())
  await expect(page.getByLabel('Giờ bắt đầu', { exact: true })).toHaveValue('09:00')
  await expect(page.getByLabel('Giờ kết thúc', { exact: true })).toHaveValue('11:00')
  await expect(page.getByLabel('Người hướng dẫn', { exact: true })).toHaveValue(expected.instructor)
  await expect(page.getByLabel('Số chỗ', { exact: true })).toHaveValue('12')
  await audit.screenshot(page, 'S98-01-created-detail')

  const edits = [
    {
      label: 'Người hướng dẫn',
      value: 'Nghệ nhân thay thế SCRUM98',
      patch: { instructor: 'Nghệ nhân thay thế SCRUM98' }
    },
    {
      label: 'Ngày học',
      value: futureDate(16),
      patch: { startsAt: iso(futureDate(16), '09:00'), endsAt: iso(futureDate(16), '11:00') }
    },
    { label: 'Giờ bắt đầu', value: '09:30', patch: { startsAt: iso(futureDate(16), '09:30') } },
    { label: 'Giờ kết thúc', value: '12:00', patch: { endsAt: iso(futureDate(16), '12:00') } },
    { label: 'Số chỗ', value: '18', patch: { capacity: 18 } }
  ]
  for (const edit of edits) {
    await test.step(`S98-02 ${edit.label}`, async () => {
      await page.getByLabel(edit.label, { exact: true }).fill(edit.value)
      await page.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click()
      await expect(page).toHaveURL(/\/workshops(?:\?.*)?$/)
      Object.assign(expected, edit.patch)
      expect(
        await audit.response(`after edit ${edit.label}`, await admin.get(`${WORKSHOPS}/${created.id}`), 200)
      ).toMatchObject(expected)
      expect(await audit.response('other unchanged', await admin.get(`${WORKSHOPS}/${other.id}`), 200)).toEqual(
        otherBefore
      )
      await page.goto(`/workshops/${created.id}/edit`)
      await page.reload()
      await expect(page.getByLabel(edit.label, { exact: true })).toHaveValue(edit.value)
    })
  }
  await audit.screenshot(page, 'S98-02-updated-detail')
  await page.getByLabel('Số chỗ', { exact: true }).fill('19')
  await page.getByRole('link', { name: 'Huỷ', exact: true }).click()
  await expect(page).toHaveURL('/workshops')
  expect(
    await audit.response('S98-03 cancel unchanged', await admin.get(`${WORKSHOPS}/${created.id}`), 200)
  ).toMatchObject(expected)
  await page.goto(`/workshops?search=${encodeURIComponent(name)}`)
  await expect(row).toContainText('09:30 – 12:00')
  await expect(row).toContainText('0/18')
  await audit.screenshot(page, 'S98-02-updated-list')
})

test('S98-04 UI validation no persisted changes', async ({ page, admin, audit, classes }) => {
  const original = await classes.create()
  const before = await audit.response('before', await admin.get(`${WORKSHOPS}/${original.id}`), 200)
  await fillLoginForm(page, ADMIN_ACCOUNT.email, ADMIN_ACCOUNT.password)
  await expect(page).toHaveURL('/')
  const cases = [
    ['Tên lớp', '', 'Vui lòng nhập tên lớp'],
    ['Tên lớp', '   ', 'Vui lòng nhập tên lớp'],
    ['Địa điểm', '   ', 'Vui lòng nhập địa điểm'],
    ['Ngày học', '', 'Vui lòng chọn ngày học'],
    ['Giờ bắt đầu', '', 'Vui lòng chọn giờ bắt đầu'],
    ['Giờ kết thúc', '', 'Vui lòng chọn giờ kết thúc'],
    ['Giờ kết thúc', '09:00', 'Giờ kết thúc phải sau giờ bắt đầu'],
    ['Giờ kết thúc', '08:59', 'Giờ kết thúc phải sau giờ bắt đầu'],
    ['Số chỗ', '', 'Vui lòng nhập số chỗ'],
    ['Số chỗ', '0', 'Lớp phải có ít nhất 1 chỗ'],
    ['Số chỗ', '-1', 'Lớp phải có ít nhất 1 chỗ'],
    ['Số chỗ', '1.5', 'Số chỗ phải là số nguyên'],
    ['Số chỗ', '201', 'Số chỗ tối đa 200']
  ]
  for (const [label, value, message] of cases) {
    await test.step(`${label}=${JSON.stringify(value)}`, async () => {
      await page.goto(`/workshops/${original.id}/edit`)
      await expect(page.getByLabel('Tên lớp', { exact: true })).toHaveValue(original.name)
      await page.getByLabel(label, { exact: true }).fill(value)
      await page.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click()
      await expect(page.getByText(message, { exact: true })).toBeVisible()
      expect(
        await audit.response(
          `${label}=${JSON.stringify(value)} readback`,
          await admin.get(`${WORKSHOPS}/${original.id}`),
          200
        )
      ).toEqual(before)
      if (label === 'Số chỗ' && value === '201') await audit.screenshot(page, 'S98-04-validation-capacity')
    })
  }
})

const invalidCases: { id: string; patch: Record<string, unknown>; status: number }[] = [
  { id: 'name-empty', patch: { name: '' }, status: 422 },
  { id: 'name-spaces', patch: { name: '   ' }, status: 422 },
  { id: 'location-empty', patch: { location: '' }, status: 422 },
  { id: 'location-spaces', patch: { location: '   ' }, status: 422 },
  { id: 'date-invalid', patch: { startsAt: 'not-a-date' }, status: 422 },
  { id: 'date-impossible', patch: { startsAt: '2030-02-30T09:00:00+07:00' }, status: 422 },
  { id: 'time-invalid', patch: { startsAt: '2030-12-01T25:61:00+07:00' }, status: 422 },
  { id: 'timezone-missing', patch: { startsAt: '2030-12-01T09:00:00' }, status: 422 },
  { id: 'end-equal', patch: { endsAt: iso(futureDate(), '09:00') }, status: 400 },
  { id: 'end-before', patch: { endsAt: iso(futureDate(), '08:59') }, status: 400 },
  { id: 'capacity-zero', patch: { capacity: 0 }, status: 422 },
  { id: 'capacity-negative', patch: { capacity: -1 }, status: 422 },
  { id: 'capacity-fraction', patch: { capacity: 1.5 }, status: 422 },
  { id: 'capacity-over-max', patch: { capacity: 201 }, status: 422 },
  { id: 'instructor-over-max', patch: { instructor: 'N'.repeat(101) }, status: 422 },
  { id: 'duration-over-12h', patch: { endsAt: iso(futureDate(), '21:01') }, status: 400 },
  { id: 'deadline-after-start', patch: { registrationDeadline: iso(futureDate(), '09:01') }, status: 400 },
  {
    id: 'past-start',
    patch: { startsAt: iso(futureDate(-2), '09:00'), endsAt: iso(futureDate(-2), '11:00') },
    status: 400
  }
]
for (const scenario of invalidCases) {
  test(`S98-05 API ${scenario.id}`, async ({ admin, audit, classes }) => {
    audit.note('validation input and oracle', scenario)
    const original = await classes.create()
    const before = await audit.response('before', await admin.get(`${WORKSHOPS}/${original.id}`), 200)
    const invalid = workshopBody({ ...scenario.patch, name: scenario.patch.name ?? uniqueName('SCRUM98 invalid') })
    await audit.response('invalid create', await admin.post(WORKSHOPS, { data: invalid }), scenario.status)
    const list = await audit.response(
      'no invalid create persisted',
      await admin.get(WORKSHOPS, { params: { search: invalid.name } }),
      200
    )
    expect(
      list.entries.some(
        (entry: { id: string; name: string }) => entry.id !== original.id && entry.name === invalid.name
      )
    ).toBe(false)
    await audit.response(
      'invalid update',
      await admin.patch(`${WORKSHOPS}/${original.id}`, { data: scenario.patch }),
      scenario.status
    )
    expect(await audit.response('readback unchanged', await admin.get(`${WORKSHOPS}/${original.id}`), 200)).toEqual(
      before
    )
  })
}

test('S98-06 API required fields and empty patch', async ({ admin, audit, classes }) => {
  const original = await classes.create()
  const before = await audit.response('before', await admin.get(`${WORKSHOPS}/${original.id}`), 200)
  for (const field of ['name', 'location', 'startsAt', 'endsAt', 'price', 'capacity']) {
    const body: Record<string, unknown> = workshopBody()
    delete body[field]
    const countBefore = await audit.response(`count before missing ${field}`, await admin.get(WORKSHOPS), 200)
    await audit.response(`missing ${field}`, await admin.post(WORKSHOPS, { data: body }), 422)
    const after = await audit.response(`count after missing ${field}`, await admin.get(WORKSHOPS), 200)
    // Tên fixture riêng: xác minh không tạo bản ghi, không phụ thuộc tổng số lớp của worker khác.
    if (body.name) {
      const matches = await audit.response(
        `search missing ${field}`,
        await admin.get(WORKSHOPS, { params: { search: String(body.name) } }),
        200
      )
      expect(matches.entries).toHaveLength(0)
    }
    audit.note('global counts observational under parallel workers', [countBefore.total_count, after.total_count])
  }
  await audit.response('empty patch', await admin.patch(`${WORKSHOPS}/${original.id}`, { data: {} }), 422)
  expect(await audit.response('readback', await admin.get(`${WORKSHOPS}/${original.id}`), 200)).toEqual(before)
})

for (const capacity of [1, 2, 199, 200]) {
  test(`S98-07 API valid capacity ${capacity}`, async ({ admin, audit, classes }) => {
    const original = await classes.create({ capacity })
    expect(
      await audit.response('capacity readback', await admin.get(`${WORKSHOPS}/${original.id}`), 200)
    ).toMatchObject({ capacity, seatsLeft: capacity, bookedSeats: 0 })
    await audit.response(
      'capacity patch',
      await admin.patch(`${WORKSHOPS}/${original.id}`, { data: { capacity } }),
      200
    )
  })
}

test('S98-08 API documented boundary duration and optional instructor', async ({ admin, audit, classes }) => {
  const original = await classes.create({
    endsAt: iso(futureDate(), '21:00'),
    registrationDeadline: iso(futureDate(), '09:00'),
    instructor: 'N'.repeat(100)
  })
  expect(await audit.response('12h readback', await admin.get(`${WORKSHOPS}/${original.id}`), 200)).toMatchObject({
    instructor: 'N'.repeat(100),
    endsAt: iso(futureDate(), '21:00')
  })
  for (const instructor of ['', '   ', null]) {
    await audit.response(
      'optional instructor patch',
      await admin.patch(`${WORKSHOPS}/${original.id}`, { data: { instructor } }),
      200
    )
    expect(
      await audit.response('optional instructor readback', await admin.get(`${WORKSHOPS}/${original.id}`), 200)
    ).toMatchObject({ instructor: null })
  }
})

for (const actor of ['guest', 'customer'] as const) {
  test(`S98-09 authorization ${actor}`, async ({ request, admin, audit, classes, page }) => {
    const original = await classes.create()
    const before = await audit.response('before', await admin.get(`${WORKSHOPS}/${original.id}`), 200)
    const customer = actor === 'customer' ? await authenticatedApi(await createVerifiedUser(), false) : undefined
    const api = customer ?? request
    const denied = actor === 'guest' ? 401 : 403
    const name = uniqueName('SCRUM98 denied')
    try {
      await audit.response('denied list', await api.get(WORKSHOPS), denied)
      await audit.response('denied detail', await api.get(`${WORKSHOPS}/${original.id}`), denied)
      await audit.response('denied create', await api.post(WORKSHOPS, { data: workshopBody({ name }) }), denied)
      await audit.response(
        'denied patch',
        await api.patch(`${WORKSHOPS}/${original.id}`, { data: { capacity: 1, instructor: 'Denied' } }),
        denied
      )
      await audit.response('denied delete', await api.delete(`${WORKSHOPS}/${original.id}`), denied)
      expect(await audit.response('unchanged', await admin.get(`${WORKSHOPS}/${original.id}`), 200)).toEqual(before)
      expect(
        (await audit.response('denied create absent', await admin.get(WORKSHOPS, { params: { search: name } }), 200))
          .entries
      ).toHaveLength(0)
      await page.goto('/workshops')
      await expect(page).toHaveURL('/login')
    } finally {
      await customer?.dispose()
    }
  })
}

test('S98-10 UI hide reopen delete unregistered class', async ({ page, admin, audit, classes }) => {
  const original = await classes.create()
  await fillLoginForm(page, ADMIN_ACCOUNT.email, ADMIN_ACCOUNT.password)
  await expect(page).toHaveURL('/')
  await page.goto(`/workshops?search=${encodeURIComponent(original.name)}`)
  const toggle = page.getByRole('switch', { name: `Mở ${original.name}`, exact: true })
  for (const active of [false, true]) {
    const changed = page.waitForResponse(
      (r) => r.url().endsWith(`${WORKSHOPS}/${original.id}`) && r.request().method() === 'PATCH'
    )
    await toggle.click()
    await audit.response('UI toggle', await changed, 200)
    await page.reload()
    await expect(toggle).toHaveAttribute('aria-checked', String(active))
    expect(await audit.response('admin readback', await admin.get(`${WORKSHOPS}/${original.id}`), 200)).toMatchObject({
      isActive: active
    })
    await audit.response('public visibility', await admin.get(`/api/v1/workshops/${original.slug}`), active ? 200 : 404)
  }
  await page.getByRole('button', { name: `Xoá ${original.name}`, exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Huỷ', exact: true }).click()
  await audit.response('cancel delete preserved', await admin.get(`${WORKSHOPS}/${original.id}`), 200)
  await page.getByRole('button', { name: `Xoá ${original.name}`, exact: true }).click()
  const deleted = page.waitForResponse(
    (r) => r.url().endsWith(`${WORKSHOPS}/${original.id}`) && r.request().method() === 'DELETE'
  )
  await page.getByRole('dialog').getByRole('button', { name: 'Xoá', exact: true }).click()
  await audit.response('UI deleted', await deleted, 200)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.reload()
  await expect(page.getByText('Không có lớp nào khớp bộ lọc', { exact: true })).toBeVisible()
  await audit.response('deleted absent admin', await admin.get(`${WORKSHOPS}/${original.id}`), 404)
  await audit.response('deleted absent public', await admin.get(`/api/v1/workshops/${original.slug}`), 404)
  await audit.screenshot(page, 'S98-10-deleted-filter-empty')
})

test('S98-11 existing registrations capacity schedule hide and history', async ({ page, admin, audit, classes }) => {
  test.setTimeout(60000)
  const original = await classes.create({ capacity: 5 })
  const user = await createVerifiedUser()
  const customer = await authenticatedApi(user, false)
  try {
    const response = await customer.post('/api/v1/workshop-registrations', {
      data: { workshopId: original.id, seats: 3, contactName: user.fullName, contactPhone: user.phone }
    })
    expect(response.status(), await response.text()).toBe(201)
    const registration = (await response.json()).data
    const readRegistration = async (label: string) => {
      const response = await customer.get('/api/v1/workshop-registrations')
      expect(response.status()).toBe(200)
      const entry = (await response.json()).data.entries.find((r: { id: string }) => r.id === registration.id)
      expect(entry).toBeTruthy()
      const safe = {
        id: entry.id,
        seats: entry.seats,
        status: entry.status,
        unitPrice: entry.unitPrice,
        totalPrice: entry.totalPrice,
        workshop: entry.workshop
      }
      audit.note(label, { status: response.status(), data: safe })
      return safe
    }
    const regBefore = await readRegistration('registration before')
    const before = await audit.response('class before', await admin.get(`${WORKSHOPS}/${original.id}`), 200)
    expect(before).toMatchObject({ bookedSeats: 3, seatsLeft: 2 })
    await fillLoginForm(page, ADMIN_ACCOUNT.email, ADMIN_ACCOUNT.password)
    await expect(page).toHaveURL('/')
    await page.goto(`/workshops/${original.id}/edit`)
    await page.getByLabel('Số chỗ', { exact: true }).fill('2')
    await page.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click()
    await expect(page.getByText('Lớp đã có 3 chỗ được đặt, số chỗ không được nhỏ hơn 3', { exact: true })).toBeVisible()
    expect(
      await audit.response('failed reduction unchanged', await admin.get(`${WORKSHOPS}/${original.id}`), 200)
    ).toEqual(before)
    await audit.screenshot(page, 'S98-11-booked-capacity-rejected')
    await page.getByLabel('Số chỗ', { exact: true }).fill('3')
    await page.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click()
    await expect(page).toHaveURL('/workshops')
    expect(
      await audit.response('capacity equals booked', await admin.get(`${WORKSHOPS}/${original.id}`), 200)
    ).toMatchObject({ capacity: 3, seatsLeft: 0, bookedSeats: 3 })
    await page.goto(`/workshops/${original.id}/edit`)
    await page.getByLabel('Ngày học', { exact: true }).fill(futureDate(18))
    await page.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click()
    await expect(page).toHaveURL('/workshops')
    const moved = await audit.response(
      'schedule changed with bookings',
      await admin.get(`${WORKSHOPS}/${original.id}`),
      200
    )
    expect(moved).toMatchObject({ startsAt: iso(futureDate(18), '09:00'), endsAt: iso(futureDate(18), '11:00') })
    expect(await readRegistration('registration after schedule')).toEqual({
      ...regBefore,
      workshop: { ...regBefore.workshop, startsAt: moved.startsAt, endsAt: moved.endsAt }
    })
    await page.goto(`/workshops?search=${encodeURIComponent(original.name)}`)
    await page.getByRole('button', { name: `Xoá ${original.name}`, exact: true }).click()
    await expect(page.getByRole('dialog').getByRole('button', { name: 'Xoá', exact: true })).toBeDisabled()
    await audit.screenshot(page, 'S98-11-booked-delete-disabled')
    await page.getByRole('dialog').getByRole('button', { name: 'Huỷ', exact: true }).click()
    await audit.response('delete with registration', await admin.delete(`${WORKSHOPS}/${original.id}`), 409)
    expect(
      await audit.response('failed delete unchanged', await admin.get(`${WORKSHOPS}/${original.id}`), 200)
    ).toEqual(moved)
    const hidden = page.waitForResponse(
      (r) => r.url().endsWith(`${WORKSHOPS}/${original.id}`) && r.request().method() === 'PATCH'
    )
    await page.getByRole('switch', { name: `Mở ${original.name}`, exact: true }).click()
    await audit.response('hide booked UI', await hidden, 200)
    await page.reload()
    await expect(page.getByRole('switch', { name: `Mở ${original.name}`, exact: true })).toHaveAttribute(
      'aria-checked',
      'false'
    )
    await audit.response('hidden public', await admin.get(`/api/v1/workshops/${original.slug}`), 404)
    expect(await readRegistration('hidden class keeps registration')).toMatchObject({
      status: 'pending',
      seats: 3,
      unitPrice: 350000,
      totalPrice: 1050000
    })
    const cancelled = await customer.patch(`/api/v1/workshop-registrations/${registration.id}/cancel`, {
      data: { reason: 'Kết thúc fixture SCRUM98' }
    })
    expect(cancelled.status(), await cancelled.text()).toBe(200)
    expect(await readRegistration('cancelled history')).toMatchObject({ status: 'cancelled', seats: 3 })
    await audit.response('delete with cancelled history', await admin.delete(`${WORKSHOPS}/${original.id}`), 409)
    await page.reload()
    await page.getByRole('button', { name: `Xoá ${original.name}`, exact: true }).click()
    await expect(page.getByRole('dialog').getByRole('button', { name: 'Xoá', exact: true })).toBeEnabled()
    const historyDelete = page.waitForResponse(
      (r) => r.url().endsWith(`${WORKSHOPS}/${original.id}`) && r.request().method() === 'DELETE'
    )
    await page.getByRole('dialog').getByRole('button', { name: 'Xoá', exact: true }).click()
    await audit.response('UI delete cancelled history rejected', await historyDelete, 409)
    await expect(
      page.getByText('Lớp đã có 1 lượt đăng ký nên không xoá được. Hãy ẩn lớp để khách không thấy nữa', { exact: true })
    ).toBeVisible()
    await audit.screenshot(page, 'S98-11-cancelled-history-delete-rejected')
    await page.getByRole('dialog').getByRole('button', { name: 'Huỷ', exact: true }).click()
    expect(
      await audit.response('class history retained', await admin.get(`${WORKSHOPS}/${original.id}`), 200)
    ).toMatchObject({ bookedSeats: 0, capacity: 3, isActive: false })
  } finally {
    await customer.dispose()
  }
})

test('S98-12 missing class and filtered empty UI', async ({ page, admin, audit }) => {
  const missing = randomUUID()
  for (const [method, response] of [
    ['GET', await admin.get(`${WORKSHOPS}/${missing}`)],
    ['PATCH', await admin.patch(`${WORKSHOPS}/${missing}`, { data: { capacity: 2 } })],
    ['DELETE', await admin.delete(`${WORKSHOPS}/${missing}`)]
  ] as const)
    await audit.response(`missing ${method}`, response, 404)
  await fillLoginForm(page, ADMIN_ACCOUNT.email, ADMIN_ACCOUNT.password)
  await expect(page).toHaveURL('/')
  await page.goto(`/workshops/${missing}/edit`)
  await expect(page.getByText('Không tìm thấy lớp workshop', { exact: true })).toBeVisible()
  await page.goto(`/workshops?search=${uniqueName('NoMatchSCRUM98')}`)
  await expect(page.getByText('Không có lớp nào khớp bộ lọc', { exact: true })).toBeVisible()
  await audit.screenshot(page, 'S98-12-empty-filter')
})

test('S98-13 observe overlapping classes same instructor pending AC', async ({ admin, audit, classes }) => {
  const original = await classes.create()
  const before = await audit.response('original', await admin.get(`${WORKSHOPS}/${original.id}`), 200)
  const response = await admin.post(WORKSHOPS, {
    data: workshopBody({ startsAt: original.startsAt, endsAt: original.endsAt, instructor: original.instructor })
  })
  const body = await response.json()
  if (response.status() === 201) classes.track(body.data.id)
  const observed = await audit.response('OBSERVATION overlap no business oracle', response)
  audit.note('needs Canh decision', { status: response.status(), data: observed })
  // Không áp đặt đúng/sai cho việc chấp nhận lịch trùng khi chưa có AC.
  expect(response.status()).toBeLessThan(500)
  expect(await audit.response('original unchanged', await admin.get(`${WORKSHOPS}/${original.id}`), 200)).toEqual(
    before
  )
})

test('S98-14 UI required create and cancel new class', async ({ page, admin, audit }) => {
  await fillLoginForm(page, ADMIN_ACCOUNT.email, ADMIN_ACCOUNT.password)
  await expect(page).toHaveURL('/')
  await page.goto('/workshops/new')
  await page.getByRole('button', { name: 'Thêm lớp', exact: true }).click()
  for (const message of [
    'Vui lòng nhập tên lớp',
    'Vui lòng nhập địa điểm',
    'Vui lòng chọn ngày học',
    'Vui lòng chọn giờ bắt đầu',
    'Vui lòng chọn giờ kết thúc',
    'Vui lòng nhập học phí',
    'Vui lòng nhập số chỗ'
  ]) {
    await expect(page.getByText(message, { exact: true })).toBeVisible()
  }
  await audit.screenshot(page, 'S98-14-required-create')
  const name = uniqueName('SCRUM98 cancelled draft')
  await fillWorkshop(page, name)
  await page.getByRole('link', { name: 'Huỷ', exact: true }).click()
  await expect(page).toHaveURL('/workshops')
  expect(
    (await audit.response('cancelled draft not created', await admin.get(WORKSHOPS, { params: { search: name } }), 200))
      .entries
  ).toHaveLength(0)
})
