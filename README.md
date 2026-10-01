# 🧋 熊茶館點單 · Vercel 零依賴版（最穩，免費不用信用卡）

此版本**刻意不含 package.json / vercel.json**。後端用 Node 內建 `fetch()` 呼叫 Stripe API，
Vercel 會正確辨識為「靜態網站 + serverless 函數」，**建置不會出錯、首頁不會 404**。

## 檔案（就這些，全部上傳，缺一不可）
```
index.html        點單前端（首頁）
ok.html           付款成功頁
api/checkout.js   收款函數（後端，零依賴）
```

## 部署步驟
1. 把以上 3 個項目（含 api 資料夾）推到 GitHub 根目錄 **或** 在 Vercel **New Project → Drop**
2. 拿到網址：`https://你的專案.vercel.app`
3. 到 Settings → **Environment Variables** 填 3 個變數，再 **Redeploy**：
   - `STRIPE_SECRET_KEY` = `sk_live_...`（測試用 `sk_test_...`）
   - `SUCCESS_URL` = `https://你的專案.vercel.app/ok.html`
   - `CANCEL_URL` = `https://你的專案.vercel.app/`
4. 打開網址點單 → 結算 → Stripe 付款

## Stripe 香港收款
- stripe.com 註冊，地區選 **香港**，填香港企業 + 銀行帳戶。
- 測試卡 `4242 4242 4242 4242`。正式換 `sk_live_`。
