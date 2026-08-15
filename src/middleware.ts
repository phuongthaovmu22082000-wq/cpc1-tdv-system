import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/auth/session';

/**
 * Middleware — TASK 019 Security
 * Chạy trước mọi request, thực hiện:
 * 1. Security headers (Spec Section 19)
 * 2. Simple in-memory rate limiting cho /login (chống brute force)
 * 3. Redirect / → /login hoặc /dashboard tuỳ trạng thái auth
 */

// ─── Simple in-memory rate limiter (per IP) ───────────────────────────────────
// Production nên dùng Netlify Edge Rate Limiting hoặc Redis. Đây là fallback
// cơ bản cho dev/preview environment.
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_LOGIN_ATTEMPTS = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 phút

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record || now > record.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return false;
  }
  record.count++;
  return record.count > MAX_LOGIN_ATTEMPTS;
}

// ─── Security headers ─────────────────────────────────────────────────────────
function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js yêu cầu unsafe-eval ở dev
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self'",
      "connect-src 'self'",
    ].join('; '),
  );
  return response;
}

// ─── Matcher config ───────────────────────────────────────────────────────────
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  // Rate limiting cho POST /login
  if (pathname === '/login' && request.method === 'POST') {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    if (isRateLimited(ip)) {
      return applySecurityHeaders(new NextResponse('Too Many Requests', { status: 429 }));
    }
  }

  // Redirect / → /login hoặc /dashboard
  if (pathname === '/') {
    const destination = sessionCookie ? '/dashboard' : '/login';
    return NextResponse.redirect(new URL(destination, request.url));
  }

  const response = NextResponse.next();
  return applySecurityHeaders(response);
}
