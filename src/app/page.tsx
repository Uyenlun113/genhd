'use client';

import React, { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import TopHeader from '@/components/TopHeader';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import StatusBadge from '@/components/StatusBadge';
import ConfirmModal from '@/components/ConfirmModal';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useWebSocket } from '@/hooks/useWebSocket';
import {
  Search,
  Plus,
  Eye,
  Edit3,
  FileCheck,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  X,
  Check,
  MoreVertical,
  Download,
  Calendar,
  User,
  Clock,
  CheckCircle,
  PenLine,
  FileSpreadsheet,
} from 'lucide-react';
import ExportExcelModal from '@/components/ExportExcelModal';

interface TestResultItem {
  _id: string;
  maSo: string;
  hoTen: string;
  namSinh: number;
  gioiTinh: string;
  diaChi?: string;
  soDienThoai?: string;
  loaiMau?: string;
  loaiXetNghiem?: string;
  donVi?: string;
  bacSiChiDinh?: string;
  trangThai: 'nhap_thong_tin' | 'chay_ket_qua' | 'da_tra_ket_qua';
  ngayNhanMau?: string;
  ngayDuKienTra?: string;
  createdAt: string;
  bacSiDoc?: string;
  bacSiDoc2?: string;
  nguoiNhap?: any;
  daKy?: boolean;
}

interface DoctorUser {
  _id: string;
  fullName: string;
  allowedCategories?: string[];
}

function DashboardContent() {
  const router = useRouter();
  const { data: session } = useSession();
  const userRole = (session?.user as { role?: string })?.role;
  const searchParams = useSearchParams();
  const doctorFilter = searchParams.get('doctor');
  const categoryFilter = searchParams.get('category') || 'cell';

  const [results, setResults] = useState<TestResultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Doctors list for edit form select
  const [doctors, setDoctors] = useState<DoctorUser[]>([]);

  // 3-Dots Dropdown Menu state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Edit Result Modal State
  const [editItem, setEditItem] = useState<TestResultItem | null>(null);
  const [editFormData, setEditFormData] = useState({
    hoTen: '',
    namSinh: '',
    gioiTinh: 'Nữ',
    diaChi: '',
    soDienThoai: '',
    loaiMau: '',
    donVi: '',
    bacSiChiDinh: '',
    bacSiDoc: '',
  });

  // Modal State for Confirm
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    type: 'danger' | 'info' | 'success';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Xác nhận',
    type: 'info',
    onConfirm: () => { },
  });

  // Close 3-dots menu on click outside
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [creatorFilter, setCreatorFilter] = useState('');
  const [allUsers, setAllUsers] = useState<Array<{ _id: string; fullName: string; username: string; role: string }>>([]);

  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    nhap_thong_tin: 0,
    chay_ket_qua: 0,
    da_tra_ket_qua: 0,
  });

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        status: activeTab,
        category: categoryFilter,
        search,
        page: String(page),
        limit: '10',
      });
      if (doctorFilter) {
        query.set('doctor', doctorFilter);
      }
      if (userRole === 'admin' && creatorFilter) {
        query.set('creator', creatorFilter);
      }
      if (startDate) {
        query.set('startDate', startDate);
      }
      if (endDate) {
        query.set('endDate', endDate);
      }
      const res = await fetch(`/api/test-results?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
        if (data.statusCounts) {
          setStatusCounts(data.statusCounts);
        }
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, categoryFilter, doctorFilter, creatorFilter, search, page, startDate, endDate, userRole]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  useWebSocket((event) => {
    if (event.type === 'REFRESH_TEST_RESULTS') {
      fetchResults();
    }
  });

  useEffect(() => {
    if (userRole === 'lab_adn') {
      router.push('/adn-convert');
    }
  }, [userRole, router]);

  useEffect(() => {
    async function fetchUsersData() {
      try {
        const docRes = await fetch('/api/users?role=doctor');
        if (docRes.ok) {
          const data = await docRes.json();
          setDoctors(data || []);
        }

        if (userRole === 'admin') {
          const allRes = await fetch('/api/users');
          if (allRes.ok) {
            const allData = await allRes.json();
            setAllUsers(allData || []);
          }
        }
      } catch (err) {
        console.error('Fetch users error:', err);
      }
    }
    fetchUsersData();
  }, [userRole]);

  const handleOpenEditModal = (item: TestResultItem) => {
    setEditItem(item);
    setActiveMenuId(null);
    const doctorExists = doctors.some((d) => d.fullName.trim() === item.bacSiDoc?.trim());
    const initialDoctor: string = doctorExists
      ? (item.bacSiDoc || '')
      : (doctors[0]?.fullName || item.bacSiDoc || '');

    setEditFormData({
      hoTen: item.hoTen || '',
      namSinh: String(item.namSinh || ''),
      gioiTinh: item.gioiTinh || 'Nữ',
      diaChi: item.diaChi || '',
      soDienThoai: item.soDienThoai || '',
      loaiMau: item.loaiMau || 'Dịch phết',
      donVi: item.donVi || '',
      bacSiChiDinh: item.bacSiChiDinh || '',
      bacSiDoc: initialDoctor,
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;

    try {
      const res = await fetch(`/api/test-results/${editItem._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editFormData,
          namSinh: Number(editFormData.namSinh),
        }),
      });

      if (res.ok) {
        toast.success(`Đã cập nhật thông tin phiếu ${editItem.maSo}!`);
        setEditItem(null);
        fetchResults();
      } else {
        toast.error('Lỗi cập nhật phiếu');
      }
    } catch {
      toast.error('Lỗi kết nối');
    }
  };

  const [acceptItem, setAcceptItem] = useState<{
    id: string;
    maSo: string;
    loaiXetNghiem?: string;
    bacSiDoc?: string;
    bacSiDoc2?: string;
  } | null>(null);
  const [selectedDoctorForAccept, setSelectedDoctorForAccept] = useState('');
  const [selectedDoctor2ForAccept, setSelectedDoctor2ForAccept] = useState('');

  const handleAcceptClick = (item: { _id: string; maSo: string; loaiXetNghiem?: string; bacSiDoc?: string; bacSiDoc2?: string }) => {
    setActiveMenuId(null);
    setAcceptItem({
      id: item._id,
      maSo: item.maSo,
      loaiXetNghiem: item.loaiXetNghiem,
      bacSiDoc: item.bacSiDoc,
      bacSiDoc2: item.bacSiDoc2,
    });

    const isCombo = item.loaiXetNghiem?.startsWith('combo_');
    const type1 = item.loaiXetNghiem?.startsWith('combo_hpv20')
      ? 'hpv20'
      : item.loaiXetNghiem?.startsWith('combo_hpv40')
      ? 'hpv40'
      : item.loaiXetNghiem || 'cell';
    const type2 = item.loaiXetNghiem?.endsWith('_thinprep') ? 'thinprep' : 'cell';

    const docs1 = doctors.filter(
      (d) => !d.allowedCategories || d.allowedCategories.length === 0 || d.allowedCategories.includes(type1)
    );
    const docs2 = doctors.filter(
      (d) => !d.allowedCategories || d.allowedCategories.length === 0 || d.allowedCategories.includes(type2)
    );

    setSelectedDoctorForAccept(
      item.bacSiDoc && item.bacSiDoc !== 'Chưa phân loại' ? item.bacSiDoc : docs1[0]?.fullName || ''
    );
    setSelectedDoctor2ForAccept(
      item.bacSiDoc2 && item.bacSiDoc2 !== 'Chưa phân loại' ? item.bacSiDoc2 : docs2[0]?.fullName || docs1[0]?.fullName || ''
    );
  };

  const handleConfirmAccept = async () => {
    if (!acceptItem || !selectedDoctorForAccept) return;
    const isCombo = acceptItem.loaiXetNghiem?.startsWith('combo_');
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = { bacSiDoc: selectedDoctorForAccept };
      if (isCombo) {
        payload.bacSiDoc2 = selectedDoctor2ForAccept || selectedDoctorForAccept;
      }

      const res = await fetch(`/api/test-results/${acceptItem.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success(`Đã nhận mẫu ${acceptItem.maSo}!`);
        setAcceptItem(null);
        fetchResults();
      } else {
        toast.error('Lỗi nhận phiếu!');
      }
    } catch {
      toast.error('Lỗi kết nối!');
    }
  };

  const handleDeleteClick = (id: string, maSo: string, hoTen: string) => {
    setActiveMenuId(null);
    setModalConfig({
      isOpen: true,
      title: 'Xóa phiếu xét nghiệm',
      message: `Bạn có chắc chắn muốn xóa phiếu ${maSo} (${hoTen})? Hành động này không thể hoàn tác.`,
      confirmText: 'Xóa phiếu',
      type: 'danger',
      onConfirm: async () => {
        setModalConfig((prev) => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch(`/api/test-results/${id}`, { method: 'DELETE' });
          if (res.ok) {
            toast.success(`Đã xóa phiếu ${maSo} thành công!`);
            fetchResults();
          } else {
            toast.error('Lỗi xóa phiếu!');
          }
        } catch {
          toast.error('Lỗi xóa phiếu!');
        }
      },
    });
  };

  const handleDownloadPDF = (id: string) => {
    setActiveMenuId(null);
    toast.success('Đang tải xuống kết quả PDF...');
    window.open(`/api/test-results/${id}/export-pdf`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <TopHeader />

        <main className="flex-1 p-5 md:p-6 w-full overflow-y-auto">
          <Header
            title={doctorFilter ? `Phiếu xét nghiệm: ${doctorFilter}` : 'Danh sách phiếu xét nghiệm'}
            subtitle={
              doctorFilter
                ? `Danh sách các phiếu xét nghiệm phụ trách bởi ${doctorFilter}`
                : categoryFilter === 'giaiphaubenh'
                  ? 'Quản lý workflow xét nghiệm Giải Phẫu Bệnh GenHD'
                  : categoryFilter === 'soituoi'
                  ? 'Quản lý workflow xét nghiệm Soi tươi dịch GenHD'
                  : categoryFilter === 'thinprep'
                    ? 'Quản lý workflow xét nghiệm Tế bào học ThinPrep GenHD'
                    : categoryFilter === 'hpv40'
                      ? 'Quản lý workflow xét nghiệm HPV 40 Types GenHD'
                      : categoryFilter === 'hpv20'
                        ? 'Quản lý workflow xét nghiệm HPV 20 Types GenHD'
                        : 'Quản lý workflow xét nghiệm Tế bào cổ tử cung (CELL) GenHD'
            }
            action={
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setIsExportModalOpen(true)}
                  className="flex items-center justify-center gap-2 h-10 px-4 text-xs font-bold rounded-xl transition-all bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-xs hover:shadow-md active:scale-[0.98]"
                >
                  <FileSpreadsheet className="w-4 h-4 shrink-0 text-white" />
                  <span>Xuất Excel</span>
                </button>
                {(userRole === 'staff' || userRole === 'admin') && (
                  <Link
                    href={`/results/new?type=${categoryFilter}`}
                    className="flex items-center justify-center gap-2 h-10 px-4 text-xs font-bold rounded-xl transition-all bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white shadow-xs hover:shadow-md active:scale-[0.98]"
                  >
                    <Plus className="w-4 h-4 shrink-0 text-white" />
                    <span>Tạo phiếu mới</span>
                  </Link>
                )}
              </div>
            }
          />

          {doctorFilter && (
            <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700 text-xs font-semibold border border-sky-200">
              <Stethoscope className="w-4 h-4" />
              <span>Đang xem phiếu của bác sĩ: <b>{doctorFilter}</b></span>
              <Link href="/" className="ml-2 text-sky-600 underline text-[11px]">
                Xóa lọc
              </Link>
            </div>
          )}

          {/* Tab Filters, Date Filter & Search */}
          <div className="glass-card p-4 mb-6 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { id: 'all', label: 'Tất cả', count: statusCounts.all },
                  { id: 'nhap_thong_tin', label: 'Nhập thông tin', count: statusCounts.nhap_thong_tin },
                  { id: 'chay_ket_qua', label: 'Chạy kết quả', count: statusCounts.chay_ket_qua },
                  { id: 'da_tra_ket_qua', label: 'Đã trả kết quả', count: statusCounts.da_tra_ket_qua },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all inline-flex items-center gap-1.5 ${
                      activeTab === tab.id
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                        activeTab === tab.id
                          ? 'bg-white/25 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-80 md:w-96">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  style={{ paddingLeft: '2.35rem' }}
                  className="form-input w-full text-xs"
                  placeholder="Tìm theo Tên, Mã số, SĐT..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>

            {/* Date Range & Creator Filter Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-bold text-slate-600 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-sky-600" />
                  <span>Lọc theo ngày tạo:</span>
                </span>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">Từ ngày:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setPage(1);
                    }}
                    className="form-input py-1 px-2 text-xs w-36 bg-white border border-slate-200 rounded-lg"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">Đến ngày:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setPage(1);
                    }}
                    className="form-input py-1 px-2 text-xs w-36 bg-white border border-slate-200 rounded-lg"
                  />
                </div>

                {(startDate || endDate) && (
                  <button
                    onClick={() => {
                      setStartDate('');
                      setEndDate('');
                      setPage(1);
                    }}
                    className="text-xs text-red-600 hover:text-red-800 font-semibold underline ml-1"
                  >
                    Xóa lọc ngày
                  </button>
                )}
              </div>

              {/* Creator Filter Dropdown (ADMIN ONLY) */}
              {userRole === 'admin' && (
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-600 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-purple-600" />
                    <span>Lọc theo nguồn:</span>
                  </span>
                  <select
                    value={creatorFilter}
                    onChange={(e) => {
                      setCreatorFilter(e.target.value);
                      setPage(1);
                    }}
                    className="form-select py-1 px-2.5 text-xs bg-white border border-slate-200 rounded-lg font-semibold text-slate-700"
                  >
                    <option value="">-- Tất cả nguồn tạo --</option>
                    {allUsers
                      .filter((u) => u.role === 'admin' || u.role === 'staff')
                      .map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.fullName} ({u.role === 'admin' ? 'Admin tổng' : 'Nhân viên PK'})
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Data Table */}
          <div className="glass-card" ref={menuRef}>
            <div className="data-table-container min-h-[380px] pb-40">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Mã số</th>
                    <th>Họ và tên</th>
                    <th>Năm sinh</th>
                    {userRole === 'admin' && <th>Nguồn</th>}
                    <th>BS Đọc KQ</th>
                    <th>Trạng thái</th>
                    <th>Dự kiến trả</th>
                    <th>Ngày tạo</th>
                    <th style={{ textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={userRole === 'admin' ? 9 : 8} className="text-center py-10 text-slate-400 text-sm">
                        Đang tải dữ liệu...
                      </td>
                    </tr>
                  ) : results.length === 0 ? (
                    <tr>
                      <td colSpan={userRole === 'admin' ? 9 : 8} className="text-center py-10 text-slate-400 text-sm">
                        Không tìm thấy phiếu xét nghiệm nào
                      </td>
                    </tr>
                  ) : (
                    results.map((item, index) => {
                      const popUpward = index > 1 && index >= results.length - 2;

                      // Creator / Nguồn
                      const creatorName =
                        typeof item.nguoiNhap === 'object' && item.nguoiNhap && (item.nguoiNhap as any).fullName
                          ? (item.nguoiNhap as any).fullName
                          : typeof item.nguoiNhap === 'object' && item.nguoiNhap && (item.nguoiNhap as any).username
                            ? (item.nguoiNhap as any).username
                            : 'Hệ thống';

                      // SLA Calculations (strictly calculated from ngayNhanMau when sample is accepted)
                      const now = new Date().getTime();
                      const acceptedTime = item.ngayNhanMau ? new Date(item.ngayNhanMau).getTime() : null;
                      let elapsedHours = 0;
                      if (acceptedTime && item.trangThai !== 'da_tra_ket_qua') {
                        elapsedHours = (now - acceptedTime) / (1000 * 60 * 60);
                      }

                      const isOverdue72h = acceptedTime && item.trangThai !== 'da_tra_ket_qua' && elapsedHours > 72;
                      const isWarning48h = acceptedTime && item.trangThai !== 'da_tra_ket_qua' && elapsedHours > 48 && elapsedHours <= 72;

                      let rowBgClass = 'hover:bg-slate-50/80 transition-colors';
                      if (isOverdue72h) {
                        rowBgClass = 'bg-red-50/90 text-red-950 font-semibold hover:bg-red-100/90 border-l-4 border-l-red-500';
                      } else if (isWarning48h) {
                        rowBgClass = 'bg-amber-100/70 text-amber-950 font-semibold hover:bg-amber-100/90 border-l-4 border-l-amber-500';
                      }

                      // Expected Completion Date
                      const duKienDate = item.ngayDuKienTra
                        ? new Date(item.ngayDuKienTra)
                        : acceptedTime
                          ? new Date(acceptedTime + 3 * 24 * 60 * 60 * 1000)
                          : null;

                      return (
                        <tr key={item._id} className={rowBgClass}>
                          <td className="font-bold text-sky-600">{item.maSo}</td>
                          <td className="font-semibold text-slate-800">{item.hoTen}</td>
                          <td>{item.namSinh}</td>
                          {userRole === 'admin' && (
                            <td className="text-xs text-slate-700 font-medium">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100/80 text-slate-700 text-[11px] font-medium border border-slate-200">
                                <User className="w-3 h-3 text-slate-500 shrink-0" />
                                <span>{creatorName}</span>
                              </span>
                            </td>
                          )}
                          <td className="text-xs text-slate-600 font-medium">
                            {item.loaiXetNghiem?.startsWith('combo_') ? (
                              (() => {
                                const lxn = item.loaiXetNghiem || '';
                                const part1Name = lxn.includes('hpv20') ? 'HPV 20' : 'HPV 40';
                                const part2Name = lxn.includes('thinprep') ? 'ThinPrep' : 'Cell';
                                const doc1Name = item.bacSiDoc && item.bacSiDoc !== 'Chưa phân loại' ? item.bacSiDoc : 'Chưa phân loại';
                                const doc2Name = (item.bacSiDoc2 || item.bacSiDoc) && (item.bacSiDoc2 || item.bacSiDoc) !== 'Chưa phân loại' ? (item.bacSiDoc2 || item.bacSiDoc) : 'Chưa phân loại';
                                return (
                                  <div className="space-y-1 text-xs">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-sky-700 text-[11px] shrink-0">{part1Name}:</span>
                                      <span className="font-semibold text-slate-800 truncate">{doc1Name}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-purple-700 text-[11px] shrink-0">{part2Name}:</span>
                                      <span className="font-semibold text-slate-800 truncate">{doc2Name}</span>
                                    </div>
                                  </div>
                                );
                              })()
                            ) : item.bacSiDoc === 'Chưa phân loại' ? (
                              <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px] font-semibold">
                                Chưa phân loại
                              </span>
                            ) : (
                              <div>
                                <span className="font-semibold text-slate-800 block">{item.bacSiDoc || '---'}</span>
                                {item.daKy && userRole !== 'staff' && (
                                  <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-300 shadow-2xs">
                                    <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                                    <span>Bác sĩ đã đọc</span>
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td>
                            <div className="flex flex-col items-start gap-1">
                              <StatusBadge status={item.trangThai} />
                              {item.daKy && item.trangThai !== 'da_tra_ket_qua' && userRole !== 'staff' && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-300">
                                  <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                                  <span>Bác sĩ đã đọc & ký</span>
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            {duKienDate ? (
                              <div className="text-xs">
                                <span className="font-semibold text-slate-700 block">
                                  {duKienDate.toLocaleString('vi-VN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                  })}
                                </span>
                                {item.trangThai === 'da_tra_ket_qua' ? (
                                  <span className="text-[10px] text-emerald-600 font-bold">✓ Đã trả kết quả</span>
                                ) : isOverdue72h ? (
                                  <span className="text-[10px] text-red-600 font-bold animate-pulse"><Clock className='inline-block w-3 h-3' /> Quá hạn 72h!</span>
                                ) : isWarning48h ? (
                                  <span className="text-[10px] text-amber-700 font-bold"> <Clock className='inline-block w-3 h-3' /> Cảnh báo &gt;48h</span>
                                ) : (
                                  <span className="text-[10px] text-sky-600 font-bold"> <Clock className='inline-block w-3 h-3' /> Trong thời hạn</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs">Chưa nhận mẫu</span>
                            )}
                          </td>
                          <td className="text-xs text-slate-500">
                            {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="flex gap-2 justify-end items-center relative">
                              {(userRole === 'doctor' || userRole === 'admin' || userRole === 'lab_admin') &&
                                item.trangThai === 'nhap_thong_tin' && (
                                  <button
                                    onClick={() => handleAcceptClick(item)}
                                    className="btn btn-success text-xs py-1 px-2.5"
                                  >
                                    <FileCheck className="w-3.5 h-3.5" />
                                    <span>Nhận mẫu</span>
                                  </button>
                                )}

                              {(userRole === 'doctor' || userRole === 'admin' || userRole === 'lab_admin') &&
                                item.trangThai === 'chay_ket_qua' && (
                                  <Link
                                    href={`/results/${item._id}`}
                                    className="btn btn-primary text-xs py-1 px-2.5 inline-flex items-center gap-1.5 shrink-0"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Nhập kết quả</span>
                                  </Link>
                                )}

                              {/* 3-Dots Action Menu Trigger */}
                              <button
                                onClick={() => setActiveMenuId(activeMenuId === item._id ? null : item._id)}
                                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 shadow-xs shrink-0"
                                title="Thao tác khác"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {/* Floating Dropdown Menu */}
                              {activeMenuId === item._id && (
                                <div
                                  className={`absolute right-0 w-52 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-[100] text-left space-y-0.5 animate-in fade-in zoom-in-95 duration-100 ${popUpward ? 'bottom-full mb-2' : 'top-full mt-1'
                                    }`}
                                >
                                  <button
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      router.push(`/results/${item._id}`);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-sky-600 transition-colors"
                                  >
                                    <Eye className="w-4 h-4 text-sky-600" />
                                    <span>Xem chi tiết</span>
                                  </button>

                                  {(userRole === 'staff' || userRole === 'admin') && item.trangThai === 'nhap_thong_tin' && (
                                    <button
                                      onClick={() => handleOpenEditModal(item)}
                                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                                    >
                                      <Edit3 className="w-4 h-4 text-indigo-600" />
                                      <span>Sửa thông tin phiếu</span>
                                    </button>
                                  )}

                                  {/* Download PDF option ONLY when da_tra_ket_qua */}
                                  {item.trangThai === 'da_tra_ket_qua' && (
                                    <button
                                      onClick={() => handleDownloadPDF(item._id)}
                                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 transition-colors"
                                    >
                                      <Download className="w-4 h-4 text-emerald-600" />
                                      <span>Tải kết quả (PDF)</span>
                                    </button>
                                  )}

                                  {(userRole === 'staff' || userRole === 'admin') && (
                                    <>
                                      <div className="my-1 border-t border-slate-100" />

                                      <button
                                        onClick={() => handleDeleteClick(item._id, item.maSo, item.hoTen)}
                                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                                      >
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                        <span>Xóa phiếu này</span>
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION BAR (ALWAYS VISIBLE) */}
            <div className="flex flex-wrap justify-between items-center gap-3 p-3.5 border-t border-slate-100 bg-slate-50/50 text-xs">
              <div className="text-slate-500 font-medium">
                {results.length > 0 ? (
                  <span>
                    Hiển thị <b>{results.length}</b> phiếu xét nghiệm (Trang <b>{page}</b> / <b>{totalPages}</b>)
                  </span>
                ) : (
                  <span>Chưa có phiếu xét nghiệm nào</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="btn btn-secondary text-xs py-1 px-3 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Trang trước</span>
                </button>

                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${p === page
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}

                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="btn btn-secondary text-xs py-1 px-3 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span>Trang sau</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* Edit Info Modal */}
        {editItem && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 border border-slate-200">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-sky-600" />
                  <span>Chỉnh sửa thông tin phiếu: {editItem.maSo}</span>
                </h3>
                <button
                  onClick={() => setEditItem(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-group sm:col-span-2">
                    <label>Họ và tên bệnh nhân *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editFormData.hoTen}
                      onChange={(e) => setEditFormData({ ...editFormData, hoTen: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Năm sinh *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={editFormData.namSinh}
                      onChange={(e) => setEditFormData({ ...editFormData, namSinh: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Giới tính</label>
                    <select
                      className="form-select"
                      value={editFormData.gioiTinh}
                      onChange={(e) => setEditFormData({ ...editFormData, gioiTinh: e.target.value })}
                    >
                      <option value="Nữ">Nữ</option>
                      <option value="Nam">Nam</option>
                    </select>
                  </div>

                  <div className="form-group sm:col-span-2">
                    <label>Địa chỉ</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editFormData.diaChi}
                      onChange={(e) => setEditFormData({ ...editFormData, diaChi: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Số điện thoại</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editFormData.soDienThoai}
                      onChange={(e) => setEditFormData({ ...editFormData, soDienThoai: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Loại mẫu</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editFormData.loaiMau}
                      onChange={(e) => setEditFormData({ ...editFormData, loaiMau: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Đơn vị gửi mẫu</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editFormData.donVi}
                      onChange={(e) => setEditFormData({ ...editFormData, donVi: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Bác sĩ chỉ định</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editFormData.bacSiChiDinh}
                      onChange={(e) => setEditFormData({ ...editFormData, bacSiChiDinh: e.target.value })}
                    />
                  </div>

                  <div className="form-group sm:col-span-2">
                    <label className="font-bold text-sky-700">Bác sĩ đọc kết quả (Gán phiếu) *</label>
                    <select
                      className="form-select font-semibold border-sky-300 bg-sky-50/50 text-slate-800"
                      value={editFormData.bacSiDoc}
                      onChange={(e) => setEditFormData({ ...editFormData, bacSiDoc: e.target.value })}
                      required
                    >
                      <option value="Chưa phân loại">-- Chưa phân loại (Tạo phiếu nháp) --</option>
                      {doctors
                        .filter((doc) => !doc.allowedCategories || doc.allowedCategories.includes(categoryFilter))
                        .map((doc) => (
                          <option key={doc._id} value={doc.fullName}>
                            {doc.fullName}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditItem(null)}
                    className="btn btn-secondary"
                  >
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <Check className="w-4 h-4" />
                    <span>Lưu cập nhật</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL PHÂN CÔNG BÁC SĨ KHI NHẬN MẪU */}
        {acceptItem && (() => {
          const isCombo = acceptItem.loaiXetNghiem?.startsWith('combo_');
          const type1 = acceptItem.loaiXetNghiem?.startsWith('combo_hpv20')
            ? 'hpv20'
            : acceptItem.loaiXetNghiem?.startsWith('combo_hpv40')
            ? 'hpv40'
            : acceptItem.loaiXetNghiem || 'cell';
          const type2 = acceptItem.loaiXetNghiem?.endsWith('_thinprep') ? 'thinprep' : 'cell';

          const docs1 = doctors.filter(
            (d) => !d.allowedCategories || d.allowedCategories.length === 0 || d.allowedCategories.includes(type1)
          );
          const docs2 = doctors.filter(
            (d) => !d.allowedCategories || d.allowedCategories.length === 0 || d.allowedCategories.includes(type2)
          );

          const label1 = isCombo
            ? `Bác sĩ đọc kết quả cho Phiếu 1 (${type1.toUpperCase()}) *`
            : 'Bác sĩ đọc kết quả *';
          const label2 = `Bác sĩ đọc kết quả cho Phiếu 2 (${type2.toUpperCase()}) *`;

          return (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-150">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100 space-y-4 text-left">
                <h3 className="text-base font-bold text-sky-800 flex items-center gap-2 pb-3 border-b border-slate-100">
                  <FileCheck className="w-5 h-5 text-sky-600" />
                  <span>Tiếp nhận mẫu & Phân công Bác sĩ</span>
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Vui lòng chọn Bác sĩ sẽ phụ trách đọc và ký kết quả cho phiếu xét nghiệm <strong className="text-sky-700">{acceptItem.maSo}</strong>:
                </p>

                <div className="form-group">
                  <label className="block text-xs font-bold text-sky-800 mb-1.5">
                    {label1}
                  </label>
                  <select
                    value={selectedDoctorForAccept}
                    onChange={(e) => setSelectedDoctorForAccept(e.target.value)}
                    className="form-select font-semibold border-sky-300 bg-sky-50/50 text-slate-800 text-xs w-full py-2"
                  >
                    <option value="">-- Chọn Bác sĩ đọc kết quả --</option>
                    {docs1.map((doc) => (
                      <option key={doc._id} value={doc.fullName}>
                        {doc.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                {isCombo && (
                  <div className="form-group">
                    <label className="block text-xs font-bold text-purple-800 mb-1.5">
                      {label2}
                    </label>
                    <select
                      value={selectedDoctor2ForAccept}
                      onChange={(e) => setSelectedDoctor2ForAccept(e.target.value)}
                      className="form-select font-semibold border-purple-300 bg-purple-50/50 text-slate-800 text-xs w-full py-2"
                    >
                      <option value="">-- Chọn Bác sĩ đọc kết quả --</option>
                      {docs2.map((doc) => (
                        <option key={doc._id} value={doc.fullName}>
                          {doc.fullName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setAcceptItem(null)}
                    className="btn btn-secondary text-xs"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmAccept}
                    disabled={!selectedDoctorForAccept || (isCombo && !selectedDoctor2ForAccept)}
                    className="btn btn-success text-xs"
                  >
                    Xác nhận nhận mẫu
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Export Excel Modal */}
        <ExportExcelModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          initialCategory={categoryFilter}
          initialStartDate={startDate}
          initialEndDate={endDate}
          initialStatus={activeTab}
        />

        {/* Custom Confirmation Popup Modal */}
        <ConfirmModal
          isOpen={modalConfig.isOpen}
          title={modalConfig.title}
          message={modalConfig.message}
          confirmText={modalConfig.confirmText}
          type={modalConfig.type}
          onConfirm={modalConfig.onConfirm}
          onCancel={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
        />
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Đang tải trang...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
