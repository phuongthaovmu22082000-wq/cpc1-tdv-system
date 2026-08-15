import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">
        CPC1 — Hệ thống Quản lý Trình Dược Viên
      </h1>
      <p className="max-w-md text-sm text-slate-500">
        Project đã được khởi tạo. Authentication đã sẵn sàng — đăng nhập để tiếp tục.
      </p>
      <Link
        href="/login"
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
      >
        Đăng nhập
      </Link>
    </main>
  );
}
