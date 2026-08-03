import './globals.css';
import { Providers } from './providers';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GenHD - Hệ Thống Quản Lý & Xuất Kết Quả Xét Nghiệm',
  description: 'Hệ thống nhập liệu, quản lý và xuất kết quả xét nghiệm CELL, HPV 40 Types và HPV 20 Types GenHD',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
