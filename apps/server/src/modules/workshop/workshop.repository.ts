import { Brackets, SelectQueryBuilder } from 'typeorm'

import { REGISTRATION_STATUS, WORKSHOP_SORT, WORKSHOP_TIME, WorkshopSort, WorkshopTime } from '@common/constants'
import { slugify } from '@common/utils/slug'

import { Workshop } from '@entities/workshop.entity'

import AppDataSource from '@databases/data-source'

export type WorkshopFilter = {
  search?: string
  isActive?: boolean
  time?: WorkshopTime
  // Trang client: chỉ lớp đang mở và chưa bắt đầu
  visibleOnly?: boolean
  // Giờ bắt đầu trong khoảng [startsFrom, startsBefore)
  startsFrom?: Date
  startsBefore?: Date
  // Chỉ lớp còn nhận đăng ký: chưa qua hạn và còn chỗ
  availableOnly?: boolean
  sort: WorkshopSort
  limit: number
  offset: number
}

type WorkshopData = Partial<
  Pick<
    Workshop,
    | 'name'
    | 'slug'
    | 'description'
    | 'instructor'
    | 'location'
    | 'startsAt'
    | 'endsAt'
    | 'registrationDeadline'
    | 'price'
    | 'capacity'
    | 'imageUrls'
    | 'isActive'
  >
>

type NewWorkshopData = WorkshopData &
  Pick<Workshop, 'name' | 'slug' | 'location' | 'startsAt' | 'endsAt' | 'price' | 'capacity' | 'imageUrls'>

const escapeLike = (value: string) => value.replace(/[\\%_]/g, (char) => `\\${char}`)

class WorkshopRepository {
  static findMany(filter: WorkshopFilter): Promise<[Workshop[], number]> {
    const query = this.workshopRepo.createQueryBuilder('workshop')

    if (filter.search) this.applySearch(query, filter.search)
    if (filter.isActive !== undefined) query.andWhere('workshop.isActive = :isActive', { isActive: filter.isActive })
    if (filter.time === WORKSHOP_TIME.UPCOMING) query.andWhere('workshop.endsAt > NOW()')
    if (filter.time === WORKSHOP_TIME.PAST) query.andWhere('workshop.endsAt <= NOW()')
    if (filter.visibleOnly) query.andWhere('workshop.isActive = true AND workshop.startsAt > NOW()')
    if (filter.startsFrom) query.andWhere('workshop.startsAt >= :startsFrom', { startsFrom: filter.startsFrom })
    if (filter.startsBefore) query.andWhere('workshop.startsAt < :startsBefore', { startsBefore: filter.startsBefore })
    if (filter.availableOnly) {
      query.andWhere('COALESCE(workshop.registrationDeadline, workshop.startsAt) > NOW()').andWhere(
        `workshop.capacity > COALESCE((
            SELECT SUM(registration.seats) FROM workshop_registrations registration
            WHERE registration.workshop_id = workshop.id
              AND registration.status <> :cancelled AND registration.deleted_at IS NULL
          ), 0)`,
        { cancelled: REGISTRATION_STATUS.CANCELLED }
      )
    }

    this.applySort(query, filter.sort)
    return query.skip(filter.offset).take(filter.limit).getManyAndCount()
  }

  static findById(id: string) {
    return this.workshopRepo.findOne({ where: { id } })
  }

  // Lớp khách được xem: đang mở (lớp đã diễn ra vẫn xem được, chỉ không đăng ký được)
  static findVisibleBySlug(slug: string) {
    return this.workshopRepo.findOne({ where: { slug, isActive: true } })
  }

  // Các slug đang dùng có dạng `base` hoặc `base-<số>` (bỏ qua lớp `excludeId` khi đang sửa chính nó)
  static async findSlugsWithBase(base: string, excludeId?: string): Promise<string[]> {
    const query = this.workshopRepo
      .createQueryBuilder('workshop')
      .select('workshop.slug', 'slug')
      .where('(workshop.slug = :base OR workshop.slug LIKE :pattern)', { base, pattern: `${escapeLike(base)}-%` })
    if (excludeId) query.andWhere('workshop.id != :excludeId', { excludeId })

    const rows = await query.getRawMany<{ slug: string }>()
    return rows.map((row) => row.slug)
  }

  static create(data: NewWorkshopData) {
    return this.workshopRepo.save(this.workshopRepo.create(data))
  }

  static async update(id: string, data: WorkshopData) {
    await this.workshopRepo.update(id, data)
    return this.workshopRepo.findOneOrFail({ where: { id } })
  }

  static softDelete(id: string) {
    return this.workshopRepo.softDelete(id)
  }

  // Tìm theo tên có dấu ("vuốt gốm") hoặc không dấu ("vuot gom") — bản không dấu so với slug
  private static applySearch(query: SelectQueryBuilder<Workshop>, search: string) {
    const slugKeyword = slugify(search)
    query.andWhere(
      new Brackets((where) => {
        where.where('workshop.name ILIKE :keyword', { keyword: `%${escapeLike(search)}%` })
        if (slugKeyword) where.orWhere('workshop.slug LIKE :slugKeyword', { slugKeyword: `%${slugKeyword}%` })
      })
    )
  }

  private static applySort(query: SelectQueryBuilder<Workshop>, sort: WorkshopSort) {
    switch (sort) {
      case WORKSHOP_SORT.START_DESC:
        query.orderBy('workshop.startsAt', 'DESC')
        break
      case WORKSHOP_SORT.PRICE_ASC:
        query.orderBy('workshop.price', 'ASC')
        break
      case WORKSHOP_SORT.PRICE_DESC:
        query.orderBy('workshop.price', 'DESC')
        break
      case WORKSHOP_SORT.NEWEST:
        query.orderBy('workshop.createdAt', 'DESC')
        break
      default:
        query.orderBy('workshop.startsAt', 'ASC')
    }
    // Thứ tự ổn định giữa các trang khi giá trị sắp xếp bằng nhau
    query.addOrderBy('workshop.id', 'ASC')
  }

  private static get workshopRepo() {
    return AppDataSource.getDataSource().getRepository(Workshop)
  }
}

export default WorkshopRepository
