# Claude Cowork Ebook – Sales Page

Landing page bán ebook "Claude Cowork – Hướng Dẫn Toàn Tập" với giá 99.000đ.

## Cấu trúc
```
/
├── index.html     ← Sales page chính (HTML thuần, không cần build)
├── vercel.json    ← Config Vercel (security headers, cache, rewrite)
├── .gitignore
└── README.md
```

## Deploy lên Vercel

### Cách 1: Kéo thả (nhanh nhất)
1. Vào https://vercel.com/new
2. Kéo thả thư mục này vào trang
3. Nhấn Deploy → xong!

### Cách 2: GitHub (khuyên dùng)
1. Push thư mục lên GitHub repo
2. Vào https://vercel.com/new → Import Git Repository
3. Chọn repo → Framework: Other → Deploy

### Cách 3: Vercel CLI
```bash
npm i -g vercel
cd claude-cowork-ebook
vercel
```

## Gắn tên miền riêng
1. Vào Project Settings → Domains
2. Add Domain → nhập domain của bạn
3. Thêm CNAME record vào DNS provider theo hướng dẫn của Vercel
