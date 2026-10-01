// 熊茶館點單 · Vercel serverless 收款函數（零依賴版）
// 用 Node 內建 fetch() 呼叫 Stripe REST API，不需要安裝任何 npm 套件。
// 因此整個專案不需要 package.json / vercel.json，Vercel 會正確辨識為「靜態 + 函數」。
//
// 金鑰與網址來自 Vercel 後台 Environment Variables（絕不可寫死在此檔）：
//   STRIPE_SECRET_KEY = sk_live_xxx (測試可用 sk_test_xxx)
//   SUCCESS_URL       = https://你的網址/ok.html
//   CANCEL_URL        = https://你的網址/

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, msg: '請用 POST' });
  }
  try {
    const key = process.env.STRIPE_SECRET_KEY;
    const items = (req.body && req.body.items) || [];

    if (!key) return res.status(500).json({ ok: false, msg: '尚未設定 STRIPE_SECRET_KEY' });
    if (!items.length) return res.status(400).json({ ok: false, msg: '訂單內容不完整' });

    // 組 Stripe checkout session 的表單參數
    const params = new URLSearchParams();
    params.set('mode', 'payment');
    params.set('success_url', process.env.SUCCESS_URL || '');
    params.set('cancel_url', process.env.CANCEL_URL || '');
    params.set('automatic_payment_methods[enabled]', 'true');
    if (req.body.phone) params.set('metadata[phone]', String(req.body.phone).slice(0, 40));
    if (req.body.note) params.set('metadata[note]', String(req.body.note).slice(0, 200));
    items.forEach((i, idx) => {
      const base = `line_items[${idx}]`;
      params.set(`${base}[quantity]`, i.qty);
      params.set(`${base}[price_data][currency]`, 'hkd');
      params.set(`${base}[price_data][unit_amount]`, Math.round(i.price * 100));
      params.set(`${base}[price_data][product_data][name]`, i.name + (i.size === 'L' ? '（大杯）' : '（中杯）'));
    });

    const resp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });
    const data = await resp.json();

    if (!resp.ok) {
      console.error('Stripe error:', data);
      return res.status(500).json({ ok: false, msg: (data.error && data.error.message) || 'Stripe 錯誤' });
    }
    return res.status(200).json({ ok: true, url: data.url });
  } catch (e) {
    console.error('checkout error:', e);
    return res.status(500).json({ ok: false, msg: '建立結帳失敗' });
  }
};
