import { ChevronDown } from 'lucide-react'

const selectClass =
  'w-full appearance-none rounded-xl border border-clay bg-cream py-2.5 pr-9 pl-3.5 text-sm text-forest outline-none transition focus:border-teal focus:ring-4 focus:ring-teal/15'

// Ô chọn trên thanh bộ lọc của các trang danh sách
export function FilterSelect({
  label,
  value,
  onChange,
  options
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className='relative'>
      <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className={selectClass}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        className='pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted'
        aria-hidden
      />
    </div>
  )
}
