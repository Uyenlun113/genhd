import React from 'react';
import { FileEdit, FlaskConical, CheckCircle2 } from 'lucide-react';

interface StatusBadgeProps {
  status: 'nhap_thong_tin' | 'chay_ket_qua' | 'da_tra_ket_qua' | string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case 'nhap_thong_tin':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <FileEdit className="w-3.5 h-3.5" />
          <span>Nhập thông tin</span>
        </span>
      );
    case 'chay_ket_qua':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <FlaskConical className="w-3.5 h-3.5" />
          <span>Chạy kết quả</span>
        </span>
      );
    case 'da_tra_ket_qua':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Đã trả kết quả</span>
        </span>
      );
    default:
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">{status}</span>;
  }
}
