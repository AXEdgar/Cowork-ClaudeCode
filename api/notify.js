/**
 * api/notify.js
 * Khi khách bấm "Tôi đã chuyển khoản":
 *   → Nhận { email, orderCode } từ frontend
 *   → Gửi thông báo Telegram tới Edgar kèm nút bấm 1 lần để gửi ebook
 *
 * ENV vars:
 *   TELEGRAM_BOT_TOKEN  – token từ @BotFather
 *   TELEGRAM_CHAT_ID    – chat ID của Edgar
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, orderCode } = req.body || {};

  if (!email || !orderCode) {
    return res.status(400).json({ error: 'Missing email or orderCode' });
  }

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID   = process.env.TELEGRAM_CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    console.error('Missing env vars');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const message = [
    '💰 *ĐƠN MỚI – CLAUDE COWORK EBOOK*',
    '',
    `📧 Email: \`${email}\``,
    `🔑 Nội dung CK: \`${orderCode}\``,
    `💵 Số tiền: 99.000đ`,
    '',
    'Kiểm tra app ngân hàng → bấm nút bên dưới để gửi ebook:',
  ].join('\n');

  // Inline keyboard: Edgar chỉ cần TAP 1 LẦN
  const reply_markup = {
    inline_keyboard: [[
      {
        text: `✅ Gửi ebook → ${email}`,
        callback_data: `OK:${email}`,
      },
    ]],
  };

  try {
    const tgRes = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
          parse_mode: 'Markdown',
          reply_markup,
        }),
      }
    );

    if (!tgRes.ok) {
      const err = await tgRes.text();
      console.error('Telegram API error:', err);
      return res.status(502).json({ error: 'Telegram API error' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Fetch error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
