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
} from 'lucide-react';

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

  useEffect(() => {
    async function fetchStats() {
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
    }
    fetchStats();
  }, []);

  useWebSocket((event) => {
    if (event.type === 'REFRESH_TEST_RESULTS') {
      async function fetchStats() {
        try {
          const res = await fetch('/api/stats');
          if (res.ok) {
            const data = await res.json();
            setStats(data);
          }
        } catch (err) {
          console.error('Fetch stats error:', err);
        }
      }
      fetchStats();
    }
  });

  const isDoctor = stats?.userRole === 'doctor';
  const allowedCats = stats?.allowedCategories || ['cell', 'thinprep', 'hpv40', 'hpv20'];
  const canSeeCell = allowedCats.includes('cell');
  const canSeeThinPrep = allowedCats.includes('thinprep');
  const canSeeHPV40 = allowedCats.includes('hpv40');
  const canSeeHPV20 = allowedCats.includes('hpv20');

  const total = stats?.totalCount || 0;
  const cellPct = total > 0 ? Math.round(((stats?.byCategory.cell || 0) / total) * 100) : 0;
  const thinprepPct = total > 0 ? Math.round(((stats?.byCategory.thinprep || 0) / total) * 100) : 0;
  const hpv40Pct = total > 0 ? Math.round(((stats?.byCategory.hpv40 || 0) / total) * 100) : 0;
  const hpv20Pct = total > 0 ? Math.round(((stats?.byCategory.hpv20 || 0) / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <TopHeader />

      <div className="flex flex-1 w-full">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 w-full">
          <Header
            title={
              isDoctor
                ? `Thống kê phiếu của Bác sĩ: ${stats?.userName || ''}`
                : 'Thống kê & Báo cáo hệ thống'
            }
            subtitle={
              isDoctor
                ? `Tổng quan cá nhân chỉ số phiếu xét nghiệm được phân công cho ${stats?.userName || ''}`
                : 'Tổng quan chỉ số hoạt động xét nghiệm tế bào & HPV GenHD'
            }
          />

          {isDoctor && (
            <div className="mb-6 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-sky-50 text-sky-700 text-xs font-bold border border-sky-200 shadow-xs">
              <Stethoscope className="w-4 h-4 text-sky-600" />
              <span>Chế độ xem Bác sĩ: Dữ liệu bên dưới đã tự động lọc duy nhất cho <b>{stats?.userName}</b></span>
            </div>
          )}

          {loading ? (
            <div className="py-20 text-center text-slate-400">Đang tải dữ liệu thống kê...</div>
          ) : !stats ? (
            <div className="py-20 text-center text-red-500">Không thể tải dữ liệu thống kê</div>
          ) : (
            <div className="space-y-6">
              {/* Top Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
                {/* Total Card - Only show for Admin and Staff */}
                {!isDoctor && (
                  <div className="glass-card p-4 sm:p-4.5 border-l-4 border-l-sky-500 flex items-center justify-between shadow-xs">
                    <div>
                      <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Tổng số phiếu
                      </span>
                      <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 block">
                        {stats.totalCount}
                      </span>
                      <span className="text-[11px] text-sky-600 font-semibold mt-1 inline-flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> Tất cả phân loại
                      </span>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold shrink-0">
                      <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                  </div>
                )}

                {/* CELL Card */}
                {canSeeCell && (
                  <Link
                    href={isDoctor ? `/?category=cell&doctor=${encodeURIComponent(stats.userName || '')}` : '/?category=cell'}
                    className="glass-card p-4 sm:p-4.5 border-l-4 border-l-sky-500 flex items-center justify-between hover:shadow-md transition-all group"
                  >
                    <div>
                      <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Xét nghiệm CELL
                      </span>
                      <span className="text-2xl sm:text-3xl font-extrabold text-sky-600 mt-1 block">
                        {stats.byCategory.cell}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                        Chiếm {cellPct}% tổng phiếu
                      </span>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                      <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                  </Link>
                )}

                {/* ThinPrep Card */}
                {canSeeThinPrep && (
                  <Link
                    href={isDoctor ? `/?category=thinprep&doctor=${encodeURIComponent(stats.userName || '')}` : '/?category=thinprep'}
                    className="glass-card p-4 sm:p-4.5 border-l-4 border-l-purple-500 flex items-center justify-between hover:shadow-md transition-all group"
                  >
                    <div>
                      <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Xét nghiệm ThinPrep
                      </span>
                      <span className="text-2xl sm:text-3xl font-extrabold text-purple-600 mt-1 block">
                        {stats.byCategory.thinprep || 0}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                        Chiếm {thinprepPct}% tổng phiếu
                      </span>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                      <FlaskConical className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                  </Link>
                )}

                {/* HPV 40 Card */}
                {canSeeHPV40 && (
                  <Link
                    href={isDoctor ? `/?category=hpv40&doctor=${encodeURIComponent(stats.userName || '')}` : '/?category=hpv40'}
                    className="glass-card p-4 sm:p-4.5 border-l-4 border-l-indigo-500 flex items-center justify-between hover:shadow-md transition-all group"
                  >
                    <div>
                      <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Xét nghiệm HPV 40
                      </span>
                      <span className="text-2xl sm:text-3xl font-extrabold text-indigo-600 mt-1 block">
                        {stats.byCategory.hpv40}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                        Chiếm {hpv40Pct}% tổng phiếu
                      </span>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                      <Dna className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                  </Link>
                )}

                {/* HPV 20 Card */}
                {canSeeHPV20 && (
                  <Link
                    href={isDoctor ? `/?category=hpv20&doctor=${encodeURIComponent(stats.userName || '')}` : '/?category=hpv20'}
                    className="glass-card p-4 sm:p-4.5 border-l-4 border-l-teal-500 flex items-center justify-between hover:shadow-md transition-all group"
                  >
                    <div>
                      <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Xét nghiệm HPV 20
                      </span>
                      <span className="text-2xl sm:text-3xl font-extrabold text-teal-600 mt-1 block">
                        {stats.byCategory.hpv20}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                        Chiếm {hpv20Pct}% tổng phiếu
                      </span>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                      <TestTube className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                  </Link>
                )}
              </div>

              {/* Status Workflow Progress Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="glass-card p-5 border border-amber-200/80 bg-gradient-to-br from-amber-50/50 to-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                      Nhập thông tin (Mới gán)
                    </span>
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  </div>
                  <span className="text-3xl font-extrabold text-amber-700 block">
                    {stats.byStatus.nhap_thong_tin}
                  </span>
                  <p className="text-xs text-amber-600 mt-2 font-medium">
                    Phiếu chờ nhận xử lý
                  </p>
                </div>

                <div className="glass-card p-5 border border-sky-200/80 bg-gradient-to-br from-sky-50/50 to-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-sky-800 uppercase tracking-wider">
                      Đang chạy kết quả
                    </span>
                    <Clock className="w-5 h-5 text-sky-600" />
                  </div>
                  <span className="text-3xl font-extrabold text-sky-700 block">
                    {stats.byStatus.chay_ket_qua}
                  </span>
                  <p className="text-xs text-sky-600 mt-2 font-medium">
                    Đang đọc mẫu & hoàn thiện kết quả
                  </p>
                </div>

                <div className="glass-card p-5 border border-emerald-200/80 bg-gradient-to-br from-emerald-50/50 to-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                      Đã trả kết quả
                    </span>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="text-3xl font-extrabold text-emerald-700 block">
                    {stats.byStatus.da_tra_ket_qua}
                  </span>
                  <p className="text-xs text-emerald-600 mt-2 font-medium">
                    Phiếu đã ký & trả kết quả hoàn tất
                  </p>
                </div>
              </div>

              {/* Visual Distribution Progress Bars */}
              <div className="glass-card p-6">
                <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-sky-600" />
                  <span>Tỷ lệ phân bổ theo loại xét nghiệm được phân công</span>
                </h3>

                <div className="space-y-4">
                  {canSeeCell && (
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1 text-slate-700">
                        <span>CELL (Tế bào cổ tử cung)</span>
                        <span>{stats.byCategory.cell} phiếu ({cellPct}%)</span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sky-500 rounded-full transition-all duration-500"
                          style={{ width: `${cellPct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {canSeeThinPrep && (
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1 text-slate-700">
                        <span>ThinPrep (Tế bào học ThinPrep)</span>
                        <span>{stats.byCategory.thinprep || 0} phiếu ({thinprepPct}%)</span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full transition-all duration-500"
                          style={{ width: `${thinprepPct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {canSeeHPV40 && (
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1 text-slate-700">
                        <span>HPV 40 Types</span>
                        <span>{stats.byCategory.hpv40} phiếu ({hpv40Pct}%)</span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${hpv40Pct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {canSeeHPV20 && (
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1 text-slate-700">
                        <span>HPV 20 Types</span>
                        <span>{stats.byCategory.hpv20} phiếu ({hpv20Pct}%)</span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-500 rounded-full transition-all duration-500"
                          style={{ width: `${hpv20Pct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Doctor Assignment Table */}
              <div className="glass-card p-6">
                <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <span>{isDoctor ? 'Thống kê công việc của bạn' : 'Thống kê số lượng phiếu theo Bác sĩ đọc kết quả'}</span>
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                        <th className="py-3 px-4">Bác sĩ đọc kết quả</th>
                        <th className="py-3 px-4 text-center">Tổng số phiếu gán</th>
                        <th className="py-3 px-4 text-center">Đã hoàn tất</th>
                        <th className="py-3 px-4 text-center">Đang xử lý</th>
                        <th className="py-3 px-4 text-right">Xem danh sách</th>
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
                            <td className="py-3 px-4 font-bold text-slate-800">
                              <span className="inline-flex items-center gap-1.5">
                                <Stethoscope className="w-4 h-4 text-sky-600" />
                                <span>{doc.doctorName}</span>
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-sky-600">
                              {doc.count}
                            </td>
                            <td className="py-3 px-4 text-center text-emerald-600 font-semibold">
                              {doc.completed}
                            </td>
                            <td className="py-3 px-4 text-center text-sky-600 font-semibold">
                              {doc.processing}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Link
                                href={`/?doctor=${encodeURIComponent(doc.doctorName)}`}
                                className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-800 font-semibold text-xs"
                              >
                                <span>Xem danh sách</span>
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
          )}
        </main>
      </div>
    </div>
  );
}
