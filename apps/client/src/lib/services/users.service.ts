import { http } from '../axios'
import type { AuthUser, UpdateProfileRequest } from '../types'

export async function getMe(): Promise<AuthUser> {
  const { data } = await http.get<AuthUser>('/users/me')
  return data
}

// US-06: Quản lý thông tin cá nhân
export async function updateProfile(payload: UpdateProfileRequest): Promise<AuthUser> {
  const { data } = await http.patch<AuthUser>('/users/me', payload)
  return data
}

export const usersService = {
  getMe,
  updateProfile
}
