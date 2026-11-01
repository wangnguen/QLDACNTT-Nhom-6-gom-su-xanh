export type CategoryRef = {
  id: string
  name: string
  slug: string
}

export type CategoryItem = CategoryRef & {
  description: string | null
  imageUrl: string | null
  isActive: boolean
  productCount: number
}

// Dùng cho danh sách (thẻ sản phẩm, bảng ở trang admin)
export type ProductSummary = {
  id: string
  name: string
  slug: string
  price: number
  stock: number
  imageUrl: string | null
  isActive: boolean
  category: CategoryRef
}

export type ProductDetail = ProductSummary & {
  description: string | null
  material: string | null
  dimensions: string | null
  imageUrls: string[]
}
