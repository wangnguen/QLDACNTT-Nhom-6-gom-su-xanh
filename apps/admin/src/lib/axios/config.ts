import axios from 'axios'

export const BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1'

// Trang admin dùng cookie refresh token riêng (rt_admin), tách biệt với trang client
export const REFRESH_TOKEN_PATH = '/auth/admin/refresh-token'

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true
})

export const refreshClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true
})
