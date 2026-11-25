import { POST_STATUS, WORDS_PER_MINUTE } from '@common/constants'
import { PostDetail, PostSummary } from '@common/types'

import { toPostCategoryRef } from '@modules/post-category/post-category.mapper'

import { Post } from '@entities/post.entity'

const EXCERPT_LENGTH = 180

// Bỏ dấu "## " của tiêu đề mục, gộp khoảng trắng để làm tóm tắt
const plainText = (content: string) =>
  content
    .replace(/^#+\s*/gm, '')
    .replace(/\s+/g, ' ')
    .trim()

export const autoExcerpt = (content: string): string => {
  const text = plainText(content)
  if (text.length <= EXCERPT_LENGTH) return text
  const cut = text.slice(0, EXCERPT_LENGTH)
  return `${cut.slice(0, cut.lastIndexOf(' ') > 100 ? cut.lastIndexOf(' ') : EXCERPT_LENGTH)}…`
}

export const readingMinutes = (content: string): number =>
  Math.max(1, Math.ceil(plainText(content).split(' ').filter(Boolean).length / WORDS_PER_MINUTE))

// `post.category` phải được load kèm; `post.author` nếu có
export const toPostSummary = (post: Post): PostSummary => ({
  id: post.id,
  title: post.title,
  slug: post.slug,
  excerpt: post.excerpt ?? autoExcerpt(post.content),
  coverImageUrl: post.coverImageUrl,
  category: toPostCategoryRef(post.category),
  status: post.status,
  publishedAt: post.status === POST_STATUS.PUBLISHED ? post.publishedAt : null,
  readingMinutes: readingMinutes(post.content),
  viewCount: post.viewCount,
  author: post.author ? { id: post.author.id, fullName: post.author.fullName } : null,
  updatedAt: post.updatedAt
})

export const toPostDetail = (post: Post): PostDetail => ({
  ...toPostSummary(post),
  content: post.content,
  customExcerpt: post.excerpt
})
