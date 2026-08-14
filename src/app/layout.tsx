import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CPC1 — Quản lý Trình Dược Viên',
  description: 'Hệ thống quản lý nội bộ đội ngũ trình dược viên CPC1 Hà Nội',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
