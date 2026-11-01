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

// ─── US-07: Danh mục và sản phẩm ─────────────────────────────────────────────

export interface Paginated<T> {
  limit: number
  offset: number
  total_count: number
  entries: T[]
}

export interface CategoryRef {
  id: string
  name: string
  slug: string
}

export interface CategoryItem extends CategoryRef {
  description: string | null
  imageUrl: string | null
  isActive: boolean
  productCount: number
}

export interface CategoryPayload {
  name: string
  description: string | null
  imageUrl: string | null
  isActive: boolean
}

export type ProductSort = 'newest' | 'price_asc' | 'price_desc' | 'name_asc'
export type ProductStatus = 'active' | 'hidden'

export interface ProductSummary {
  id: string
  name: string
  slug: string
  price: number
  stock: number
  imageUrl: string | null
  isActive: boolean
  category: CategoryRef
}

export interface ProductDetail extends ProductSummary {
  description: string | null
  material: string | null
  dimensions: string | null
  imageUrls: string[]
}

export interface AdminProductQuery {
  limit?: number
  offset?: number
  search?: string
  categoryId?: string
  status?: ProductStatus
  sort?: ProductSort
}

export interface ProductPayload {
  name: string
  categoryId: string
  price: number
  stock: number
  description: string | null
  material: string | null
  dimensions: string | null
  imageUrls: string[]
  isActive: boolean
}
