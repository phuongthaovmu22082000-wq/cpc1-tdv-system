#!/usr/bin/env bash
# =============================================================================
# CPC1 — Production Smoke Tests
# Chạy sau khi deploy lên Netlify để xác nhận hệ thống hoạt động.
#
# Cách dùng:
#   APP_URL=https://your-site.netlify.app ./scripts/smoke-test.sh
# =============================================================================

set -e

APP_URL="${1:-${NEXT_PUBLIC_APP_URL:-http://localhost:3000}}"

echo "🔬 CPC1 — Smoke Tests"
echo "   URL: $APP_URL"
echo ""

PASS=0
FAIL=0

check() {
  local name="$1"
  local expected="$2"
  local actual="$3"

  if [ "$actual" = "$expected" ]; then
    echo "  ✅ $name"
    PASS=$((PASS + 1))
  else
    echo "  ❌ $name (expected: $expected, got: $actual)"
    FAIL=$((FAIL + 1))
  fi
}

echo "── Pages (unauthenticated) ─────────────────────────────"
check "/ redirects (307)"           "307" "$(curl -s -o /dev/null -w '%{http_code}' "$APP_URL/")"
check "/login returns 200"          "200" "$(curl -s -o /dev/null -w '%{http_code}' "$APP_URL/login")"
check "/dashboard redirects (307)"  "307" "$(curl -s -o /dev/null -w '%{http_code}' "$APP_URL/dashboard")"
check "/customers redirects (307)"  "307" "$(curl -s -o /dev/null -w '%{http_code}' "$APP_URL/customers")"
check "/sales redirects (307)"      "307" "$(curl -s -o /dev/null -w '%{http_code}' "$APP_URL/sales")"
check "/products redirects (307)"   "307" "$(curl -s -o /dev/null -w '%{http_code}' "$APP_URL/products")"
check "/tenders redirects (307)"    "307" "$(curl -s -o /dev/null -w '%{http_code}' "$APP_URL/tenders")"

echo ""
echo "── API Routes (unauthenticated → 401) ──────────────────"
check "GET /api/customers → 401"      "401" "$(curl -s -o /dev/null -w '%{http_code}' "$APP_URL/api/customers")"
check "GET /api/sales → 401"          "401" "$(curl -s -o /dev/null -w '%{http_code}' "$APP_URL/api/sales")"
check "GET /api/products → 401"       "401" "$(curl -s -o /dev/null -w '%{http_code}' "$APP_URL/api/products")"
check "GET /api/tenders → 401"        "401" "$(curl -s -o /dev/null -w '%{http_code}' "$APP_URL/api/tenders")"
check "GET /api/daily-reports → 401"  "401" "$(curl -s -o /dev/null -w '%{http_code}' "$APP_URL/api/daily-reports")"
check "GET /api/kpi → 401"            "401" "$(curl -s -o /dev/null -w '%{http_code}' "$APP_URL/api/kpi")"
check "GET /api/notifications → 401"  "401" "$(curl -s -o /dev/null -w '%{http_code}' "$APP_URL/api/notifications")"

echo ""
echo "── Security Headers ────────────────────────────────────"
HEADERS=$(curl -s -I "$APP_URL/login")
echo "$HEADERS" | grep -qi "x-frame-options: DENY"       && { echo "  ✅ X-Frame-Options: DENY"; PASS=$((PASS+1)); } || { echo "  ❌ X-Frame-Options missing"; FAIL=$((FAIL+1)); }
echo "$HEADERS" | grep -qi "x-content-type-options"      && { echo "  ✅ X-Content-Type-Options present"; PASS=$((PASS+1)); } || { echo "  ❌ X-Content-Type-Options missing"; FAIL=$((FAIL+1)); }
echo "$HEADERS" | grep -qi "referrer-policy"              && { echo "  ✅ Referrer-Policy present"; PASS=$((PASS+1)); } || { echo "  ❌ Referrer-Policy missing"; FAIL=$((FAIL+1)); }

echo ""
echo "── Webhook (no secret → reject) ───────────────────────"
STATUS=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$APP_URL/api/webhook/n8n" \
  -H "Content-Type: application/json" \
  -d '{"action":"unknown"}')
# Khi N8N_API_KEY set: 401. Khi chưa set: 400 (unknown action). Cả 2 đều OK.
if [ "$STATUS" = "401" ] || [ "$STATUS" = "400" ]; then
  echo "  ✅ POST /api/webhook/n8n (no auth) → $STATUS"
  PASS=$((PASS+1))
else
  echo "  ❌ POST /api/webhook/n8n → $STATUS (expected 400 or 401)"
  FAIL=$((FAIL+1))
fi

echo ""
echo "══════════════════════════════════════════════════════"
echo "   PASS: $PASS  |  FAIL: $FAIL"
echo ""

if [ $FAIL -eq 0 ]; then
  echo "✅ Tất cả smoke tests PASS. Hệ thống sẵn sàng."
  exit 0
else
  echo "❌ $FAIL test(s) FAIL. Kiểm tra lại cấu hình."
  exit 1
fi
