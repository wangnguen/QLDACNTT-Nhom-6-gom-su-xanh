import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ConflictError, NotFoundError } from '@common/errors'

import UserRepository from '@modules/user/user.repository'
import UserService from '@modules/user/user.service'

import { makeUser } from '../../helpers/factories'

vi.mock('@modules/user/user.repository', () => ({
  default: {
    getUserById: vi.fn(),
    findByPhone: vi.fn(),
    updateProfile: vi.fn()
  }
}))

const repo = vi.mocked(UserRepository)

beforeEach(() => {
  vi.resetAllMocks()
})

describe('UserService.getUserInfo', () => {
  it('trả về thông tin user', async () => {
    repo.getUserById.mockResolvedValue(makeUser())

    await expect(UserService.getUserInfo('user-1')).resolves.toMatchObject({
      id: 'user-1',
      email: 'an.nguyen@gmail.com'
    })
  })

  it('báo lỗi 404 khi không tìm thấy user', async () => {
    repo.getUserById.mockResolvedValue(null)

    await expect(UserService.getUserInfo('user-1')).rejects.toThrow(NotFoundError)
  })
})

describe('UserService.updateProfile', () => {
  beforeEach(() => {
    repo.getUserById.mockResolvedValue(makeUser())
    repo.updateProfile.mockResolvedValue(makeUser({ fullName: 'Nguyễn Văn Bình' }))
  })

  it('cập nhật hồ sơ, không kiểm tra số điện thoại khi không đổi số', async () => {
    const result = await UserService.updateProfile('user-1', { fullName: 'Nguyễn Văn Bình', phone: '0912345678' })

    expect(repo.findByPhone).not.toHaveBeenCalled()
    expect(repo.updateProfile).toHaveBeenCalledWith(
      'user-1',
      { fullName: 'Nguyễn Văn Bình', phone: '0912345678' },
      undefined
    )
    expect(result.fullName).toBe('Nguyễn Văn Bình')
  })

  it('đổi sang số điện thoại chưa ai dùng', async () => {
    repo.findByPhone.mockResolvedValue(null)

    await UserService.updateProfile('user-1', { phone: '0987654321' })

    expect(repo.updateProfile).toHaveBeenCalledWith('user-1', { phone: '0987654321' }, undefined)
  })

  it('báo trùng khi số điện thoại mới thuộc tài khoản khác đã xác thực', async () => {
    repo.findByPhone.mockResolvedValue(makeUser({ id: 'user-2', phone: '0987654321' }))

    await expect(UserService.updateProfile('user-1', { phone: '0987654321' })).rejects.toThrow(ConflictError)
    expect(repo.updateProfile).not.toHaveBeenCalled()
  })

  it('xoá tài khoản đăng ký dở dang đang giữ số điện thoại mới', async () => {
    repo.findByPhone.mockResolvedValue(makeUser({ id: 'pending', phone: '0987654321', isEmailVerified: false }))

    await UserService.updateProfile('user-1', { phone: '0987654321' })

    expect(repo.updateProfile).toHaveBeenCalledWith('user-1', { phone: '0987654321' }, 'pending')
  })

  it('báo lỗi 404 khi không tìm thấy user', async () => {
    repo.getUserById.mockResolvedValue(null)

    await expect(UserService.updateProfile('user-1', { fullName: 'Bình' })).rejects.toThrow(NotFoundError)
  })
})
