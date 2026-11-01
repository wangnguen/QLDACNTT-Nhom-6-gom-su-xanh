const SLUG_MAX_LENGTH = 100

// "Bình hoa men lam Đông Hồ" → "binh-hoa-men-lam-dong-ho"
export const slugify = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SLUG_MAX_LENGTH)
    .replace(/-+$/, '')

// Slug đã có người dùng thì thêm hậu tố -2, -3... cho tới khi không trùng
export const nextAvailableSlug = (base: string, takenSlugs: string[]): string => {
  const taken = new Set(takenSlugs)
  if (!taken.has(base)) return base

  let suffix = 2
  while (taken.has(`${base}-${suffix}`)) suffix++
  return `${base}-${suffix}`
}
