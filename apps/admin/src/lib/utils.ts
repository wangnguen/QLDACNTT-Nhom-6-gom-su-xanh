export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

const priceFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

// 450000 → "450.000 ₫"
export function formatPrice(value: number): string {
  return priceFormatter.format(value)
}
