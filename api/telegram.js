// Tăng timeout lên 30s để tránh Vercel cold start làm webhook lỗi
export const maxDuration = 30;

/**
 * api/telegram.js  –  Telegram Bot Webhook
 *
 * Hỗ trợ 2 cách xác nhận:
 *   1. TAP NÚT (nhanh): Edgar tap nút "✅ Gửi ebook" trong Telegram → tự động gửi
 *   2. NHẮN TAY (dự phòng): Edgar nhắn "OK email@gmail.com"
 *
 * ENV vars:
 *   TELEGRAM_BOT_TOKEN  – token từ @BotFather
 *   TELEGRAM_CHAT_ID    – chat ID của Edgar
 *   RESEND_API_KEY      – API key từ resend.com
 *   FROM_EMAIL          – địa chỉ gửi ebook
 *   EBOOK_DOWNLOAD_URL  – link tải PDF
 *
 * Đăng ký webhook (1 lần sau khi deploy):
 *   https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://your-site.vercel.app/api/telegram
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const BOT_TOKEN  = process.env.TELEGRAM_BOT_TOKEN;
  const MY_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
  const BREVO_KEY  = process.env.BREVO_API_KEY;
  const FROM_EMAIL = process.env.FROM_EMAIL || 'duclam203@gmail.com';
  const FROM_NAME  = process.env.FROM_NAME  || 'Claude Cowork Ebook';
  const EBOOK_URL  = process.env.EBOOK_DOWNLOAD_URL;

  const ok = () => res.status(200).json({ ok: true });

  let update;
  try { update = req.body; } catch { return ok(); }

  /* ══════════════════════════════════════════════════════
     CÁCH 1: Callback query – Edgar TAP NÚT inline button
  ══════════════════════════════════════════════════════ */
  if (update?.callback_query) {
    const cq = update.callback_query;

    // Bảo mật: chỉ Edgar mới được dùng
    if (String(cq.from?.id) !== String(MY_CHAT_ID)) {
      await answerCallback(BOT_TOKEN, cq.id, '⛔ Không có quyền');
      return ok();
    }

    const data = cq.data || '';

    if (data.startsWith('OK:')) {
      const email = data.slice(3).trim().toLowerCase();

      // Trả lời ngay để Telegram bỏ loading
      await answerCallback(BOT_TOKEN, cq.id, '⏳ Đang gửi ebook...');

      // Gửi ebook
      const success = await sendEbook(email, { BREVO_KEY, FROM_EMAIL, FROM_NAME, EBOOK_URL });

      if (success) {
        // Sửa message gốc: thay nút bằng trạng thái đã xử lý
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageReplyMarkup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: cq.message.chat.id,
            message_id: cq.message.message_id,
            reply_markup: { inline_keyboard: [] }, // xoá nút
          }),
        });
        await sendTelegram(BOT_TOKEN, MY_CHAT_ID,
          `✅ Đã gửi ebook tới \`${email}\` thành công!`
        );
      } else {
        await sendTelegram(BOT_TOKEN, MY_CHAT_ID,
          `❌ Lỗi gửi email tới \`${email}\` — kiểm tra RESEND_API_KEY và FROM_EMAIL`
        );
      }
    }

    return ok();
  }

  /* ══════════════════════════════════════════════════════
     CÁCH 2: Text message – Edgar nhắn "OK email" thủ công
  ══════════════════════════════════════════════════════ */
  const msg = update?.message;
  if (!msg) return ok();

  if (String(msg.chat?.id) !== String(MY_CHAT_ID)) return ok();

  const text = (msg.text || '').trim();

  if (/^ok\s+\S+@\S+\.\S+/i.test(text)) {
    const email = text.replace(/^ok\s+/i, '').trim().toLowerCase();
    const success = await sendEbook(email, { BREVO_KEY, FROM_EMAIL, FROM_NAME, EBOOK_URL });

    if (success) {
      await sendTelegram(BOT_TOKEN, MY_CHAT_ID,
        `✅ Đã gửi ebook tới \`${email}\` thành công!`
      );
    } else {
      await sendTelegram(BOT_TOKEN, MY_CHAT_ID,
        `❌ Lỗi gửi email tới \`${email}\``
      );
    }
    return ok();
  }

  return ok();
}

/* ── Helpers ─────────────────────────────────────────────── */

async function answerCallback(token, callbackQueryId, text) {
  return fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  });
}

async function sendTelegram(token, chatId, text) {
  return fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
  });
}

async function sendEbook(email, { BREVO_KEY, FROM_EMAIL, FROM_NAME, EBOOK_URL }) {
  try {
    const r = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender:      { name: FROM_NAME, email: FROM_EMAIL },
        to:          [{ email }],
        subject:     '🎉 Ebook Claude Cowork của bạn đây!',
        htmlContent: buildEmailHtml(email, EBOOK_URL),
      }),
    });
    if (!r.ok) {
      const err = await r.text();
      console.error('Brevo error:', err);
    }
    return r.ok;
  } catch (err) {
    console.error('sendEbook error:', err);
    return false;
  }
}

function buildEmailHtml(email, downloadUrl) {
  return `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Ebook Claude Cowork</title></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" bgcolor="#f5f5f5">
  <tr><td align="center" style="padding:32px 16px">
    <table width="560" cellpadding="0" cellspacing="0" bgcolor="#ffffff"
      style="border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.10);max-width:100%">

      <tr><td bgcolor="#0D47A1" style="padding:32px;text-align:center">
        <div style="font-size:36px;margin-bottom:8px">📘</div>
        <h1 style="color:#fff;font-size:22px;margin:0;font-weight:900">Claude Cowork – Hướng Dẫn Toàn Tập</h1>
        <p style="color:rgba(255,255,255,.75);font-size:14px;margin:8px 0 0">Cảm ơn bạn đã đặt mua!</p>
      </td></tr>

      <tr><td style="padding:32px">
        <p style="font-size:16px;color:#212121;margin:0 0 16px">Xin chào,</p>
        <p style="font-size:15px;color:#424242;line-height:1.7;margin:0 0 24px">
          Thanh toán của bạn đã được xác nhận. Cảm ơn bạn đã tin tưởng! 🎉<br/>
          Bấm vào nút bên dưới để tải ebook về máy:
        </p>

        <table cellpadding="0" cellspacing="0" width="100%">
          <tr><td align="center" style="padding:8px 0 28px">
            <a href="${downloadUrl}"
              style="background:linear-gradient(135deg,#D32F2F,#B71C1C);color:#fff;
                     font-size:18px;font-weight:800;padding:16px 40px;border-radius:12px;
                     text-decoration:none;display:inline-block;
                     box-shadow:0 4px 18px rgba(211,47,47,.35)">
              📥 Tải Ebook Ngay
            </a>
          </td></tr>
        </table>

        <table cellpadding="0" cellspacing="0" width="100%"
          style="background:#E8F0FE;border-radius:12px;margin-bottom:24px">
          <tr><td style="padding:20px">
            <p style="font-size:14px;font-weight:700;color:#0D47A1;margin:0 0 12px">📋 Nội dung trong ebook:</p>
            ${[
              '9 chương hướng dẫn A→Z đầy đủ',
              '4 siêu quyền năng: Claude.md · Skills · Connectors · Scheduled Tasks',
              '7 Skills thực tế với hướng dẫn step-by-step',
              'Template Claude.md sẵn dùng ngay',
              'Roadmap 4 tuần từ mới → AI Employee 24/7',
            ].map(item => `<p style="font-size:13px;color:#1A237E;margin:4px 0">✓ ${item}</p>`).join('')}
          </td></tr>
        </table>

        <p style="font-size:13px;color:#757575;line-height:1.6;margin:0">
          Link tải không có thời hạn — bạn có thể tải lại bất cứ lúc nào.<br/>
          Không thấy email? Kiểm tra thư mục <strong>Spam/Junk</strong>.
        </p>
      </td></tr>

      <tr><td bgcolor="#F5F5F5" style="padding:20px;text-align:center;border-top:1px solid #E0E0E0">
        <p style="font-size:12px;color:#9E9E9E;margin:0">
          Gửi tới ${email} · Claude Cowork Ebook<br/>
          Đây là email tự động, vui lòng không reply.
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`;
}
