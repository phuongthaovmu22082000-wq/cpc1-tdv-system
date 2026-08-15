#!/usr/bin/env bash
# =============================================================================
# CPC1 — Netlify Environment Variables Setup
#
# Yêu cầu: netlify CLI (npm install -g netlify-cli) và đã đăng nhập (netlify login)
#
# Cách dùng:
#   chmod +x scripts/setup-netlify-env.sh
#   SITE_ID=<netlify-site-id> ./scripts/setup-netlify-env.sh
#
# Hoặc set thủ công trong Netlify Dashboard:
#   Site Settings → Environment Variables
# =============================================================================

set -e

echo "🔧 CPC1 — Netlify Environment Variables"
echo ""
echo "Điền các giá trị thực tế vào bên dưới:"
echo "(Nhấn Enter để bỏ qua nếu muốn set thủ công trên Dashboard)"
echo ""

read -p "DATABASE_URL (postgresql://...): " DB_URL
read -p "NEXT_PUBLIC_APP_URL (https://your-site.netlify.app): " APP_URL
read -p "ADMIN_EMAIL (email tài khoản ADMIN đầu tiên): " ADMIN_EMAIL
read -p "ADMIN_PASSWORD (mật khẩu ≥ 8 ký tự): " ADMIN_PASSWORD
read -p "ADMIN_FULL_NAME: " ADMIN_NAME
read -p "ADMIN_EMPLOYEE_CODE (vd: NV0001): " ADMIN_CODE
read -p "N8N_WEBHOOK_URL (để trống nếu chưa có): " N8N_URL
read -p "N8N_API_KEY (để trống nếu chưa có): " N8N_KEY

# AUTH_SECRET tự tạo ngẫu nhiên
AUTH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

echo ""
echo "📤 Set environment variables..."

netlify env:set NODE_ENV production
netlify env:set DATABASE_URL "$DB_URL"
netlify env:set AUTH_SECRET "$AUTH_SECRET"
netlify env:set NEXT_PUBLIC_APP_URL "$APP_URL"
netlify env:set ADMIN_EMAIL "$ADMIN_EMAIL"
netlify env:set ADMIN_PASSWORD "$ADMIN_PASSWORD"
netlify env:set ADMIN_FULL_NAME "$ADMIN_NAME"
netlify env:set ADMIN_EMPLOYEE_CODE "$ADMIN_CODE"

if [ -n "$N8N_URL" ]; then
  netlify env:set N8N_WEBHOOK_URL "$N8N_URL"
fi
if [ -n "$N8N_KEY" ]; then
  netlify env:set N8N_API_KEY "$N8N_KEY"
fi

echo ""
echo "✅ Environment variables đã set!"
echo ""
echo "AUTH_SECRET (lưu lại nơi an toàn): $AUTH_SECRET"
echo ""
echo "Bước tiếp theo: chạy seed sau deploy đầu tiên"
echo "  scripts/run-seed.sh"
