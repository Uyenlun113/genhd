'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import TopHeader from '@/components/TopHeader';
import Sidebar from '@/components/Sidebar';
import {
  PlusCircle,
  Download,
  Dna,
  FileText,
  ImageIcon,
  Trash2,
  Loader2,
  CheckCircle2,
  Clock,
  FlaskConical,
  Upload,
  Eye,
  Edit,
  UserPlus,
  Send,
  PackageCheck,
  FileCheck,
  Search,
  RefreshCw,
  Plus,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface SampleItem {
  kyHieuMau: string;
  hoTen: string;
  gioiTinh: string;
  ngaySinh: string;
  quocTich?: string;
  cccd?: string;
  quyenSo?: string;
  ngayCap?: string;
  noiCap?: string;
  noiThuongTru?: string;
  loaiMau?: string;
  anhChanDung?: string;
  anhCccdMatTruoc?: string;
  anhCccdMatSau?: string;
  anhKetQuaChay?: string;
}

interface LocusItem {
  locus: string;
  alleles: {
    [sampleKey: string]: {
      a1: string;
      a2: string;
    };
  };
}

interface AdnOrderData {
  _id: string;
  maSo: string;
  loaiXetNghiemADN: 'phap_ly' | 'tu_nguyen';
  soPhieu: string;
  ngayBanHanh: string;
  ngayYeuCau: string;
  nguoiYeuCau: string;
  nguoiThuMau: string;
  boKit: string;
  daiDienDonVi: string;
  kiemSoatKetQua: string;
  trangThai: 'gui_mau' | 'dang_chay_mau' | 'da_tra_ket_qua';
  anhGuiMau?: string;
  anhNhanMau?: string;
  mauDanhSach: SampleItem[];
  table1: LocusItem[];
  table2: LocusItem[];
  table3: LocusItem[];
  ketLuan: string;
  doTinCay: string;
  createdAt?: string;
}

const nfc = (str: string) => (str || '').normalize('NFC');

const formatAllele = (v1?: string, v2?: string) => {
  const a1 = (v1 || '').trim();
  const a2 = (v2 || '').trim();
  if (a1 && a2) return `${a1} ; ${a2}`;
  return a1 || a2 || '';
};

export default function AdnConvertPage() {
  const [orders, setOrders] = useState<AdnOrderData[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showUploadResultModal, setShowUploadResultModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const [activeOrder, setActiveOrder] = useState<AdnOrderData | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [uploadingResultFile, setUploadingResultFile] = useState(false);
  const [previewTab, setPreviewTab] = useState<'page1' | 'run' | 'cccd'>('page1');
  const [previewSampleIdx, setPreviewSampleIdx] = useState(0);

  // Helper to generate default order code / ticket number (Số phiếu / Mã ca)
  const generateDefaultSoPhieu = (type: 'phap_ly' | 'tu_nguyen') => {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = String(now.getFullYear()).slice(-2);
    const prefix = type === 'phap_ly' ? 'HCGT' : 'TNGT';
    return `${prefix}-${d}${m}${y}-01`;
  };

  // ---------------------------------------------------------
  // Create Order Form State (Step 1)
  // ---------------------------------------------------------
  const [createType, setCreateType] = useState<'phap_ly' | 'tu_nguyen'>('phap_ly');
  const [createSoPhieu, setCreateSoPhieu] = useState(generateDefaultSoPhieu('phap_ly'));
  const [createNgayYeuCau, setCreateNgayYeuCau] = useState(new Date().toLocaleDateString('vi-VN'));
  const [createNgayBanHanh, setCreateNgayBanHanh] = useState(`Hà Nội, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}.`);
  const [createNguoiYeuCau, setCreateNguoiYeuCau] = useState('');
  const [createNguoiThuMau, setCreateNguoiThuMau] = useState('Hoàng Văn Luận');
  const [createBoKit, setCreateBoKit] = useState('A27Plex STR Detection Kit');
  const [createAnhGuiMau, setCreateAnhGuiMau] = useState('');

  const [createSamples, setCreateSamples] = useState<SampleItem[]>([
    {
      kyHieuMau: 'M1',
      hoTen: '',
      gioiTinh: 'Nam',
      ngaySinh: '',
      quocTich: 'Việt Nam',
      cccd: '',
      ngayCap: '',
      noiCap: '',
      noiThuongTru: '',
      loaiMau: 'Máu',
    },
    {
      kyHieuMau: 'M2',
      hoTen: '',
      gioiTinh: 'Nữ',
      ngaySinh: '',
      quocTich: 'Việt Nam',
      cccd: '',
      quyenSo: '',
      ngayCap: '',
      noiCap: '',
      loaiMau: 'Máu',
    },
  ]);

  // ---------------------------------------------------------
  // Receive Sample Form State (Step 2)
  // ---------------------------------------------------------
  const [receiveAnhNhanMau, setReceiveAnhNhanMau] = useState('');

  // ---------------------------------------------------------
  // Upload Result Form State (Step 3)
  // ---------------------------------------------------------
  const [resultKetLuan, setResultKetLuan] = useState('');
  const [resultDoTinCay, setResultDoTinCay] = useState('> 99,9999%');
  const [resultKiemSoat, setResultKiemSoat] = useState('TS. BS. Nguyễn Khánh Dương');
  const [resultDaiDien, setResultDaiDien] = useState('CÔNG TY CỔ PHẦN GENETRUST VIỆT NAM');
  const [resultSamples, setResultSamples] = useState<SampleItem[]>([]);
  const [resultTable1, setResultTable1] = useState<LocusItem[]>([]);
  const [resultTable2, setResultTable2] = useState<LocusItem[]>([]);
  const [resultTable3, setResultTable3] = useState<LocusItem[]>([]);

  // Fetch orders list
  const fetchOrders = async () => {
    setLoading(true);
    try {
      let url = `/api/adn/orders?status=${statusFilter}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setOrders(json.data || []);
      }
    } catch (err) {
      toast.error('Lỗi khi tải danh sách đơn ADN');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  // ---------------------------------------------------------
  // Helper functions for image file reading
  // ---------------------------------------------------------
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      callback(reader.result as string);
      toast.success('Đã tải ảnh lên thành công!');
    };
    reader.readAsDataURL(file);
  };

  // ---------------------------------------------------------
  // Step 1: Create Order Handler
  // ---------------------------------------------------------
  const handleAddSampleToCreate = () => {
    const nextNum = createSamples.length + 1;
    setCreateSamples([
      ...createSamples,
      {
        kyHieuMau: `M${nextNum}`,
        hoTen: '',
        gioiTinh: 'Nam',
        ngaySinh: '',
        quocTich: 'Việt Nam',
        cccd: '',
        loaiMau: 'Máu',
      },
    ]);
  };

  const handleRemoveSampleFromCreate = (index: number) => {
    if (createSamples.length <= 2) {
      toast.error('Đơn xét nghiệm ADN cần tối thiểu 2 mẫu');
      return;
    }
    const updated = createSamples.filter((_, i) => i !== index);
    setCreateSamples(updated);
  };

  const handleCreateOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createNguoiYeuCau) {
      toast.error('Vui lòng nhập tên người yêu cầu');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/adn/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loaiXetNghiemADN: createType,
          soPhieu: createSoPhieu,
          ngayYeuCau: createNgayYeuCau,
          ngayBanHanh: createNgayBanHanh,
          nguoiYeuCau: createNguoiYeuCau,
          nguoiThuMau: createNguoiThuMau,
          boKit: createBoKit,
          anhGuiMau: createAnhGuiMau,
          mauDanhSach: createSamples,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success('Tạo đơn xét nghiệm ADN thành công! Trạng thái: Gửi mẫu');
        setShowCreateModal(false);
        fetchOrders();
      } else {
        toast.error(json.error || 'Tạo đơn thất bại');
      }
    } catch (err) {
      toast.error('Lỗi khi kết nối hệ thống');
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------
  // Step 2: Receive Sample Handler
  // ---------------------------------------------------------
  const openReceiveModal = (order: AdnOrderData) => {
    setActiveOrder(order);
    setReceiveAnhNhanMau(order.anhNhanMau || '');
    setShowReceiveModal(true);
  };

  const handleReceiveSampleSubmit = async () => {
    if (!activeOrder) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/adn/orders/${activeOrder._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'nhan_mau',
          anhNhanMau: receiveAnhNhanMau,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success('Đã xác nhận nhận mẫu! Trạng thái: Đủ điều kiện đang chạy mẫu');
        setShowReceiveModal(false);
        fetchOrders();
      } else {
        toast.error(json.error || 'Xác nhận thất bại');
      }
    } catch (err) {
      toast.error('Lỗi hệ thống');
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------
  // Step 3: Upload Results Handler
  // ---------------------------------------------------------
  const openUploadResultModal = (order: AdnOrderData) => {
    setActiveOrder(order);
    setResultKetLuan(order.ketLuan || '');
    setResultDoTinCay(order.doTinCay || '> 99,9999%');
    setResultKiemSoat(order.kiemSoatKetQua || 'TS. BS. Nguyễn Khánh Dương');
    setResultDaiDien(order.daiDienDonVi || 'CÔNG TY CỔ PHẦN GENETRUST VIỆT NAM');
    setResultSamples(order.mauDanhSach || []);
    setResultTable1(order.table1 || []);
    setResultTable2(order.table2 || []);
    setResultTable3(order.table3 || []);
    setShowUploadResultModal(true);
  };

  // Upload DOCX/PDF result file to parse Loci tables (Image 2)
  const handleFileUploadResult = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingResultFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/adn/parse-pdf', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          const d = json.data;
          if (d.table1) setResultTable1(d.table1);
          if (d.table2) setResultTable2(d.table2);
          if (d.table3) setResultTable3(d.table3);
          if (d.ketLuan) setResultKetLuan(d.ketLuan);
          if (d.doTinCay) setResultDoTinCay(d.doTinCay);
          toast.success(`Đã tự động giải mã dữ liệu bảng Locus từ file ${file.name}!`);
        }
      } else {
        toast.error('Không thể tự đọc file, hãy cập nhật bảng thủ công.');
      }
    } catch (err) {
      toast.error('Lỗi phân tích file kết quả');
    } finally {
      setUploadingResultFile(false);
    }
  };

  const handleSaveResultSubmit = async () => {
    if (!activeOrder) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/adn/orders/${activeOrder._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trangThai: 'da_tra_ket_qua',
          mauDanhSach: resultSamples,
          table1: resultTable1,
          table2: resultTable2,
          table3: resultTable3,
          ketLuan: resultKetLuan,
          doTinCay: resultDoTinCay,
          kiemSoatKetQua: resultKiemSoat,
          daiDienDonVi: resultDaiDien,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success('Đã lưu thông tin kết quả xét nghiệm ADN!');
        setShowUploadResultModal(false);
        fetchOrders();
      } else {
        toast.error(json.error || 'Lưu thất bại');
      }
    } catch (err) {
      toast.error('Lỗi lưu dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------
  // Step 4: Preview & Download PDF Handler
  // ---------------------------------------------------------
  const openPreviewModal = (order: AdnOrderData) => {
    setActiveOrder(order);
    setPreviewTab('page1');
    setPreviewSampleIdx(0);
    setShowPreviewModal(true);
  };

  const handleDownloadPdf = async (order: AdnOrderData) => {
    setExportingPdf(true);
    try {
      const res = await fetch('/api/adn/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Ket_Qua_ADN_${order.soPhieu || order.maSo}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success('Đã tải xuống file PDF kết quả ADN!');
      } else {
        toast.error('Xuất PDF thất bại');
      }
    } catch (err) {
      toast.error('Lỗi khi tạo file PDF');
    } finally {
      setExportingPdf(false);
    }
  };

  // Render Loci Table Editor inside Upload Modal
  const renderLociEditor = (tableData: LocusItem[], setTableData: (val: LocusItem[]) => void, title: string) => {
    if (!resultSamples || resultSamples.length === 0) return null;
    return (
      <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <h4 className="text-sm font-bold text-slate-700 mb-3">{title}</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-center border-collapse bg-white rounded-lg overflow-hidden shadow-xs">
            <thead>
              <tr className="bg-sky-600 text-white font-bold">
                <th className="p-2 border border-sky-700 w-24">Locus</th>
                {resultSamples.map((s, idx) => (
                  <th key={idx} className="p-2 border border-sky-700">
                    {s.kyHieuMau || `M${idx + 1}`} ({s.hoTen || 'Chưa nhập tên'})
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((item, locIdx) => (
                <tr key={locIdx} className="hover:bg-slate-100/80 transition-colors">
                  <td className="p-2 font-bold text-slate-800 border border-slate-200 bg-slate-100">{item.locus}</td>
                  {resultSamples.map((s, sIdx) => {
                    const sKey = s.kyHieuMau || `M${sIdx + 1}`;
                    const currentVal = item.alleles?.[sKey] || { a1: '', a2: '' };
                    return (
                      <td key={sIdx} className="p-1 border border-slate-200">
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="text"
                            value={currentVal.a1}
                            onChange={(e) => {
                              const updated = [...tableData];
                              if (!updated[locIdx].alleles) updated[locIdx].alleles = {};
                              if (!updated[locIdx].alleles[sKey]) updated[locIdx].alleles[sKey] = { a1: '', a2: '' };
                              updated[locIdx].alleles[sKey].a1 = e.target.value;
                              setTableData(updated);
                            }}
                            className="w-12 text-center border border-slate-300 rounded-md py-1 text-xs focus:ring-1 focus:ring-sky-500 font-mono"
                            placeholder="Alil 1"
                          />
                          <span className="text-slate-400 font-bold">;</span>
                          <input
                            type="text"
                            value={currentVal.a2}
                            onChange={(e) => {
                              const updated = [...tableData];
                              if (!updated[locIdx].alleles) updated[locIdx].alleles = {};
                              if (!updated[locIdx].alleles[sKey]) updated[locIdx].alleles[sKey] = { a1: '', a2: '' };
                              updated[locIdx].alleles[sKey].a2 = e.target.value;
                              setTableData(updated);
                            }}
                            className="w-12 text-center border border-slate-300 rounded-md py-1 text-xs focus:ring-1 focus:ring-sky-500 font-mono"
                            placeholder="Alil 2"
                          />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      <TopHeader />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* Top Title Banner */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
                <Dna className="w-7 h-7 text-indigo-600" />
                <span>Quản Lý Xét Nghiệm ADN</span>
              </h1>
              <p className="text-xs md:text-sm text-slate-500 mt-1">
                Tạo đơn Xét nghiệm ADN Pháp Lý & Tự Nguyện $\rightarrow$ Quản lý trạng thái Gửi/Nhận mẫu $\rightarrow$ Trả kết quả & Xuất PDF đa trang.
              </p>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-bold text-sm shadow-md hover:from-sky-500 hover:to-indigo-500 transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <PlusCircle className="w-5 h-5" />
              <span>+ Tạo đơn xét nghiệm ADN mới</span>
            </button>
          </div>

          {/* Filters & Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              {[
                { key: 'all', label: 'Tất cả đơn' },
                { key: 'gui_mau', label: 'Gửi mẫu' },
                { key: 'dang_chay_mau', label: 'Đang chạy mẫu' },
                { key: 'da_tra_ket_qua', label: 'Đã trả kết quả' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === tab.key
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchOrders()}
                placeholder="Tìm mã số, số phiếu, họ tên..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Orders List Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                <span className="text-sm font-medium">Đang tải danh sách đơn xét nghiệm ADN...</span>
              </div>
            ) : orders.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Dna className="w-12 h-12 mx-auto mb-3 opacity-30 text-indigo-600" />
                <p className="text-sm font-medium">Chưa có đơn xét nghiệm ADN nào phù hợp.</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-3 text-xs text-indigo-600 hover:underline font-bold"
                >
                  Tạo đơn mới ngay
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                      <th className="p-3.5 pl-5">Mã đơn / Số phiếu</th>
                      <th className="p-3.5">Loại ADN</th>
                      <th className="p-3.5">Người yêu cầu</th>
                      <th className="p-3.5">Số lượng mẫu</th>
                      <th className="p-3.5">Ngày yêu cầu</th>
                      <th className="p-3.5">Trạng thái</th>
                      <th className="p-3.5 pr-5 text-right">Thao tác quy trình</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.map((order) => {
                      const isPhapLy = order.loaiXetNghiemADN === 'phap_ly';
                      return (
                        <tr key={order._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3.5 pl-5 font-bold text-slate-900">
                            <div>{order.maSo}</div>
                            <div className="text-[10px] text-slate-400 font-mono">Số: {order.soPhieu || '---'}</div>
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                                isPhapLy ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'
                              }`}
                            >
                              {isPhapLy ? 'ADN Pháp Lý' : 'ADN Tự Nguyện'}
                            </span>
                          </td>
                          <td className="p-3.5 font-semibold text-slate-800">{order.nguoiYeuCau || '---'}</td>
                          <td className="p-3.5 text-slate-600 font-medium">
                            <span className="px-2 py-0.5 bg-slate-100 rounded-md font-bold text-slate-700">
                              {order.mauDanhSach?.length || 2} Mẫu
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-500">{order.ngayYeuCau || '---'}</td>
                          <td className="p-3.5">
                            {order.trangThai === 'gui_mau' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                <Send className="w-3 h-3" /> Gửi mẫu
                              </span>
                            )}
                            {order.trangThai === 'dang_chay_mau' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                                <FlaskConical className="w-3 h-3 animate-pulse text-sky-600" /> Đang chạy mẫu
                              </span>
                            )}
                            {order.trangThai === 'da_tra_ket_qua' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" /> Đã trả kết quả
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 pr-5 text-right space-x-2">
                            {/* Step 2 Action Button: Receive sample */}
                            {order.trangThai === 'gui_mau' && (
                              <button
                                onClick={() => openReceiveModal(order)}
                                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg transition-all shadow-xs active:scale-95 cursor-pointer inline-flex items-center gap-1"
                              >
                                <PackageCheck className="w-3.5 h-3.5" /> Nhận mẫu
                              </button>
                            )}

                            {/* Step 3 Action Button: Navigate to dedicated detail page to upload results */}
                            {order.trangThai === 'dang_chay_mau' && (
                              <Link
                                href={`/adn-convert/${order._id}`}
                                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-all shadow-xs active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
                              >
                                <Upload className="w-3.5 h-3.5" /> Up kết quả
                              </Link>
                            )}

                            {/* Step 4 Action Buttons: Navigate to detail page or download PDF */}
                            {order.trangThai === 'da_tra_ket_qua' && (
                              <>
                                <Link
                                  href={`/adn-convert/${order._id}`}
                                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg transition-all cursor-pointer inline-flex items-center gap-1"
                                >
                                  <Eye className="w-3.5 h-3.5" /> Xem chi tiết
                                </Link>
                                <button
                                  onClick={() => handleDownloadPdf(order)}
                                  disabled={exportingPdf}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all shadow-xs cursor-pointer inline-flex items-center gap-1"
                                >
                                  <Download className="w-3.5 h-3.5" /> Tải PDF
                                </button>
                              </>
                            )}

                            {/* View Detail Direct Link */}
                            <Link
                              href={`/adn-convert/${order._id}`}
                              className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors inline-block"
                              title="Vào trang chi tiết đơn"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: TẠO ĐƠN XÉT NGHIỆM ADN MỚI (STEP 1)             */}
      {/* ========================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <PlusCircle className="w-6 h-6 text-indigo-600" />
                  <span>Tạo Đơn Xét Nghiệm ADN Mới</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Nhập thông tin người yêu cầu, danh sách mẫu và đính kèm Ảnh gửi mẫu.</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrderSubmit} className="space-y-6">
              {/* Type Selector */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setCreateType('phap_ly');
                    setCreateSoPhieu(generateDefaultSoPhieu('phap_ly'));
                  }}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    createType === 'phap_ly'
                      ? 'border-purple-600 bg-purple-50/60 ring-2 ring-purple-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold text-purple-900 text-base">ADN Pháp Lý (HCGT-...)</div>
                  <div className="text-xs text-purple-700 mt-1">
                    Sử dụng mẫu chuẩn `Phiếu trả KQ ADN PL- V2.docx`. Dùng làm thủ tục hành chính, pháp lý.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCreateType('tu_nguyen');
                    setCreateSoPhieu(generateDefaultSoPhieu('tu_nguyen'));
                  }}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    createType === 'tu_nguyen'
                      ? 'border-teal-600 bg-teal-50/60 ring-2 ring-teal-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold text-teal-900 text-base">ADN Tự Nguyện (TNGT-...)</div>
                  <div className="text-xs text-teal-700 mt-1">
                    Sử dụng mẫu chuẩn `Phiếu trả KQ ADN TN- V1.docx`. Dùng giải tỏa nghi ngờ cá nhân.
                  </div>
                </button>
              </div>

              {/* General Order Information */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">1. Thông tin chung đơn hàng</h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Số phiếu</label>
                    <input
                      type="text"
                      value={createSoPhieu}
                      onChange={(e) => setCreateSoPhieu(e.target.value)}
                      placeholder="VD: GT010726"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Người yêu cầu (*)</label>
                    <input
                      type="text"
                      required
                      value={createNguoiYeuCau}
                      onChange={(e) => setCreateNguoiYeuCau(e.target.value)}
                      placeholder="Họ tên người yêu cầu"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Ngày yêu cầu</label>
                    <input
                      type="text"
                      value={createNgayYeuCau}
                      onChange={(e) => setCreateNgayYeuCau(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Người thu mẫu</label>
                    <input
                      type="text"
                      value={createNguoiThuMau}
                      onChange={(e) => setCreateNguoiThuMau(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Bộ kit STR</label>
                    <input
                      type="text"
                      value={createBoKit}
                      onChange={(e) => setCreateBoKit(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Ngày ban hành</label>
                    <input
                      type="text"
                      value={createNgayBanHanh}
                      onChange={(e) => setCreateNgayBanHanh(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Samples Manager */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                    2. Danh sách các mẫu xét nghiệm ({createSamples.length} mẫu)
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddSampleToCreate}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm mẫu (M{createSamples.length + 1})
                  </button>
                </div>

                {createSamples.map((sample, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 relative">
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="font-bold text-xs text-indigo-700">Mẫu {sample.kyHieuMau}:</span>
                      {createSamples.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSampleFromCreate(idx)}
                          className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 cursor-pointer font-semibold"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Xóa mẫu
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Ký hiệu mẫu (*)</label>
                        <input
                          type="text"
                          required
                          value={sample.kyHieuMau}
                          onChange={(e) => {
                            const updated = [...createSamples];
                            updated[idx].kyHieuMau = e.target.value;
                            setCreateSamples(updated);
                          }}
                          placeholder="VD: M1, M2, GT-01..."
                          className="w-full p-2 border border-indigo-300 rounded-md font-bold text-indigo-700 bg-indigo-50/50"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Họ tên người lấy mẫu</label>
                        <input
                          type="text"
                          value={sample.hoTen}
                          onChange={(e) => {
                            const updated = [...createSamples];
                            updated[idx].hoTen = e.target.value;
                            setCreateSamples(updated);
                          }}
                          placeholder="Họ tên người lấy mẫu"
                          className="w-full p-2 border border-slate-300 rounded-md font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Giới tính</label>
                        <select
                          value={sample.gioiTinh}
                          onChange={(e) => {
                            const updated = [...createSamples];
                            updated[idx].gioiTinh = e.target.value;
                            setCreateSamples(updated);
                          }}
                          className="w-full p-2 border border-slate-300 rounded-md"
                        >
                          <option value="Nam">Nam</option>
                          <option value="Nữ">Nữ</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Ngày sinh</label>
                        <input
                          type="text"
                          value={sample.ngaySinh}
                          onChange={(e) => {
                            const updated = [...createSamples];
                            updated[idx].ngaySinh = e.target.value;
                            setCreateSamples(updated);
                          }}
                          placeholder="dd/mm/yyyy"
                          className="w-full p-2 border border-slate-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Loại mẫu</label>
                        <input
                          type="text"
                          value={sample.loaiMau}
                          onChange={(e) => {
                            const updated = [...createSamples];
                            updated[idx].loaiMau = e.target.value;
                            setCreateSamples(updated);
                          }}
                          placeholder="Máu, Tế bào..."
                          className="w-full p-2 border border-slate-300 rounded-md"
                        />
                      </div>

                      {createType === 'phap_ly' && (
                        <>
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Quốc tịch</label>
                            <input
                              type="text"
                              value={sample.quocTich}
                              onChange={(e) => {
                                const updated = [...createSamples];
                                updated[idx].quocTich = e.target.value;
                                setCreateSamples(updated);
                              }}
                              className="w-full p-2 border border-slate-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">CCCD / Giấy chứng sinh</label>
                            <input
                              type="text"
                              value={sample.cccd}
                              onChange={(e) => {
                                const updated = [...createSamples];
                                updated[idx].cccd = e.target.value;
                                setCreateSamples(updated);
                              }}
                              placeholder="Số CCCD hoặc Số chứng sinh"
                              className="w-full p-2 border border-slate-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Ngày cấp / Nơi cấp</label>
                            <input
                              type="text"
                              value={sample.ngayCap}
                              onChange={(e) => {
                                const updated = [...createSamples];
                                updated[idx].ngayCap = e.target.value;
                                setCreateSamples(updated);
                              }}
                              placeholder="VD: 12/05/2020 Cục CSQLHC"
                              className="w-full p-2 border border-slate-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Nơi thường trú</label>
                            <input
                              type="text"
                              value={sample.noiThuongTru}
                              onChange={(e) => {
                                const updated = [...createSamples];
                                updated[idx].noiThuongTru = e.target.value;
                                setCreateSamples(updated);
                              }}
                              placeholder="Địa chỉ thường trú"
                              className="w-full p-2 border border-slate-300 rounded-md"
                            />
                          </div>
                        </>
                      )}
                    </div>

                    {/* Upload Ảnh chân dung mẫu */}
                    <div className="pt-2 border-t flex items-center justify-between">
                      <label className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg cursor-pointer flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-indigo-600" /> Tải Ảnh Chân Dung Mẫu {sample.kyHieuMau} lên
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleImageUpload(e, (b64) => {
                              const updated = [...createSamples];
                              updated[idx].anhChanDung = b64;
                              setCreateSamples(updated);
                            })
                          }
                          className="hidden"
                        />
                      </label>
                      {sample.anhChanDung ? (
                        <div className="flex items-center gap-2">
                          <img src={sample.anhChanDung} alt="Chân dung mẫu" className="w-10 h-12 object-cover rounded border" />
                          <span className="text-[11px] text-emerald-600 font-bold">✓ Đã có ảnh chân dung</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">Chưa tải ảnh chân dung</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Upload Ảnh gửi mẫu */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  3. Đính kèm Ảnh gửi mẫu (Trạng thái: Gửi mẫu)
                </h4>
                <div className="flex items-center gap-4">
                  <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs cursor-pointer inline-flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4" /> Tải ảnh gửi mẫu lên
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, (b64) => setCreateAnhGuiMau(b64))}
                      className="hidden"
                    />
                  </label>
                  {createAnhGuiMau ? (
                    <div className="flex items-center gap-2">
                      <img src={createAnhGuiMau} alt="Ảnh gửi mẫu" className="w-16 h-12 object-cover rounded-lg border" />
                      <span className="text-xs text-emerald-600 font-bold">✓ Đã đính kèm ảnh</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">Chưa đính kèm ảnh gửi mẫu</span>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-bold text-xs rounded-xl hover:from-sky-500 hover:to-indigo-500 shadow-md cursor-pointer flex items-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Tạo Đơn (Chuyển sang Gửi Mẫu)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: XÁC NHẬN NHẬN MẪU (STEP 2)                       */}
      {/* ========================================================= */}
      {showReceiveModal && activeOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-sky-600" />
                <span>Nhận Mẫu Xét Nghiệm ADN</span>
              </h3>
              <button onClick={() => setShowReceiveModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-sky-50 p-3 rounded-xl text-xs text-sky-900 font-medium">
                Đơn: <strong>{activeOrder.maSo}</strong> ({activeOrder.soPhieu}) - Người yêu cầu: <strong>{activeOrder.nguoiYeuCau}</strong>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Đính kèm Ảnh nhận mẫu (*)</label>
                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-sky-300 rounded-xl bg-sky-50/50 hover:bg-sky-50 transition-colors">
                  {receiveAnhNhanMau ? (
                    <div className="space-y-2 text-center">
                      <img src={receiveAnhNhanMau} alt="Ảnh nhận mẫu" className="max-h-40 mx-auto rounded-lg shadow-sm border" />
                      <button
                        type="button"
                        onClick={() => setReceiveAnhNhanMau('')}
                        className="text-xs text-red-600 hover:underline font-bold"
                      >
                        Đổi ảnh khác
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer text-center space-y-2">
                      <Upload className="w-8 h-8 mx-auto text-sky-600" />
                      <span className="block text-xs font-bold text-sky-700">Tải ảnh nhận mẫu lên</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, (b64) => setReceiveAnhNhanMau(b64))}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => setShowReceiveModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
              >
                Hủy
              </button>
              <button
                onClick={handleReceiveSampleSubmit}
                disabled={loading}
                className="px-5 py-2 bg-sky-600 text-white font-bold text-xs rounded-xl hover:bg-sky-500 cursor-pointer flex items-center gap-1.5"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Xác nhận (Chuyển sang Đủ ĐK Đang chạy mẫu)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: UP KẾT QUẢ XÉT NGHIỆM ADN (STEP 3)               */}
      {/* ========================================================= */}
      {showUploadResultModal && activeOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-5xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Upload className="w-6 h-6 text-indigo-600" />
                  <span>Cập Nhật Kết Quả Xét Nghiệm ADN</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Tải file DOCX/PDF kết quả + Ảnh CCCD 2 mặt + Ảnh kết quả chạy GeneMapper cho từng mẫu.</p>
              </div>
              <button onClick={() => setShowUploadResultModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            {/* 1. Upload DOCX/PDF Result File to parse Loci tables (Image 2) */}
            <div className="bg-indigo-50/80 p-4 rounded-xl border border-indigo-200 space-y-3">
              <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wide flex items-center gap-2">
                <FileText className="w-4 h-4" /> 1. Upload File DOCX hoặc PDF Kết quả Locus (như Ảnh 2)
              </h4>
              <div className="flex items-center gap-4">
                <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-2 shadow-xs">
                  {uploadingResultFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <span>Chọn File Kết Quả DOCX / PDF</span>
                  <input
                    type="file"
                    accept=".docx,.pdf"
                    onChange={handleFileUploadResult}
                    className="hidden"
                  />
                </label>
                <span className="text-xs text-slate-500">
                  Hệ thống tự động phân tích dữ liệu bảng Alil cho các Locus và điền vào bảng bên dưới.
                </span>
              </div>
            </div>

            {/* 2. Upload CCCD Photos & Run Result Photos for EACH sample */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                2. Upload Ảnh CCCD (Mặt trước/sau) & Ảnh biểu đồ chạy (GeneMapper - Ảnh 3) từng người
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resultSamples.map((sample, idx) => (
                  <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center gap-2 border-b pb-2 text-xs">
                      <span className="font-bold text-slate-700">Ký hiệu mẫu:</span>
                      <input
                        type="text"
                        value={sample.kyHieuMau}
                        onChange={(e) => {
                          const updated = [...resultSamples];
                          updated[idx].kyHieuMau = e.target.value;
                          setResultSamples(updated);
                        }}
                        placeholder="VD: M1, M2..."
                        className="w-24 p-1 bg-white border border-indigo-300 rounded font-bold text-indigo-700 text-xs"
                      />
                      <span className="font-bold text-slate-700 ml-2">Họ tên:</span>
                      <input
                        type="text"
                        value={sample.hoTen}
                        onChange={(e) => {
                          const updated = [...resultSamples];
                          updated[idx].hoTen = e.target.value;
                          setResultSamples(updated);
                        }}
                        placeholder="Họ tên người lấy mẫu"
                        className="flex-1 p-1 bg-white border border-slate-300 rounded font-bold text-slate-800 text-xs"
                      />
                    </div>

                    {/* CCCD Mat Truoc */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Ảnh CCCD Mặt trước</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleImageUpload(e, (b64) => {
                            const updated = [...resultSamples];
                            updated[idx].anhCccdMatTruoc = b64;
                            setResultSamples(updated);
                          })
                        }
                        className="text-xs w-full"
                      />
                      {sample.anhCccdMatTruoc && (
                        <img src={sample.anhCccdMatTruoc} alt="CCCD Mặt trước" className="mt-2 h-20 rounded border object-cover" />
                      )}
                    </div>

                    {/* CCCD Mat Sau */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Ảnh CCCD Mặt sau / Giấy khai sinh</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleImageUpload(e, (b64) => {
                            const updated = [...resultSamples];
                            updated[idx].anhCccdMatSau = b64;
                            setResultSamples(updated);
                          })
                        }
                        className="text-xs w-full"
                      />
                      {sample.anhCccdMatSau && (
                        <img src={sample.anhCccdMatSau} alt="CCCD Mặt sau" className="mt-2 h-20 rounded border object-cover" />
                      )}
                    </div>

                    {/* Ảnh Kết quả chạy GeneMapper (Image 3) */}
                    <div className="pt-2 border-t border-slate-200">
                      <label className="block text-[11px] font-bold text-purple-800 mb-1">
                        Ảnh Kết quả chạy ADN (Biểu đồ GeneMapper - Ảnh 3)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleImageUpload(e, (b64) => {
                            const updated = [...resultSamples];
                            updated[idx].anhKetQuaChay = b64;
                            setResultSamples(updated);
                          })
                        }
                        className="text-xs w-full"
                      />
                      {sample.anhKetQuaChay && (
                        <img src={sample.anhKetQuaChay} alt="Biểu đồ chạy" className="mt-2 h-24 rounded border object-cover" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Loci Allele Table Editors */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">3. Bảng Kết quả phân tích Alil Locus</h4>
              {renderLociEditor(resultTable1, setResultTable1, 'Bảng Locus 1 (D3S1358, vWA, D12S391, CSF1PO, Penta E...)')}
              {renderLociEditor(resultTable2, setResultTable2, 'Bảng Locus 2 (D2S1338, Penta D, AMEL, D22S1045...)')}
              {renderLociEditor(resultTable3, setResultTable3, 'Bảng Locus 3 (D8S1179, D5S818, D21S11, FGA...)')}
            </div>

            {/* 4. Conclusion & Signatures Info */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">4. Kết luận & Độ tin cậy</h4>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kết luận</label>
                <textarea
                  rows={2}
                  value={resultKetLuan}
                  onChange={(e) => setResultKetLuan(e.target.value)}
                  placeholder="VD: có quan hệ huyết thống bố - con ( cha – con) độ tin cậy > 99,9999%"
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold text-red-600"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Độ tin cậy</label>
                  <input
                    type="text"
                    value={resultDoTinCay}
                    onChange={(e) => setResultDoTinCay(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cán bộ xét nghiệm</label>
                  <input
                    type="text"
                    value={resultKiemSoat}
                    onChange={(e) => setResultKiemSoat(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Đại diện đơn vị</label>
                  <input
                    type="text"
                    value={resultDaiDien}
                    onChange={(e) => setResultDaiDien(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => setShowUploadResultModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveResultSubmit}
                disabled={loading}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Lưu Kết Quả (Chuyển sang Đã trả kết quả)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: PREVIEW & DOWNLOAD PDF (STEP 4)                  */}
      {/* ========================================================= */}
      {showPreviewModal && activeOrder && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-5xl w-full p-6 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Eye className="w-6 h-6 text-emerald-600" />
                  <span>Xem Trực Quan Phiếu Kết Quả & Ảnh Đính Kèm</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kiểm tra hiển thị phiếu chính (Trang 1) và các trang đính kèm (Biểu đồ chạy & Ảnh CCCD).
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleDownloadPdf(activeOrder)}
                  disabled={exportingPdf}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-2"
                >
                  {exportingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  <span>Tải PDF Kết Quả</span>
                </button>
                <button onClick={() => setShowPreviewModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">
                  ✕
                </button>
              </div>
            </div>

            {/* Page Selector Tabs */}
            <div className="flex items-center gap-2 border-b pb-2">
              <button
                onClick={() => setPreviewTab('page1')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  previewTab === 'page1' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Trang 1: Phiếu Kết Quả ADN
              </button>
              <button
                onClick={() => setPreviewTab('run')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  previewTab === 'run' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Các Trang Biểu Đồ Chạy ADN (GeneMapper)
              </button>
              <button
                onClick={() => setPreviewTab('cccd')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  previewTab === 'cccd' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Các Trang CCCD / Giấy Khai Sinh
              </button>
            </div>

            {/* Preview Content Area */}
            <div className="flex-1 bg-slate-200/70 p-6 rounded-2xl overflow-y-auto flex items-center justify-center min-h-[500px]">
              {/* PAGE 1 PREVIEW */}
              {previewTab === 'page1' && (
                <div className="bg-white w-[595px] min-h-[842px] p-8 shadow-xl text-black font-serif text-[11px] leading-snug space-y-4 border border-slate-300">
                  {/* Header */}
                  <div className="flex justify-between items-start border-b pb-2">
                    <div>
                      <div className="font-bold text-blue-900 text-xs uppercase">
                        {activeOrder.loaiXetNghiemADN === 'tu_nguyen'
                          ? 'VIỆN NGHIÊN CỨU VÀ PHÂN TÍCH DI TRUYỀN\nCÔNG TY CỔ PHẦN CÔNG NGHỆ VÀ THƯƠNG MẠI HK-TECH'
                          : 'CÔNG TY CỔ PHẦN GENETRUST VIỆT NAM'}
                      </div>
                      <div className="text-[9px] italic text-slate-600">
                        Địa chỉ: Số 15, Ngõ 5 Hoàng Quốc Việt, Phường Nghĩa Đô, TP Hà Nội
                      </div>
                    </div>
                    <div className="text-right text-[9px] italic">
                      <div>{activeOrder.ngayBanHanh}</div>
                      <div>Số: {activeOrder.soPhieu}</div>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="text-center font-bold text-blue-900 text-base py-1">
                    KẾT QUẢ XÉT NGHIỆM ADN
                  </div>

                  {/* Intro */}
                  <div className="text-[10px]">
                    Theo đơn yêu cầu xét nghiệm ADN ngày {activeOrder.ngayYeuCau} của bà(ông) {activeOrder.nguoiYeuCau}, Công ty thực hiện xét nghiệm ADN cho những mẫu/người sau:
                  </div>

                  {/* Samples list */}
                  <div className="space-y-1 text-[10px]">
                    {activeOrder.mauDanhSach?.map((s, i) => (
                      <div key={i} className="font-bold text-slate-800">
                        {i + 1}. Mẫu {s.kyHieuMau}: {s.hoTen} - {s.gioiTinh} - {s.ngaySinh} ({s.cccd || 'Mẫu máu'})
                      </div>
                    ))}
                  </div>

                  {/* Note */}
                  <div className="text-[9px] italic space-y-0.5 border-t pt-1">
                    <div>- Người thu/nhận mẫu: {activeOrder.nguoiThuMau}</div>
                    <div>- Phân tích ADN theo bộ kit {activeOrder.boKit}</div>
                  </div>

                  {/* Loci comparison tables preview */}
                  <div className="text-[9px] font-bold">Kết quả phân tích ADN như sau:</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-center border-collapse border border-slate-400 text-[9px]">
                      <thead>
                        <tr className="bg-slate-100 font-bold">
                          <th className="border border-slate-400 p-1">Locus</th>
                          {activeOrder.mauDanhSach?.map((s, idx) => (
                            <th key={idx} className="border border-slate-400 p-1">{s.kyHieuMau}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {activeOrder.table1?.slice(0, 5).map((loc, idx) => (
                          <tr key={idx}>
                            <td className="border border-slate-400 p-1 font-bold">{loc.locus}</td>
                            {activeOrder.mauDanhSach?.map((s, sIdx) => {
                              const sKey = s.kyHieuMau || `M${sIdx + 1}`;
                              const val = loc.alleles?.[sKey];
                              return (
                                <td key={sIdx} className="border border-slate-400 p-1">
                                  {val ? `${val.a1 || ''} ; ${val.a2 || ''}` : '---'}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Conclusion */}
                  <div className="pt-2">
                    <div className="font-bold text-blue-900 text-xs">KẾT LUẬN:</div>
                    <div className="font-bold text-red-600 text-xs mt-1">
                      {activeOrder.ketLuan || 'có quan hệ huyết thống độ tin cậy > 99,9999%'}
                    </div>
                  </div>

                  {/* Signatures */}
                  <div className="flex justify-between pt-6 text-[10px] font-bold text-center">
                    <div>
                      <div>CÁN BỘ XÉT NGHIỆM</div>
                      <div className="mt-12 text-slate-700">{activeOrder.kiemSoatKetQua}</div>
                    </div>
                    <div>
                      <div>ĐẠI DIỆN ĐƠN VỊ</div>
                      <div className="mt-12 text-slate-700">{activeOrder.daiDienDonVi}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* RUN RESULT CHARTS PREVIEW */}
              {previewTab === 'run' && (
                <div className="space-y-6 w-full max-w-2xl">
                  {activeOrder.mauDanhSach?.map((sample, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl shadow-md border border-slate-300 space-y-3">
                      <div className="font-bold text-sm text-purple-900 border-b pb-2">
                        Trang {idx + 2}: Biểu đồ kết quả chạy (GeneMapper) - Mẫu {sample.kyHieuMau}: {sample.hoTen}
                      </div>
                      {sample.anhKetQuaChay ? (
                        <img src={sample.anhKetQuaChay} alt="Biểu đồ chạy" className="w-full max-h-96 object-contain rounded-lg border" />
                      ) : (
                        <div className="p-8 text-center text-slate-400 text-xs italic bg-slate-50 rounded-lg">
                          Chưa upload ảnh kết quả chạy GeneMapper cho mẫu này
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* CCCD PHOTOS PREVIEW */}
              {previewTab === 'cccd' && (
                <div className="space-y-6 w-full max-w-2xl">
                  {activeOrder.mauDanhSach?.map((sample, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl shadow-md border border-slate-300 space-y-4">
                      <div className="font-bold text-sm text-teal-900 border-b pb-2">
                        Trang {activeOrder.mauDanhSach.length + idx + 2}: CCCD / Giấy khai sinh - Mẫu {sample.kyHieuMau}: {sample.hoTen}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs font-bold text-slate-700 mb-1">Mặt trước CCCD:</div>
                          {sample.anhCccdMatTruoc ? (
                            <img src={sample.anhCccdMatTruoc} alt="CCCD Trước" className="w-full max-h-48 object-contain rounded border" />
                          ) : (
                            <div className="p-6 text-center text-slate-400 text-xs italic bg-slate-50 rounded">Chưa có ảnh mặt trước</div>
                          )}
                        </div>

                        <div>
                          <div className="text-xs font-bold text-slate-700 mb-1">Mặt sau CCCD:</div>
                          {sample.anhCccdMatSau ? (
                            <img src={sample.anhCccdMatSau} alt="CCCD Sau" className="w-full max-h-48 object-contain rounded border" />
                          ) : (
                            <div className="p-6 text-center text-slate-400 text-xs italic bg-slate-50 rounded">Chưa có ảnh mặt sau</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: XEM CHI TIẾT ĐƠN                                 */}
      {/* ========================================================= */}
      {showDetailModal && activeOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-slate-900">Chi Tiết Đơn: {activeOrder.maSo}</h3>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl">
                <div><strong>Số phiếu:</strong> {activeOrder.soPhieu}</div>
                <div><strong>Loại ADN:</strong> {activeOrder.loaiXetNghiemADN === 'phap_ly' ? 'ADN Pháp Lý' : 'ADN Tự Nguyện'}</div>
                <div><strong>Người yêu cầu:</strong> {activeOrder.nguoiYeuCau}</div>
                <div><strong>Ngày yêu cầu:</strong> {activeOrder.ngayYeuCau}</div>
                <div><strong>Người thu mẫu:</strong> {activeOrder.nguoiThuMau}</div>
                <div><strong>Bộ kit:</strong> {activeOrder.boKit}</div>
              </div>

              {/* Display Ảnh Gửi mẫu & Ảnh Nhận mẫu for UI inspection */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-slate-50 p-3 rounded-xl border">
                  <div className="font-bold text-slate-800 mb-2">Ảnh Gửi Mẫu (Bước 1):</div>
                  {activeOrder.anhGuiMau ? (
                    <img src={activeOrder.anhGuiMau} alt="Ảnh gửi mẫu" className="w-full h-32 object-cover rounded-lg border" />
                  ) : (
                    <span className="text-slate-400 italic">Chưa có ảnh gửi mẫu</span>
                  )}
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border">
                  <div className="font-bold text-slate-800 mb-2">Ảnh Nhận Mẫu (Bước 2):</div>
                  {activeOrder.anhNhanMau ? (
                    <img src={activeOrder.anhNhanMau} alt="Ảnh nhận mẫu" className="w-full h-32 object-cover rounded-lg border" />
                  ) : (
                    <span className="text-slate-400 italic">Chưa có ảnh nhận mẫu</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
