import { EntityManager } from 'typeorm'

import { BadRequestError, ConflictError, NotFoundError } from '@common/errors'

import DB from '@databases/data-source'

import { WorkshopInput } from './workshop.schema'

const view = `SELECT w.*, COALESCE(SUM(r.seats) FILTER(WHERE r.status='confirmed'),0)::int AS booked,
  w.capacity-COALESCE(SUM(r.seats) FILTER(WHERE r.status='confirmed'),0)::int AS remaining
  FROM workshops w LEFT JOIN workshop_registrations r ON r.workshop_id=w.id`

export default class WorkshopService {
  static list(admin = false) {
    return DB.getDataSource().query(
      `${view} ${admin ? '' : "WHERE w.status='open' AND w.starts_at > now()"} GROUP BY w.id ORDER BY w.starts_at,w.id`
    )
  }
  static async lock(m: EntityManager, id: string) {
    const [w] = await m.query('SELECT * FROM workshops WHERE id=$1 FOR UPDATE', [id])
    if (!w) throw new NotFoundError('Không tìm thấy lớp')
    return w
  }
  static async create(v: WorkshopInput) {
    if (Date.parse(v.startsAt) <= Date.now()) throw new BadRequestError('Lịch phải ở tương lai')
    const [w] = await DB.getDataSource().query(
      `INSERT INTO workshops(name,content,artisan,starts_at,ends_at,capacity,status)
      VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [v.name, v.content, v.artisan, v.startsAt, v.endsAt, v.capacity, v.status]
    )
    return w
  }
  static update(id: string, v: WorkshopInput) {
    return DB.getDataSource().transaction(async (m) => {
      const w = await this.lock(m, id)
      const [{ booked }] = await m.query(
        "SELECT COALESCE(SUM(seats),0)::int AS booked FROM workshop_registrations WHERE workshop_id=$1 AND status='confirmed'",
        [id]
      )
      if (v.capacity < booked) throw new ConflictError('Sức chứa nhỏ hơn số chỗ đã đăng ký')
      if (
        booked &&
        (new Date(w.starts_at).getTime() !== Date.parse(v.startsAt) ||
          new Date(w.ends_at).getTime() !== Date.parse(v.endsAt))
      ) {
        throw new ConflictError('Không đổi lịch khi có đăng ký; hãy hủy lớp và tạo lịch mới')
      }
      if (w.status === 'cancelled' && v.status !== 'cancelled') throw new ConflictError('Không mở lại lớp đã hủy')
      if (v.status === 'open' && Date.parse(v.startsAt) <= Date.now())
        throw new BadRequestError('Lịch phải ở tương lai')
      const [updated] = await m.query(
        `UPDATE workshops SET name=$2,content=$3,artisan=$4,starts_at=$5,ends_at=$6,capacity=$7,status=$8,updated_at=now() WHERE id=$1 RETURNING *`,
        [id, v.name, v.content, v.artisan, v.startsAt, v.endsAt, v.capacity, v.status]
      )
      return updated
    })
  }
  static register(id: string, userId: string, seats: number) {
    return DB.getDataSource().transaction(async (m) => {
      const w = await this.lock(m, id)
      if (w.status !== 'open' || new Date(w.starts_at).getTime() <= Date.now())
        throw new ConflictError('Lớp không còn nhận đăng ký')
      const [existing] = await m.query('SELECT * FROM workshop_registrations WHERE workshop_id=$1 AND user_id=$2', [
        id,
        userId
      ])
      if (existing?.status === 'confirmed') {
        if (existing.seats === seats) return existing
        throw new ConflictError('Bạn đã đăng ký lớp này')
      }
      const [{ booked }] = await m.query(
        "SELECT COALESCE(SUM(seats),0)::int AS booked FROM workshop_registrations WHERE workshop_id=$1 AND status='confirmed'",
        [id]
      )
      if (booked + seats > w.capacity) throw new ConflictError('Lớp không đủ chỗ')
      const [r] = await m.query(
        `INSERT INTO workshop_registrations(workshop_id,user_id,seats) VALUES($1,$2,$3)
        ON CONFLICT(workshop_id,user_id) DO UPDATE SET seats=$3,status='confirmed',updated_at=now() RETURNING *`,
        [id, userId, seats]
      )
      return r
    })
  }
  static registrations(workshopId?: string, search = '', status?: string) {
    return DB.getDataSource().query(
      `SELECT r.*, w.name AS workshop_name,w.status AS workshop_status,w.starts_at,
      u.full_name,u.email,u.phone FROM workshop_registrations r
      JOIN workshops w ON w.id=r.workshop_id JOIN users u ON u.id=r.user_id
      WHERE ($1::uuid IS NULL OR r.workshop_id=$1)
      AND ($3::text IS NULL OR r.status=$3)
      AND (u.full_name ILIKE $2 OR u.email ILIKE $2 OR COALESCE(u.phone,'') ILIKE $2)
      ORDER BY r.created_at DESC,r.id`,
      [workshopId ?? null, `%${search}%`, status ?? null]
    )
  }
  static cancel(id: string) {
    return DB.getDataSource().transaction(async (m) => {
      const [r] = await m.query('SELECT workshop_id FROM workshop_registrations WHERE id=$1', [id])
      if (!r) throw new NotFoundError('Không tìm thấy đăng ký')
      await this.lock(m, r.workshop_id)
      const [updated] = await m.query(
        "UPDATE workshop_registrations SET status='cancelled',updated_at=now() WHERE id=$1 RETURNING *",
        [id]
      )
      return updated
    })
  }
}
