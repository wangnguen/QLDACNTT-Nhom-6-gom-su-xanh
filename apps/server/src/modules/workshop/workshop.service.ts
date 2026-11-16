import { MAX_WORKSHOP_DURATION_HOURS, WORKSHOP_NOT_FOUND_MESSAGE, WORKSHOP_STATUS } from '@common/constants'
import { BadRequestError, ConflictError, NotFoundError } from '@common/errors'
import { Paginated, WorkshopDetail, WorkshopSummary } from '@common/types'
import { startOfVnDay } from '@common/utils/date'
import { nextAvailableSlug, slugify } from '@common/utils/slug'

import WorkshopRegistrationRepository from '@modules/workshop-registration/workshop-registration.repository'

import { Workshop } from '@entities/workshop.entity'

import { AdminWorkshopQuery, CreateWorkshopBody, UpdateWorkshopBody, WorkshopQuery } from './dto'
import { toWorkshopDetail, toWorkshopSummary } from './workshop.mapper'
import WorkshopRepository from './workshop.repository'

type WorkshopSchedule = Pick<Workshop, 'startsAt' | 'endsAt' | 'registrationDeadline'>

const HOUR_MS = 60 * 60 * 1000

class WorkshopService {
  // US-12: Danh sách lớp ở trang client — chỉ lớp đang mở và chưa bắt đầu
  static async list({ from, to, ...query }: WorkshopQuery): Promise<Paginated<WorkshopSummary>> {
    const [workshops, total] = await WorkshopRepository.findMany({
      ...query,
      visibleOnly: true,
      startsFrom: from ? startOfVnDay(from) : undefined,
      startsBefore: to ? startOfVnDay(to, 1) : undefined
    })

    return { limit: query.limit, offset: query.offset, total_count: total, entries: await this.toSummaries(workshops) }
  }

  // US-12: Chi tiết lớp — lớp đang ẩn hoặc đã xoá trả 404 như không tồn tại
  static async getBySlug(slug: string): Promise<WorkshopDetail> {
    const workshop = await WorkshopRepository.findVisibleBySlug(slug)
    if (!workshop) throw new NotFoundError(WORKSHOP_NOT_FOUND_MESSAGE)
    return toWorkshopDetail(workshop, await this.countBookedSeats(workshop.id))
  }

  // US-11: Danh sách lớp ở trang admin (gồm cả lớp đang ẩn và lớp đã kết thúc)
  static async listForAdmin({ status, ...query }: AdminWorkshopQuery): Promise<Paginated<WorkshopSummary>> {
    const isActive = status === undefined ? undefined : status === WORKSHOP_STATUS.ACTIVE
    const [workshops, total] = await WorkshopRepository.findMany({ ...query, isActive })

    return { limit: query.limit, offset: query.offset, total_count: total, entries: await this.toSummaries(workshops) }
  }

  static async getForAdmin(id: string): Promise<WorkshopDetail> {
    const workshop = await this.findOrThrow(id)
    return toWorkshopDetail(workshop, await this.countBookedSeats(id))
  }

  static async create(dto: CreateWorkshopBody): Promise<WorkshopDetail> {
    this.ensureValidSchedule(
      { startsAt: dto.startsAt, endsAt: dto.endsAt, registrationDeadline: dto.registrationDeadline ?? null },
      true
    )

    const slug = await this.generateSlug(dto.name)
    const workshop = await WorkshopRepository.create({ ...dto, slug })
    return toWorkshopDetail(workshop, 0)
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

    // Không giảm số chỗ xuống dưới số chỗ khách đã đặt
    const bookedSeats = await this.countBookedSeats(id)
    if (dto.capacity !== undefined && dto.capacity < bookedSeats) {
      throw new BadRequestError(`Lớp đã có ${bookedSeats} chỗ được đặt, số chỗ không được nhỏ hơn ${bookedSeats}`)
    }

    // Chỉ sinh slug mới khi tên đổi thật sự (không tính hoa thường, dấu) để link cũ không bị hỏng vô cớ
    const nameChanged = dto.name !== undefined && slugify(dto.name) !== slugify(workshop.name)
    const slug = nameChanged ? await this.generateSlug(dto.name!, id) : workshop.slug

    const updated = await WorkshopRepository.update(id, { ...dto, slug })
    return toWorkshopDetail(updated, bookedSeats)
  }

  // Lớp đã có người đăng ký (kể cả đã huỷ) thì giữ lại để tra cứu lịch sử — chỉ ẩn được
  static async remove(id: string): Promise<void> {
    await this.findOrThrow(id)

    const registrationCount = await WorkshopRegistrationRepository.countByWorkshop(id)
    if (registrationCount > 0) {
      throw new ConflictError(
        `Lớp đã có ${registrationCount} lượt đăng ký nên không xoá được. Hãy ẩn lớp để khách không thấy nữa`
      )
    }

    await WorkshopRepository.softDelete(id)
  }

  private static async findOrThrow(id: string) {
    const workshop = await WorkshopRepository.findById(id)
    if (!workshop) throw new NotFoundError(WORKSHOP_NOT_FOUND_MESSAGE)
    return workshop
  }

  private static async countBookedSeats(workshopId: string) {
    const booked = await WorkshopRegistrationRepository.countBookedSeats([workshopId])
    return booked.get(workshopId) ?? 0
  }

  private static async toSummaries(workshops: Workshop[]) {
    const booked = await WorkshopRegistrationRepository.countBookedSeats(workshops.map((workshop) => workshop.id))
    return workshops.map((workshop) => toWorkshopSummary(workshop, booked.get(workshop.id) ?? 0))
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
