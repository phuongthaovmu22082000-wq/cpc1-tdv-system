/**
 * API Response Standard — Spec Section 16
 * { data, error } pattern cho tất cả API routes.
 */
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCurrentEmployee } from '@/lib/auth/current-user';
import type { CurrentEmployee } from '@/lib/auth/current-user';

// ─── Response helpers ─────────────────────────────────────────────────────────

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data, error: null }, { status });
}

export function err(code: string, message: string, status: number) {
  return NextResponse.json({ data: null, error: { code, message } }, { status });
}

export const UNAUTHORIZED = () => err('UNAUTHORIZED', 'Chưa đăng nhập.', 401);
export const FORBIDDEN = () => err('FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.', 403);
export const NOT_FOUND = (msg = 'Không tìm thấy.') => err('NOT_FOUND', msg, 404);
export const BAD_REQUEST = (msg: string) => err('BAD_REQUEST', msg, 400);
export const SERVER_ERROR = () => err('INTERNAL_ERROR', 'Lỗi hệ thống. Vui lòng thử lại.', 500);

// ─── Auth-aware route wrapper ─────────────────────────────────────────────────

type RouteHandler = (
  req: Request,
  ctx: { employee: CurrentEmployee; params?: Record<string, string> },
) => Promise<NextResponse>;

/**
 * Wrap route handler với auth check tự động.
 * Trả 401 nếu chưa đăng nhập — không redirect (API không dùng redirect).
 */
export function withAuth(handler: RouteHandler) {
  return async (req: Request, { params }: { params?: Promise<Record<string, string>> }) => {
    try {
      const employee = await getCurrentEmployee();
      if (!employee) return UNAUTHORIZED();

      const resolvedParams = params ? await params : undefined;
      return await handler(req, { employee, params: resolvedParams });
    } catch (e) {
      // Không expose lỗi DB raw cho client (Spec Section 16)
      console.error('[API error]', e);
      return SERVER_ERROR();
    }
  };
}
