import { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { axiosInstance, refreshClient, REFRESH_TOKEN_PATH } from './config'
import type { ApiErrorBody } from '../types'

declare module 'axios' {
  interface AxiosRequestConfig {
    skipAuth?: boolean
    _retry?: boolean
  }
}

// Access token chỉ giữ trong bộ nhớ; refresh token nằm trong httpOnly cookie do server set
let _accessToken: string | null = null

export function getAccessToken(): string | null {
  return _accessToken
}

export function setAccessToken(token: string | null): void {
  _accessToken = token
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly data?: ApiErrorBody
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

function toApiError(error: AxiosError): ApiError {
  const body = error.response?.data as ApiErrorBody | undefined
  if (!error.response) {
    return new ApiError(0, 'Không kết nối được tới máy chủ, vui lòng thử lại')
  }
  // Lỗi validation: hiện thông báo của trường đầu tiên thay vì "Dữ liệu không hợp lệ"
  const message = body?.errors?.[0]?.message ?? body?.message ?? error.message
  return new ApiError(error.response.status, message, body)
}

let isRefreshing = false
let refreshQueue: Array<(token: string | null) => void> = []

async function doRefresh(): Promise<string | null> {
  try {
    type Envelope = { data: { accessToken: string } }
    const res = await refreshClient.post<Envelope>(REFRESH_TOKEN_PATH)
    const { accessToken } = res.data.data
    setAccessToken(accessToken)
    return accessToken
  } catch {
    setAccessToken(null)
    return null
  }
}

export function applyInterceptors(instance: AxiosInstance): void {
  instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    if (!config.skipAuth) {
      const token = getAccessToken()
      if (token) config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  instance.interceptors.response.use(
    (response) => {
      if (response.status === 204) return response
      const body = response.data
      if (body && typeof body === 'object' && 'data' in body) {
        response.data = body.data
      }
      return response
    },
    async (error: AxiosError) => {
      const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

      if (!original || error.response?.status !== 401 || original._retry || original.skipAuth) {
        return Promise.reject(toApiError(error))
      }

      original._retry = true

      if (!isRefreshing) {
        isRefreshing = true
        const newToken = await doRefresh()
        isRefreshing = false
        refreshQueue.forEach((cb) => cb(newToken))
        refreshQueue = []

        if (!newToken) {
          localStorage.removeItem('hasSession')
          window.location.href = '/login'
          return Promise.reject(toApiError(error))
        }
        original.headers.Authorization = `Bearer ${newToken}`
        return axiosInstance(original)
      }

      return new Promise<unknown>((resolve, reject) => {
        refreshQueue.push((token) => {
          if (!token) return reject(toApiError(error))
          original.headers.Authorization = `Bearer ${token}`
          resolve(axiosInstance(original))
        })
      })
    }
  )
}
