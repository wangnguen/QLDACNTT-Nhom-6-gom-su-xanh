// '2026-11-24' → '24/11'; '2026-11' → 'T11/2026'
export const periodLabel = (period: string) => {
  const [year, month, day] = period.split('-')
  return day ? `${day}/${month}` : `T${Number(month)}/${year}`
}
