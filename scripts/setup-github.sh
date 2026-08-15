#!/usr/bin/env bash
# =============================================================================
# CPC1 — GitHub Setup Script
# Chạy script này trên máy của bạn sau khi giải nén cpc1-final.tar.gz
#
# Yêu cầu: git đã cài, đã đăng nhập GitHub (gh CLI hoặc personal access token)
#
# Cách dùng:
#   chmod +x scripts/setup-github.sh
#   ./scripts/setup-github.sh <github-username> <repo-name>
#
# Ví dụ:
#   ./scripts/setup-github.sh cpc1company cpc1-tdv-system
# =============================================================================

set -e

GITHUB_USER="${1:-YOUR_GITHUB_USERNAME}"
REPO_NAME="${2:-cpc1-tdv-system}"

echo "🚀 CPC1 — GitHub Setup"
echo "   User : $GITHUB_USER"
echo "   Repo : $REPO_NAME"
echo ""

# 1. Tạo repo trên GitHub (dùng gh CLI nếu có)
if command -v gh &>/dev/null; then
  echo "📦 Tạo repository trên GitHub..."
  gh repo create "$GITHUB_USER/$REPO_NAME" \
    --private \
    --description "Hệ thống Quản lý Trình Dược Viên CPC1 Hà Nội" \
    --confirm 2>/dev/null || echo "  (repo có thể đã tồn tại, bỏ qua)"
else
  echo "⚠  gh CLI chưa cài. Hãy tạo repo thủ công tại:"
  echo "   https://github.com/new"
  echo "   Tên: $REPO_NAME | Private | KHÔNG khởi tạo với README"
  echo ""
  read -p "   Nhấn Enter sau khi tạo xong... " _
fi

# 2. Add remote và push
echo "📤 Push code lên GitHub..."
git remote remove origin 2>/dev/null || true
git remote add origin "https://github.com/$GITHUB_USER/$REPO_NAME.git"
git branch -M main
git push -u origin main

echo ""
echo "✅ Xong! Repo tại: https://github.com/$GITHUB_USER/$REPO_NAME"
echo ""
echo "Bước tiếp theo: Kết nối Netlify"
echo "  https://app.netlify.com/start/deploy?repository=https://github.com/$GITHUB_USER/$REPO_NAME"
