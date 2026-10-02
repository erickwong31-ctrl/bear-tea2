// 熊茶館點單 · 收款函數（零依賴版：不裝套件，用系統內建 fetch 直連 Stripe）
// 前端 POST /api/checkout → 本函數建立 Stripe Checkout Session 並回傳付款網址
// 密鑰從 Vercel 的 Environment Variables 讀取（STRIPE_SECRET_KEY / SUCCESS_URL / CANCEL_URL）

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') return res.status(405).json({ ok: false, msg: '請用 POST' });

  try {
    const SK = process.env.STRIPE_SECRET_KEY || '';
    if (!SK) return res.status(500).json({ ok: false, msg: '尚未設定 STRIPE_SECRET_KEY' });

    const items = (req.body && req.body.items) || [];
    if (!items.length) return res.status(400).json({ ok: false, msg: '訂單內容不完整' });

    const params = new URLSearchParams();
    params.append('mode', 'payment');
    // 穩定收款方式：信用卡（測試卡 4242 可測）。要八達通/轉數快/支付寶等需另配 Stripe 帳號。
    params.append('payment_method_types[]', 'card');
    params.append('success_url', process.env.SUCCESS_URL || 'https://bear-tea2.vercel.app/ok.html');
    params.append('cancel_url', process.env.CANCEL_URL || 'https://bear-tea2.vercel.app/');

    items.forEach((it, i) => {
      params.append('line_items[' + i + '][quantity]', String(it.qty));
      params.append('line_items[' + i + '][price_data][currency]', 'hkd');
      params.append('line_items[' + i + '][price_data][unit_amount]', String(Math.round(it.price * 100)));
      params.append('line_items[' + i + '][price_data][product_data][name]', it.name + (it.size === 'L' ? '（大杯）' : '（中杯）'));
    });

    params.append('metadata[phone]', String((req.body.phone) || '').slice(0, 40));
    params.append('metadata[note]', String((req.body.note) || '').slice(0, 200));
    params.append('metadata[order]', JSON.stringify(items.map(i => ({ n: i.name, z: i.size === 'L' ? '大' : '中', q: i.qty, p: i.price, a: (i.addons || '') }))).slice(0, 400));
    var ticket = (req.body && req.body.ticket) || ('BT' + String(Date.now()).slice(-4));
    params.append('client_reference_id', ticket);
    params.append('metadata[ticket]', ticket);

    const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + SK,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });
    const d = await r.json();

    if (d.url) {
      return res.status(200).json({ ok: true, url: d.url });
    }
    const msg = (d.error && d.error.message) || '建立結帳失敗';
    return res.status(200).json({ ok: false, msg: msg });
  } catch (e) {
    return res.status(500).json({ ok: false, msg: '伺服器錯誤' });
  }
};
