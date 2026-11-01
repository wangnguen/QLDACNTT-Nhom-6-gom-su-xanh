import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useAuthStore } from '@stores/authStore'
import { ProductCard, ProductCardSkeleton } from '@components/product'
import { useHomeStore } from './store'

export default function HomePage() {
  const { user, isAuthenticated } = useAuthStore()
  const { newestProducts, fetchNewestProducts } = useHomeStore()

  useEffect(() => {
    fetchNewestProducts()
  }, [fetchNewestProducts])

  return (
    <>
      <section className='relative overflow-hidden'>
        <div className='mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2'>
          <div>
            <p className='text-sm font-bold tracking-[0.2em] text-leaf uppercase'>Gốm thủ công Bát Tràng</p>
            <h1 className='mt-4 font-display text-5xl leading-[1.05] font-bold text-moss sm:text-6xl'>
              {isAuthenticated && user ? `Xin chào, ${user.fullName}!` : 'Nặn đất thành hình, gửi tình vào gốm.'}
            </h1>
            <p className='mt-6 max-w-xl text-lg text-ink'>
              Khám phá những sản phẩm gốm thủ công và đăng ký workshop để tự tay làm nên chiếc bình của riêng bạn.
            </p>
            <div className='mt-8 flex flex-wrap gap-3'>
              <Link to='/products' className='btn-primary'>
                Xem sản phẩm
                <ArrowRight size={18} />
              </Link>
              {isAuthenticated ? (
                <Link to='/account' className='btn-outline px-6 py-3 text-[15px]'>
                  Xem tài khoản
                </Link>
              ) : (
                <Link to='/register' className='btn-outline px-6 py-3 text-[15px]'>
                  Tạo tài khoản
                </Link>
              )}
            </div>
          </div>

          {/* Hình trang trí: các vòng tròn đồng tâm như bàn xoay gốm */}
          <div aria-hidden className='relative mx-auto aspect-square w-full max-w-md'>
            <div className='absolute inset-0 rounded-full border-[36px] border-moss/10' />
            <div className='absolute inset-[14%] rounded-full border-[28px] border-leaf/15' />
            <div className='absolute inset-[30%] rounded-full bg-cream shadow-[0_16px_48px_rgba(28,61,30,0.14)]' />
            <img src='/logo.png' alt='' className='absolute inset-[33%] h-[34%] w-[34%] rounded-full object-cover' />
          </div>
        </div>
      </section>

      {/* US-08: 4 sản phẩm mới nhất; chưa có sản phẩm nào thì ẩn mục này */}
      {newestProducts?.length !== 0 && (
        <section className='mx-auto max-w-6xl px-4 pb-20 sm:px-6'>
          <div className='mb-6 flex items-end justify-between gap-4'>
            <div>
              <p className='text-sm font-bold tracking-[0.2em] text-leaf uppercase'>Mới ra lò</p>
              <h2 className='mt-1 font-display text-3xl font-bold text-moss sm:text-4xl'>Sản phẩm mới</h2>
            </div>
            <Link to='/products' className='link inline-flex shrink-0 items-center gap-1 text-sm'>
              Xem tất cả
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className='grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4'>
            {newestProducts
              ? newestProducts.map((product) => <ProductCard key={product.id} product={product} />)
              : Array.from({ length: 4 }, (_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        </section>
      )}
    </>
  )
}
