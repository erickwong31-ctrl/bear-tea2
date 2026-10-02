// 熊茶館 · 查取餐號：依付款 session 回傳取餐號碼（client_reference_id）
// 前端 ok.html 用 ?session_id 呼叫本函數，取得並顯示取餐號
module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'GET') return res.status(405).json({ ok: false, msg: 'GET only' });

  const id = (req.query && req.query.session_id) || '';
  const SK = process.env.STRIPE_SECRET_KEY || '';
  if (!id || !SK) return res.status(400).json({ ok: false, msg: '缺少 session_id 或未設定密鑰' });

  try {
    const r = await fetch('https://api.stripe.com/v1/checkout/sessions/' + encodeURIComponent(id), {
      headers: { 'Authorization': '***' + SK }
    });
    const d = await r.json();
    if (d && d.client_reference_id) {
      return res.status(200).json({ ok: true, ticket: d.client_reference_id });
    }
    return res.status(200).json({ ok: true, ticket: '' });
  } catch (e) {
    return res.status(500).json({ ok: false, msg: '查詢失敗' });
  }
};
