#!/usr/bin/env bash
# =============================================================================
# CPC1 — Production Database Seed
#
# Chạy script này MỘT LẦN sau deploy đầu tiên lên production.
# Script idempotent — có thể chạy lại an toàn.
#
# Yêu cầu: DATABASE_URL đã set trong environment hoặc .env.local
#
# Cách dùng:
#   DATABASE_URL="postgresql://..." ./scripts/run-seed.sh
#   hoặc set trong .env.local rồi chạy: ./scripts/run-seed.sh
# =============================================================================

set -e

echo "🌱 CPC1 — Production Seed"
echo ""

if [ -z "$DATABASE_URL" ]; then
  if [ -f ".env.local" ]; then
    export $(grep -v '^#' .env.local | grep DATABASE_URL | xargs)
    echo "📄 Loaded DATABASE_URL from .env.local"
  else
    echo "❌ DATABASE_URL chưa được set."
    echo "   Cách 1: DATABASE_URL='postgresql://...' ./scripts/run-seed.sh"
    echo "   Cách 2: Thêm DATABASE_URL vào .env.local"
    exit 1
  fi
fi

echo "1️⃣  Chạy migration..."
npm run db:migrate

echo ""
echo "2️⃣  Seed dữ liệu hệ thống (roles, permissions, territories)..."
npm run db:seed

echo ""
echo "3️⃣  Tạo tài khoản ADMIN đầu tiên..."
echo "   (cần ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_FULL_NAME, ADMIN_EMPLOYEE_CODE trong env)"
npm run db:seed:admin

echo ""
echo "✅ Seed hoàn tất!"
echo ""
echo "Đăng nhập tại: ${NEXT_PUBLIC_APP_URL:-http://localhost:3000}/login"
echo "  Email   : $ADMIN_EMAIL"
echo "  Password: (đã set qua ADMIN_PASSWORD)"
