import { AUTH_TOKEN, AuthTokenType, USER_ROLE } from '@common/constants'
import { hashAuthToken } from '@common/utils/random'

import type { AuthToken } from '@entities/auth-token.entity'
import type { RefreshToken } from '@entities/refresh-token.entity'
import type { User } from '@entities/user.entity'

// Mật khẩu giả lập: test mock hashPassword thành `hashed:<mật khẩu>` để khỏi chạy bcrypt
export const fakeHash = (plain: string) => `hashed:${plain}`

export const PASSWORD = 'GomSu@2026'

export const makeUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'user-1',
    fullName: 'Nguyễn Văn An',
    email: 'an.nguyen@gmail.com',
    phone: '0912345678',
    gender: null,
    address: null,
    password: fakeHash(PASSWORD),
    role: USER_ROLE.USER,
    avatarUrl: null,
    isEmailVerified: true,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides
  }) as User

export const makeAuthToken = (otp: string, overrides: Partial<AuthToken> & { type?: AuthTokenType } = {}): AuthToken =>
  ({
    id: 'auth-token-1',
    token: hashAuthToken(otp),
    type: AUTH_TOKEN.VERIFY_EMAIL,
    userId: 'user-1',
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    usedAt: null,
    attempts: 0,
    newEmail: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides
  }) as AuthToken

export const makeRefreshToken = (overrides: Partial<RefreshToken> = {}): RefreshToken =>
  ({
    id: 'refresh-token-1',
    token: 'stored-hash',
    userId: 'user-1',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    absoluteExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides
  }) as RefreshToken
