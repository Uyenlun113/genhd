'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import TopHeader from '@/components/TopHeader';
import Sidebar from '@/components/Sidebar';
import {
  ArrowLeft,
  Download,
  Dna,
  FileText,
  ImageIcon,
  Trash2,
  Loader2,
  CheckCircle2,
  FlaskConical,
  Upload,
  Eye,
  Save,
  Send,
  PackageCheck,
  Plus,
  ShieldCheck,
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

export default function AdnOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [uploadingResultFile, setUploadingResultFile] = useState(false);

  const [order, setOrder] = useState<AdnOrderData | null>(null);

  // Editable Form State
  const [soPhieu, setSoPhieu] = useState('');
  const [loaiXetNghiemADN, setLoaiXetNghiemADN] = useState<'phap_ly' | 'tu_nguyen'>('phap_ly');
  const [ngayYeuCau, setNgayYeuCau] = useState('');
  const [ngayBanHanh, setNgayBanHanh] = useState('');
  const [nguoiYeuCau, setNguoiYeuCau] = useState('');
  const [nguoiThuMau, setNguoiThuMau] = useState('Hoàng Văn Luận');
  const [boKit, setBoKit] = useState('A27Plex STR Detection Kit');
  const [daiDienDonVi, setDaiDienDonVi] = useState('CÔNG TY CỔ PHẦN GENETRUST VIỆT NAM');
  const [kiemSoatKetQua, setKiemSoatKetQua] = useState('TS. BS. Nguyễn Khánh Dương');
  const [ketLuan, setKetLuan] = useState('');
  const [doTinCay, setDoTinCay] = useState('> 99,9999%');
  const [trangThai, setTrangThai] = useState<'gui_mau' | 'dang_chay_mau' | 'da_tra_ket_qua'>('gui_mau');

  const [anhGuiMau, setAnhGuiMau] = useState('');
  const [anhNhanMau, setAnhNhanMau] = useState('');

  const [mauDanhSach, setMauDanhSach] = useState<SampleItem[]>([]);
  const [table1, setTable1] = useState<LocusItem[]>([]);
  const [table2, setTable2] = useState<LocusItem[]>([]);
  const [table3, setTable3] = useState<LocusItem[]>([]);

  // Preview state
  const [previewTab, setPreviewTab] = useState<'page1' | 'run' | 'cccd'>('page1');

  // Fetch Order Details
  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/adn/orders/${id}`);
        const json = await res.json();
        if (json.success && json.data) {
          const d: AdnOrderData = json.data;
          setOrder(d);
          setSoPhieu(d.soPhieu || d.maSo || '');
          setLoaiXetNghiemADN(d.loaiXetNghiemADN || 'phap_ly');
          setNgayYeuCau(d.ngayYeuCau || '');
          setNgayBanHanh(d.ngayBanHanh || '');
          setNguoiYeuCau(d.nguoiYeuCau || '');
          setNguoiThuMau(d.nguoiThuMau || 'Hoàng Văn Luận');
          setBoKit(d.boKit || 'A27Plex STR Detection Kit');
          setDaiDienDonVi(d.daiDienDonVi || 'CÔNG TY CỔ PHẦN GENETRUST VIỆT NAM');
          setKiemSoatKetQua(d.kiemSoatKetQua || 'TS. BS. Nguyễn Khánh Dương');
          setKetLuan(d.ketLuan || '');
          setDoTinCay(d.doTinCay || '> 99,9999%');
          setTrangThai(d.trangThai || 'gui_mau');
          setAnhGuiMau(d.anhGuiMau || '');
          setAnhNhanMau(d.anhNhanMau || '');
          const samples = d.mauDanhSach || [];
          setMauDanhSach(samples);
          setTable1(normalizeLociTable(d.table1 || [], samples));
          setTable2(normalizeLociTable(d.table2 || [], samples));
          setTable3(normalizeLociTable(d.table3 || [], samples));
        } else {
          toast.error('Không tìm thấy đơn xét nghiệm');
        }
      } catch (err) {
        toast.error('Lỗi khi tải thông tin đơn xét nghiệm');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  // Helper to normalize raw table structure to alleles map
  const normalizeLociTable = (rawTable: any[], samples: SampleItem[]) => {
    if (!Array.isArray(rawTable)) return [];
    const sKeys = samples.length > 0 ? samples.map((s) => s.kyHieuMau || 'M1') : ['M1', 'M2'];

    return rawTable.map((item) => {
      const locus = item.locus || '';
      const alleles: Record<string, { a1: string; a2: string }> = {};

      sKeys.forEach((sKey, sIdx) => {
        if (
          item.alleles &&
          item.alleles[sKey] &&
          (item.alleles[sKey].a1 !== undefined || item.alleles[sKey].a2 !== undefined)
        ) {
          alleles[sKey] = {
            a1: String(item.alleles[sKey].a1 || ''),
            a2: String(item.alleles[sKey].a2 || ''),
          };
        } else {
          const num = sIdx + 1;
          const a1 =
            item[`m${num}_1`] ??
            item[`M${num}_1`] ??
            item[`m${sKey}_1`] ??
            (num === 1 ? item.m1_1 : item.m2_1) ??
            '';
          const a2 =
            item[`m${num}_2`] ??
            item[`M${num}_2`] ??
            item[`m${sKey}_2`] ??
            (num === 1 ? item.m1_2 : item.m2_2) ??
            '';
          alleles[sKey] = {
            a1: String(a1 || ''),
            a2: String(a2 || ''),
          };
        }
      });

      return { ...item, locus, alleles };
    });
  };

  // Helper for image upload
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

  // Upload DOCX/PDF Result File to parse Loci tables
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
          if (d.table1) setTable1(normalizeLociTable(d.table1, mauDanhSach));
          if (d.table2) setTable2(normalizeLociTable(d.table2, mauDanhSach));
          if (d.table3) setTable3(normalizeLociTable(d.table3, mauDanhSach));
          if (d.ketLuan) setKetLuan(d.ketLuan);
          if (d.doTinCay) setDoTinCay(d.doTinCay);
          toast.success(`Đã tự động đọc bảng Locus từ file ${file.name}!`);
        }
      } else {
        toast.error('Không thể đọc file tự động, hãy nhập bảng thủ công.');
      }
    } catch (err) {
      toast.error('Lỗi phân tích file kết quả');
    } finally {
      setUploadingResultFile(false);
    }
  };

  // Save changes & update status to 'da_tra_ket_qua'
  const handleSaveOrder = async (targetStatus?: 'gui_mau' | 'dang_chay_mau' | 'da_tra_ket_qua') => {
    setSaving(true);
    const newStatus = targetStatus || (trangThai === 'gui_mau' ? 'dang_chay_mau' : 'da_tra_ket_qua');
    try {
      const res = await fetch(`/api/adn/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          soPhieu,
          loaiXetNghiemADN,
          ngayYeuCau,
          ngayBanHanh,
          nguoiYeuCau,
          nguoiThuMau,
          boKit,
          daiDienDonVi,
          kiemSoatKetQua,
          ketLuan,
          doTinCay,
          trangThai: newStatus,
          anhGuiMau,
          anhNhanMau,
          mauDanhSach,
          table1,
          table2,
          table3,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setTrangThai(newStatus);
        toast.success(`Đã lưu kết quả thành công! Trạng thái: ${newStatus === 'da_tra_ket_qua' ? 'Đã trả kết quả' : 'Đang xử lý'}`);
      } else {
        toast.error(json.error || 'Lưu thất bại');
      }
    } catch (err) {
      toast.error('Lỗi kết nối khi lưu dữ liệu');
    } finally {
      setSaving(false);
    }
  };

  // Download PDF Result
  const handleDownloadPdf = async () => {
    setExportingPdf(true);
    try {
      const payload = {
        _id: id,
        soPhieu,
        loaiXetNghiemADN,
        ngayYeuCau,
        ngayBanHanh,
        nguoiYeuCau,
        nguoiThuMau,
        boKit,
        daiDienDonVi,
        kiemSoatKetQua,
        ketLuan,
        doTinCay,
        mauDanhSach,
        table1,
        table2,
        table3,
      };

      const res = await fetch('/api/adn/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Ket_Qua_ADN_${soPhieu}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success('Đã tải file PDF kết quả về máy!');
      } else {
        toast.error('Tạo file PDF thất bại');
      }
    } catch (err) {
      toast.error('Lỗi khi tải file PDF');
    } finally {
      setExportingPdf(false);
    }
  };

  // Render Loci Table Editor
  const renderLociEditor = (tableData: LocusItem[], setTableData: (val: LocusItem[]) => void, title: string) => {
    if (!mauDanhSach || mauDanhSach.length === 0) return null;
    return (
      <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-xs">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3">{title}</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-center border-collapse bg-white rounded-lg overflow-hidden shadow-xs">
            <thead>
              <tr className="bg-sky-600 text-white font-bold">
                <th className="p-2.5 border border-sky-700 w-28">Locus</th>
                {mauDanhSach.map((s, idx) => (
                  <th key={idx} className="p-2.5 border border-sky-700">
                    {s.kyHieuMau || `M${idx + 1}`} ({s.hoTen || 'Chưa nhập tên'})
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((item, locIdx) => (
                <tr key={locIdx} className="hover:bg-slate-100/80 transition-colors">
                  <td className="p-2 font-bold text-slate-800 border border-slate-200 bg-slate-100">{item.locus}</td>
                  {mauDanhSach.map((s, sIdx) => {
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
                            className="w-12 text-center border border-slate-300 rounded-md py-1 text-xs focus:ring-1 focus:ring-sky-500 font-mono font-bold"
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
                            className="w-12 text-center border border-slate-300 rounded-md py-1 text-xs focus:ring-1 focus:ring-sky-500 font-mono font-bold"
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col">
        <TopHeader />
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <span className="text-sm font-semibold text-slate-600">Đang tải trang chi tiết đơn ADN...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      <TopHeader />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 min-w-0 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* Top Bar Header Navigation */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => router.push('/adn-convert')}
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer shrink-0"
                title="Quay lại danh sách"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-black text-slate-900 truncate">Chi Tiết Kết Quả: {soPhieu}</h1>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0 ${
                      loaiXetNghiemADN === 'phap_ly' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'
                    }`}
                  >
                    {loaiXetNghiemADN === 'phap_ly' ? 'ADN Pháp Lý' : 'ADN Tự Nguyện'}
                  </span>
                  {trangThai === 'gui_mau' && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 shrink-0">
                      Gửi mẫu
                    </span>
                  )}
                  {trangThai === 'dang_chay_mau' && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 shrink-0">
                      Đang chạy mẫu
                    </span>
                  )}
                  {trangThai === 'da_tra_ket_qua' && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 shrink-0">
                      Đã trả kết quả
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">Cập nhật thông tin mẫu, tải file kết quả DOCX/PDF & ảnh đính kèm.</p>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => handleSaveOrder('da_tra_ket_qua')}
                disabled={saving}
                className="px-5 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-2 transition-all active:scale-95"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Lưu Kết Quả</span>
              </button>

              <button
                onClick={handleDownloadPdf}
                disabled={exportingPdf}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-2 transition-all active:scale-95"
              >
                {exportingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>Tải PDF Kết Quả</span>
              </button>
            </div>
          </div>

          {/* Section 1: Thông tin chung & Danh sách các mẫu */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-b pb-3 flex items-center gap-2">
              <Dna className="w-4 h-4 text-indigo-600" /> 1. Thông Tin Chung & Danh Sách Mẫu ({mauDanhSach.length} mẫu)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mã ca / Số phiếu</label>
                <input
                  type="text"
                  value={soPhieu}
                  onChange={(e) => setSoPhieu(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-indigo-700"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Người yêu cầu</label>
                <input
                  type="text"
                  value={nguoiYeuCau}
                  onChange={(e) => setNguoiYeuCau(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ngày yêu cầu</label>
                <input
                  type="text"
                  value={ngayYeuCau}
                  onChange={(e) => setNgayYeuCau(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bộ kit STR</label>
                <input
                  type="text"
                  value={boKit}
                  onChange={(e) => setBoKit(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            {/* List of Samples (M1, M2, M3...) */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-700">Chi tiết thông tin từng mẫu:</span>
                <button
                  type="button"
                  onClick={() =>
                    setMauDanhSach([
                      ...mauDanhSach,
                      {
                        kyHieuMau: `M${mauDanhSach.length + 1}`,
                        hoTen: '',
                        gioiTinh: 'Nam',
                        ngaySinh: '',
                        loaiMau: 'Máu',
                      },
                    ])
                  }
                  className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm mẫu
                </button>
              </div>

              <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
                {mauDanhSach.map((sample, idx) => (
                  <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between border-b pb-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-700">Ký hiệu mẫu:</span>
                        <input
                          type="text"
                          value={sample.kyHieuMau}
                          onChange={(e) => {
                            const updated = [...mauDanhSach];
                            updated[idx].kyHieuMau = e.target.value;
                            setMauDanhSach(updated);
                          }}
                          className="w-24 p-1 bg-white border border-indigo-300 rounded font-bold text-indigo-700 text-xs"
                        />
                      </div>
                      {mauDanhSach.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setMauDanhSach(mauDanhSach.filter((_, i) => i !== idx))}
                          className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Xóa
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">Họ tên</label>
                        <input
                          type="text"
                          value={sample.hoTen}
                          onChange={(e) => {
                            const updated = [...mauDanhSach];
                            updated[idx].hoTen = e.target.value;
                            setMauDanhSach(updated);
                          }}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">Giới tính</label>
                        <select
                          value={sample.gioiTinh}
                          onChange={(e) => {
                            const updated = [...mauDanhSach];
                            updated[idx].gioiTinh = e.target.value;
                            setMauDanhSach(updated);
                          }}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded"
                        >
                          <option value="Nam">Nam</option>
                          <option value="Nữ">Nữ</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">Ngày sinh</label>
                        <input
                          type="text"
                          value={sample.ngaySinh}
                          onChange={(e) => {
                            const updated = [...mauDanhSach];
                            updated[idx].ngaySinh = e.target.value;
                            setMauDanhSach(updated);
                          }}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">CCCD / Chứng sinh</label>
                        <input
                          type="text"
                          value={sample.cccd}
                          onChange={(e) => {
                            const updated = [...mauDanhSach];
                            updated[idx].cccd = e.target.value;
                            setMauDanhSach(updated);
                          }}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded"
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t flex items-center justify-between">
                      <label className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg cursor-pointer flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5" /> Ảnh Chân Dung Mẫu {sample.kyHieuMau}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleImageUpload(e, (b64) => {
                              const updated = [...mauDanhSach];
                              updated[idx].anhChanDung = b64;
                              setMauDanhSach(updated);
                            })
                          }
                          className="hidden"
                        />
                      </label>
                      {sample.anhChanDung ? (
                        <div className="flex items-center gap-2">
                          <img src={sample.anhChanDung} alt="Chân dung" className="w-8 h-10 object-cover rounded border" />
                          <span className="text-[10px] text-emerald-600 font-bold">✓ Đã có ảnh</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400">Chưa có ảnh chân dung</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Display Photos: Ảnh Gửi Mẫu & Ảnh Nhận Mẫu (UI Only) */}
            <div className="pt-4 border-t border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3">
                Ảnh Gửi Mẫu & Ảnh Nhận Mẫu (Hiển thị trên UI quản lý)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Ảnh Gửi Mẫu (Bước 1):</span>
                    <label className="text-[11px] text-indigo-600 hover:underline font-bold cursor-pointer">
                      Đổi ảnh
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, (b64) => setAnhGuiMau(b64))}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {anhGuiMau ? (
                    <img src={anhGuiMau} alt="Ảnh gửi mẫu" className="h-36 object-cover rounded-lg border w-full" />
                  ) : (
                    <div className="h-28 flex items-center justify-center bg-white border rounded-lg text-slate-400 text-xs italic">
                      Chưa đính kèm ảnh gửi mẫu
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Ảnh Nhận Mẫu (Bước 2):</span>
                    <label className="text-[11px] text-indigo-600 hover:underline font-bold cursor-pointer">
                      Đổi ảnh
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, (b64) => setAnhNhanMau(b64))}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {anhNhanMau ? (
                    <img src={anhNhanMau} alt="Ảnh nhận mẫu" className="h-36 object-cover rounded-lg border w-full" />
                  ) : (
                    <div className="h-28 flex items-center justify-center bg-white border rounded-lg text-slate-400 text-xs italic">
                      Chưa đính kèm ảnh nhận mẫu
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Upload File Kết Quả DOCX/PDF & Ảnh CCCD + Ảnh Chạy Mẫu */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-b pb-3 flex items-center gap-2">
              <Upload className="w-4 h-4 text-indigo-600" /> 2. Upload File DOCX/PDF & Ảnh Đính Kèm Từng Người
            </h3>

            {/* Upload DOCX / PDF file (Image 2) */}
            <div className="bg-indigo-50/80 p-4 rounded-xl border border-indigo-200 flex items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-indigo-900 uppercase">Tải lên File DOCX hoặc PDF Kết quả (Bảng Locus)</h4>
                <p className="text-xs text-slate-500 mt-0.5">Tự động đọc và điền dữ liệu Alil Locus vào các bảng bên dưới.</p>
              </div>

              <label className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-2 shadow-sm shrink-0">
                {uploadingResultFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span>Chọn File Kết Quả</span>
                <input type="file" accept=".docx,.pdf" onChange={handleFileUploadResult} className="hidden" />
              </label>
            </div>

            {/* Photos of CCCD & GeneMapper Chart per sample */}
            <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
              {mauDanhSach.map((sample, idx) => (
                <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                  <div className="font-bold text-xs text-indigo-900 border-b pb-2">
                    Mẫu {sample.kyHieuMau}: {sample.hoTen || 'Chưa nhập tên'}
                  </div>

                  {/* CCCD Mat Truoc */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Ảnh CCCD Mặt trước</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleImageUpload(e, (b64) => {
                          const updated = [...mauDanhSach];
                          updated[idx].anhCccdMatTruoc = b64;
                          setMauDanhSach(updated);
                        })
                      }
                      className="text-xs w-full"
                    />
                    {sample.anhCccdMatTruoc && (
                      <img src={sample.anhCccdMatTruoc} alt="CCCD Trước" className="mt-2 h-24 rounded border object-cover" />
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
                          const updated = [...mauDanhSach];
                          updated[idx].anhCccdMatSau = b64;
                          setMauDanhSach(updated);
                        })
                      }
                      className="text-xs w-full"
                    />
                    {sample.anhCccdMatSau && (
                      <img src={sample.anhCccdMatSau} alt="CCCD Sau" className="mt-2 h-24 rounded border object-cover" />
                    )}
                  </div>

                  {/* Biểu đồ chạy GeneMapper (Ảnh 3) */}
                  <div className="pt-2 border-t">
                    <label className="block text-[11px] font-bold text-purple-900 mb-1">
                      Ảnh Kết quả chạy ADN (Biểu đồ GeneMapper - Ảnh 3)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleImageUpload(e, (b64) => {
                          const updated = [...mauDanhSach];
                          updated[idx].anhKetQuaChay = b64;
                          setMauDanhSach(updated);
                        })
                      }
                      className="text-xs w-full"
                    />
                    {sample.anhKetQuaChay && (
                      <img src={sample.anhKetQuaChay} alt="Biểu đồ chạy" className="mt-2 h-32 rounded border object-cover w-full" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Bảng Kết quả phân tích Alil Locus */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-b pb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" /> 3. Bảng Kết Quả Phân Tích Alil Locus
            </h3>

            {renderLociEditor(table1, setTable1, 'Bảng Locus 1 (D3S1358, vWA, D12S391, CSF1PO, Penta E...)')}
            {renderLociEditor(table2, setTable2, 'Bảng Locus 2 (D2S1338, Penta D, AMEL, D22S1045...)')}
            {renderLociEditor(table3, setTable3, 'Bảng Locus 3 (D8S1179, D5S818, D21S11, FGA...)')}
          </div>

          {/* Section 4: Kết luận & Độ tin cậy */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide border-b pb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" /> 4. Kết Luận & Độ Tin Cậy
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kết luận xét nghiệm</label>
              <textarea
                rows={3}
                value={ketLuan}
                onChange={(e) => setKetLuan(e.target.value)}
                placeholder="VD: có quan hệ huyết thống bố - con ( cha – con) độ tin cậy > 99,9999%"
                className="w-full p-3 border border-slate-300 rounded-xl text-xs font-bold text-red-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Độ tin cậy</label>
                <input
                  type="text"
                  value={doTinCay}
                  onChange={(e) => setDoTinCay(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cán bộ xét nghiệm</label>
                <input
                  type="text"
                  value={kiemSoatKetQua}
                  onChange={(e) => setKiemSoatKetQua(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Đại diện đơn vị</label>
                <input
                  type="text"
                  value={daiDienDonVi}
                  onChange={(e) => setDaiDienDonVi(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Live Preview Trang Kết Quả & Ảnh Đính Kèm */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-600" /> 5. Xem Trực Quan Trang Kết Quả (Live Preview)
              </h3>

              <button
                onClick={handleDownloadPdf}
                disabled={exportingPdf}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {exportingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span>Tải PDF Kết Quả</span>
              </button>
            </div>

            {/* Preview Tabs */}
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

            {/* Preview Display Box */}
            <div className="bg-slate-200/70 p-6 rounded-2xl flex items-center justify-center min-h-[450px]">
              {previewTab === 'page1' && (
                <div className="bg-white w-[595px] min-h-[842px] p-8 shadow-xl text-black font-serif text-[10px] leading-snug space-y-3 border border-slate-300 relative">
                  {/* Header Logo HK & Company Info */}
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3 items-start">
                      <img src="/logo_hk.jpg" alt="Logo HK-Tech" className="w-20 h-14 object-contain" />
                      <div>
                        {loaiXetNghiemADN === 'tu_nguyen' ? (
                          <>
                            <div className="font-bold text-blue-900 text-[10px]">VIỆN NGHIÊN CỨU VÀ PHÂN TÍCH DI TRUYỀN</div>
                            <div className="font-bold text-blue-900 text-[10px]">CÔNG TY CỔ PHẦN CÔNG NGHỆ VÀ THƯƠNG MẠI HK-TECH</div>
                            <div className="text-[8px] italic text-blue-800">Địa chỉ: Số 15 Nguyễn Như Uyên, Phường Yên Hòa, Quận Cầu Giấy, TP Hà Nội</div>
                            <div className="text-[8px] italic text-blue-800">Website: hk-tech.vn | Hotline: 0971 553 330</div>
                            <div className="text-[8px] italic text-blue-800">Email: xetnghiemht.central@gmail.com</div>
                          </>
                        ) : (
                          <>
                            <div className="font-bold text-blue-900 text-[10.5px]">CÔNG TY CỔ PHẦN CÔNG NGHỆ VÀ THƯƠNG MẠI HK-TECH</div>
                            <div className="text-[8px] italic text-blue-800">Địa chỉ: Số 15 Nguyễn Như Uyên, Phường Yên Hòa, Quận Cầu Giấy, TP Hà Nội</div>
                            <div className="text-[8px] italic text-blue-800">Website: hk-tech.vn | Hotline: 0936 654 456</div>
                            <div className="text-[8px] italic text-blue-800">Email: xetnghiemht.central@gmail.com</div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Header Blue Bar */}
                  <div className="w-full h-1 bg-blue-900 my-1"></div>

                  {/* Top Right Date & Ticket Number */}
                  <div className="text-right text-[9px] italic">
                    <div>{ngayBanHanh || 'Hà Nội, ngày .... tháng .... năm ........'}</div>
                    <div>Số: {soPhieu}</div>
                  </div>

                  {/* Title */}
                  <div className="text-center font-bold text-black text-sm py-0.5">KẾT QUẢ XÉT NGHIỆM ADN</div>

                  {/* Intro */}
                  <div className="text-[9.5px]">
                    Theo đơn yêu cầu xét nghiệm ADN ngày {ngayYeuCau || '...................'} của bà(ông) {nguoiYeuCau || '...................'}, Công ty Cổ phần công nghệ và thương mại HK- Teck thực hiện xét nghiệm ADN cho những {loaiXetNghiemADN === 'tu_nguyen' ? 'mẫu được ghi tên' : 'người'} sau:
                  </div>

                  {/* Samples Detail List */}
                  <div className="space-y-2 text-[9.5px]">
                    {mauDanhSach.map((s, idx) => (
                      <div key={idx} className="flex gap-3 items-start">
                        {loaiXetNghiemADN === 'phap_ly' && (
                          <img
                            src={s.anhChanDung || s.anhCccdMatTruoc || '/logo_hk.jpg'}
                            alt="Chân dung"
                            className="w-12 h-16 object-cover border border-slate-300 shrink-0"
                          />
                        )}
                        <div className="space-y-0.5">
                          {loaiXetNghiemADN === 'tu_nguyen' ? (
                            <>
                              <div className="font-bold">{idx + 1}. Người có mẫu ghi tên: {s.hoTen || '...................'}</div>
                              <div>Giới tính: {s.gioiTinh}   Ngày sinh: {s.ngaySinh}   Loại mẫu: {s.loaiMau || 'Máu'}</div>
                              <div>Ký hiệu mẫu: {s.kyHieuMau}</div>
                            </>
                          ) : idx === 0 ? (
                            <>
                              <div className="font-bold">1. Họ tên: {s.hoTen}   Giới tính: {s.gioiTinh}   Ngày sinh: {s.ngaySinh}   Quốc tịch: {s.quocTich || 'Việt Nam'}</div>
                              <div>CCCD/Passport: {s.cccd}   Ngày cấp: {s.ngayCap}</div>
                              <div>Nơi cấp: {s.noiCap}</div>
                              <div>Nơi thường trú: {s.noiThuongTru}</div>
                              <div>Ký hiệu mẫu: {s.kyHieuMau}</div>
                            </>
                          ) : (
                            <>
                              <div className="font-bold">{idx + 1}. Người có tên dự kiến: {s.hoTen}</div>
                              <div>Giới tính: {s.gioiTinh}   Ngày sinh: {s.ngaySinh}</div>
                              <div>Giấy chứng sinh số: {s.cccd}   Quyển số: {s.quyenSo}</div>
                              <div>Ngày cấp: {s.ngayCap}   Nơi cấp: {s.noiCap}</div>
                              <div>Ký hiệu mẫu: {s.kyHieuMau}</div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Notes */}
                  <div className="text-[8.5px] italic space-y-0.5 pt-1">
                    <div>- Người {loaiXetNghiemADN === 'tu_nguyen' ? 'nhận' : 'thu'} mẫu: {nguoiThuMau}</div>
                    <div>- {loaiXetNghiemADN === 'tu_nguyen' ? 'Mẫu và các thông tin ghi trên mẫu' : 'Các giấy tờ cá nhân'} do người yêu cầu xét nghiệm tự cung cấp và chịu trách nhiệm.</div>
                    <div>- Các ký hiệu mẫu do Công ty cổ phần công nghệ và thương mại HK- TECK đặt.</div>
                    <div>- Phân tích ADN trong nhân tế bào các mẫu trên theo bộ kit {boKit}.</div>
                  </div>

                  {/* 3 Loci Comparison Tables */}
                  <div className="text-[9.5px] font-bold">Kết quả phân tích ADN như sau:</div>

                  {[
                    ['D3S1358', 'vWA', 'D12S391', 'CSF1PO', 'Penta E', 'D2S441', 'D16S539', 'D7S820', 'D13S317'],
                    ['D2S1338', 'Penta D', 'Rs199815934', 'AMEL', 'D22S1045', 'D19S433', 'D18S51', 'D6S1043', 'DYS391'],
                    ['D8S1179', 'D5S818', 'D21S11', 'FGA', 'D10S1248', 'TH01', 'D1S1656', 'TPOX', 'SE33'],
                  ].map((lociList, tableIdx) => {
                    const currentSourceTable = tableIdx === 0 ? table1 : tableIdx === 1 ? table2 : table3;
                    return (
                      <table key={tableIdx} className="w-full text-center border-collapse border border-slate-600 text-[8px]">
                        <thead>
                          <tr className="bg-slate-50 font-bold border-b border-slate-600">
                            <th className="border border-slate-600 p-0.5 w-12">Locus/Mẫu</th>
                            {lociList.map((loc, lIdx) => (
                              <th key={lIdx} className="border border-slate-600 p-0.5">{loc}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {mauDanhSach.map((s, sIdx) => {
                            const sKey = s.kyHieuMau || `M${sIdx + 1}`;
                            return (
                              <tr key={sIdx} className="border-b border-slate-600">
                                <td className="border border-slate-600 p-0.5 font-bold bg-slate-50">{sKey}</td>
                                {lociList.map((locName, lIdx) => {
                                  const rowItem = currentSourceTable.find((r) => (r.locus || '').toLowerCase() === locName.toLowerCase());
                                  let valStr = '';
                                  if (rowItem) {
                                    if (rowItem.alleles && rowItem.alleles[sKey]) {
                                      const a1 = rowItem.alleles[sKey].a1 || '';
                                      const a2 = rowItem.alleles[sKey].a2 || '';
                                      valStr = a1 && a2 ? `${a1} ; ${a2}` : a1 || a2 || '';
                                    }
                                  }
                                  return (
                                    <td key={lIdx} className="border border-slate-600 p-0.5 font-sans font-medium">
                                      {valStr}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    );
                  })}

                  {/* Conclusion */}
                  <div className="pt-1">
                    <div className="font-bold text-[10px] text-center">KẾT LUẬN:</div>
                    <div className="font-bold text-red-600 text-[9.5px] text-center mt-0.5">
                      {ketLuan ||
                        `${mauDanhSach[0]?.hoTen || '...'} (Kí hiệu: ${mauDanhSach[0]?.kyHieuMau || 'M1'}) có quan hệ huyết thống bố - con ( cha – con) với ${mauDanhSach[1]?.hoTen || '...'} (Kí hiệu: ${mauDanhSach[1]?.kyHieuMau || 'M2'}) độ tin cậy > 99,9999%.`}
                    </div>
                  </div>

                  {/* Signatures */}
                  <div className="flex justify-between pt-4 text-[9.5px] font-bold text-center">
                    <div>
                      <div>CÁN BỘ XÉT NGHIỆM</div>
                      <div className="mt-10 font-normal">{kiemSoatKetQua}</div>
                    </div>
                    <div>
                      <div>ĐẠI DIỆN ĐƠN VỊ</div>
                      <div className="mt-10 font-normal">{daiDienDonVi}</div>
                    </div>
                  </div>

                  {/* Footer note for ADN Tự nguyện (Image 3) */}
                  {loaiXetNghiemADN === 'tu_nguyen' && (
                    <div className="text-[7.5px] italic text-slate-400 text-center pt-2">
                      Ghi chú: Kết quả xét nghiệm có giá trị trên mẫu phân tích, không có giá trị trong tranh chấp, tổ tụng pháp lý
                    </div>
                  )}
                </div>
              )}

              {previewTab === 'run' && (
                <div className="space-y-6 w-full max-w-2xl">
                  {mauDanhSach.map((sample, idx) => (
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

              {previewTab === 'cccd' && (
                <div className="space-y-6 w-full max-w-2xl">
                  {mauDanhSach.map((sample, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl shadow-md border border-slate-300 space-y-4">
                      <div className="font-bold text-sm text-teal-900 border-b pb-2">
                        Trang {mauDanhSach.length + idx + 2}: CCCD / Giấy khai sinh - Mẫu {sample.kyHieuMau}: {sample.hoTen}
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
        </main>
      </div>
    </div>
  );
}
