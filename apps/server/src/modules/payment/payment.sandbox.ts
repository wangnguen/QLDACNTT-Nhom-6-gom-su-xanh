// Trang cổng thanh toán giả lập (chỉ dùng khi phát triển, chưa cấu hình VNPay) — mô phỏng bước khách trả tiền ở VNPay

type SandboxPageParams = {
  txnRef: string
  amount: number
  orderInfo: string
  successUrl: string
  cancelUrl: string
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!)

const formatPrice = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)

export const renderSandboxPage = ({
  txnRef,
  amount,
  orderInfo,
  successUrl,
  cancelUrl
}: SandboxPageParams) => `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Cổng thanh toán giả lập</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #eef3f8; font-family: system-ui, sans-serif; color: #0f2a44; }
  main { width: min(26rem, calc(100% - 2rem)); background: #fff; border-radius: 16px; box-shadow: 0 12px 40px rgba(15, 42, 68, .12); padding: 28px; }
  .badge { display: inline-block; background: #fff4d6; color: #8a5a00; border-radius: 999px; padding: 4px 12px; font-size: 12px; font-weight: 700; }
  h1 { font-size: 20px; margin: 14px 0 4px; }
  p { margin: 0; color: #4a6075; font-size: 14px; }
  dl { margin: 20px 0; border-top: 1px solid #e3e9ef; }
  dl div { display: flex; justify-content: space-between; gap: 12px; padding: 10px 0; border-bottom: 1px solid #e3e9ef; font-size: 14px; }
  dt { color: #4a6075; } dd { margin: 0; font-weight: 600; text-align: right; word-break: break-all; }
  .amount { font-size: 22px; color: #005baa; }
  a { display: block; text-align: center; text-decoration: none; border-radius: 999px; padding: 12px; font-weight: 700; margin-top: 10px; }
  .pay { background: #005baa; color: #fff; } .cancel { border: 1px solid #c9d4df; color: #0f2a44; }
</style>
</head>
<body>
<main>
  <span class="badge">Môi trường thử nghiệm — không trừ tiền thật</span>
  <h1>Cổng thanh toán giả lập</h1>
  <p>Server chưa cấu hình VNPay nên dùng trang này thay cho bước thanh toán ở VNPay.</p>
  <dl>
    <div><dt>Mã giao dịch</dt><dd>${escapeHtml(txnRef)}</dd></div>
    <div><dt>Nội dung</dt><dd>${escapeHtml(orderInfo)}</dd></div>
    <div><dt>Số tiền</dt><dd class="amount">${escapeHtml(formatPrice(amount))}</dd></div>
  </dl>
  <a class="pay" href="${escapeHtml(successUrl)}">Thanh toán thành công</a>
  <a class="cancel" href="${escapeHtml(cancelUrl)}">Huỷ giao dịch</a>
</main>
</body>
</html>`
