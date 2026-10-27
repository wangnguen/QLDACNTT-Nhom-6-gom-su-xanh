interface Props {
  seconds: number
  loading: boolean
  onResend: () => void
}

// "Chưa nhận được mã? Gửi lại" — khoá trong lúc đếm ngược (server cũng chặn gửi lại trong 60 giây)
export function ResendButton({ seconds, loading, onResend }: Props) {
  return (
    <p className='text-center text-sm text-ink'>
      Chưa nhận được mã?{' '}
      {seconds > 0 ? (
        <span className='font-semibold text-muted'>Gửi lại sau {seconds}s</span>
      ) : (
        <button type='button' onClick={onResend} disabled={loading} className='link disabled:opacity-60'>
          {loading ? 'Đang gửi...' : 'Gửi lại mã'}
        </button>
      )}
    </p>
  )
}
