import { AUTH_TOKEN, AuthTokenType, USER_ROLE } from '@common/constants'
import { hashAuthToken } from '@common/utils/random'

import type { AuthToken } from '@entities/auth-token.entity'
import type { Category } from '@entities/category.entity'
import type { Product } from '@entities/product.entity'
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

export const makeCategory = (overrides: Partial<Category> = {}): Category =>
  ({
    id: 'category-1',
    name: 'Bình hoa',
    slug: 'binh-hoa',
    description: null,
    imageUrl: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides
  }) as Category

export const makeProduct = (overrides: Partial<Product> = {}): Product =>
  ({
    id: 'product-1',
    name: 'Bình hoa men lam',
    slug: 'binh-hoa-men-lam',
    description: 'Vẽ tay hoạ tiết hoa sen',
    price: 450000,
    stock: 20,
    material: 'Gốm men lam',
    dimensions: 'Cao 30cm',
    imageUrls: ['https://example.com/1.jpg', 'https://example.com/2.jpg'],
    isActive: true,
    categoryId: 'category-1',
    category: makeCategory(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides
  }) as Product
