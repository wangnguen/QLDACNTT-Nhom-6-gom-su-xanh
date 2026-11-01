import { ProductDetail, ProductSummary } from '@common/types'

import { toCategoryRef } from '@modules/category/category.mapper'

import { Product } from '@entities/product.entity'

// `product.category` phải được load kèm (repository luôn join category)
export const toProductSummary = (product: Product): ProductSummary => ({
  id: product.id,
  name: product.name,
  slug: product.slug,
  price: product.price,
  stock: product.stock,
  imageUrl: product.imageUrls[0] ?? null,
  isActive: product.isActive,
  category: toCategoryRef(product.category)
})

export const toProductDetail = (product: Product): ProductDetail => ({
  ...toProductSummary(product),
  description: product.description,
  material: product.material,
  dimensions: product.dimensions,
  imageUrls: product.imageUrls
})
