'use client';

import React, { useState } from 'react';
import { X, FileSpreadsheet, Calendar, Filter, Download, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ExportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: string;
  initialStartDate?: string;
  initialEndDate?: string;
  initialStatus?: string;
}

export default function ExportExcelModal({
  isOpen,
  onClose,
  initialCategory = 'all',
  initialStartDate = '',
  initialEndDate = '',
  initialStatus = 'all',
}: ExportExcelModalProps) {
  const [category, setCategory] = useState(initialCategory);
  const [status, setStatus] = useState(initialStatus);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleQuickDatePreset = (preset: 'today' | '7days' | 'thisMonth' | 'all') => {
    const today = new Date();
    if (preset === 'today') {
      const formattedStr = today.toISOString().split('T')[0];
      setStartDate(formattedStr);
      setEndDate(formattedStr);
    } else if (preset === '7days') {
      const past = new Date(today);
      past.setDate(past.getDate() - 7);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    } else if (preset === 'thisMonth') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    } else {
      setStartDate('');
      setEndDate('');
    }
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        category,
        status,
      });
      if (startDate) query.set('startDate', startDate);
      if (endDate) query.set('endDate', endDate);

      const res = await fetch(`/api/test-results/export-excel?${query.toString()}`);
      if (!res.ok) {
        throw new Error('Lỗi khi tải file Excel');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const now = new Date();
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      a.download = `Danh_Sach_Xet_Nghiem_${category}_${dateStr}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      toast.success('Đã tải xuống file Excel thành công!');
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Không thể xuất Excel, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Xuất Báo Cáo Excel</h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                Xuất file Excel chuẩn 16 cột thông tin cho tất cả dịch vụ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          {/* Highlight Notification */}
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              File Excel tải về bao gồm các trường: <b>STT, Mã ca, Tên KH, Ngày sinh, Giới tính, Địa chỉ, SĐT, Chuẩn đoán, Loại mẫu, Đơn vị, Bác sỹ chỉ định, Gói xét nghiệm, Trạng thái, Ngày nhận/trả mẫu, Bác sỹ đọc.</b>
            </span>
          </div>

          {/* Dịch vụ Select */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-emerald-600" />
              <span>Gói Dịch Vụ Xét Nghiệm</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-10 px-3 text-sm font-semibold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-slate-50/50"
            >
              <option value="all">Tất Cả Dịch Vụ</option>
              <option value="cell">Xét nghiệm Cell</option>
              <option value="thinprep">Xét nghiệm ThinPrep</option>
              <option value="hpv40">Xét nghiệm HPV 40 Types</option>
              <option value="hpv20">Xét nghiệm HPV 20 Types</option>
              <option value="hpv23">Xét nghiệm HPV 23 Types</option>
              <option value="soituoi">Xét nghiệm Soi Tươi</option>
              <option value="giaiphaubenh">Giải Phẫu Bệnh</option>
            </select>
          </div>

          {/* Trạng thái mẫu Select */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Trạng Thái Mẫu
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full h-10 px-3 text-sm font-semibold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-slate-50/50"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="nhap_thong_tin">Nhập thông tin (Mới nhận)</option>
              <option value="chay_ket_qua">Đang chạy kết quả</option>
              <option value="da_tra_ket_qua">Đã trả kết quả (Hoàn tất)</option>
            </select>
          </div>

          {/* Date Presets & Custom Pickers */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>Khoảng Thời Gian (Ngày Tạo / Ngày Nhận)</span>
            </label>

            {/* Presets */}
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                type="button"
                onClick={() => handleQuickDatePreset('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${!startDate && !endDate
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                  }`}
              >
                Tất cả thời gian
              </button>
              <button
                type="button"
                onClick={() => handleQuickDatePreset('today')}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
              >
                Hôm nay
              </button>
              <button
                type="button"
                onClick={() => handleQuickDatePreset('7days')}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
              >
                7 ngày qua
              </button>
              <button
                type="button"
                onClick={() => handleQuickDatePreset('thisMonth')}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
              >
                Tháng này
              </button>
            </div>

            {/* Custom Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] font-medium text-slate-500 block mb-1">Từ ngày</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full h-9 px-3 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-500 block mb-1">Đến ngày</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full h-9 px-3 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-200/60 transition-colors"
          >
            Hủy bỏ
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-sm hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang kết xuất Excel...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 shrink-0" />
                <span>Tải File Excel (.xlsx)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
