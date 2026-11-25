import { PostStatus } from '@common/constants'

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

// Dùng cho danh sách bài viết (thẻ bài ở trang tin tức, bảng ở trang admin)
export type PostSummary = {
  id: string
  title: string
  slug: string
  // Tóm tắt admin nhập, không có thì lấy đầu nội dung
  excerpt: string
  coverImageUrl: string | null
  category: PostCategoryRef
  status: PostStatus
  publishedAt: Date | null
  // Ước lượng thời gian đọc (phút)
  readingMinutes: number
  viewCount: number
  author: { id: string; fullName: string } | null
  updatedAt: Date
}

export type PostDetail = PostSummary & {
  content: string
  // Tóm tắt đúng như admin nhập (null = tự lấy từ nội dung) — dùng ở form sửa bài
  customExcerpt: string | null
}

// US-23: Bài viết ở trang tin tức kèm vài bài cùng danh mục
export type PublicPostDetail = PostDetail & {
  related: PostSummary[]
}
