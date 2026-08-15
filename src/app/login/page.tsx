import { redirect } from 'next/navigation';
import { getCurrentEmployee } from '@/lib/auth/current-user';
import { LoginForm } from '@/components/forms/login-form';

export default async function LoginPage() {
  const currentEmployee = await getCurrentEmployee();
  if (currentEmployee) {
    redirect('/dashboard');
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-slate-50 px-6">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-slate-900">CPC1 — Đăng nhập</h1>
        <p className="mt-1 text-sm text-slate-500">
          Hệ thống Quản lý Trình Dược Viên — CPC1 Hà Nội
        </p>
      </div>
      <LoginForm />
    </main>
  );
}
