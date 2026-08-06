import './globals.css';
import { Providers } from './providers';
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-plus-jakarta',
});

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
    <html lang="vi" className={plusJakartaSans.variable}>
      <body className={plusJakartaSans.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
