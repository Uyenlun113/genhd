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
} from 'lucide-react';

interface TestResultItem {
  _id: string;
  maSo: string;
  hoTen: string;
  namSinh: number;
  gioiTinh: string;
  diaChi?: string;
  soDienThoai?: string;
  loaiMau?: string;
  donVi?: string;
  bacSiChiDinh?: string;
  trangThai: 'nhap_thong_tin' | 'chay_ket_qua' | 'da_tra_ket_qua';
  createdAt: string;
  bacSiDoc?: string;
}

interface DoctorUser {
  _id: string;
  fullName: string;
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
    onConfirm: () => {},
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
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, categoryFilter, doctorFilter, search, page, startDate, endDate]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  useWebSocket((event) => {
    if (event.type === 'REFRESH_TEST_RESULTS') {
      fetchResults();
    }
  });

  useEffect(() => {
    async function fetchDoctors() {
      try {
        const res = await fetch('/api/users?role=doctor');
        if (res.ok) {
          const data = await res.json();
          setDoctors(data || []);
        }
      } catch (err) {
        console.error('Fetch doctors error:', err);
      }
    }
    fetchDoctors();
  }, []);

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

  const handleAcceptClick = (id: string, maSo: string) => {
    setActiveMenuId(null);
    setModalConfig({
      isOpen: true,
      title: 'Nhận xử lý phiếu xét nghiệm',
      message: `Bạn có muốn nhận xử lý phiếu ${maSo} không? Trạng thái sẽ chuyển thành CHẠY KẾT QUẢ.`,
      confirmText: 'Nhận phiếu',
      type: 'info',
      onConfirm: async () => {
        setModalConfig((prev) => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch(`/api/test-results/${id}/accept`, { method: 'POST' });
          if (res.ok) {
            toast.success('Đã nhận xử lý phiếu thành công!');
            fetchResults();
          } else {
            toast.error('Lỗi nhận phiếu!');
          }
        } catch {
          toast.error('Lỗi nhận phiếu!');
        }
      },
    });
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <TopHeader />

      <div className="flex flex-1 w-full">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 w-full">
          <Header
            title={doctorFilter ? `Phiếu xét nghiệm: ${doctorFilter}` : 'Danh sách phiếu xét nghiệm'}
            subtitle={
              doctorFilter
                ? `Danh sách các phiếu xét nghiệm phụ trách bởi ${doctorFilter}`
                : categoryFilter === 'hpv40'
                ? 'Quản lý workflow xét nghiệm HPV 40 Types GenHD'
                : categoryFilter === 'hpv20'
                ? 'Quản lý workflow xét nghiệm HPV 20 Types GenHD'
                : 'Quản lý workflow xét nghiệm Tế bào cổ tử cung (CELL) GenHD'
            }
            action={
              (userRole === 'staff' || userRole === 'admin') ? (
                <Link href={`/results/new?type=${categoryFilter}`} className="btn btn-primary">
                  <Plus className="w-4 h-4" />
                  <span>Tạo phiếu mới</span>
                </Link>
              ) : null
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
                  { id: 'all', label: 'Tất cả' },
                  { id: 'nhap_thong_tin', label: 'Nhập thông tin' },
                  { id: 'chay_ket_qua', label: 'Chạy kết quả' },
                  { id: 'da_tra_ket_qua', label: 'Đã trả kết quả' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setPage(1);
                    }}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === tab.id
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  className="form-input pl-9 w-full text-xs"
                  placeholder="Tìm theo Tên, Mã số, SĐT..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>

            {/* Date Range Filter Row */}
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs">
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
                    <th>BS Đọc KQ</th>
                    <th>Trạng thái</th>
                    <th>Ngày tạo</th>
                    <th style={{ textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400 text-sm">
                        Đang tải dữ liệu...
                      </td>
                    </tr>
                  ) : results.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400 text-sm">
                        Không tìm thấy phiếu xét nghiệm nào
                      </td>
                    </tr>
                  ) : (
                    results.map((item, index) => {
                      const popUpward = index > 1 && index >= results.length - 2;

                      return (
                        <tr key={item._id}>
                          <td className="font-bold text-sky-600">{item.maSo}</td>
                          <td className="font-semibold text-slate-800">{item.hoTen}</td>
                          <td>{item.namSinh}</td>
                          <td className="text-xs text-slate-600 font-medium">{item.bacSiDoc || '---'}</td>
                          <td>
                            <StatusBadge status={item.trangThai} />
                          </td>
                          <td className="text-xs text-slate-500">
                            {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="flex gap-2 justify-end items-center relative">
                              {(userRole === 'doctor' || userRole === 'admin') &&
                                item.trangThai === 'nhap_thong_tin' && (
                                  <button
                                    onClick={() => handleAcceptClick(item._id, item.maSo)}
                                    className="btn btn-success text-xs py-1 px-2.5"
                                  >
                                    <FileCheck className="w-3.5 h-3.5" />
                                    <span>Nhận phiếu</span>
                                  </button>
                                )}

                              {/* 3-Dots Action Menu Trigger */}
                              <button
                                onClick={() => setActiveMenuId(activeMenuId === item._id ? null : item._id)}
                                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 shadow-xs"
                                title="Thao tác khác"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {/* Floating Dropdown Menu */}
                              {activeMenuId === item._id && (
                                <div
                                  className={`absolute right-0 w-52 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 z-[100] text-left space-y-0.5 animate-in fade-in zoom-in-95 duration-100 ${
                                    popUpward ? 'bottom-full mb-2' : 'top-full mt-1'
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
                                  <span>
                                    {item.trangThai === 'chay_ket_qua' &&
                                    (userRole === 'doctor' || userRole === 'admin')
                                      ? 'Nhập kết quả'
                                      : 'Xem chi tiết'}
                                  </span>
                                </button>

                                {item.trangThai === 'nhap_thong_tin' && (
                                  <button
                                    onClick={() => handleOpenEditModal(item)}
                                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                                  >
                                    <Edit3 className="w-4 h-4 text-indigo-600" />
                                    <span>Sửa thông tin phiếu</span>
                                  </button>
                                )}

                                {/* Download PDF option if result ready or entered */}
                                {item.trangThai !== 'nhap_thong_tin' && (
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

            {totalPages > 1 && (
              <div className="flex justify-end items-center gap-3 p-3 border-t border-slate-100">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="btn btn-secondary text-xs py-1 px-2.5 disabled:opacity-50"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Trước</span>
                </button>
                <span className="text-xs text-slate-500 font-medium">
                  Trang {page} / {totalPages}
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  className="btn btn-secondary text-xs py-1 px-2.5 disabled:opacity-50"
                >
                  <span>Sau</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
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
                      {doctors.map((doc) => (
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
