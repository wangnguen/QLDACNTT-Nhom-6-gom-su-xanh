import { describe, expect, it } from 'vitest'

import { WorkshopBody, RegistrationBody } from '@modules/workshop/workshop.schema'
const valid = {
  name: 'Lớp gốm',
  content: 'Nặn gốm',
  artisan: 'Nghệ nhân',
  startsAt: '2030-01-01T10:00:00+07:00',
  endsAt: '2030-01-01T12:00:00+07:00',
  capacity: 5
}
describe('Workshop validation', () => {
  it('nhận timestamp offset Việt Nam và mặc định open', () => expect(WorkshopBody.parse(valid).status).toBe('open'))
  it.each([
    { capacity: 0 },
    { capacity: 1.5 },
    { endsAt: valid.startsAt },
    { startsAt: '2030-01-01T10:00' },
    { artisan: ' ' },
    { status: 'deleted' }
  ])('từ chối %o', (patch) => expect(WorkshopBody.safeParse({ ...valid, ...patch }).success).toBe(false))
  it.each([0, -1, 1.5, 10001])('từ chối số chỗ %s', (seats) =>
    expect(RegistrationBody.safeParse({ seats }).success).toBe(false)
  )
})
