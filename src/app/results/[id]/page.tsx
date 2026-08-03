'use client';

import React, { useState, useEffect, use } from 'react';
import TopHeader from '@/components/TopHeader';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import StatusBadge from '@/components/StatusBadge';
import FileUpload from '@/components/FileUpload';
import { useSession } from 'next-auth/react';
import {
  FileText,
  FlaskConical,
  Download,
  CheckCircle,
  Save,
  FileCheck,
  Dna,
  Lock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  BIEN_DOI_VI_SINH_OPTIONS,
  BIEN_DOI_KHAC_OPTIONS,
  BAT_THUONG_VAY_OPTIONS,
  BAT_THUONG_TUYEN_OPTIONS,
} from '@/constants/options';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TestResultDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { data: session } = useSession();
  const userRole = (session?.user as { role?: string })?.role;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signedPdfBase64, setSignedPdfBase64] = useState('');
  const [doctors, setDoctors] = useState<Array<{ _id: string; fullName: string }>>([]);

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

  const [formData, setFormData] = useState({
    _id: '',
    maSo: '',
    loaiXetNghiem: 'cell' as 'cell' | 'hpv40' | 'hpv20',
    hoTen: '',
    namSinh: 1990,
    gioiTinh: 'Nữ',
    diaChi: '',
    soDienThoai: '',
    loaiMau: 'Dịch phết',
    donVi: '',
    bacSiChiDinh: '',

    // Cell fields
    tinhChatBenhPham: 'dat',
    lyDoKhongDat: '',
    khongTonThuong: true,
    batThuongKhac: false,
    teBaoNoiMac: false,
    bienDoiViSinh: [] as string[],
    bienDoiKhac: [] as string[],
    batThuongVay: [] as string[],
    batThuongTuyen: [] as string[],

    // HPV fields
    hpvHighRiskResult: 'Âm tính',
    hpvHighRiskOtherResult: 'Âm tính',
    hpvLowRiskResult: 'Âm tính',
    hpvOtherTypesResult: 'Âm tính',

    // Common fields
    ketLuan: 'KHÔNG THẤY TẾ BÀO BẤT THƯỜNG TRÊN PHIẾN ĐỒ',
    khuyenNghi: '',
    ngayXetNghiem: new Date().toISOString().split('T')[0],
    bacSiDoc: 'BS CK1 PHẠM THẾ HÙNG',
    trangThai: 'nhap_thong_tin',
    anhTeBao: '',
    pdfDaKy: '',
  });

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/test-results/${id}`);
        if (res.ok) {
          const data = await res.json();
          const testType = data.loaiXetNghiem || 'cell';
          const currentDoctorName = (session?.user as any)?.name;
          const assignedDoctor = data.bacSiDoc || currentDoctorName || 'BS CK1 PHẠM THẾ HÙNG';

          setFormData({
            ...data,
            loaiXetNghiem: testType,
            bacSiDoc: assignedDoctor,
            ketLuan:
              data.ketLuan ||
              (testType === 'cell'
                ? 'KHÔNG THẤY TẾ BÀO BẤT THƯỜNG TRÊN PHIẾN ĐỒ'
                : 'ÂM TÍNH VỚI CÁC CHỦNG HPV KHẢO SÁT'),
            ngayXetNghiem: data.ngayXetNghiem
              ? new Date(data.ngayXetNghiem).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0],
          });
        }
      } catch (err) {
        console.error('Error loading result detail:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleArrayCheckbox = (category: string, value: string) => {
    setFormData((prev) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const list = (prev as any)[category] as string[];
      const exists = list.includes(value);
      const updated = exists ? list.filter((item) => item !== value) : [...list, value];
      return { ...prev, [category]: updated };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/test-results/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        toast.success('Đã lưu kết quả thành công!');
      } else {
        toast.error('Lỗi lưu kết quả!');
      }
    } catch {
      toast.error('Lỗi kết nối!');
    } finally {
      setSaving(false);
    }
  };

  const handleAccept = async () => {
    try {
      const currentDoc = session?.user?.name;
      const updatedData = { ...formData, bacSiDoc: currentDoc || formData.bacSiDoc };

      const res = await fetch(`/api/test-results/${id}/accept`, { method: 'POST' });
      if (res.ok) {
        const updated = await res.json();
        setFormData((prev) => ({
          ...prev,
          trangThai: updated.trangThai,
          bacSiDoc: currentDoc || prev.bacSiDoc,
        }));
        // Also save bacSiDoc to DB
        await fetch(`/api/test-results/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedData),
        });
        toast.success(`Đã nhận xử lý phiếu! Bác sĩ phụ trách: ${currentDoc || formData.bacSiDoc}`);
      } else {
        toast.error('Lỗi nhận phiếu!');
      }
    } catch {
      toast.error('Lỗi nhận phiếu!');
    }
  };

  const handleExportPDF = () => {
    window.open(`/api/test-results/${id}/export-pdf`, '_blank');
  };

  const handleUploadSignedPDF = async () => {
    if (!signedPdfBase64) {
      toast.error('Vui lòng chọn file PDF đã ký!');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/test-results/${id}/upload-signed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfBase64: signedPdfBase64 }),
      });
      if (res.ok) {
        const updated = await res.json();
        setFormData((prev) => ({ ...prev, trangThai: updated.trangThai, pdfDaKy: signedPdfBase64 }));
        toast.success('Đã upload PDF đã ký! Trạng thái: ĐÃ TRẢ KẾT QUẢ');
      } else {
        toast.error('Lỗi upload file!');
      }
    } catch {
      toast.error('Lỗi kết nối!');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <TopHeader />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-8 text-center text-slate-500">
            Đang tải thông tin phiếu...
          </main>
        </div>
      </div>
    );
  }

  const isHPV = formData.loaiXetNghiem === 'hpv40' || formData.loaiXetNghiem === 'hpv20';
  const isHPV40 = formData.loaiXetNghiem === 'hpv40';
  const isCompleted = formData.trangThai === 'da_tra_ket_qua';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <TopHeader />

      <div className="flex flex-1 w-full">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 w-full">
          <Header
            title={`Phiếu xét nghiệm: ${formData.maSo}`}
            subtitle={`Bệnh nhân: ${formData.hoTen} (${formData.loaiXetNghiem === 'cell' ? 'Mẫu CELL' : isHPV40 ? 'Mẫu HPV 40' : 'Mẫu HPV 20'})`}
            action={
              <div className="flex items-center gap-3">
                <StatusBadge status={formData.trangThai} />

                {(userRole === 'doctor' || userRole === 'admin') && formData.trangThai === 'nhap_thong_tin' && (
                  <button onClick={handleAccept} className="btn btn-success">
                    <FileCheck className="w-4 h-4" />
                    <span>Nhận xử lý phiếu</span>
                  </button>
                )}

                {formData.trangThai !== 'nhap_thong_tin' && (
                  <button onClick={handleExportPDF} className="btn btn-primary">
                    <Download className="w-4 h-4" />
                    <span>Download PDF phôi</span>
                  </button>
                )}
              </div>
            }
          />

          <div className="space-y-6">
            {/* Section 1: Administrative Info */}
            <div className="glass-card p-6">
              <h3 className="flex items-center gap-2 text-base font-bold text-sky-700 mb-4 pb-3 border-b border-slate-100">
                <FileText className="w-5 h-5 text-sky-600" />
                <span>Thông tin hành chính bệnh nhân</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="form-group">
                  <label>Họ và tên</label>
                  <input
                    type="text"
                    name="hoTen"
                    className="form-input disabled:bg-slate-100 disabled:text-slate-600"
                    value={formData.hoTen}
                    onChange={handleInputChange}
                    disabled={formData.trangThai !== 'nhap_thong_tin'}
                  />
                </div>

                <div className="form-group">
                  <label>Năm sinh</label>
                  <input
                    type="number"
                    name="namSinh"
                    className="form-input disabled:bg-slate-100 disabled:text-slate-600"
                    value={formData.namSinh}
                    onChange={handleInputChange}
                    disabled={formData.trangThai !== 'nhap_thong_tin'}
                  />
                </div>

                <div className="form-group">
                  <label>Giới tính</label>
                  <select
                    name="gioiTinh"
                    className="form-select disabled:bg-slate-100 disabled:text-slate-600"
                    value={formData.gioiTinh}
                    onChange={handleInputChange}
                    disabled={formData.trangThai !== 'nhap_thong_tin'}
                  >
                    <option value="Nữ">Nữ</option>
                    <option value="Nam">Nam</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Số điện thoại</label>
                  <input
                    type="text"
                    name="soDienThoai"
                    className="form-input disabled:bg-slate-100 disabled:text-slate-600"
                    value={formData.soDienThoai}
                    onChange={handleInputChange}
                    disabled={formData.trangThai !== 'nhap_thong_tin'}
                  />
                </div>

                <div className="form-group sm:col-span-2">
                  <label>Địa chỉ</label>
                  <input
                    type="text"
                    name="diaChi"
                    className="form-input disabled:bg-slate-100 disabled:text-slate-600"
                    value={formData.diaChi}
                    onChange={handleInputChange}
                    disabled={formData.trangThai !== 'nhap_thong_tin'}
                  />
                </div>

                <div className="form-group">
                  <label>Loại mẫu</label>
                  <input
                    type="text"
                    name="loaiMau"
                    className="form-input disabled:bg-slate-100 disabled:text-slate-600"
                    value={formData.loaiMau}
                    onChange={handleInputChange}
                    disabled={formData.trangThai !== 'nhap_thong_tin'}
                  />
                </div>

                <div className="form-group">
                  <label>Đơn vị gửi mẫu</label>
                  <input
                    type="text"
                    name="donVi"
                    className="form-input disabled:bg-slate-100 disabled:text-slate-600"
                    value={formData.donVi}
                    onChange={handleInputChange}
                    disabled={formData.trangThai !== 'nhap_thong_tin'}
                  />
                </div>

                <div className="form-group sm:col-span-2">
                  <label>Bác sĩ chỉ định</label>
                  <input
                    type="text"
                    name="bacSiChiDinh"
                    className="form-input disabled:bg-slate-100 disabled:text-slate-600"
                    value={formData.bacSiChiDinh}
                    onChange={handleInputChange}
                    disabled={formData.trangThai !== 'nhap_thong_tin'}
                  />
                </div>

                <div className="form-group sm:col-span-2">
                  <label className="font-bold text-sky-700">Bác sĩ đọc kết quả (Gán phiếu) *</label>
                  <select
                    name="bacSiDoc"
                    className="form-select font-semibold border-sky-300 bg-sky-50/50 text-slate-800 disabled:bg-slate-100 disabled:text-slate-600"
                    value={formData.bacSiDoc}
                    onChange={handleInputChange}
                    disabled={formData.trangThai !== 'nhap_thong_tin'}
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

              {formData.trangThai !== 'nhap_thong_tin' ? (
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 inline-flex items-center gap-1.5">
                    🔒 Phiếu đang trong quá trình chạy mẫu / đã trả kết quả - Thông tin hành chính được khóa cố định.
                  </span>
                </div>
              ) : (
                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="btn btn-primary text-xs"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Đang lưu...' : 'Lưu thông tin phiếu'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Section 2: Clinical Results based on Test Type */}
            {!isHPV ? (
              /* CELL / Bethesda 2014 Form */
              <div className="glass-card p-6">
                <h3 className="flex items-center justify-between text-base font-bold text-sky-700 mb-5 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-5 h-5 text-sky-600" />
                    <span>KẾT QUẢ TẾ BÀO HỌC CỔ TỬ CUNG (BETHESDA 2014)</span>
                  </div>
                  {isCompleted && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" />
                      <span>ĐÃ TRẢ KẾT QUẢ (ĐÃ KHÓA)</span>
                    </span>
                  )}
                </h3>

                {/* Tính chất bệnh phẩm */}
                <div className="mb-6">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    TÍNH CHẤT BỆNH PHẨM
                  </label>
                  <div className="flex flex-wrap gap-4">
                    <label className={`checkbox-item ${isCompleted ? 'opacity-70 cursor-not-allowed pointer-events-none' : ''}`}>
                      <input
                        type="radio"
                        name="tinhChatBenhPham"
                        value="dat"
                        checked={formData.tinhChatBenhPham === 'dat'}
                        onChange={handleInputChange}
                        disabled={isCompleted}
                      />
                      <span>Đạt yêu cầu chẩn đoán</span>
                    </label>
                    <label className={`checkbox-item ${isCompleted ? 'opacity-70 cursor-not-allowed pointer-events-none' : ''}`}>
                      <input
                        type="radio"
                        name="tinhChatBenhPham"
                        value="khongDat"
                        checked={formData.tinhChatBenhPham === 'khongDat'}
                        onChange={handleInputChange}
                        disabled={isCompleted}
                      />
                      <span>Không đạt yêu cầu chẩn đoán</span>
                    </label>
                  </div>
                </div>

                {/* Kết quả chính */}
                <div className="mb-6">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    KẾT QUẢ CHÍNH
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <label className={`checkbox-item ${isCompleted ? 'opacity-70 cursor-not-allowed pointer-events-none' : ''}`}>
                      <input
                        type="checkbox"
                        name="khongTonThuong"
                        checked={formData.khongTonThuong}
                        onChange={handleInputChange}
                        disabled={isCompleted}
                      />
                      <span>KHÔNG TỔN THƯƠNG TRONG BIỂU MÔ hay UNG THƯ</span>
                    </label>
                    <label className={`checkbox-item ${isCompleted ? 'opacity-70 cursor-not-allowed pointer-events-none' : ''}`}>
                      <input
                        type="checkbox"
                        name="batThuongKhac"
                        checked={formData.batThuongKhac}
                        onChange={handleInputChange}
                        disabled={isCompleted}
                      />
                      <span>BẤT THƯỜNG KHÁC</span>
                    </label>
                    <label className={`checkbox-item ${isCompleted ? 'opacity-70 cursor-not-allowed pointer-events-none' : ''}`}>
                      <input
                        type="checkbox"
                        name="teBaoNoiMac"
                        checked={formData.teBaoNoiMac}
                        onChange={handleInputChange}
                        disabled={isCompleted}
                      />
                      <span>TẾ BÀO NỘI MẠC TỬ CUNG</span>
                    </label>
                  </div>
                </div>

                {/* Checkbox Groups: Vi sinh & Biến đổi khác */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                    <h4 className="text-xs font-bold text-sky-700 uppercase tracking-wider mb-3">
                      BIẾN ĐỔI TẾ BÀO DO VI SINH
                    </h4>
                    <div className="space-y-2">
                      {BIEN_DOI_VI_SINH_OPTIONS.map((opt) => (
                        <label key={opt.value} className={`checkbox-item ${isCompleted ? 'opacity-70 cursor-not-allowed pointer-events-none' : ''}`}>
                          <input
                            type="checkbox"
                            checked={formData.bienDoiViSinh?.includes(opt.value)}
                            onChange={() => handleArrayCheckbox('bienDoiViSinh', opt.value)}
                            disabled={isCompleted}
                          />
                          <span>{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                    <h4 className="text-xs font-bold text-sky-700 uppercase tracking-wider mb-3">
                      BIẾN ĐỔI TẾ BÀO KHÁC
                    </h4>
                    <div className="space-y-2">
                      {BIEN_DOI_KHAC_OPTIONS.map((opt) => (
                        <label key={opt.value} className={`checkbox-item ${isCompleted ? 'opacity-70 cursor-not-allowed pointer-events-none' : ''}`}>
                          <input
                            type="checkbox"
                            checked={formData.bienDoiKhac?.includes(opt.value)}
                            onChange={() => handleArrayCheckbox('bienDoiKhac', opt.value)}
                            disabled={isCompleted}
                          />
                          <span>{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Checkbox Groups: Bất thường vảy & Tuyến */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                    <h4 className="text-xs font-bold text-sky-700 uppercase tracking-wider mb-3">
                      BẤT THƯỜNG TẾ BÀO BIỂU MÔ — TẾ BÀO VẢY
                    </h4>
                    <div className="space-y-2">
                      {BAT_THUONG_VAY_OPTIONS.map((opt) => (
                        <label key={opt.value} className={`checkbox-item ${isCompleted ? 'opacity-70 cursor-not-allowed pointer-events-none' : ''}`}>
                          <input
                            type="checkbox"
                            checked={formData.batThuongVay?.includes(opt.value)}
                            onChange={() => handleArrayCheckbox('batThuongVay', opt.value)}
                            disabled={isCompleted}
                          />
                          <span>{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                    <h4 className="text-xs font-bold text-sky-700 uppercase tracking-wider mb-3">
                      BẤT THƯỜNG TẾ BÀO BIỂU MÔ — TẾ BÀO TUYẾN
                    </h4>
                    <div className="space-y-2">
                      {BAT_THUONG_TUYEN_OPTIONS.map((opt) => (
                        <label key={opt.value} className={`checkbox-item ${isCompleted ? 'opacity-70 cursor-not-allowed pointer-events-none' : ''}`}>
                          <input
                            type="checkbox"
                            checked={formData.batThuongTuyen?.includes(opt.value)}
                            onChange={() => handleArrayCheckbox('batThuongTuyen', opt.value)}
                            disabled={isCompleted}
                          />
                          <span>{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Kết luận & Khuyến nghị */}
                <div className="form-group mb-4">
                  <label className="font-bold text-slate-700">KẾT LUẬN *</label>
                  <textarea
                    name="ketLuan"
                    className="form-textarea font-bold disabled:bg-slate-100 disabled:text-slate-700"
                    rows={2}
                    value={formData.ketLuan}
                    onChange={handleInputChange}
                    disabled={isCompleted}
                  />
                </div>

                <div className="form-group mb-6">
                  <label className="font-bold text-slate-700">KHUYẾN NGHỊ</label>
                  <textarea
                    name="khuyenNghi"
                    className="form-textarea disabled:bg-slate-100 disabled:text-slate-700"
                    rows={2}
                    value={formData.khuyenNghi || ''}
                    onChange={handleInputChange}
                    disabled={isCompleted}
                    placeholder="Ví dụ: Đề nghị xét nghiệm lại sau 6 tháng..."
                  />
                </div>

                {/* Cell Image Upload */}
                <FileUpload
                  label="Upload ảnh soi tế bào (chèn vào góc dưới bên trái PDF)"
                  value={formData.anhTeBao}
                  disabled={isCompleted}
                  onChange={(base64) => setFormData((prev) => ({ ...prev, anhTeBao: base64 }))}
                />
              </div>
            ) : (
              /* HPV 40 / HPV 20 Form */
              <div className="glass-card p-6">
                <h3 className="flex items-center justify-between text-base font-bold text-indigo-700 mb-5 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Dna className="w-5 h-5 text-indigo-600" />
                    <span>
                      KẾT QUẢ XÉT NGHIỆM {isHPV40 ? 'HPV 40 TYPES' : 'HPV 20 TYPES'} (REAL-TIME PCR)
                    </span>
                  </div>
                  {isCompleted && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" />
                      <span>ĐÃ TRẢ KẾT QUẢ (ĐÃ KHÓA)</span>
                    </span>
                  )}
                </h3>

                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-red-50/50 border border-red-100">
                    <div className="md:col-span-2">
                      <span className="font-bold text-red-700 block">
                        HPV Nguy Cơ Cao (Type 16, 18)
                      </span>
                      <span className="text-xs text-slate-500">Các chủng: 16, 18</span>
                    </div>
                    <input
                      type="text"
                      name="hpvHighRiskResult"
                      className="form-input font-bold text-red-700 disabled:bg-slate-100"
                      value={formData.hpvHighRiskResult}
                      onChange={handleInputChange}
                      disabled={isCompleted}
                      placeholder="Âm tính hoặc Dương tính (Type 16)"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-red-50/50 border border-red-100">
                    <div className="md:col-span-2">
                      <span className="font-bold text-red-700 block">
                        HPV Nguy Cơ Cao Khác (16 Types)
                      </span>
                      <span className="text-xs text-slate-500">
                        Các chủng: 26, 31, 33, 35, 39, 45, 51, 52, 53, 56, 58, 59, 66, 68, 73, 82
                      </span>
                    </div>
                    <input
                      type="text"
                      name="hpvHighRiskOtherResult"
                      className="form-input font-bold text-red-700 disabled:bg-slate-100"
                      value={formData.hpvHighRiskOtherResult}
                      onChange={handleInputChange}
                      disabled={isCompleted}
                      placeholder="Âm tính hoặc ghi các type dương tính"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                    <div className="md:col-span-2">
                      <span className="font-bold text-sky-700 block">
                        HPV Nguy Cơ Thấp (2 Types)
                      </span>
                      <span className="text-xs text-slate-500">Các chủng: 6, 11</span>
                    </div>
                    <input
                      type="text"
                      name="hpvLowRiskResult"
                      className="form-input font-bold text-sky-700 disabled:bg-slate-100"
                      value={formData.hpvLowRiskResult}
                      onChange={handleInputChange}
                      disabled={isCompleted}
                      placeholder="Âm tính hoặc Dương tính (Type 6)"
                    />
                  </div>

                  {isHPV40 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="md:col-span-2">
                        <span className="font-bold text-slate-700 block">
                          Các Type HPV Khác (20 Types)
                        </span>
                        <span className="text-xs text-slate-500">
                          Các chủng: 30, 32, 34, 40, 42, 43, 44, 54, 55, 61, 62, 67, 71, 72, 74, 81,
                          83, 84, 87, 90
                        </span>
                      </div>
                      <input
                        type="text"
                        name="hpvOtherTypesResult"
                        className="form-input font-bold text-slate-700 disabled:bg-slate-100"
                        value={formData.hpvOtherTypesResult}
                        onChange={handleInputChange}
                        disabled={isCompleted}
                        placeholder="Âm tính"
                      />
                    </div>
                  )}
                </div>

                {/* Kết luận */}
                <div className="form-group mb-6">
                  <label className="font-bold text-slate-700">KẾT LUẬN *</label>
                  <textarea
                    name="ketLuan"
                    className="form-textarea font-bold text-indigo-900 disabled:bg-slate-100"
                    rows={2}
                    value={formData.ketLuan}
                    onChange={handleInputChange}
                    disabled={isCompleted}
                  />
                </div>

                {/* Biểu đồ Real-time PCR upload */}
                <FileUpload
                  label="Upload ảnh Biểu đồ tín hiệu huỳnh quang / Điện di (Real-time PCR)"
                  value={formData.anhTeBao}
                  disabled={isCompleted}
                  onChange={(base64) => setFormData((prev) => ({ ...prev, anhTeBao: base64 }))}
                />
              </div>
            )}

            {/* Doctor & Date Footer Card */}
            <div className="glass-card p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="form-group mb-0 w-full sm:w-64">
                  <label className="font-bold text-slate-700">Ngày xét nghiệm *</label>
                  <input
                    type="date"
                    name="ngayXetNghiem"
                    className="form-input disabled:bg-slate-100"
                    value={formData.ngayXetNghiem}
                    onChange={handleInputChange}
                    disabled={isCompleted}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block font-medium">Bác sĩ đọc kết quả:</span>
                    <span className="text-sm font-bold text-sky-700">{formData.bacSiDoc || 'Chưa gán'}</span>
                  </div>

                  {!isCompleted && (
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="btn btn-primary"
                    >
                      <Save className="w-4 h-4" />
                      <span>{saving ? 'Đang lưu...' : 'Lưu kết quả'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: PDF Signing Workflow */}
            <div className="glass-card p-6">
              <h3 className="flex items-center gap-2 text-base font-bold text-sky-700 mb-3">
                <CheckCircle className="w-5 h-5 text-sky-600" />
                <span>Hoàn tất phiếu & Upload PDF đã ký</span>
              </h3>

              <p className="text-xs text-slate-500 mb-4">
                Quy trình: 1. Lưu kết quả ➔ 2. Download PDF phôi ➔ 3. Bác sĩ ký tay / đóng dấu ➔ 4. Upload lại PDF đã ký.
              </p>

              <div className="mb-4">
                <button onClick={handleExportPDF} className="btn btn-secondary">
                  <Download className="w-4 h-4" />
                  <span>1. Download file PDF phôi</span>
                </button>
              </div>

              <FileUpload
                accept="application/pdf"
                label="2. Upload bản PDF bác sĩ đã ký"
                value={signedPdfBase64 || formData.pdfDaKy}
                isImage={false}
                onChange={(base64) => setSignedPdfBase64(base64)}
              />

              {signedPdfBase64 && (
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={handleUploadSignedPDF}
                    disabled={saving}
                    className="btn btn-success"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{saving ? 'Đang tải lên...' : 'Xác nhận upload & Trả kết quả'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
