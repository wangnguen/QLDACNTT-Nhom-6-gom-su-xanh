import { MAX_WORKSHOP_DURATION_HOURS, WORKSHOP_STATUS } from '@common/constants'
import { BadRequestError, NotFoundError } from '@common/errors'
import { Paginated, WorkshopDetail, WorkshopSummary } from '@common/types'
import { nextAvailableSlug, slugify } from '@common/utils/slug'

import { Workshop } from '@entities/workshop.entity'

import { AdminWorkshopQuery, CreateWorkshopBody, UpdateWorkshopBody } from './dto'
import { toWorkshopDetail, toWorkshopSummary } from './workshop.mapper'
import WorkshopRepository from './workshop.repository'

export const WORKSHOP_NOT_FOUND_MESSAGE = 'Không tìm thấy lớp workshop'

type WorkshopSchedule = Pick<Workshop, 'startsAt' | 'endsAt' | 'registrationDeadline'>

const HOUR_MS = 60 * 60 * 1000

class WorkshopService {
  // US-11: Danh sách lớp ở trang admin (gồm cả lớp đang ẩn và lớp đã kết thúc)
  static async listForAdmin({ status, ...query }: AdminWorkshopQuery): Promise<Paginated<WorkshopSummary>> {
    const isActive = status === undefined ? undefined : status === WORKSHOP_STATUS.ACTIVE
    const [workshops, total] = await WorkshopRepository.findMany({ ...query, isActive })

    return { limit: query.limit, offset: query.offset, total_count: total, entries: workshops.map(toWorkshopSummary) }
  }

  static async getForAdmin(id: string): Promise<WorkshopDetail> {
    return toWorkshopDetail(await this.findOrThrow(id))
  }

  static async create(dto: CreateWorkshopBody): Promise<WorkshopDetail> {
    this.ensureValidSchedule(
      { startsAt: dto.startsAt, endsAt: dto.endsAt, registrationDeadline: dto.registrationDeadline ?? null },
      true
    )

    const slug = await this.generateSlug(dto.name)
    const workshop = await WorkshopRepository.create({ ...dto, slug })
    return toWorkshopDetail(workshop)
  }

  static async update(id: string, dto: UpdateWorkshopBody): Promise<WorkshopDetail> {
    const workshop = await this.findOrThrow(id)

    // Lịch học mới = giá trị gửi lên ghép với giá trị cũ; chỉ kiểm tra khi có đổi thời gian
    if (dto.startsAt || dto.endsAt || dto.registrationDeadline !== undefined) {
      const schedule = {
        startsAt: dto.startsAt ?? workshop.startsAt,
        endsAt: dto.endsAt ?? workshop.endsAt,
        registrationDeadline:
          dto.registrationDeadline === undefined ? workshop.registrationDeadline : dto.registrationDeadline
      }
      // Dời giờ bắt đầu thì giờ mới phải ở tương lai; sửa hạn đăng ký của lớp cũ thì không cần
      const startMoved = !!dto.startsAt && dto.startsAt.getTime() !== workshop.startsAt.getTime()
      this.ensureValidSchedule(schedule, startMoved)
    }

    // Chỉ sinh slug mới khi tên đổi thật sự (không tính hoa thường, dấu) để link cũ không bị hỏng vô cớ
    const nameChanged = dto.name !== undefined && slugify(dto.name) !== slugify(workshop.name)
    const slug = nameChanged ? await this.generateSlug(dto.name!, id) : workshop.slug

    const updated = await WorkshopRepository.update(id, { ...dto, slug })
    return toWorkshopDetail(updated)
  }

  static async remove(id: string): Promise<void> {
    await this.findOrThrow(id)
    await WorkshopRepository.softDelete(id)
  }

  private static async findOrThrow(id: string) {
    const workshop = await WorkshopRepository.findById(id)
    if (!workshop) throw new NotFoundError(WORKSHOP_NOT_FOUND_MESSAGE)
    return workshop
  }

  // Kết thúc sau bắt đầu, không dài quá MAX_WORKSHOP_DURATION_HOURS, hạn đăng ký không sau giờ bắt đầu
  private static ensureValidSchedule(
    { startsAt, endsAt, registrationDeadline }: WorkshopSchedule,
    mustStartInFuture: boolean
  ) {
    if (mustStartInFuture && startsAt.getTime() <= Date.now()) {
      throw new BadRequestError('Thời gian bắt đầu phải sau thời điểm hiện tại')
    }
    if (endsAt.getTime() <= startsAt.getTime()) {
      throw new BadRequestError('Thời gian kết thúc phải sau thời gian bắt đầu')
    }
    if (endsAt.getTime() - startsAt.getTime() > MAX_WORKSHOP_DURATION_HOURS * HOUR_MS) {
      throw new BadRequestError(`Mỗi lớp kéo dài tối đa ${MAX_WORKSHOP_DURATION_HOURS} tiếng`)
    }
    if (registrationDeadline && registrationDeadline.getTime() > startsAt.getTime()) {
      throw new BadRequestError('Hạn đăng ký không được sau thời gian bắt đầu')
    }
  }

  private static async generateSlug(name: string, excludeId?: string) {
    const base = slugify(name)
    return nextAvailableSlug(base, await WorkshopRepository.findSlugsWithBase(base, excludeId))
  }
}

export default WorkshopService
