export const POST_CATEGORY_NOT_FOUND_MESSAGE = 'Không tìm thấy danh mục bài viết'

export const POST_NOT_FOUND_MESSAGE = 'Không tìm thấy bài viết'

export const POST_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published'
} as const

export type PostStatus = (typeof POST_STATUS)[keyof typeof POST_STATUS]

// Tốc độ đọc trung bình để ước lượng thời gian đọc bài
export const WORDS_PER_MINUTE = 200

export const MAX_POST_CONTENT_LENGTH = 50_000

// Số bài liên quan hiện cuối trang bài viết
export const RELATED_POSTS_LIMIT = 3
