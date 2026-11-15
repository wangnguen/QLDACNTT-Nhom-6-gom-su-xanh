import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { http } from '@lib/axios'
import { useAuthStore } from '@stores/authStore'

type Workshop = {
  id: string
  name: string
  content: string
  artisan: string
  starts_at: string
  ends_at: string
  remaining: number
  capacity: number
}
const time = (s: string) => new Date(s).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })

export default function WorkshopsPage() {
  const [rows, setRows] = useState<Workshop[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [pending, setPending] = useState(false)
  const authenticated = useAuthStore((s) => s.isAuthenticated)
  const navigate = useNavigate()
  const location = useLocation()
  async function load() {
    setLoading(true)
    try {
      setRows((await http.get('/workshops')).data)
      setError('')
    } catch {
      setError('Không tải được lớp học. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    void load()
  }, [])
  async function register(id: string, seats: number) {
    if (!authenticated) {
      navigate('/login', { state: { from: location.pathname } })
      return
    }
    setPending(true)
    setError('')
    setNotice('')
    try {
      await http.post(`/workshops/${id}/registrations`, { seats })
      setNotice('Đăng ký thành công')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Đăng ký thất bại')
    } finally {
      setPending(false)
    }
  }
  return (
    <div className='mx-auto max-w-6xl space-y-5 px-4 py-10'>
      <h1 className='text-3xl font-bold text-moss'>Workshop gốm</h1>
      <p>Lịch hiển thị theo giờ Việt Nam (UTC+7).</p>
      {loading && <p role='status'>Đang tải lớp học...</p>}
      {error && (
        <div role='alert'>
          {error}
          <button className='btn-outline' onClick={() => void load()}>
            Thử lại
          </button>
        </div>
      )}
      {notice && <p role='status'>{notice}</p>}
      {!loading && !error && rows.length === 0 && <p>Chưa có lớp nhận đăng ký</p>}
      {rows.map((w) => (
        <article key={w.id} className='space-y-3 rounded-xl border border-clay bg-cream p-5'>
          <h2 className='text-xl font-bold'>{w.name}</h2>
          <p>{w.content}</p>
          <p>Nghệ nhân: {w.artisan}</p>
          <p>
            {time(w.starts_at)} – {time(w.ends_at)}
          </p>
          <p>
            Còn {w.remaining}/{w.capacity} chỗ
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void register(w.id, Number(new FormData(e.currentTarget).get('seats')))
            }}
          >
            <label>
              Số chỗ{' '}
              <input
                name='seats'
                type='number'
                defaultValue={1}
                min={1}
                max={Math.max(1, w.remaining)}
                required
                className='rounded border p-2'
              />
            </label>
            <button className='btn-primary ml-3' disabled={pending || w.remaining === 0}>
              {w.remaining === 0 ? 'Hết chỗ' : 'Đăng ký lớp'}
            </button>
          </form>
        </article>
      ))}
    </div>
  )
}
