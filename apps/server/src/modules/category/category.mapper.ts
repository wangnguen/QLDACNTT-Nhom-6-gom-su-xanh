import { CategoryItem, CategoryRef } from '@common/types'

import { Category } from '@entities/category.entity'

export const toCategoryRef = (category: Category): CategoryRef => ({
  id: category.id,
  name: category.name,
  slug: category.slug
})

export const toCategoryItem = (category: Category, productCount: number): CategoryItem => ({
  ...toCategoryRef(category),
  description: category.description,
  imageUrl: category.imageUrl,
  isActive: category.isActive,
  productCount
})
