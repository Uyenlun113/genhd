'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
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
  Clock,
  PenLine,
  Send,
  Eye,
  Activity,
  Image as ImageIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useWebSocket } from '@/hooks/useWebSocket';
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
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState('');
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
    loaiXetNghiem: 'cell' as 'cell' | 'thinprep' | 'hpv40' | 'hpv20' | 'soituoi' | 'giaiphaubenh',
    hoTen: '',
    namSinh: 1990,
    gioiTinh: 'Nữ',
    diaChi: '',
    soDienThoai: '',
    loaiMau: 'Dịch phết',
    donVi: '',
    bacSiChiDinh: '',

    // Giải Phẫu Bệnh fields
    viTriBenhPham: '',
    daiThe: '',
    viThe: '',

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

    // Soi tươi fields
    chanDoanLamSang: '',
    nhanXetDaiThe: '',
    soiTuoiBachCau: 'Âm tính',
    soiTuoiNam: 'Âm tính',
    soiTuoiTapKhuan: 'Âm tính',
    soiTuoiTeBaoBieuMo: 'Ít',
    soiTuoiTrichomonas: 'Âm tính',
    soiTuoiGhiChuBachCau: '',
    soiTuoiGhiChuNam: '',
    soiTuoiGhiChuTapKhuan: '',
    soiTuoiGhiChuTeBaoBieuMo: '',
    soiTuoiGhiChuTrichomonas: '',

    // Common fields
    ketLuan: 'KHÔNG THẤY TẾ BÀO BẤT THƯỜNG TRÊN PHIẾN ĐỒ',
    khuyenNghi: '',
    ngayXetNghiem: new Date().toISOString().split('T')[0],
    bacSiDoc: 'BS CK1 PHẠM THẾ HÙNG',
    trangThai: 'nhap_thong_tin',
    daKy: false,
    anhTeBao: '',
    pdfDaKy: '',
    lichSuChinhSua: [] as Array<{ nguoiSua: string; thoiGian: string; noiDung: string }>,
  });

  const loadData = useCallback(async () => {
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
            (testType === 'soituoi'
              ? 'BÌNH THƯỜNG'
              : testType === 'cell' || testType === 'thinprep'
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
  }, [id, session?.user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useWebSocket((event) => {
    if (event.type === 'REFRESH_TEST_RESULTS') {
      loadData();
    }
  });

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
    const yearNum = Number(formData.namSinh);
    const currentYear = new Date().getFullYear();
    if (!formData.namSinh || isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear) {
      toast.error(`Năm sinh không hợp lệ. Vui lòng nhập năm sinh từ 1900 đến ${currentYear}`);
      return;
    }
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

  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [selectedDoctorForAccept, setSelectedDoctorForAccept] = useState('');

  const handleOpenAcceptModal = () => {
    setSelectedDoctorForAccept(doctors[0]?.fullName || formData.bacSiDoc || '');
    setShowAcceptModal(true);
  };

  const handleConfirmAccept = async () => {
    if (!selectedDoctorForAccept) {
      toast.error('Vui lòng chọn bác sĩ đọc kết quả');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/test-results/${id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bacSiDoc: selectedDoctorForAccept }),
      });
      if (res.ok) {
        const updated = await res.json();
        setFormData((prev) => ({
          ...prev,
          trangThai: updated.trangThai,
          bacSiDoc: selectedDoctorForAccept,
        }));
        toast.success(`Đã nhận mẫu! Bác sĩ đọc kết quả: ${selectedDoctorForAccept}`);
        setShowAcceptModal(false);
      } else {
        toast.error('Lỗi nhận phiếu!');
      }
    } catch {
      toast.error('Lỗi kết nối!');
    } finally {
      setSaving(false);
    }
  };

  const handleExportPDF = () => {
    window.open(`/api/test-results/${id}/export-pdf`, '_blank');
  };

  const handleSign = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/test-results/${id}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const updated = await res.json();
        setFormData((prev) => ({ ...prev, daKy: true, ...updated }));
        toast.success('Đã lưu kết quả và ký thành công!');
        // Preview PDF inline
        setPdfPreviewUrl(`/api/test-results/${id}/export-pdf?mode=preview&t=${Date.now()}`);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Lỗi ký kết quả!');
      }
    } catch {
      toast.error('Lỗi kết nối!');
    } finally {
      setSaving(false);
    }
  };

  const handleDeliver = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/test-results/${id}/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anhTeBao: formData.anhTeBao }),
      });
      if (res.ok) {
        const updated = await res.json();
        setFormData((prev) => ({ ...prev, trangThai: updated.trangThai }));
        toast.success('Đã trả kết quả xét nghiệm thành công!');
      } else {
        const err = await res.json();
        toast.error(err.error || 'Lỗi trả kết quả!');
      }
    } catch {
      toast.error('Lỗi kết nối!');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (base64OrUrl: string) => {
    setFormData((prev) => ({ ...prev, anhTeBao: base64OrUrl }));
    try {
      const updatedData = { ...formData, anhTeBao: base64OrUrl };
      const res = await fetch(`/api/test-results/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      if (res.ok) {
        toast.success(base64OrUrl ? 'Đã tải và lưu ảnh xét nghiệm thành công!' : 'Đã xóa ảnh!');
        setPdfPreviewUrl(`/api/test-results/${id}/export-pdf?mode=preview&t=${Date.now()}`);
      }
    } catch (err) {
      console.error('Lỗi lưu ảnh:', err);
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
            subtitle={`Bệnh nhân: ${formData.hoTen} (${
              formData.loaiXetNghiem === 'cell'
                ? 'Mẫu CELL'
                : formData.loaiXetNghiem === 'thinprep'
                ? 'Mẫu ThinPrep'
                : formData.loaiXetNghiem === 'hpv40'
                ? 'Mẫu HPV 40'
                : formData.loaiXetNghiem === 'hpv20'
                ? 'Mẫu HPV 20'
                : formData.loaiXetNghiem === 'soituoi'
                ? 'Mẫu Soi tươi'
                : formData.loaiXetNghiem === 'giaiphaubenh'
                ? 'Mẫu Giải Phẫu Bệnh'
                : 'Phiếu xét nghiệm'
            })`}
            action={
              <div className="flex items-center gap-3">
                <StatusBadge status={formData.trangThai} />

                {(userRole === 'doctor' || userRole === 'admin' || userRole === 'lab_admin') && formData.trangThai === 'nhap_thong_tin' && (
                  <button onClick={handleOpenAcceptModal} className="btn btn-success">
                    <FileCheck className="w-4 h-4" />
                    <span>Nhận mẫu</span>
                  </button>
                )}

                {formData.trangThai === 'da_tra_ket_qua' && (
                  <button onClick={handleExportPDF} className="btn btn-primary">
                    <Download className="w-4 h-4" />
                    <span>Download PDF kết quả</span>
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
                    disabled={userRole === 'doctor' || userRole === 'lab_admin' || formData.trangThai !== 'nhap_thong_tin'}
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
                    min={1900}
                    max={new Date().getFullYear()}
                    disabled={userRole === 'doctor' || userRole === 'lab_admin' || formData.trangThai !== 'nhap_thong_tin'}
                  />
                </div>

                <div className="form-group">
                  <label>Giới tính</label>
                  <select
                    name="gioiTinh"
                    className="form-select disabled:bg-slate-100 disabled:text-slate-600"
                    value={formData.gioiTinh}
                    onChange={handleInputChange}
                    disabled={userRole === 'doctor' || userRole === 'lab_admin' || formData.trangThai !== 'nhap_thong_tin'}
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
                    disabled={userRole === 'doctor' || userRole === 'lab_admin' || formData.trangThai !== 'nhap_thong_tin'}
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
                    disabled={userRole === 'doctor' || userRole === 'lab_admin' || formData.trangThai !== 'nhap_thong_tin'}
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
                    disabled={userRole === 'doctor' || userRole === 'lab_admin' || formData.trangThai !== 'nhap_thong_tin'}
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
                    disabled={userRole === 'doctor' || userRole === 'lab_admin' || formData.trangThai !== 'nhap_thong_tin'}
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
                    disabled={userRole === 'doctor' || userRole === 'lab_admin' || formData.trangThai !== 'nhap_thong_tin'}
                  />
                </div>

                <div className="form-group sm:col-span-2">
                  <label className="font-bold text-sky-700">Bác sĩ đọc kết quả (Gán phiếu) *</label>
                  <select
                    name="bacSiDoc"
                    className="form-select font-semibold border-sky-300 bg-sky-50/50 text-slate-800 disabled:bg-slate-100 disabled:text-slate-600"
                    value={formData.bacSiDoc}
                    onChange={handleInputChange}
                    disabled={userRole === 'doctor' || userRole === 'lab_admin' || formData.trangThai !== 'nhap_thong_tin'}
                    required
                  >
                    <option value="Chưa phân loại">-- Chưa phân loại (Tạo phiếu nháp) --</option>
                    {doctors.map((doc) => (
                      <option key={doc._id} value={doc.fullName}>
                        {doc.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {userRole === 'doctor' || userRole === 'lab_admin' || formData.trangThai !== 'nhap_thong_tin' ? (
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 inline-flex items-center gap-1.5">
                    <Lock className='inline-block w-4 h-4' /> Thông tin hành chính bệnh nhân được khóa cố định đối với Bác sĩ / Admin phòng Lab / Phiếu đã nhận mẫu.
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

            {/* Section 2: Clinical Results or Staff Status Banner */}
            {userRole === 'staff' ? (
              <div className="glass-card p-6 border-l-4 border-l-sky-500">
                <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-sky-600" />
                  <span>Trạng thái kết quả xét nghiệm chuyên môn</span>
                </h3>

                {formData.trangThai !== 'da_tra_ket_qua' ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">
                        <Clock className='inline-block w-5 h-5' />
                      </div>
                      <div>
                        <h4 className="font-bold text-amber-900 text-sm">Đang chờ bác sĩ xử lý & trả kết quả</h4>
                        <p className="text-xs text-amber-700 mt-0.5">
                          Phiếu xét nghiệm đã được gửi và đang trong quá trình phân tích chuyên môn.
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-300">
                      Chờ trả kết quả
                    </span>
                  </div>
                ) : (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                        <CheckCircle className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-emerald-900 text-sm">Đã có kết quả xét nghiệm hoàn tất!</h4>
                        <p className="text-xs text-emerald-700 mt-0.5">
                          Bác sĩ {formData.bacSiDoc} đã hoàn tất và trả kết quả xét nghiệm.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleExportPDF}
                      className="btn btn-primary text-xs flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Tải kết quả PDF</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {formData.loaiXetNghiem === 'giaiphaubenh' ? (
                  /* GIẢI PHẪU BỆNH Form */
                  <div className="glass-card p-6">
                    <h3 className="flex items-center justify-between text-base font-bold text-amber-700 mb-5 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-amber-600" />
                        <span>KẾT QUẢ XÉT NGHIỆM GIẢI PHẪU BỆNH</span>
                      </div>
                      {isCompleted && (
                        <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" />
                          <span>ĐÃ TRẢ KẾT QUẢ (ĐÃ KHÓA)</span>
                        </span>
                      )}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="form-group mb-0">
                        <label className="font-bold text-slate-700 text-xs">Chẩn đoán lâm sàng</label>
                        <input
                          type="text"
                          name="chanDoanLamSang"
                          className="form-input text-xs disabled:bg-slate-100"
                          placeholder="Nhập chẩn đoán lâm sàng..."
                          value={formData.chanDoanLamSang || ''}
                          onChange={handleInputChange}
                          disabled={isCompleted}
                        />
                      </div>

                      <div className="form-group mb-0">
                        <label className="font-bold text-slate-700 text-xs">Vị trí bệnh phẩm</label>
                        <input
                          type="text"
                          name="viTriBenhPham"
                          className="form-input text-xs disabled:bg-slate-100"
                          placeholder="Nhập vị trí bệnh phẩm..."
                          value={formData.viTriBenhPham || ''}
                          onChange={handleInputChange}
                          disabled={isCompleted}
                        />
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div className="form-group">
                        <label className="font-bold text-slate-800 text-xs uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          <span>Mô tả Đại thể (ĐẠI THỂ)</span>
                        </label>
                        <textarea
                          name="daiThe"
                          rows={4}
                          className="form-textarea font-medium text-slate-800 bg-slate-50/50 border-slate-200 disabled:bg-slate-100"
                          placeholder="Nhập mô tả đại thể..."
                          value={formData.daiThe || ''}
                          onChange={handleInputChange}
                          disabled={isCompleted}
                        />
                      </div>

                      <div className="form-group">
                        <label className="font-bold text-slate-800 text-xs uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          <span>Mô tả Vi thể (VI THỂ)</span>
                        </label>
                        <textarea
                          name="viThe"
                          rows={5}
                          className="form-textarea font-medium text-slate-800 bg-slate-50/50 border-slate-200 disabled:bg-slate-100"
                          placeholder="Nhập mô tả vi thể..."
                          value={formData.viThe || ''}
                          onChange={handleInputChange}
                          disabled={isCompleted}
                        />
                      </div>

                      <div className="form-group">
                        <label className="font-bold text-amber-800 text-xs uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                          <span>KẾT LUẬN *</span>
                        </label>
                        <textarea
                          name="ketLuan"
                          rows={3}
                          className="form-textarea font-bold text-amber-900 bg-amber-50/40 border-amber-200 disabled:bg-slate-100 disabled:text-slate-600"
                          placeholder="Nhập kết luận giải phẫu bệnh..."
                          value={formData.ketLuan}
                          onChange={handleInputChange}
                          disabled={isCompleted}
                          required
                        />
                      </div>
                    </div>
                  </div>
                ) : formData.loaiXetNghiem === 'soituoi' ? (
                  /* SOI TƯƠI Form */
                  <div className="glass-card p-6">
                    <h3 className="flex items-center justify-between text-base font-bold text-emerald-700 mb-5 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-emerald-600" />
                        <span>KẾT QUẢ XÉT NGHIỆM SOI TƯƠI DỊCH</span>
                      </div>
                      {isCompleted && (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" />
                          <span>ĐÃ TRẢ KẾT QUẢ (ĐÃ KHÓA)</span>
                        </span>
                      )}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="form-group mb-0">
                        <label className="font-bold text-slate-700 text-xs">Chẩn đoán lâm sàng</label>
                        <input
                          type="text"
                          name="chanDoanLamSang"
                          className="form-input text-xs disabled:bg-slate-100"
                          placeholder="Nhập chẩn đoán lâm sàng..."
                          value={formData.chanDoanLamSang || ''}
                          onChange={handleInputChange}
                          disabled={isCompleted}
                        />
                      </div>

                      <div className="form-group mb-0">
                        <label className="font-bold text-slate-700 text-xs">Nhận xét đại thể</label>
                        <input
                          type="text"
                          name="nhanXetDaiThe"
                          className="form-input text-xs disabled:bg-slate-100"
                          placeholder="Nhập nhận xét đại thể..."
                          value={formData.nhanXetDaiThe || ''}
                          onChange={handleInputChange}
                          disabled={isCompleted}
                        />
                      </div>
                    </div>

                    {/* Table of 5 Soi Tươi items */}
                    <div className="overflow-x-auto mb-6">
                      <table className="w-full text-xs text-left border-collapse border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                        <thead>
                          <tr className="bg-sky-800 text-white font-bold text-center divide-x divide-sky-700">
                            <th className="py-2.5 px-3 w-12">STT</th>
                            <th className="py-2.5 px-3 w-1/4">SOI TƯƠI</th>
                            <th className="py-2.5 px-3 w-1/4">KẾT QUẢ</th>
                            <th className="py-2.5 px-3 w-1/4">Ý NGHĨA</th>
                            <th className="py-2.5 px-3 w-1/4">GHI CHÚ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 font-medium">
                          {/* Row 1: Bạch cầu */}
                          <tr className="divide-x divide-slate-200 hover:bg-slate-50/50">
                            <td className="py-2 px-3 text-center font-bold text-slate-500">1</td>
                            <td className="py-2 px-3 font-bold text-slate-800">Bạch cầu</td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                name="soiTuoiBachCau"
                                className="form-input w-full text-xs font-bold text-sky-700 bg-sky-50/50 py-1 disabled:bg-slate-100"
                                value={formData.soiTuoiBachCau || ''}
                                onChange={handleInputChange}
                                disabled={isCompleted}
                                placeholder="Âm tính / + / ++..."
                              />
                            </td>
                            <td className="py-2 px-3 text-slate-600">Đánh giá mức độ viêm nhiễm</td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                name="soiTuoiGhiChuBachCau"
                                className="form-input w-full text-xs py-1 disabled:bg-slate-100"
                                value={formData.soiTuoiGhiChuBachCau || ''}
                                onChange={handleInputChange}
                                disabled={isCompleted}
                              />
                            </td>
                          </tr>

                          {/* Row 2: Nấm */}
                          <tr className="divide-x divide-slate-200 bg-slate-50/40 hover:bg-slate-50/80">
                            <td className="py-2 px-3 text-center font-bold text-slate-500">2</td>
                            <td className="py-2 px-3 font-bold text-slate-800">Nấm</td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                name="soiTuoiNam"
                                className="form-input w-full text-xs font-bold text-sky-700 bg-sky-50/50 py-1 disabled:bg-slate-100"
                                value={formData.soiTuoiNam || ''}
                                onChange={handleInputChange}
                                disabled={isCompleted}
                                placeholder="Âm tính / Dương tính..."
                              />
                            </td>
                            <td className="py-2 px-3 text-slate-600">Đánh giá sự xuất hiện của nấm</td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                name="soiTuoiGhiChuNam"
                                className="form-input w-full text-xs py-1 disabled:bg-slate-100"
                                value={formData.soiTuoiGhiChuNam || ''}
                                onChange={handleInputChange}
                                disabled={isCompleted}
                              />
                            </td>
                          </tr>

                          {/* Row 3: Tạp khuẩn */}
                          <tr className="divide-x divide-slate-200 hover:bg-slate-50/50">
                            <td className="py-2 px-3 text-center font-bold text-slate-500">3</td>
                            <td className="py-2 px-3 font-bold text-slate-800">Tạp khuẩn</td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                name="soiTuoiTapKhuan"
                                className="form-input w-full text-xs font-bold text-sky-700 bg-sky-50/50 py-1 disabled:bg-slate-100"
                                value={formData.soiTuoiTapKhuan || ''}
                                onChange={handleInputChange}
                                disabled={isCompleted}
                                placeholder="Âm tính / + / ++..."
                              />
                            </td>
                            <td className="py-2 px-3 text-slate-600">Viêm do vi khuẩn</td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                name="soiTuoiGhiChuTapKhuan"
                                className="form-input w-full text-xs py-1 disabled:bg-slate-100"
                                value={formData.soiTuoiGhiChuTapKhuan || ''}
                                onChange={handleInputChange}
                                disabled={isCompleted}
                              />
                            </td>
                          </tr>

                          {/* Row 4: Tế bào biểu mô */}
                          <tr className="divide-x divide-slate-200 bg-slate-50/40 hover:bg-slate-50/80">
                            <td className="py-2 px-3 text-center font-bold text-slate-500">4</td>
                            <td className="py-2 px-3 font-bold text-slate-800">Tế bào biểu mô</td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                name="soiTuoiTeBaoBieuMo"
                                className="form-input w-full text-xs font-bold text-sky-700 bg-sky-50/50 py-1 disabled:bg-slate-100"
                                value={formData.soiTuoiTeBaoBieuMo || ''}
                                onChange={handleInputChange}
                                disabled={isCompleted}
                                placeholder="Ít / Vừa / Nhiều..."
                              />
                            </td>
                            <td className="py-2 px-3 text-slate-600">Đánh giá chất lượng mẫu</td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                name="soiTuoiGhiChuTeBaoBieuMo"
                                className="form-input w-full text-xs py-1 disabled:bg-slate-100"
                                value={formData.soiTuoiGhiChuTeBaoBieuMo || ''}
                                onChange={handleInputChange}
                                disabled={isCompleted}
                              />
                            </td>
                          </tr>

                          {/* Row 5: Trichomonas vaginalis */}
                          <tr className="divide-x divide-slate-200 hover:bg-slate-50/50">
                            <td className="py-2 px-3 text-center font-bold text-slate-500">5</td>
                            <td className="py-2 px-3 font-bold italic text-slate-800">Trichomonas vaginalis</td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                name="soiTuoiTrichomonas"
                                className="form-input w-full text-xs font-bold text-sky-700 bg-sky-50/50 py-1 disabled:bg-slate-100"
                                value={formData.soiTuoiTrichomonas || ''}
                                onChange={handleInputChange}
                                disabled={isCompleted}
                                placeholder="Âm tính / Dương tính..."
                              />
                            </td>
                            <td className="py-2 px-3 text-slate-600"></td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                name="soiTuoiGhiChuTrichomonas"
                                className="form-input w-full text-xs py-1 disabled:bg-slate-100"
                                value={formData.soiTuoiGhiChuTrichomonas || ''}
                                onChange={handleInputChange}
                                disabled={isCompleted}
                              />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Kết luận & Khuyến nghị */}
                    <div className="grid grid-cols-1 gap-4 pt-4 border-t border-slate-100">
                      <div className="form-group">
                        <label className="font-bold text-emerald-800">KẾT LUẬN *</label>
                        <textarea
                          name="ketLuan"
                          rows={3}
                          className="form-textarea font-bold text-emerald-900 bg-emerald-50/30 border-emerald-200 disabled:bg-slate-100 disabled:text-slate-600"
                          value={formData.ketLuan}
                          onChange={handleInputChange}
                          disabled={isCompleted}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="font-bold text-slate-700">KHUYẾN NGHỊ / ĐỀ NGHỊ</label>
                        <textarea
                          name="khuyenNghi"
                          rows={2}
                          className="form-textarea disabled:bg-slate-100 disabled:text-slate-600"
                          value={formData.khuyenNghi}
                          onChange={handleInputChange}
                          disabled={isCompleted}
                        />
                      </div>
                    </div>
                  </div>
                ) : formData.loaiXetNghiem === 'cell' || formData.loaiXetNghiem === 'thinprep' ? (
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
                        <label className={`radio-item ${formData.tinhChatBenhPham === 'dat' ? 'border-sky-500 bg-sky-50/60 ring-2 ring-sky-500/20' : ''}`}>
                          <input
                            type="radio"
                            name="tinhChatBenhPham"
                            value="dat"
                            checked={formData.tinhChatBenhPham === 'dat'}
                            onChange={handleInputChange}
                            disabled={isCompleted}
                          />
                          <span className="text-sm font-bold text-slate-800">Đạt tiêu chuẩn đánh giá</span>
                        </label>

                        <label className={`radio-item ${formData.tinhChatBenhPham === 'khongDat' ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20' : ''}`}>
                          <input
                            type="radio"
                            name="tinhChatBenhPham"
                            value="khongDat"
                            checked={formData.tinhChatBenhPham === 'khongDat'}
                            onChange={handleInputChange}
                            disabled={isCompleted}
                          />
                          <span className="text-sm font-bold text-slate-800">Không đạt tiêu chuẩn</span>
                        </label>
                      </div>

                      {formData.tinhChatBenhPham === 'khongDat' && (
                        <input
                          type="text"
                          name="lyDoKhongDat"
                          placeholder="Nhập lý do không đạt..."
                          className="form-input mt-2 text-xs"
                          value={formData.lyDoKhongDat}
                          onChange={handleInputChange}
                          disabled={isCompleted}
                        />
                      )}
                    </div>

                    {/* Checkbox Main 3 Categories */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <label className="checkbox-item">
                        <input
                          type="checkbox"
                          name="khongTonThuong"
                          checked={formData.khongTonThuong}
                          onChange={handleInputChange}
                          disabled={isCompleted}
                        />
                        <span className="text-xs font-bold text-slate-700">
                          Không tổn thương trong biểu mô hay ác tính
                        </span>
                      </label>

                      <label className="checkbox-item">
                        <input
                          type="checkbox"
                          name="batThuongKhac"
                          checked={formData.batThuongKhac}
                          onChange={handleInputChange}
                          disabled={isCompleted}
                        />
                        <span className="text-xs font-bold text-slate-700">Tế bào bất thường khác</span>
                      </label>

                      <label className="checkbox-item">
                        <input
                          type="checkbox"
                          name="teBaoNoiMac"
                          checked={formData.teBaoNoiMac}
                          onChange={handleInputChange}
                          disabled={isCompleted}
                        />
                        <span className="text-xs font-bold text-slate-700">
                          Tế bào nội mạc tử cung ở phụ nữ &ge; 45 tuổi
                        </span>
                      </label>
                    </div>

                    {/* Biến đổi vi sinh */}
                    <div className="mb-6">
                      <label className="block text-xs font-bold text-sky-800 uppercase tracking-wider mb-2">
                        BIẾN ĐỔI TẾ BÀO DO VI SINH VẬT
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {BIEN_DOI_VI_SINH_OPTIONS.map((opt) => (
                          <label key={opt.value} className="checkbox-item">
                            <input
                              type="checkbox"
                              checked={formData.bienDoiViSinh.includes(opt.value)}
                              onChange={() => handleArrayCheckbox('bienDoiViSinh', opt.value)}
                              disabled={isCompleted}
                            />
                            <span className={`text-xs font-medium ${opt.value === 'hpv' || opt.value === 'tapKhuan' ? '' : 'italic'}`}>
                              {opt.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Biến đổi tế bào khác */}
                    <div className="mb-6">
                      <label className="block text-xs font-bold text-sky-800 uppercase tracking-wider mb-2">
                        BIẾN ĐỔI TẾ BÀO KHÁC
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {BIEN_DOI_KHAC_OPTIONS.map((opt) => (
                          <label key={opt.value} className="checkbox-item">
                            <input
                              type="checkbox"
                              checked={formData.bienDoiKhac.includes(opt.value)}
                              onChange={() => handleArrayCheckbox('bienDoiKhac', opt.value)}
                              disabled={isCompleted}
                            />
                            <span className="text-xs">{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Bất thường tế bào vảy */}
                    <div className="mb-6">
                      <label className="block text-xs font-bold text-sky-800 uppercase tracking-wider mb-2">
                        BẤT THƯỜNG TẾ BÀO VẢY
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {BAT_THUONG_VAY_OPTIONS.map((opt) => (
                          <label key={opt.value} className="checkbox-item">
                            <input
                              type="checkbox"
                              checked={formData.batThuongVay.includes(opt.value)}
                              onChange={() => handleArrayCheckbox('batThuongVay', opt.value)}
                              disabled={isCompleted}
                            />
                            <span className="text-xs">{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Bất thường tế bào tuyến */}
                    <div className="mb-6">
                      <label className="block text-xs font-bold text-sky-800 uppercase tracking-wider mb-2">
                        BẤT THƯỜNG TẾ BÀO TUYẾN
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {BAT_THUONG_TUYEN_OPTIONS.map((opt) => (
                          <label key={opt.value} className="checkbox-item">
                            <input
                              type="checkbox"
                              checked={formData.batThuongTuyen.includes(opt.value)}
                              onChange={() => handleArrayCheckbox('batThuongTuyen', opt.value)}
                              disabled={isCompleted}
                            />
                            <span className="text-xs">{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>



                    {/* Kết luận & Khuyên nghị */}
                    <div className="grid grid-cols-1 gap-4 pt-4 border-t border-slate-100">
                      <div className="form-group">
                        <label className="font-bold text-sky-800">KẾT LUẬN *</label>
                        <textarea
                          name="ketLuan"
                          rows={3}
                          className="form-textarea font-bold text-sky-900 bg-sky-50/30 border-sky-200 disabled:bg-slate-100 disabled:text-slate-600"
                          value={formData.ketLuan}
                          onChange={handleInputChange}
                          disabled={isCompleted}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="font-bold text-slate-700">KHUYẾN NGHỊ / ĐỀ NGHỊ</label>
                        <textarea
                          name="khuyenNghi"
                          rows={2}
                          className="form-textarea disabled:bg-slate-100 disabled:text-slate-600"
                          value={formData.khuyenNghi}
                          onChange={handleInputChange}
                          disabled={isCompleted}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* HPV 40 / HPV 20 Types Form */
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
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                          <span className="text-xs font-bold text-red-700 uppercase block">
                            1. NHÓM HPV NGUY CƠ CAO (TYPE 16, 18)
                          </span>
                          <span className="text-xs text-slate-500">Khảo sát 2 chủng nguy cơ cao nhất: 16, 18</span>
                        </div>
                        <input
                          type="text"
                          name="hpvHighRiskResult"
                          className="form-input w-full sm:w-48 text-xs font-bold text-red-700 border-red-200 bg-red-50/50 disabled:bg-slate-100"
                          value={formData.hpvHighRiskResult}
                          onChange={handleInputChange}
                          disabled={isCompleted}
                          placeholder="Âm tính / Dương tính..."
                        />
                      </div>

                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                          <span className="text-xs font-bold text-red-700 uppercase block">
                            2. NHÓM HPV NGUY CƠ CAO KHÁC (16 TYPES)
                          </span>
                          <span className="text-xs text-slate-500">
                            Khảo sát 16 chủng: 26, 31, 33, 35, 39, 45, 51, 52, 53, 56, 58, 59, 66, 68, 73, 82
                          </span>
                        </div>
                        <input
                          type="text"
                          name="hpvHighRiskOtherResult"
                          className="form-input w-full sm:w-48 text-xs font-bold text-red-700 border-red-200 bg-red-50/50 disabled:bg-slate-100"
                          value={formData.hpvHighRiskOtherResult}
                          onChange={handleInputChange}
                          disabled={isCompleted}
                          placeholder="Âm tính / Dương tính..."
                        />
                      </div>

                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                          <span className="text-xs font-bold text-sky-700 uppercase block">
                            3. NHÓM HPV NGUY CƠ THẤP (2 TYPES)
                          </span>
                          <span className="text-xs text-slate-500">Khảo sát 2 chủng: 6, 11</span>
                        </div>
                        <input
                          type="text"
                          name="hpvLowRiskResult"
                          className="form-input w-full sm:w-48 text-xs font-bold text-sky-700 border-sky-200 bg-sky-50/50 disabled:bg-slate-100"
                          value={formData.hpvLowRiskResult}
                          onChange={handleInputChange}
                          disabled={isCompleted}
                          placeholder="Âm tính / Dương tính..."
                        />
                      </div>

                      {isHPV40 && (
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div>
                            <span className="text-xs font-bold text-slate-700 uppercase block">
                              4. CÁC TYPE HPV KHÁC (20 TYPES)
                            </span>
                            <span className="text-xs text-slate-500">
                              Khảo sát 20 chủng: 30, 32, 34, 40, 42, 43, 44, 54, 55, 61, 62, 67, 71, 72, 74, 81, 83, 84, 87, 90
                            </span>
                          </div>
                          <input
                            type="text"
                            name="hpvOtherTypesResult"
                            className="form-input w-full sm:w-48 text-xs font-bold text-slate-700 bg-white disabled:bg-slate-100"
                            value={formData.hpvOtherTypesResult}
                            onChange={handleInputChange}
                            disabled={isCompleted}
                            placeholder="Âm tính / Dương tính..."
                          />
                        </div>
                      )}
                    </div>



                    {/* Kết luận & Khuyến nghị */}
                    <div className="grid grid-cols-1 gap-4 pt-4 border-t border-slate-100">
                      <div className="form-group">
                        <label className="font-bold text-indigo-800">KẾT LUẬN *</label>
                        <textarea
                          name="ketLuan"
                          rows={3}
                          className="form-textarea font-bold text-indigo-900 bg-indigo-50/30 border-indigo-200 disabled:bg-slate-100 disabled:text-slate-600"
                          value={formData.ketLuan}
                          onChange={handleInputChange}
                          disabled={isCompleted}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="font-bold text-slate-700">KHUYẾN NGHỊ / ĐỀ NGHỊ</label>
                        <textarea
                          name="khuyenNghi"
                          rows={2}
                          className="form-textarea disabled:bg-slate-100 disabled:text-slate-600"
                          value={formData.khuyenNghi}
                          onChange={handleInputChange}
                          disabled={isCompleted}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Bác sĩ: Ngày XN + Lưu & Ký */}
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
                        {formData.daKy && (
                          <span className="ml-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                            <PenLine className="w-3 h-3" />
                            <span>ĐÃ KÝ</span>
                          </span>
                        )}
                      </div>

                      {(userRole === 'doctor' || userRole === 'admin' || userRole === 'lab_admin') && !isCompleted && (
                        formData.daKy ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleSave}
                              disabled={saving}
                              className="btn btn-primary"
                            >
                              <Save className="w-4 h-4" />
                              <span>{saving ? 'Đang lưu...' : 'Lưu cập nhật'}</span>
                            </button>
                            <button
                              onClick={() => setPdfPreviewUrl(`/api/test-results/${id}/export-pdf?mode=preview&t=${Date.now()}`)}
                              className="btn btn-secondary"
                            >
                              <Eye className="w-4 h-4" />
                              <span>Xem lại PDF</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={handleSign}
                            disabled={saving}
                            className="btn btn-success"
                          >
                            <PenLine className="w-4 h-4" />
                            <span>{saving ? 'Đang xử lý...' : 'Lưu kết quả và ký'}</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>

                {/* Preview PDF inline */}
                {pdfPreviewUrl && (
                  <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="flex items-center gap-2 text-base font-bold text-sky-700">
                        <Eye className="w-5 h-5 text-sky-600" />
                        <span>Xem trước PDF kết quả</span>
                      </h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => window.open(`/api/test-results/${id}/export-pdf`, '_blank')}
                          className="btn btn-primary text-xs"
                        >
                          <Download className="w-4 h-4" />
                          <span>Tải PDF</span>
                        </button>
                        <button
                          onClick={() => setPdfPreviewUrl('')}
                          className="btn btn-secondary text-xs"
                        >
                          <span>Đóng</span>
                        </button>
                      </div>
                    </div>
                    <iframe
                      src={pdfPreviewUrl}
                      className="w-full rounded-xl border border-slate-200"
                      style={{ height: '800px' }}
                      title="PDF Preview"
                    />
                  </div>
                )}

                {/* Section 3: Ảnh xét nghiệm & Trả kết quả */}
                {((userRole === 'admin' || userRole === 'lab_admin') || (formData.anhTeBao && isCompleted)) && (
                  <div className="glass-card p-6">
                    <h3 className="flex items-center gap-2 text-base font-bold text-sky-700 mb-4 pb-3 border-b border-slate-100">
                      <ImageIcon className="w-5 h-5 text-sky-600" />
                      <span>{isCompleted ? 'Ảnh xét nghiệm đã đính kèm' : 'Tải ảnh xét nghiệm & Trả kết quả'}</span>
                    </h3>

                    <div className="mb-4">
                      <FileUpload
                        accept="image/*"
                        label={isHPV ? 'Ảnh biểu đồ tín hiệu huỳnh quang Real-time PCR' : 'Ảnh tiêu bản tế bào học (Kính hiển vi / ThinPrep)'}
                        value={formData.anhTeBao}
                        isImage={true}
                        disabled={isCompleted}
                        onChange={handleImageUpload}
                      />
                    </div>

                    {!isCompleted && (userRole === 'admin' || userRole === 'lab_admin') && (
                      <div className="flex justify-center mt-4">
                        <button
                          onClick={handleDeliver}
                          disabled={saving}
                          className="btn btn-success px-8 py-2.5 text-sm font-bold shadow-md hover:shadow-lg transition-all"
                        >
                          <Send className="w-4 h-4" />
                          <span>{saving ? 'Đang xử lý...' : 'Trả kết quả'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Section 4: Lịch sử chỉnh sửa & Nhật ký hệ thống (Chỉ Admin thấy) */}
            {userRole === 'admin' && (
              <div className="glass-card p-6">
                <h3 className="flex items-center gap-2 text-base font-bold text-slate-800 mb-4 pb-3 border-b border-slate-100">
                  <FileCheck className="w-5 h-5 text-indigo-600" />
                  <span>Lịch sử chỉnh sửa & Nhật ký hệ thống</span>
                </h3>

                {(!formData.lichSuChinhSua || formData.lichSuChinhSua.length === 0) ? (
                  <p className="text-xs text-slate-400 py-4 text-center">Chưa có thông tin lịch sử chỉnh sửa.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold">
                          <th className="py-2.5 px-4">Người thực hiện</th>
                          <th className="py-2.5 px-4">Thời gian</th>
                          <th className="py-2.5 px-4">Nội dung thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {formData.lichSuChinhSua.map((log: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-2.5 px-4 font-bold text-slate-800 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                              <span>{log.nguoiSua}</span>
                            </td>
                            <td className="py-2.5 px-4 text-slate-500">
                              {new Date(log.thoiGian).toLocaleString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="py-2.5 px-4 text-sky-700 font-semibold">{log.noiDung}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* MODAL PHÂN CÔNG BÁC SĨ KHI NHẬN MẪU */}
      {showAcceptModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-base font-bold text-sky-800 flex items-center gap-2 pb-3 border-b border-slate-100">
              <FileCheck className="w-5 h-5 text-sky-600" />
              <span>Tiếp nhận mẫu & Phân công Bác sĩ</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Vui lòng chọn Bác sĩ sẽ phụ trách đọc và ký kết quả cho phiếu xét nghiệm <strong className="text-sky-700">{formData.maSo}</strong> ({formData.hoTen}):
            </p>

            <div className="form-group">
              <label className="block text-xs font-bold text-sky-800 mb-1.5">
                Bác sĩ đọc kết quả *
              </label>
              <select
                value={selectedDoctorForAccept}
                onChange={(e) => setSelectedDoctorForAccept(e.target.value)}
                className="form-select font-semibold border-sky-300 bg-sky-50/50 text-slate-800 text-xs w-full py-2"
              >
                <option value="">-- Chọn Bác sĩ đọc kết quả --</option>
                {doctors.map((doc) => (
                  <option key={doc._id} value={doc.fullName}>
                    {doc.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAcceptModal(false)}
                className="btn btn-secondary text-xs"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmAccept}
                disabled={saving || !selectedDoctorForAccept}
                className="btn btn-success text-xs"
              >
                {saving ? 'Đang xử lý...' : 'Xác nhận nhận mẫu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
