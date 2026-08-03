import './globals.css';
import { Providers } from './providers';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GenHD - Quản Lý Phiếu Xét Nghiệm Tế Bào Cổ Tử Cung',
  description: 'Hệ thống nhập liệu, quản lý và xuất kết quả xét nghiệm GenHD',
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
