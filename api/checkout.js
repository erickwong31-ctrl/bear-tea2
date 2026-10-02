// 熊茶館點單 · Vercel Serverless 收款函數
// 前端 POST /api/checkout（同源）→ 本函數用 Stripe 建立 Checkout Session 並回傳付款網址
// 金鑰從 Vercel 後台的 Environment Variables 讀取（絕不可寫死在前端）
const Stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, msg: '請用 POST' });
  }
  try {
    const items = (req.body && req.body.items) || [];
    if (!items.length) return res.status(400).json({ ok: false, msg: '訂單內容不完整' });

    const line_items = items.map(i => ({
      quantity: i.qty,
      price_data: {
        currency: 'hkd',                       // 港幣
        product_data: {
          name: i.name + (i.size === 'L' ? '（大杯）' : '（中杯）')
        },
        unit_amount: Math.round(i.price * 100) // 元 → 分
      }
    }));

    const session = await Stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      // 穩定收款方式：信用卡/扣賬卡（測試卡 4242 可測）。
      // 如要八達通/轉數快/支付寶等，需另配 Stripe 帳號開通，後續再加。
      payment_method_types: ['card'],
      metadata: {
        phone: String((req.body.phone) || '').slice(0, 40),
        note: String((req.body.note) || '').slice(0, 200),
        order: JSON.stringify(items.map(i => ({ n: i.name, z: i.size === 'L' ? '大' : '中', q: i.qty, p: i.price, a: (i.addons || '') }))).slice(0, 400)
      },
      client_reference_id: 'BT' + String(Date.now()).slice(-8),
      success_url: process.env.SUCCESS_URL,
      cancel_url: process.env.CANCEL_URL
    });

    res.status(200).json({ ok: true, url: session.url });
  } catch (e) {
    console.error('checkout error:', e);
    res.status(500).json({ ok: false, msg: '建立結帳失敗，請檢查 Vercel 的 Stripe 金鑰設定' });
  }
};
