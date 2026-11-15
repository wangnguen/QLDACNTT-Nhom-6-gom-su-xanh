import { useEffect, useState } from 'react'
import { http } from '@lib/axios'

type Workshop = {
  id: string
  name: string
  content: string
  artisan: string
  starts_at: string
  ends_at: string
  capacity: number
  remaining: number
  status: string
}
type Registration = {
  id: string
  workshop_name: string
  workshop_status: string
  full_name: string
  email: string
  phone: string | null
  seats: number
  status: string
  created_at: string
}
type Form = {
  name: string
  content: string
  artisan: string
  startsAt: string
  endsAt: string
  capacity: number
  status: string
}
const empty: Form = { name: '', content: '', artisan: '', startsAt: '', endsAt: '', capacity: 10, status: 'open' }
const local = (s: string) => new Date(new Date(s).getTime() + 7 * 3600000).toISOString().slice(0, 16)
const time = (s: string) => new Date(s).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })

export default function WorkshopsPage() {
  const [rows, setRows] = useState<Workshop[]>([])
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [form, setForm] = useState<Form>(empty)
  const [editing, setEditing] = useState<string | null>(null)
  const [workshopId, setWorkshopId] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(false)
  async function load() {
    setLoading(true)
    try {
      setRows((await http.get('/admin/workshops')).data)
      setError('')
    } catch {
      setError('Không tải được lớp học')
    } finally {
      setLoading(false)
    }
  }
  async function find() {
    try {
      setRegistrations(
        (
          await http.get('/admin/workshop-registrations', {
            params: { workshopId: workshopId || undefined, search, status: status || undefined }
          })
        ).data
      )
      setError('')
    } catch {
      setError('Không tải được danh sách đăng ký')
    }
  }
  useEffect(() => {
    void load()
  }, [])
  async function save() {
    setPending(true)
    setError('')
    setNotice('')
    try {
      const body = {
        ...form,
        startsAt: new Date(`${form.startsAt}:00+07:00`).toISOString(),
        endsAt: new Date(`${form.endsAt}:00+07:00`).toISOString()
      }
      if (editing) await http.patch(`/admin/workshops/${editing}`, body)
      else await http.post('/admin/workshops', body)
      setEditing(null)
      setForm(empty)
      await load()
      setNotice('Đã lưu lớp học')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lưu thất bại')
    } finally {
      setPending(false)
    }
  }
  async function cancel(id: string) {
    setPending(true)
    try {
      await http.patch(`/admin/workshop-registrations/${id}`, { status: 'cancelled' })
      await find()
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hủy thất bại')
    } finally {
      setPending(false)
    }
  }
  return (
    <div className='mx-auto max-w-6xl space-y-6'>
      <h1 className='text-3xl font-bold'>Quản lý Workshop</h1>
      <p>Lịch nhập và hiển thị theo giờ Việt Nam (UTC+7).</p>
      {error && <p role='alert'>{error}</p>}
      {notice && <p role='status'>{notice}</p>}
      {loading && <p role='status'>Đang tải...</p>}
      <button className='btn-outline' onClick={() => void load()}>
        Tải lại lớp
      </button>
      <form
        className='grid gap-4 rounded-xl border border-clay bg-cream p-5 sm:grid-cols-2'
        onSubmit={(e) => {
          e.preventDefault()
          void save()
        }}
      >
        <h2 className='text-xl font-bold sm:col-span-2'>{editing ? 'Sửa lớp' : 'Tạo lớp'}</h2>
        {(['name', 'content', 'artisan', 'startsAt', 'endsAt', 'capacity'] as const).map((key) => (
          <label key={key} className='flex flex-col gap-1'>
            {
              {
                name: 'Tên lớp',
                content: 'Nội dung',
                artisan: 'Nghệ nhân',
                startsAt: 'Bắt đầu',
                endsAt: 'Kết thúc',
                capacity: 'Sức chứa'
              }[key]
            }
            <input
              className='rounded border p-2'
              required
              type={key === 'capacity' ? 'number' : key.endsWith('At') ? 'datetime-local' : 'text'}
              min={key === 'capacity' ? 1 : undefined}
              value={form[key]}
              onChange={(e) =>
                setForm({ ...form, [key]: key === 'capacity' ? Number(e.target.value) : e.target.value })
              }
            />
          </label>
        ))}
        <label>
          Trạng thái lớp{' '}
          <select
            aria-label='Trạng thái lớp'
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value='open'>Mở đăng ký</option>
            <option value='hidden'>Ẩn</option>
            <option value='cancelled'>Đã hủy</option>
          </select>
        </label>
        <button className='btn-primary' disabled={pending}>
          Lưu lớp
        </button>
        {editing && (
          <button
            type='button'
            className='btn-outline'
            onClick={() => {
              setEditing(null)
              setForm(empty)
            }}
          >
            Bỏ sửa
          </button>
        )}
      </form>
      {!loading && rows.length === 0 && <p>Chưa có lớp học</p>}
      {rows.map((w) => (
        <article className='rounded-xl border p-4' key={w.id}>
          <h2 className='font-bold'>{w.name}</h2>
          <p>
            {w.artisan} · {time(w.starts_at)} – {time(w.ends_at)} · {w.remaining}/{w.capacity} chỗ · {w.status}
          </p>
          <button
            className='btn-outline'
            aria-label={`Sửa lớp ${w.name}`}
            onClick={() => {
              setEditing(w.id)
              setForm({
                name: w.name,
                content: w.content,
                artisan: w.artisan,
                startsAt: local(w.starts_at),
                endsAt: local(w.ends_at),
                capacity: w.capacity,
                status: w.status
              })
            }}
          >
            Sửa lớp
          </button>
        </article>
      ))}
      <section className='space-y-4 rounded-xl border p-5'>
        <h2 className='text-2xl font-bold'>Danh sách đăng ký</h2>
        <form
          className='flex flex-wrap gap-3'
          onSubmit={(e) => {
            e.preventDefault()
            void find()
          }}
        >
          <label>
            Lọc lớp{' '}
            <select aria-label='Lọc lớp' value={workshopId} onChange={(e) => setWorkshopId(e.target.value)}>
              <option value=''>Tất cả</option>
              {rows.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tìm khách{' '}
            <input value={search} onChange={(e) => setSearch(e.target.value)} className='rounded border p-2' />
          </label>
          <label>
            Trạng thái đăng ký{' '}
            <select aria-label='Trạng thái đăng ký' value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value=''>Tất cả</option>
              <option value='confirmed'>Đã xác nhận</option>
              <option value='cancelled'>Đã hủy</option>
            </select>
          </label>
          <button className='btn-outline'>Tìm đăng ký</button>
        </form>
        {registrations.length === 0 && <p>Chưa có kết quả đăng ký</p>}
        {registrations.map((r) => (
          <article className='rounded border p-3' key={r.id}>
            <p>
              {r.workshop_name} ({r.workshop_status}) · {r.full_name} · {r.email} · {r.phone ?? 'Chưa có SĐT'} ·{' '}
              {r.seats} chỗ · {r.status} · {time(r.created_at)}
            </p>
            <button
              className='btn-outline'
              disabled={pending || r.status === 'cancelled'}
              onClick={() => void cancel(r.id)}
            >
              Hủy đăng ký
            </button>
          </article>
        ))}
      </section>
    </div>
  )
}
