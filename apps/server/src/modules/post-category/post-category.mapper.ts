import { PostCategoryItem, PostCategoryRef } from '@common/types'

import { PostCategory } from '@entities/post-category.entity'

export const toPostCategoryRef = (category: PostCategory): PostCategoryRef => ({
  id: category.id,
  name: category.name,
  slug: category.slug
})

export const toPostCategoryItem = (category: PostCategory, postCount: number): PostCategoryItem => ({
  ...toPostCategoryRef(category),
  description: category.description,
  isActive: category.isActive,
  postCount
})
