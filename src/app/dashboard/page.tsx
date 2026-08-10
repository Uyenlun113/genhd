'use client';

import React, { useState, useEffect } from 'react';
import TopHeader from '@/components/TopHeader';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Link from 'next/link';
import { useWebSocket } from '@/hooks/useWebSocket';
import {
  BarChart3,
  Activity,
  Dna,
  TestTube,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  ArrowRight,
  TrendingUp,
  Stethoscope,
  FlaskConical,
  UserCheck,
  FileSpreadsheet,
  PieChart as PieIcon,
  Layers,
} from 'lucide-react';
import ExportExcelModal from '@/components/ExportExcelModal';
import { exportDoctorStatsExcel } from '@/lib/excelExport';

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

interface StatsData {
  totalCount: number;
  userRole?: string;
  userName?: string;
  allowedCategories?: string[];
  byCategory: {
    cell: number;
    thinprep?: number;
    hpv40: number;
    hpv20: number;
    soituoi?: number;
    giaiphaubenh?: number;
  };
  byStatus: {
    nhap_thong_tin: number;
    chay_ket_qua: number;
    da_tra_ket_qua: number;
  };
  byDoctor: Array<{
    doctorName: string;
    count: number;
    completed: number;
    processing: number;
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Fetch stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useWebSocket((event) => {
    if (event.type === 'REFRESH_TEST_RESULTS') {
      fetchStats();
    }
  });

  const isDoctor = stats?.userRole === 'doctor';
  const isStaff = stats?.userRole === 'staff';
  const allowedCats = stats?.allowedCategories || ['cell', 'thinprep', 'hpv40', 'hpv20', 'soituoi', 'giaiphaubenh'];
  const canSeeCell = allowedCats.includes('cell');
  const canSeeThinPrep = allowedCats.includes('thinprep');
  const canSeeHPV40 = allowedCats.includes('hpv40');
  const canSeeHPV20 = allowedCats.includes('hpv20');
  const canSeeSoiTuoi = allowedCats.includes('soituoi') || isDoctor || isStaff || stats?.userRole === 'admin' || stats?.userRole === 'lab_admin';
  const canSeeGiaiPhauBenh = allowedCats.includes('giaiphaubenh') || isDoctor || isStaff || stats?.userRole === 'admin' || stats?.userRole === 'lab_admin';

  const total = stats?.totalCount || 0;
  const cellCount = stats?.byCategory.cell || 0;
  const thinprepCount = stats?.byCategory.thinprep || 0;
  const hpv40Count = stats?.byCategory.hpv40 || 0;
  const hpv20Count = stats?.byCategory.hpv20 || 0;
  const soituoiCount = stats?.byCategory.soituoi || 0;
  const giaiphaubenhCount = stats?.byCategory.giaiphaubenh || 0;

  const cellPct = total > 0 ? Math.round((cellCount / total) * 100) : 0;
  const thinprepPct = total > 0 ? Math.round((thinprepCount / total) * 100) : 0;
  const hpv40Pct = total > 0 ? Math.round((hpv40Count / total) * 100) : 0;
  const hpv20Pct = total > 0 ? Math.round((hpv20Count / total) * 100) : 0;
  const soituoiPct = total > 0 ? Math.round((soituoiCount / total) * 100) : 0;
  const giaiphaubenhPct = total > 0 ? Math.round((giaiphaubenhCount / total) * 100) : 0;

  // Chart Data Preparation
  const categoryChartData = [
    { name: 'CELL', value: cellCount, color: '#0284c7', pct: cellPct, show: canSeeCell },
    { name: 'ThinPrep', value: thinprepCount, color: '#9333ea', pct: thinprepPct, show: canSeeThinPrep },
    { name: 'HPV 40', value: hpv40Count, color: '#4f46e5', pct: hpv40Pct, show: canSeeHPV40 },
    { name: 'HPV 20', value: hpv20Count, color: '#0d9488', pct: hpv20Pct, show: canSeeHPV20 },
    { name: 'Soi tươi', value: soituoiCount, color: '#059669', pct: soituoiPct, show: canSeeSoiTuoi },
    { name: 'Giải Phẫu Bệnh', value: giaiphaubenhCount, color: '#d97706', pct: giaiphaubenhPct, show: canSeeGiaiPhauBenh },
  ].filter((item) => item.show && item.value > 0);

  const categoryBarData = [
    { name: 'CELL', 'Số phiếu': cellCount, color: '#0284c7', show: canSeeCell },
    { name: 'ThinPrep', 'Số phiếu': thinprepCount, color: '#9333ea', show: canSeeThinPrep },
    { name: 'HPV 40', 'Số phiếu': hpv40Count, color: '#4f46e5', show: canSeeHPV40 },
    { name: 'HPV 20', 'Số phiếu': hpv20Count, color: '#0d9488', show: canSeeHPV20 },
    { name: 'Soi tươi', 'Số phiếu': soituoiCount, color: '#059669', show: canSeeSoiTuoi },
    { name: 'GPB', 'Số phiếu': giaiphaubenhCount, color: '#d97706', show: canSeeGiaiPhauBenh },
  ].filter((item) => item.show);

  const doctorChartData = (stats?.byDoctor || []).map((doc) => ({
    name: doc.doctorName.length > 15 ? `${doc.doctorName.substring(0, 15)}...` : doc.doctorName,
    fullName: doc.doctorName,
    'Đã hoàn tất': doc.completed,
    'Đang xử lý': doc.processing,
  }));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <TopHeader />

      <div className="flex flex-1 w-full">
        <Sidebar />

        <main className="flex-1 p-5 md:p-6 w-full overflow-y-auto max-h-[calc(100vh-61px)]">
          <Header
            title={
              isDoctor
                ? `Thống kê phiếu của Bác sĩ: ${stats?.userName || ''}`
                : isStaff
                  ? `Thống kê phiếu của Phòng khám: ${stats?.userName || ''}`
                  : 'Thống kê & Báo cáo hệ thống'
            }
            subtitle={
              isDoctor
                ? `Tổng quan cá nhân chỉ số phiếu xét nghiệm được phân công cho ${stats?.userName || ''}`
                : isStaff
                  ? `Tổng quan cá nhân chỉ số phiếu xét nghiệm được tạo bởi ${stats?.userName || ''}`
                  : 'Tổng quan chỉ số hoạt động xét nghiệm tế bào & HPV GenHD'
            }
            action={
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm hover:shadow-md hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98]"
              >
                <FileSpreadsheet className="w-4 h-4 shrink-0 text-white" />
                <span>Xuất Excel Tất Cả Dịch Vụ</span>
              </button>
            }
          />

          {isDoctor ? (
            <div className="mb-6 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-sky-50 text-sky-700 text-xs font-bold border border-sky-200 shadow-xs">
              <Stethoscope className="w-4 h-4 text-sky-600" />
              <span>Chế độ xem Bác sĩ: Dữ liệu bên dưới đã tự động lọc duy nhất cho <b>{stats?.userName}</b></span>
            </div>
          ) : isStaff ? (
            <div className="mb-6 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 shadow-xs">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Chế độ xem Nhân viên / Phòng khám: Dữ liệu bên dưới đã tự động lọc các phiếu tạo bởi <b>{stats?.userName}</b></span>
            </div>
          ) : null}

          {loading ? (
            <div className="py-20 text-center text-slate-400">Đang tải dữ liệu thống kê...</div>
          ) : !stats ? (
            <div className="py-20 text-center text-red-500">Không thể tải dữ liệu thống kê</div>
          ) : (
            <div className="space-y-6">
              {/* Top Workflow Status & Total KPI Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Cards */}
                <div className="bg-white p-5 rounded-2xl border border-rose-200/80 shadow-xs flex items-center justify-between bg-gradient-to-br from-rose-50/40 to-white">
                  <div>
                    <span className="text-xs font-bold text-rose-700 uppercase tracking-wider block">
                      Tổng số phiếu xét nghiệm
                    </span>
                    <span className="text-3xl font-black text-rose-600 mt-1 block">
                      {stats.totalCount}
                    </span>
                    <span className="text-[11px] text-rose-700/80 font-semibold mt-1 inline-flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-rose-600" /> Tất cả phân loại
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-rose-100/80 text-rose-600 flex items-center justify-center font-bold shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                </div>

                {/* Status: Nhập thông tin */}
                <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-xs flex items-center justify-between bg-gradient-to-br from-amber-50/40 to-white">
                  <div>
                    <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block">
                      Nhập thông tin
                    </span>
                    <span className="text-3xl font-black text-amber-600 mt-1 block">
                      {stats.byStatus.nhap_thong_tin}
                    </span>
                    <span className="text-[11px] text-amber-700/80 font-semibold mt-1 block">
                      Chờ nhận mẫu & xử lý
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-100/80 text-amber-600 flex items-center justify-center font-bold shrink-0">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                </div>

                {/* Status: Đang chạy kết quả */}
                <div className="bg-white p-5 rounded-2xl border border-sky-200/80 shadow-xs flex items-center justify-between bg-gradient-to-br from-sky-50/40 to-white">
                  <div>
                    <span className="text-xs font-bold text-sky-700 uppercase tracking-wider block">
                      Đang chạy kết quả
                    </span>
                    <span className="text-3xl font-black text-sky-600 mt-1 block">
                      {stats.byStatus.chay_ket_qua}
                    </span>
                    <span className="text-[11px] text-sky-700/80 font-semibold mt-1 block">
                      Đang đọc mẫu & hoàn thiện
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-sky-100/80 text-sky-600 flex items-center justify-center font-bold shrink-0">
                    <Clock className="w-6 h-6" />
                  </div>
                </div>

                {/* Status: Đã trả kết quả */}
                <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-xs flex items-center justify-between bg-gradient-to-br from-emerald-50/40 to-white">
                  <div>
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
                      Đã trả kết quả
                    </span>
                    <span className="text-3xl font-black text-emerald-600 mt-1 block">
                      {stats.byStatus.da_tra_ket_qua}
                    </span>
                    <span className="text-[11px] text-emerald-700/80 font-semibold mt-1 block">
                      Phiếu đã ký & hoàn tất
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Service Categories Quick Grid (Balanced 6-Column Layout) */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-600" />
                  <span>Chi tiết số phiếu theo gói dịch vụ</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {/* CELL */}
                  {canSeeCell && (
                    <Link
                      href={isDoctor ? `/?category=cell&doctor=${encodeURIComponent(stats.userName || '')}` : '/?category=cell'}
                      className="bg-white p-4 rounded-xl border border-slate-200/80 hover:border-sky-300 hover:shadow-md transition-all group block"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-600">CELL</span>
                        <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Activity className="w-4 h-4" />
                        </div>
                      </div>
                      <span className="text-2xl font-extrabold text-sky-600 block">{cellCount}</span>
                      <span className="text-[10px] text-slate-500 font-medium block mt-0.5">{cellPct}% tổng số</span>
                    </Link>
                  )}

                  {/* ThinPrep */}
                  {canSeeThinPrep && (
                    <Link
                      href={isDoctor ? `/?category=thinprep&doctor=${encodeURIComponent(stats.userName || '')}` : '/?category=thinprep'}
                      className="bg-white p-4 rounded-xl border border-slate-200/80 hover:border-purple-300 hover:shadow-md transition-all group block"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-600">ThinPrep</span>
                        <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <FlaskConical className="w-4 h-4" />
                        </div>
                      </div>
                      <span className="text-2xl font-extrabold text-purple-600 block">{thinprepCount}</span>
                      <span className="text-[10px] text-slate-500 font-medium block mt-0.5">{thinprepPct}% tổng số</span>
                    </Link>
                  )}

                  {/* HPV 40 */}
                  {canSeeHPV40 && (
                    <Link
                      href={isDoctor ? `/?category=hpv40&doctor=${encodeURIComponent(stats.userName || '')}` : '/?category=hpv40'}
                      className="bg-white p-4 rounded-xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-md transition-all group block"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-600">HPV 40</span>
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Dna className="w-4 h-4" />
                        </div>
                      </div>
                      <span className="text-2xl font-extrabold text-indigo-600 block">{hpv40Count}</span>
                      <span className="text-[10px] text-slate-500 font-medium block mt-0.5">{hpv40Pct}% tổng số</span>
                    </Link>
                  )}

                  {/* HPV 20 */}
                  {canSeeHPV20 && (
                    <Link
                      href={isDoctor ? `/?category=hpv20&doctor=${encodeURIComponent(stats.userName || '')}` : '/?category=hpv20'}
                      className="bg-white p-4 rounded-xl border border-slate-200/80 hover:border-teal-300 hover:shadow-md transition-all group block"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-600">HPV 20</span>
                        <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <TestTube className="w-4 h-4" />
                        </div>
                      </div>
                      <span className="text-2xl font-extrabold text-teal-600 block">{hpv20Count}</span>
                      <span className="text-[10px] text-slate-500 font-medium block mt-0.5">{hpv20Pct}% tổng số</span>
                    </Link>
                  )}

                  {/* Soi Tươi */}
                  {canSeeSoiTuoi && (
                    <Link
                      href={isDoctor ? `/?category=soituoi&doctor=${encodeURIComponent(stats.userName || '')}` : '/?category=soituoi'}
                      className="bg-white p-4 rounded-xl border border-slate-200/80 hover:border-emerald-300 hover:shadow-md transition-all group block"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-600">Soi tươi</span>
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Activity className="w-4 h-4" />
                        </div>
                      </div>
                      <span className="text-2xl font-extrabold text-emerald-600 block">{soituoiCount}</span>
                      <span className="text-[10px] text-slate-500 font-medium block mt-0.5">{soituoiPct}% tổng số</span>
                    </Link>
                  )}

                  {/* GPB */}
                  {canSeeGiaiPhauBenh && (
                    <Link
                      href={isDoctor ? `/?category=giaiphaubenh&doctor=${encodeURIComponent(stats.userName || '')}` : '/?category=giaiphaubenh'}
                      className="bg-white p-4 rounded-xl border border-slate-200/80 hover:border-amber-300 hover:shadow-md transition-all group block"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-600">GPB</span>
                        <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <FileText className="w-4 h-4" />
                        </div>
                      </div>
                      <span className="text-2xl font-extrabold text-amber-600 block">{giaiphaubenhCount}</span>
                      <span className="text-[10px] text-slate-500 font-medium block mt-0.5">{giaiphaubenhPct}% tổng số</span>
                    </Link>
                  )}
                </div>
              </div>

              {/* Dynamic Interactive Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Donut Chart: Service Ratio Distribution */}
                <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <PieIcon className="w-5 h-5 text-indigo-600" />
                        <span>Tỷ lệ phân bổ dịch vụ</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">Tỷ lệ % từng loại xét nghiệm trong hệ thống</p>
                    </div>
                  </div>

                  <div className="h-64 w-full relative my-auto">
                    {categoryChartData.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                        Chưa có dữ liệu phiếu xét nghiệm
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={65}
                            outerRadius={90}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {categoryChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-slate-900 text-white text-xs p-2.5 rounded-xl shadow-lg border border-slate-700">
                                    <span className="font-bold block">{data.name}</span>
                                    <span className="text-slate-300">
                                      Số lượng: <b>{data.value} phiếu</b> ({data.pct}%)
                                    </span>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    )}

                    {/* Center Text inside Donut Chart */}
                    {categoryChartData.length > 0 && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-black text-slate-800">{total}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phiếu</span>
                      </div>
                    )}
                  </div>

                  {/* Chart Legend */}
                  <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100 text-xs">
                    {categoryChartData.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between px-2 py-1 rounded-lg bg-slate-50">
                        <span className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="font-semibold text-slate-700">{item.name}</span>
                        </span>
                        <span className="font-bold text-slate-900">{item.value} ({item.pct}%)</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bar Chart: Service Comparison */}
                <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-sky-600" />
                        <span>Biểu đồ so sánh số lượng phiếu</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">Số phiếu ghi nhận theo từng loại xét nghiệm</p>
                    </div>
                  </div>

                  <div className="h-72 w-full my-auto">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-slate-900 text-white text-xs p-2.5 rounded-xl shadow-lg border border-slate-700">
                                  <span className="font-bold block">{data.name}</span>
                                  <span className="text-sky-300">
                                    Tổng phiếu: <b>{payload[0].value}</b>
                                  </span>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="Số phiếu" radius={[8, 8, 0, 0]}>
                          {categoryBarData.map((entry, index) => (
                            <Cell key={`bar-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Doctor Assignment Statistics Section */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                      <Users className="w-5 h-5 text-indigo-600" />
                      <span>{isDoctor ? 'Thống kê công việc của bạn' : 'Thống kê tiến độ theo Bác sĩ đọc kết quả'}</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Theo dõi chi tiết số phiếu Đã hoàn tất & Đang xử lý</p>
                  </div>

                  {stats.byDoctor.length > 0 && (
                    <button
                      onClick={() => exportDoctorStatsExcel(stats.byDoctor)}
                      className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-xl transition-all shadow-2xs hover:shadow-xs active:scale-[0.98]"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Xuất Excel Thống Kê Bác Sĩ</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  {/* Doctor Grouped Bar Chart */}
                  {doctorChartData.length > 0 && (
                    <div className="lg:col-span-6 h-64 w-full border-r-0 lg:border-r border-slate-100 pr-0 lg:pr-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={doctorChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }} />
                          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                          <Tooltip
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-slate-900 text-white text-xs p-3 rounded-xl shadow-lg border border-slate-700 space-y-1">
                                    <span className="font-bold text-sky-300 block mb-1">{label}</span>
                                    {payload.map((p, idx) => (
                                      <div key={idx} className="flex items-center justify-between gap-4">
                                        <span style={{ color: p.color }}>{p.name}:</span>
                                        <span className="font-bold">{p.value} phiếu</span>
                                      </div>
                                    ))}
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                          <Bar dataKey="Đã hoàn tất" fill="#10b981" radius={[6, 6, 0, 0]} />
                          <Bar dataKey="Đang xử lý" fill="#0284c7" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Doctor Table */}
                  <div className={`${doctorChartData.length > 0 ? 'lg:col-span-6' : 'lg:col-span-12'} overflow-x-auto`}>
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                          <th className="py-2.5 px-3">Bác sĩ đọc kết quả</th>
                          <th className="py-2.5 px-3 text-center">Tổng</th>
                          <th className="py-2.5 px-3 text-center">Đã hoàn tất</th>
                          <th className="py-2.5 px-3 text-center">Đang xử lý</th>
                          <th className="py-2.5 px-3 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-medium">
                        {stats.byDoctor.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-slate-400">
                              Chưa có thông tin bác sĩ
                            </td>
                          </tr>
                        ) : (
                          stats.byDoctor.map((doc, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-2.5 px-3 font-bold text-slate-800">
                                <span className="inline-flex items-center gap-1.5">
                                  <Stethoscope className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                                  <span>{doc.doctorName}</span>
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center font-extrabold text-slate-900">
                                {doc.count}
                              </td>
                              <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">
                                {doc.completed}
                              </td>
                              <td className="py-2.5 px-3 text-center text-sky-600 font-bold">
                                {doc.processing}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <Link
                                  href={`/?doctor=${encodeURIComponent(doc.doctorName)}`}
                                  className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-800 font-bold text-xs"
                                >
                                  <span>Xem phiếu</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Export Excel Modal */}
          <ExportExcelModal
            isOpen={isExportModalOpen}
            onClose={() => setIsExportModalOpen(false)}
            initialCategory="all"
          />
        </main>
      </div>
    </div>
  );
}
