export interface ApiErrorBody {
  statusCode: number
  message: string
  path?: string
  timestamp?: string
  errors?: { field: string; message: string; code?: string }[]
}

export interface AuthUser {
  id: string
  email: string
  fullName: string
  phone: string | null
  role: 'user' | 'admin'
  avatarUrl: string | null
  isEmailVerified: boolean
}

export interface AuthResponse {
  accessToken: string
  user: AuthUser
}

export interface RefreshResponse {
  accessToken: string
}

export interface LoginRequest {
  identifier: string
  password: string
}
