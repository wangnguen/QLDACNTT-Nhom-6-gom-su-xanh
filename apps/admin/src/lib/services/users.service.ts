import { http } from '../axios'
import type { AuthUser } from '../types'

export async function getMe(): Promise<AuthUser> {
  const { data } = await http.get<AuthUser>('/users/me')
  return data
}

export const usersService = {
  getMe
}
