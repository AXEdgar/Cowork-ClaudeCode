# Hướng dẫn cấu hình Payment (Thanh toán)

Làm theo **5 bước** bên dưới để hệ thống tự động nhận đơn và gửi ebook.

---

## BƯỚC 1 — Điền thông tin ngân hàng vào index.html

Mở `index.html`, tìm đoạn comment `// ── CẤU HÌNH` gần cuối file (trong `<script>`):

```js
var BANK_ID      = 'MB';           // ← đổi thành mã ngân hàng của bạn
var ACCOUNT_NO   = '1234567890';   // ← đổi thành số tài khoản
var ACCOUNT_NAME = 'NGUYEN VAN A'; // ← đổi thành tên chủ TK (IN HOA, không dấu)
```

**Mã ngân hàng VietQR phổ biến:**

| Ngân hàng    | Mã   |
|--------------|------|
| MB Bank      | MB   |
| Vietcombank  | VCB  |
| Techcombank  | TCB  |
| BIDV         | BIDV |
| VPBank       | VPB  |
| Agribank     | AGR  |
| ACB          | ACB  |
| Sacombank    | STB  |

> Danh sách đầy đủ: https://api.vietqr.io/v2/banks

---

## BƯỚC 2 — Tạo Telegram Bot

1. Mở Telegram → tìm **@BotFather** → nhắn `/newbot`
2. Đặt tên bot (vd: `ClaudeCoworkEbook`) và username (vd: `coworkebook_bot`)
3. BotFather trả về **Bot Token** → lưu lại (dạng `1234567890:AAF...`)
4. Nhắn bất kỳ tin nhắn nào tới bot vừa tạo
5. Mở URL sau (thay `BOT_TOKEN`) để lấy **Chat ID** của bạn:
   ```
   https://api.telegram.org/bot<BOT_TOKEN>/getUpdates
   ```
   → Tìm `"chat":{"id":XXXXXXXXX}` — số đó là Chat ID của bạn

---

## BƯỚC 3 — Tạo tài khoản Resend (gửi email)

1. Đăng ký tại **https://resend.com** (miễn phí, 100 email/ngày)
2. Vào **API Keys** → **Create API Key** → lưu lại key (`re_xxxx...`)
3. Vào **Domains** → thêm domain của bạn (nếu có) để gửi từ địa chỉ đẹp
   - Nếu chưa có domain, có thể dùng email mặc định của Resend

---

## BƯỚC 4 — Upload ebook PDF lên Google Drive

1. Tải PDF ebook lên Google Drive
2. Chuột phải → **Share** → **Anyone with the link** (Viewer)
3. Copy link, ví dụ: `https://drive.google.com/file/d/XXXXXX/view`
4. Đổi thành link tải trực tiếp:
   ```
   https://drive.google.com/uc?export=download&id=XXXXXX
   ```
   *(thay `XXXXXX` bằng ID trong link gốc)*

---

## BƯỚC 5 — Thêm Environment Variables trên Vercel

1. Vào **Vercel Dashboard** → chọn project → **Settings** → **Environment Variables**
2. Thêm 5 biến sau:

| Variable               | Ví dụ giá trị                                      |
|------------------------|-----------------------------------------------------|
| `TELEGRAM_BOT_TOKEN`   | `1234567890:AAFxxxxxxxxxxxxxxx`                     |
| `TELEGRAM_CHAT_ID`     | `987654321`                                         |
| `RESEND_API_KEY`       | `re_xxxxxxxxxxxxxxxxxxxxxxxx`                       |
| `FROM_EMAIL`           | `ebook@yourdomain.com` hoặc `onboarding@resend.dev` |
| `EBOOK_DOWNLOAD_URL`   | `https://drive.google.com/uc?export=download&id=XX` |

3. Click **Save** → **Redeploy** project

---

## BƯỚC 6 — Đăng ký Telegram Webhook (1 lần duy nhất)

Sau khi deploy xong, mở URL này trong trình duyệt (thay các giá trị):

```
https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://<YOUR-VERCEL-DOMAIN>/api/telegram
```

Ví dụ:
```
https://api.telegram.org/bot1234567890:AAF.../setWebhook?url=https://claude-cowork-ebook.vercel.app/api/telegram
```

Nếu trả về `{"ok":true}` → thành công!

---

## Cách sử dụng hàng ngày

Khi có khách chuyển khoản:

1. Bạn nhận thông báo Telegram từ bot với thông tin đơn hàng
2. Kiểm tra app ngân hàng → xác nhận tiền đã vào
3. Nhắn vào bot: `OK email@gmail.com`
4. Bot tự động gửi email chứa link tải ebook cho khách
5. Bot xác nhận lại cho bạn: `✅ Đã gửi ebook thành công!`

---

## Lưu ý bảo mật

- **Không commit** file `.env` lên GitHub — dùng Vercel Environment Variables
- Link tải Google Drive nên để **Viewer only**, không cho phép copy hay tải lại nhiều lần nếu muốn bảo vệ nội dung
- Chỉ **Chat ID của bạn** mới có thể ra lệnh `OK` — bot sẽ bỏ qua tin nhắn từ người khác

---

*Cần hỗ trợ? Liên hệ qua Telegram hoặc email.*
