import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className='flex min-h-screen flex-col items-center justify-center px-4 text-center'>
      <p className='font-display text-8xl font-bold text-moss/20'>404</p>
      <h1 className='mt-2 font-display text-3xl font-bold text-moss'>Không tìm thấy trang</h1>
      <p className='mt-2 text-ink'>Trang bạn tìm có thể đã bị xoá hoặc đường dẫn không đúng.</p>
      <Link to='/' className='btn-primary mt-8'>
        Về trang chủ
      </Link>
    </div>
  )
}
