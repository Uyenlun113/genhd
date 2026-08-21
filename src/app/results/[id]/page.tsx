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
  Loader2,
  FileCheck,
  Dna,
  Lock,
  Clock,
  PenLine,
  Send,
  Eye,
  Activity,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
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
  const [showHpvSection, setShowHpvSection] = useState(true);
  const [showCellSection, setShowCellSection] = useState(true);
  const [showSoiTuoiSection, setShowSoiTuoiSection] = useState(true);
  const [showGpbSection, setShowGpbSection] = useState(true);
  const [doctors, setDoctors] = useState<Array<{ _id: string; fullName: string; allowedCategories?: string[] }>>([]);

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
    loaiXetNghiem: 'cell' as 'cell' | 'thinprep' | 'hpv40' | 'hpv20' | 'hpv23' | 'soituoi' | 'giaiphaubenh' | 'combo_hpv20_cell' | 'combo_hpv40_cell' | 'combo_hpv23_cell' | 'combo_hpv20_thinprep' | 'combo_hpv40_thinprep' | 'combo_hpv23_thinprep',
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
    ketLuan2: 'KHÔNG THẤY TẾ BÀO BẤT THƯỜNG TRÊN PHIẾN ĐỒ',
    khuyenNghi: '',
    ngayXetNghiem: new Date().toISOString().split('T')[0],
    ngayNhanMau: new Date().toISOString().split('T')[0],
    bacSiDoc: 'BS CK1 PHẠM THẾ HÙNG',
    bacSiDoc2: 'BS CK1 PHẠM THẾ HÙNG',
    trangThai: 'nhap_thong_tin',
    daKy: false,
    daKy2: false,
    anhTeBao: '',
    anhHpv: '',
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
        const isCombo = testType.startsWith('combo_');

        setFormData({
          ...data,
          loaiXetNghiem: testType,
          bacSiDoc: assignedDoctor,
          bacSiDoc2: data.bacSiDoc2 || assignedDoctor,
          daKy: data.daKy || false,
          daKy2: data.daKy2 || false,
          anhTeBao: data.anhTeBao || '',
          anhHpv: data.anhHpv || '',
          ketLuan: data.ketLuan || '',
          ketLuan2: data.ketLuan2 || '',
          ngayXetNghiem: data.ngayXetNghiem
            ? new Date(data.ngayXetNghiem).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          ngayNhanMau: data.ngayNhanMau
            ? new Date(data.ngayNhanMau).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
        });

        if (data.daKy || data.trangThai === 'da_tra_ket_qua') {
          setPdfPreviewUrl(`/api/test-results/${id}/export-pdf?mode=preview&t=${Date.now()}`);
        }
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

  const handleSignPart = async (part: 1 | 2) => {
    setSaving(true);
    try {
      const isPart1 = part === 1;
      const isCurrentlySigned = isPart1 ? formData.daKy : (isCombo ? formData.daKy2 : formData.daKy);
      const targetState = !isCurrentlySigned;

      const payload = {
        ...formData,
        part,
        [isPart1 ? 'daKy' : 'daKy2']: targetState,
      };

      const res = await fetch(`/api/test-results/${id}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const updated = await res.json();
        setFormData((prev) => ({
          ...prev,
          ...updated,
          daKy: isPart1 ? targetState : prev.daKy,
          daKy2: isPart1 ? prev.daKy2 : targetState,
        }));
        toast.success(
          targetState
            ? `Đã ký duyệt Phần ${part} thành công!`
            : `Đã hủy chữ ký Phần ${part}!`
        );
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
        body: JSON.stringify({ anhTeBao: formData.anhTeBao, anhHpv: formData.anhHpv }),
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

  const handleImageUploadPart = async (part: 1 | 2, base64OrUrl: string) => {
    const fieldName = part === 1 ? 'anhHpv' : 'anhTeBao';
    setFormData((prev) => ({ ...prev, [fieldName]: base64OrUrl }));
    try {
      const updatedData = { ...formData, [fieldName]: base64OrUrl };
      const res = await fetch(`/api/test-results/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      if (res.ok) {
        toast.success(
          base64OrUrl
            ? `Đã tải và lưu ảnh Phần ${part} thành công!`
            : `Đã xóa ảnh Phần ${part}!`
        );
        setPdfPreviewUrl(`/api/test-results/${id}/export-pdf?mode=preview&t=${Date.now()}`);
      }
    } catch (err) {
      console.error('Lỗi lưu ảnh:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex overflow-hidden h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          <TopHeader />
          <main className="flex-1 p-8 text-center text-slate-500">
            Đang tải thông tin phiếu...
          </main>
        </div>
      </div>
    );
  }

  const isCombo = formData.loaiXetNghiem.startsWith('combo_');
  const isHPV = formData.loaiXetNghiem === 'hpv40' || formData.loaiXetNghiem === 'hpv20' || formData.loaiXetNghiem === 'hpv23' || isCombo;
  const isHPV40 = formData.loaiXetNghiem === 'hpv40' || formData.loaiXetNghiem === 'combo_hpv40_cell' || formData.loaiXetNghiem === 'combo_hpv40_thinprep';
  const isHPV23 = formData.loaiXetNghiem === 'hpv23' || formData.loaiXetNghiem === 'combo_hpv23_cell' || formData.loaiXetNghiem === 'combo_hpv23_thinprep';
  const isThinPrep = formData.loaiXetNghiem === 'thinprep' || formData.loaiXetNghiem === 'combo_hpv20_thinprep' || formData.loaiXetNghiem === 'combo_hpv40_thinprep' || formData.loaiXetNghiem === 'combo_hpv23_thinprep';
  const isCell = formData.loaiXetNghiem === 'cell' || formData.loaiXetNghiem === 'combo_hpv20_cell' || formData.loaiXetNghiem === 'combo_hpv40_cell' || formData.loaiXetNghiem === 'combo_hpv23_cell';
  const isCompleted = formData.trangThai === 'da_tra_ket_qua';

  const type1 = formData.loaiXetNghiem.startsWith('combo_hpv20')
    ? 'hpv20'
    : formData.loaiXetNghiem.startsWith('combo_hpv40')
    ? 'hpv40'
    : formData.loaiXetNghiem.startsWith('combo_hpv23')
    ? 'hpv23'
    : formData.loaiXetNghiem;

  const type2 = formData.loaiXetNghiem.endsWith('_thinprep') ? 'thinprep' : 'cell';

  const isDoctorAllowed = (d: any, type: string) => {
    if (!d.allowedCategories || d.allowedCategories.length === 0) return true;
    if (d.allowedCategories.includes(type)) return true;
    if (type.startsWith('hpv') && (d.allowedCategories.includes('hpv20') || d.allowedCategories.includes('hpv23') || d.allowedCategories.includes('hpv40') || d.allowedCategories.includes('hpv'))) return true;
    return false;
  };

  const doctors1 = doctors.filter((d) => isDoctorAllowed(d, type1));
  const doctors2 = doctors.filter((d) => isDoctorAllowed(d, type2));

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <TopHeader />

        <main className="flex-1 p-6 md:p-8 w-full overflow-y-auto">
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
                : formData.loaiXetNghiem === 'hpv23'
                ? 'Mẫu HPV 23'
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

                {(formData.daKy || isCompleted) && (
                  <button
                    onClick={() => setPdfPreviewUrl(`/api/test-results/${id}/export-pdf?mode=preview&t=${Date.now()}`)}
                    className="btn btn-secondary flex items-center gap-1.5"
                  >
                    <Eye className="w-4 h-4 text-sky-600" />
                    <span>Xem trước PDF</span>
                  </button>
                )}

                {formData.trangThai === 'da_tra_ket_qua' && (
                  <>
                    <button onClick={handleSave} disabled={saving} className="btn btn-primary flex items-center gap-1.5">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span>Lưu thay đổi</span>
                    </button>
                    <button onClick={handleExportPDF} className="btn btn-secondary flex items-center gap-1.5">
                      <Download className="w-4 h-4" />
                      <span>Download PDF kết quả</span>
                    </button>
                  </>
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
                    disabled={userRole === 'doctor'}
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
                    disabled={userRole === 'doctor'}
                  />
                </div>

                <div className="form-group">
                  <label>Giới tính</label>
                  <select
                    name="gioiTinh"
                    className="form-select disabled:bg-slate-100 disabled:text-slate-600"
                    value={formData.gioiTinh}
                    onChange={handleInputChange}
                    disabled={userRole === 'doctor'}
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
                    disabled={userRole === 'doctor'}
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
                    disabled={userRole === 'doctor'}
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
                    disabled={userRole === 'doctor'}
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
                    disabled={userRole === 'doctor'}
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
                    disabled={userRole === 'doctor'}
                  />
                </div>

                <div className="form-group">
                  <label className="font-bold text-slate-700 text-xs">Ngày nhận mẫu</label>
                  <input
                    type="date"
                    name="ngayNhanMau"
                    className="form-input text-xs disabled:bg-slate-100 disabled:text-slate-600"
                    value={formData.ngayNhanMau}
                    onChange={handleInputChange}
                    disabled={userRole === 'doctor'}
                  />
                </div>

                {isCombo ? (
                  <>
                    <div className="form-group sm:col-span-2">
                      <label className="font-bold text-sky-700 text-xs">
                        Bác sĩ đọc kết quả cho Phiếu 1 ({type1.toUpperCase()}) *
                      </label>
                      <select
                        name="bacSiDoc"
                        className="form-select text-xs font-semibold border-sky-300 bg-sky-50/50 text-slate-800 disabled:bg-slate-100 disabled:text-slate-600"
                        value={formData.bacSiDoc}
                        onChange={handleInputChange}
                        disabled={userRole === 'doctor'}
                        required
                      >
                        <option value="Chưa phân loại">-- Chưa phân loại (Tạo phiếu nháp) --</option>
                        {doctors1.map((doc) => (
                          <option key={doc._id} value={doc.fullName}>
                            {doc.fullName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group sm:col-span-2">
                      <label className="font-bold text-purple-700 text-xs">
                        Bác sĩ đọc kết quả cho Phiếu 2 ({type2.toUpperCase()}) *
                      </label>
                      <select
                        name="bacSiDoc2"
                        className="form-select text-xs font-semibold border-purple-300 bg-purple-50/50 text-slate-800 disabled:bg-slate-100 disabled:text-slate-600"
                        value={formData.bacSiDoc2 || formData.bacSiDoc}
                        onChange={handleInputChange}
                        disabled={userRole === 'doctor'}
                        required
                      >
                        <option value="Chưa phân loại">-- Chưa phân loại (Tạo phiếu nháp) --</option>
                        {doctors2.map((doc) => (
                          <option key={doc._id} value={doc.fullName}>
                            {doc.fullName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : (
                  <div className="form-group sm:col-span-2">
                    <label className="font-bold text-sky-700 text-xs">Bác sĩ đọc kết quả (Gán phiếu) *</label>
                    <select
                      name="bacSiDoc"
                      className="form-select text-xs font-semibold border-sky-300 bg-sky-50/50 text-slate-800 disabled:bg-slate-100 disabled:text-slate-600"
                      value={formData.bacSiDoc}
                      onChange={handleInputChange}
                      disabled={userRole === 'doctor'}
                      required
                    >
                      <option value="Chưa phân loại">-- Chưa phân loại (Tạo phiếu nháp) --</option>
                      {doctors1.map((doc) => (
                        <option key={doc._id} value={doc.fullName}>
                          {doc.fullName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {userRole === 'doctor' ? (
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 inline-flex items-center gap-1.5">
                    <Lock className='inline-block w-4 h-4' /> Thông tin hành chính bệnh nhân được khóa đối với tài khoản Bác sĩ đọc.
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
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPdfPreviewUrl(`/api/test-results/${id}/export-pdf?mode=preview&t=${Date.now()}`)}
                        className="btn btn-secondary text-xs flex items-center gap-1.5"
                      >
                        <Eye className="w-4 h-4 text-sky-600" />
                        <span>Xem trước PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleExportPDF}
                        className="btn btn-primary text-xs flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Tải kết quả PDF</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {formData.loaiXetNghiem === 'giaiphaubenh' ? (
                  /* GIẢI PHẪU BỆNH Form */
                  <div className="glass-card p-6">
                    <h3
                      onClick={() => setShowGpbSection(!showGpbSection)}
                      className="flex items-center justify-between text-base font-bold text-amber-700 cursor-pointer select-none mb-5 pb-3 border-b border-slate-100 hover:opacity-80 transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-amber-600" />
                        <span>KẾT QUẢ XÉT NGHIỆM GIẢI PHẪU BỆNH</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {isCompleted && (
                          <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5" />
                            <span>ĐÃ TRẢ KẾT QUẢ</span>
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowGpbSection(!showGpbSection);
                          }}
                          className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-all flex items-center gap-1 text-xs font-semibold cursor-pointer"
                        >
                          <span>{showGpbSection ? 'Thu gọn' : 'Mở rộng'}</span>
                          {showGpbSection ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </div>
                    </h3>

                    {showGpbSection && (
                      <div className="space-y-6">
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
                              disabled={false}
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
                              disabled={false}
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
                              disabled={false}
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
                              disabled={false}
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
                              disabled={false}
                              required
                            />
                          </div>
                        </div>

                        {/* THÔNG TIN BÁC SĨ ĐỌC & KÝ DUYỆT TRỰC TIẾP CHO PHẦN GIẢI PHẪU BỆNH */}
                        <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div>
                              <span className="text-xs text-amber-800 font-bold block mb-1">
                                Bác sĩ đọc kết quả:
                              </span>
                              {userRole === 'admin' || userRole === 'lab_admin' ? (
                                <select
                                  name="bacSiDoc"
                                  value={formData.bacSiDoc}
                                  onChange={handleInputChange}
                                  className="form-select text-xs py-1.5 px-3 font-bold text-amber-700 rounded-lg border-amber-300 bg-white shadow-2xs"
                                >
                                  {doctors1.map((d) => (
                                    <option key={d._id} value={d.fullName}>
                                      {d.fullName}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="text-xs font-bold text-amber-800">{formData.bacSiDoc || 'Chưa gán'}</span>
                              )}
                            </div>

                            {formData.daKy && (
                              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300 inline-flex items-center gap-1">
                                <PenLine className="w-3.5 h-3.5 text-emerald-600" />
                                <span>ĐÃ KÝ DUYỆT</span>
                              </span>
                            )}
                          </div>

                          {(userRole === 'doctor' || userRole === 'admin' || userRole === 'lab_admin') && !isCompleted && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving}
                                className="btn btn-secondary text-xs py-1.5 px-3"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>{saving ? 'Đang lưu...' : 'Lưu kết quả GPB'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSignPart(1)}
                                disabled={saving}
                                className={`btn text-xs py-1.5 px-3.5 font-bold transition-all shadow-sm ${
                                  formData.daKy
                                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                                }`}
                              >
                                <PenLine className="w-3.5 h-3.5" />
                                <span>{formData.daKy ? 'Hủy chữ ký GPB' : 'Lưu & Ký duyệt (GPB)'}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : formData.loaiXetNghiem === 'soituoi' ? (
                  /* SOI TƯƠI Form */
                  <div className="glass-card p-6">
                    <h3
                      onClick={() => setShowSoiTuoiSection(!showSoiTuoiSection)}
                      className="flex items-center justify-between text-base font-bold text-emerald-700 cursor-pointer select-none mb-5 pb-3 border-b border-slate-100 hover:opacity-80 transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-emerald-600" />
                        <span>KẾT QUẢ XÉT NGHIỆM SOI TƯƠI DỊCH</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {isCompleted && (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5" />
                            <span>ĐÃ TRẢ KẾT QUẢ</span>
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowSoiTuoiSection(!showSoiTuoiSection);
                          }}
                          className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-all flex items-center gap-1 text-xs font-semibold cursor-pointer"
                        >
                          <span>{showSoiTuoiSection ? 'Thu gọn' : 'Mở rộng'}</span>
                          {showSoiTuoiSection ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </div>
                    </h3>

                    {showSoiTuoiSection && (
                      <>
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
                          disabled={false}
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
                          disabled={false}
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
                                disabled={false}
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
                                disabled={false}
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
                                disabled={false}
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
                                disabled={false}
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
                                disabled={false}
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
                                disabled={false}
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
                                disabled={false}
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
                                disabled={false}
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
                                disabled={false}
                                placeholder="Âm tính / Dương tính..."
                              />
                            </td>
                            <td className="py-2 px-3 text-slate-600">Đánh giá sơ bộ sự xuất hiện của trùng roi</td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                name="soiTuoiGhiChuTrichomonas"
                                className="form-input w-full text-xs py-1 disabled:bg-slate-100"
                                value={formData.soiTuoiGhiChuTrichomonas || ''}
                                onChange={handleInputChange}
                                disabled={false}
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
                          disabled={false}
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
                          disabled={false}
                        />
                      </div>
                    </div>

                    {/* THÔNG TIN BÁC SĨ ĐỌC & KÝ DUYỆT TRỰC TIẾP CHO PHẦN SOI TƯƠI */}
                    <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 flex flex-wrap items-center justify-between gap-4 mt-6">
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-xs text-emerald-800 font-bold block mb-1">
                            Bác sĩ đọc kết quả:
                          </span>
                          {userRole === 'admin' || userRole === 'lab_admin' ? (
                            <select
                              name="bacSiDoc"
                              value={formData.bacSiDoc}
                              onChange={handleInputChange}
                              className="form-select text-xs py-1.5 px-3 font-bold text-emerald-700 rounded-lg border-emerald-300 bg-white shadow-2xs"
                            >
                              {doctors1.map((d) => (
                                <option key={d._id} value={d.fullName}>
                                  {d.fullName}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-xs font-bold text-emerald-800">{formData.bacSiDoc || 'Chưa gán'}</span>
                          )}
                        </div>

                        {formData.daKy && (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300 inline-flex items-center gap-1">
                            <PenLine className="w-3.5 h-3.5 text-emerald-600" />
                            <span>ĐÃ KÝ DUYỆT</span>
                          </span>
                        )}
                      </div>

                      {(userRole === 'doctor' || userRole === 'admin' || userRole === 'lab_admin') && !isCompleted && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="btn btn-secondary text-xs py-1.5 px-3"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>{saving ? 'Đang lưu...' : 'Lưu kết quả Soi tươi'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSignPart(1)}
                            disabled={saving}
                            className={`btn text-xs py-1.5 px-3.5 font-bold transition-all shadow-sm ${
                              formData.daKy
                                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                            }`}
                          >
                            <PenLine className="w-3.5 h-3.5" />
                            <span>{formData.daKy ? 'Hủy chữ ký Soi tươi' : 'Lưu & Ký duyệt (Soi tươi)'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ) : (
                  <>
                    {/* Render HPV Form if HPV or Combo */}
                    {isHPV && (
                      <div className="glass-card p-6 mb-6">
                        <h3
                          onClick={() => setShowHpvSection(!showHpvSection)}
                          className="flex items-center justify-between text-base font-bold text-indigo-700 cursor-pointer select-none mb-5 pb-3 border-b border-slate-100 hover:opacity-80 transition-all"
                        >
                          <div className="flex items-center gap-2">
                            <Dna className="w-5 h-5 text-indigo-600" />
                            <span>
                              KẾT QUẢ XÉT NGHIỆM {isHPV40 ? 'HPV 40 TYPES' : isHPV23 ? 'HPV 23 TYPES' : 'HPV 20 TYPES'} (REAL-TIME PCR)
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            {isCompleted && (
                              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                                <Lock className="w-3.5 h-3.5" />
                                <span>ĐÃ TRẢ KẾT QUẢ</span>
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowHpvSection(!showHpvSection);
                              }}
                              className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-all flex items-center gap-1 text-xs font-semibold cursor-pointer"
                            >
                              <span>{showHpvSection ? 'Thu gọn' : 'Mở rộng'}</span>
                              {showHpvSection ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </button>
                          </div>
                        </h3>

                        {showHpvSection && (
                          <>
                            <div className="space-y-4 mb-6">
                          {/* Row 1: High Risk 16, 18 */}
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
                              disabled={false}
                              placeholder="Âm tính / Dương tính..."
                            />
                          </div>

                          {/* Row 2: High Risk Others */}
                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div>
                              <span className="text-xs font-bold text-red-700 uppercase block">
                                2. NHÓM HPV NGUY CƠ CAO KHÁC ({isHPV23 ? '10 TYPES' : '16 TYPES'})
                              </span>
                              <span className="text-xs text-slate-500">
                                {isHPV23
                                  ? 'Khảo sát 10 chủng: 31, 33, 35, 39, 45, 51, 52, 56, 58, 59'
                                  : 'Khảo sát 16 chủng: 26, 31, 33, 35, 39, 45, 51, 52, 53, 56, 58, 59, 66, 68, 73, 82'}
                              </span>
                            </div>
                            <input
                              type="text"
                              name="hpvHighRiskOtherResult"
                              className="form-input w-full sm:w-48 text-xs font-bold text-red-700 border-red-200 bg-red-50/50 disabled:bg-slate-100"
                              value={formData.hpvHighRiskOtherResult}
                              onChange={handleInputChange}
                              disabled={false}
                              placeholder="Âm tính / Dương tính..."
                            />
                          </div>

                          {/* If HPV 23: Row 3 is Other Types (9 Types) */}
                          {isHPV23 && (
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                              <div>
                                <span className="text-xs font-bold text-red-700 uppercase block">
                                  3. CÁC TYPE HPV KHÁC (9 TYPES)
                                </span>
                                <span className="text-xs text-slate-500">
                                  Khảo sát 9 chủng: 66, 68, 42, 43, 44, 53, 81, 82, 73
                                </span>
                              </div>
                              <input
                                type="text"
                                name="hpvOtherTypesResult"
                                className="form-input w-full sm:w-48 text-xs font-bold text-red-700 border-red-200 bg-red-50/50 disabled:bg-slate-100"
                                value={formData.hpvOtherTypesResult}
                                onChange={handleInputChange}
                                disabled={false}
                                placeholder="Âm tính / Dương tính..."
                              />
                            </div>
                          )}

                          {/* Low Risk 6, 11 */}
                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div>
                              <span className="text-xs font-bold text-sky-700 uppercase block">
                                {isHPV23 ? '4. NHÓM HPV NGUY CƠ THẤP (2 TYPES)' : '3. NHÓM HPV NGUY CƠ THẤP (2 TYPES)'}
                              </span>
                              <span className="text-xs text-slate-500">Khảo sát 2 chủng: 6, 11</span>
                            </div>
                            <input
                              type="text"
                              name="hpvLowRiskResult"
                              className="form-input w-full sm:w-48 text-xs font-bold text-sky-700 border-sky-200 bg-sky-50/50 disabled:bg-slate-100"
                              value={formData.hpvLowRiskResult}
                              onChange={handleInputChange}
                              disabled={false}
                              placeholder="Âm tính / Dương tính..."
                            />
                          </div>

                          {/* If HPV 40: 20 Other Types */}
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
                                disabled={false}
                                placeholder="Âm tính / Dương tính..."
                              />
                            </div>
                          )}
                        </div>

                        {/* Kết luận & Khuyến nghị HPV */}
                        <div className="grid grid-cols-1 gap-4 pt-4 border-t border-slate-100 mb-6">
                          <div className="form-group">
                            <label className="font-bold text-indigo-800 text-xs">KẾT LUẬN XÉT NGHIỆM HPV *</label>
                            <textarea
                              name="ketLuan"
                              rows={2}
                              className="form-textarea font-bold text-indigo-900 bg-indigo-50/40 border-indigo-200 text-xs disabled:bg-slate-100"
                              value={formData.ketLuan}
                              onChange={handleInputChange}
                              disabled={false}
                              required
                            />
                          </div>

                          <div className="form-group">
                            <label className="font-bold text-slate-700 text-xs">KHUYẾN NGHỊ / ĐỀ NGHỊ</label>
                            <textarea
                              name="khuyenNghi"
                              rows={2}
                              className="form-textarea text-xs disabled:bg-slate-100"
                              value={formData.khuyenNghi}
                              onChange={handleInputChange}
                              disabled={false}
                            />
                          </div>
                        </div>

                        {/* Ảnh đính kèm biểu đồ PCR */}
                        <div className="pt-4 border-t border-slate-100 mb-6">
                          <label className="font-bold text-slate-700 text-xs mb-2 block flex items-center gap-1.5">
                            <ImageIcon className="w-4 h-4 text-sky-600" />
                            <span>Ảnh biểu đồ tín hiệu huỳnh quang Real-time PCR / Tiêu bản</span>
                          </label>
                          <FileUpload
                            accept="image/*"
                            label="Tải ảnh biểu đồ PCR"
                            value={formData.anhHpv}
                            isImage={true}
                            disabled={false}
                            onChange={(url) => handleImageUploadPart(1, url)}
                          />
                        </div>

                        {/* THÔNG TIN BÁC SĨ ĐỌC & KÝ DUYỆT TRỰC TIẾP CHO PHẦN HPV */}
                        <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-200 flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div>
                              <span className="text-xs text-indigo-800 font-bold block mb-1">
                                {isCombo ? 'Bác sĩ đọc HPV (Phần 1):' : 'Bác sĩ đọc kết quả:'}
                              </span>
                              {userRole === 'admin' || userRole === 'lab_admin' ? (
                                <select
                                  name="bacSiDoc"
                                  value={formData.bacSiDoc}
                                  onChange={handleInputChange}
                                  className="form-select text-xs py-1.5 px-3 font-bold text-sky-700 rounded-lg border-sky-300 bg-white shadow-2xs"
                                >
                                  {doctors1.map((d) => (
                                    <option key={d._id} value={d.fullName}>
                                      {d.fullName}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="text-xs font-bold text-sky-800">{formData.bacSiDoc || 'Chưa gán'}</span>
                              )}
                            </div>

                            {formData.daKy && (
                              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300 inline-flex items-center gap-1">
                                <PenLine className="w-3.5 h-3.5 text-emerald-600" />
                                <span>ĐÃ KÝ DUYỆT</span>
                              </span>
                            )}
                          </div>

                          {(userRole === 'doctor' || userRole === 'admin' || userRole === 'lab_admin') && !isCompleted && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving}
                                className="btn btn-secondary text-xs py-1.5 px-3"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>{saving ? 'Đang lưu...' : 'Lưu kết quả HPV'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSignPart(1)}
                                disabled={saving}
                                className={`btn text-xs py-1.5 px-3.5 font-bold transition-all shadow-sm ${
                                  formData.daKy
                                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                                }`}
                              >
                                <PenLine className="w-3.5 h-3.5" />
                                <span>{formData.daKy ? 'Hủy chữ ký P1' : 'Lưu & Ký duyệt P1 (HPV)'}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                    {/* Render Cell / ThinPrep Form if Cell/ThinPrep or Combo */}
                    {(isCell || isThinPrep) && (
                      <div className="glass-card p-6">
                        <h3
                          onClick={() => setShowCellSection(!showCellSection)}
                          className="flex items-center justify-between text-base font-bold text-sky-700 cursor-pointer select-none mb-5 pb-3 border-b border-slate-100 hover:opacity-80 transition-all"
                        >
                          <div className="flex items-center gap-2">
                            <FlaskConical className="w-5 h-5 text-sky-600" />
                            <span>KẾT QUẢ TẾ BÀO HỌC CỔ TỬ CUNG ({isThinPrep ? 'THINPREP' : 'BETHESDA 2014'})</span>
                          </div>
                          <div className="flex items-center gap-3">
                            {isCompleted && (
                              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                                <Lock className="w-3.5 h-3.5" />
                                <span>ĐÃ TRẢ KẾT QUẢ</span>
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowCellSection(!showCellSection);
                              }}
                              className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-all flex items-center gap-1 text-xs font-semibold cursor-pointer"
                            >
                              <span>{showCellSection ? 'Thu gọn' : 'Mở rộng'}</span>
                              {showCellSection ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </button>
                          </div>
                        </h3>

                        {showCellSection && (
                          <>
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
                                disabled={false}
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
                                disabled={false}
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
                              disabled={false}
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
                              disabled={false}
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
                              disabled={false}
                            />
                            <span className="text-xs font-bold text-slate-700">Tế bào bất thường khác</span>
                          </label>

                          <label className="checkbox-item">
                            <input
                              type="checkbox"
                              name="teBaoNoiMac"
                              checked={formData.teBaoNoiMac}
                              onChange={handleInputChange}
                              disabled={false}
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
                                  disabled={false}
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
                                  disabled={false}
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
                                  disabled={false}
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
                                  disabled={false}
                                />
                                <span className="text-xs">{opt.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Kết luận & Khuyến nghị */}
                        <div className="grid grid-cols-1 gap-4 pt-4 border-t border-slate-100 mb-6">
                          <div className="form-group">
                            <label className="font-bold text-sky-800 text-xs">KẾT LUẬN TẾ BÀO HỌC *</label>
                            <textarea
                              name={isCombo ? "ketLuan2" : "ketLuan"}
                              rows={3}
                              className="form-textarea font-bold text-sky-900 bg-sky-50/30 border-sky-200 text-xs disabled:bg-slate-100"
                              value={isCombo ? (formData.ketLuan2 || '') : formData.ketLuan}
                              onChange={handleInputChange}
                              disabled={false}
                              required
                            />
                          </div>

                          <div className="form-group">
                            <label className="font-bold text-slate-700 text-xs">KHUYẾN NGHỊ / ĐỀ NGHỊ</label>
                            <textarea
                              name="khuyenNghi"
                              rows={2}
                              className="form-textarea text-xs disabled:bg-slate-100"
                              value={formData.khuyenNghi}
                              onChange={handleInputChange}
                              disabled={false}
                            />
                          </div>
                        </div>

                        {/* Ảnh đính kèm tiêu bản tế bào */}
                        <div className="pt-4 border-t border-slate-100 mb-6">
                          <label className="font-bold text-slate-700 text-xs mb-2 block flex items-center gap-1.5">
                            <ImageIcon className="w-4 h-4 text-sky-600" />
                            <span>Ảnh tiêu bản tế bào học (Kính hiển vi / ThinPrep)</span>
                          </label>
                          <FileUpload
                            accept="image/*"
                            label="Tải ảnh tiêu bản tế bào"
                            value={formData.anhTeBao}
                            isImage={true}
                            disabled={false}
                            onChange={(url) => handleImageUploadPart(2, url)}
                          />
                        </div>

                        {/* THÔNG TIN BÁC SĨ ĐỌC & KÝ DUYỆT TRỰC TIẾP CHO PHẦN TẾ BÀO */}
                        <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-200 flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div>
                              <span className="text-xs text-purple-800 font-bold block mb-1">
                                {isCombo ? 'Bác sĩ đọc Tế bào (Phần 2):' : 'Bác sĩ đọc kết quả:'}
                              </span>
                              {userRole === 'admin' || userRole === 'lab_admin' ? (
                                <select
                                  name="bacSiDoc2"
                                  value={formData.bacSiDoc2 || formData.bacSiDoc}
                                  onChange={handleInputChange}
                                  className="form-select text-xs py-1.5 px-3 font-bold text-purple-700 rounded-lg border-purple-300 bg-white shadow-2xs"
                                >
                                  {doctors2.map((d) => (
                                    <option key={d._id} value={d.fullName}>
                                      {d.fullName}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="text-xs font-bold text-purple-800">{formData.bacSiDoc2 || formData.bacSiDoc || 'Chưa gán'}</span>
                              )}
                            </div>

                            {(isCombo ? formData.daKy2 : formData.daKy) && (
                              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300 inline-flex items-center gap-1">
                                <PenLine className="w-3.5 h-3.5 text-emerald-600" />
                                <span>ĐÃ KÝ DUYỆT</span>
                              </span>
                            )}
                          </div>

                          {(userRole === 'doctor' || userRole === 'admin' || userRole === 'lab_admin') && !isCompleted && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving}
                                className="btn btn-secondary text-xs py-1.5 px-3"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>{saving ? 'Đang lưu...' : 'Lưu kết quả Tế bào'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSignPart(isCombo ? 2 : 1)}
                                disabled={saving}
                                className={`btn text-xs py-1.5 px-3.5 font-bold transition-all shadow-sm ${
                                  (isCombo ? formData.daKy2 : formData.daKy)
                                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                                }`}
                              >
                                <PenLine className="w-3.5 h-3.5" />
                                <span>{(isCombo ? formData.daKy2 : formData.daKy) ? 'Hủy chữ ký P2' : 'Lưu & Ký duyệt P2 (Tế bào)'}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
                  </>
                )}

                {/* BOTTOM ACTION BAR - ONLY PREVIEW & DELIVER */}
                <div className="glass-card p-5 mt-6 flex flex-wrap items-center justify-between gap-4 sticky bottom-4 shadow-xl border-sky-100 bg-white/95 backdrop-blur-md z-30">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 font-medium">Trạng thái phiếu:</span>
                    <StatusBadge status={formData.trangThai} />
                    {isCombo ? (
                      <div className="flex items-center gap-2">
                        {formData.daKy && (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 inline-flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Đã ký P1</span>
                          </span>
                        )}
                        {formData.daKy2 && (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 inline-flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Đã ký P2</span>
                          </span>
                        )}
                      </div>
                    ) : (
                      formData.daKy && (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 inline-flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Đã ký duyệt</span>
                        </span>
                      )
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {(userRole === 'admin' || userRole === 'staff' || userRole === 'lab_admin') &&
                      formData.trangThai !== 'da_tra_ket_qua' && (
                        <button
                          type="button"
                          onClick={handleDeliver}
                          disabled={saving}
                          className="btn btn-success text-xs font-bold py-2 px-4 shadow-md flex items-center gap-1.5 cursor-pointer"
                        >
                          <Send className="w-4 h-4" />
                          <span>{saving ? 'Đang xử lý...' : 'Xác nhận Trả kết quả'}</span>
                        </button>
                      )}

                    <button
                      type="button"
                      onClick={() => setPdfPreviewUrl(`/api/test-results/${id}/export-pdf?mode=preview&t=${Date.now()}`)}
                      className="btn btn-secondary text-xs font-bold py-2 px-4 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-4 h-4 text-sky-600" />
                      <span>Xem lại PDF</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => window.open(`/api/test-results/${id}/export-pdf`, '_blank')}
                      className="btn btn-primary text-xs font-bold py-2 px-4 flex items-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Tải xuống PDF</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Preview PDF inline (Available for ALL ROLES including Staff) */}
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
