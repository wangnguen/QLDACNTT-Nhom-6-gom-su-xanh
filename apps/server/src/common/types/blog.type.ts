export type PostCategoryRef = {
  id: string
  name: string
  slug: string
}

export type PostCategoryItem = PostCategoryRef & {
  description: string | null
  isActive: boolean
  // Số bài viết (trang admin: mọi bài; trang client: bài đã đăng)
  postCount: number
}
