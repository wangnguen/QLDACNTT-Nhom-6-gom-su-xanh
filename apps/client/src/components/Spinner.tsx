export function FullPageSpinner() {
  return (
    <div className='flex min-h-screen items-center justify-center' role='status' aria-label='Đang tải'>
      <div className='h-10 w-10 animate-spin rounded-full border-4 border-teal border-t-transparent' />
    </div>
  )
}
