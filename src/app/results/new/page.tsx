'use client';

import React, { useState, useEffect, Suspense } from 'react';
import TopHeader from '@/components/TopHeader';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserPlus, ArrowLeft, Save, Sparkles, Check, Flame } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';

interface DoctorUser {
  _id: string;
  fullName: string;
  allowedCategories?: string[];
}

interface ServiceOption {
  id: string;
  label: string;
  isCombo: boolean;
  types: string[];
}

const SINGLE_SERVICE_OPTIONS: ServiceOption[] = [
  { id: 'cell', label: 'Cell', isCombo: false, types: ['cell'] },
  { id: 'thinprep', label: 'ThinPrep', isCombo: false, types: ['thinprep'] },
  { id: 'hpv40', label: 'HPV 40', isCombo: false, types: ['hpv40'] },
  { id: 'hpv20', label: 'HPV 20', isCombo: false, types: ['hpv20'] },
  { id: 'hpv23', label: 'HPV 23', isCombo: false, types: ['hpv23'] },
  { id: 'soituoi', label: 'Soi tươi', isCombo: false, types: ['soituoi'] },
  { id: 'giaiphaubenh', label: 'Giải Phẫu Bệnh', isCombo: false, types: ['giaiphaubenh'] },
];

const COMBO_SERVICE_OPTIONS: ServiceOption[] = [
  { id: 'combo_hpv20_cell', label: 'Gói Combo: HPV 20 + Cell', isCombo: true, types: ['hpv20', 'cell'] },
  { id: 'combo_hpv40_cell', label: 'Gói Combo: HPV 40 + Cell', isCombo: true, types: ['hpv40', 'cell'] },
  { id: 'combo_hpv23_cell', label: 'Gói Combo: HPV 23 + Cell', isCombo: true, types: ['hpv23', 'cell'] },
  { id: 'combo_hpv20_thinprep', label: 'Gói Combo: HPV 20 + ThinPrep', isCombo: true, types: ['hpv20', 'thinprep'] },
  { id: 'combo_hpv40_thinprep', label: 'Gói Combo: HPV 40 + ThinPrep', isCombo: true, types: ['hpv40', 'thinprep'] },
  { id: 'combo_hpv23_thinprep', label: 'Gói Combo: HPV 23 + ThinPrep', isCombo: true, types: ['hpv23', 'thinprep'] },
];

function NewResultFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramType = searchParams.get('type') || 'cell';

  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const userName = session?.user?.name;

  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<DoctorUser[]>([]);

  // Service mode state:
  // If true => Combo mode (single combo package chosen)
  // If false => Single Services mode (can choose 1 or MULTIPLE single services simultaneously!)
  const [isComboMode, setIsComboMode] = useState<boolean>(paramType.startsWith('combo_'));
  const [selectedComboId, setSelectedComboId] = useState<string>(paramType.startsWith('combo_') ? paramType : 'combo_hpv20_cell');
  const [selectedSingleServices, setSelectedSingleServices] = useState<string[]>(!paramType.startsWith('combo_') ? [paramType] : ['cell']);

  const [bacSiDoc1, setBacSiDoc1] = useState('Chưa phân loại');
  const [bacSiDoc2, setBacSiDoc2] = useState('Chưa phân loại');

  const [formData, setFormData] = useState({
    hoTen: '',
    namSinh: '',
    gioiTinh: 'Nữ',
    diaChi: '',
    soDienThoai: '',
    loaiMau: 'Dịch phết',
    donVi: '',
    bacSiChiDinh: '',
    chanDoanLamSang: '',
    nhanXetDaiThe: '',
    viTriBenhPham: '',
    ngayNhanMau: new Date().toISOString().split('T')[0],
  });

  const hasCategoryPermission = (cat: string) => {
    if (userRole === 'admin' || userRole === 'lab_admin') return true;
    const userAllowed: string[] = (session?.user as any)?.allowedCategories || [];
    return userAllowed.includes(cat);
  };

  const availableSingleServices = SINGLE_SERVICE_OPTIONS.filter((opt) => {
    if (userRole === 'admin' || userRole === 'lab_admin') return true;
    const userAllowed: string[] = (session?.user as any)?.allowedCategories || [];
    return userAllowed.includes(opt.id) || opt.types.some((t) => hasCategoryPermission(t));
  });

  const availableComboServices = COMBO_SERVICE_OPTIONS.filter((opt) => {
    if (userRole === 'admin' || userRole === 'lab_admin') return true;
    const userAllowed: string[] = (session?.user as any)?.allowedCategories || [];
    return userAllowed.includes(opt.id) || opt.types.some((t) => hasCategoryPermission(t));
  });

  const selectedComboObj =
    availableComboServices.find((s) => s.id === selectedComboId) ||
    availableComboServices[0] ||
    COMBO_SERVICE_OPTIONS[0];

  const type1 = isComboMode ? selectedComboObj.types[0] || 'cell' : selectedSingleServices[0] || 'cell';
  const type2 = isComboMode ? selectedComboObj.types[1] || 'cell' : 'cell';

  const isDoctorAllowed = (d: DoctorUser, type: string) => {
    if (!d.allowedCategories || d.allowedCategories.length === 0) return true;
    if (d.allowedCategories.includes(type)) return true;
    if (type.startsWith('hpv') && (d.allowedCategories.includes('hpv20') || d.allowedCategories.includes('hpv23') || d.allowedCategories.includes('hpv40') || d.allowedCategories.includes('hpv'))) return true;
    return false;
  };

  const doctors1 = doctors.filter((d) => isDoctorAllowed(d, type1));
  const doctors2 = doctors.filter((d) => isDoctorAllowed(d, type2));

  useEffect(() => {
    const urlType = searchParams.get('type');
    if (urlType) {
      if (urlType.startsWith('combo_')) {
        setIsComboMode(true);
        setSelectedComboId(urlType);
      } else {
        setIsComboMode(false);
        setSelectedSingleServices([urlType]);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    async function fetchDoctors() {
      try {
        const res = await fetch('/api/users?role=doctor');
        if (res.ok) {
          const data = await res.json();
          const list: DoctorUser[] = data || [];
          setDoctors(list);

          if (userRole === 'doctor' && userName && list.length > 0) {
            const matchDoc = list.find((d) => d.fullName.trim() === userName.trim());
            if (matchDoc) {
              setBacSiDoc1(matchDoc.fullName);
              setBacSiDoc2(matchDoc.fullName);
            }
          }
        }
      } catch (err) {
        console.error('Fetch doctors error:', err);
      }
    }
    fetchDoctors();
  }, [userRole, userName]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleSingleService = (id: string) => {
    setIsComboMode(false);
    setSelectedSingleServices((prev) => {
      if (prev.includes(id)) {
        if (prev.length > 1) {
          return prev.filter((s) => s !== id);
        }
        return prev;
      } else {
        return [...prev, id];
      }
    });

    const isCellOrThinPrep = id === 'cell' || id === 'thinprep';
    setFormData((prev) => ({
      ...prev,
      loaiMau: isCellOrThinPrep ? 'Dịch phết' : 'Dịch',
    }));
  };

  const selectComboPackage = (id: string) => {
    setIsComboMode(true);
    setSelectedComboId(id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.hoTen.trim()) {
      toast.error('Vui lòng nhập họ và tên bệnh nhân');
      return;
    }
    const yearNum = Number(formData.namSinh);
    const currentYear = new Date().getFullYear();
    if (!formData.namSinh || isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear) {
      toast.error(`Năm sinh không hợp lệ. Vui lòng nhập năm sinh từ 1900 đến ${currentYear}`);
      return;
    }
    if ((userRole === 'admin' || userRole === 'lab_admin') && !bacSiDoc1) {
      toast.error('Vui lòng chọn Bác sĩ đọc kết quả');
      return;
    }

    if (isComboMode) {
      if ((userRole === 'admin' || userRole === 'lab_admin') && !bacSiDoc2) {
        toast.error('Vui lòng chọn Bác sĩ đọc kết quả thứ 2 cho gói Combo');
        return;
      }
    } else {
      if (selectedSingleServices.length === 0) {
        toast.error('Vui lòng chọn ít nhất 1 dịch vụ xét nghiệm');
        return;
      }
    }

    setLoading(true);
    try {
      if (isComboMode) {
        const typeToSave = selectedComboId;
        const res = await fetch('/api/test-results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            namSinh: Number(formData.namSinh),
            loaiXetNghiem: typeToSave,
            bacSiDoc: bacSiDoc1,
            bacSiDoc2: bacSiDoc2,
          }),
        });

        if (res.ok) {
          const newResult = await res.json();
          toast.success(`🎉 Đã tạo gói Combo thành công! Mã số: ${newResult.maSo}`);
          router.push(`/?category=${typeToSave}`);
        } else {
          const errorData = await res.json();
          toast.error(errorData.error || 'Lỗi tạo phiếu mới');
        }
      } else {
        const createdResults: any[] = [];
        for (const srvId of selectedSingleServices) {
          const res = await fetch('/api/test-results', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...formData,
              namSinh: Number(formData.namSinh),
              loaiXetNghiem: srvId,
              bacSiDoc: bacSiDoc1,
              bacSiDoc2: '',
            }),
          });

          if (res.ok) {
            const data = await res.json();
            createdResults.push(data);
          } else {
            const errorData = await res.json();
            toast.error(`Lỗi tạo phiếu (${srvId}): ${errorData.error || 'Lỗi hệ thống'}`);
          }
        }

        if (createdResults.length > 0) {
          if (createdResults.length === 1) {
            toast.success(`🎉 Đã tạo phiếu xét nghiệm thành công! Mã số: ${createdResults[0].maSo}`);
          } else {
            const maSoList = createdResults.map((r) => r.maSo).join(', ');
            toast.success(`🎉 Đã tạo thành công ${createdResults.length} phiếu xét nghiệm! (Mã: ${maSoList})`);
          }
          router.push(`/?category=${selectedSingleServices[0]}`);
        }
      }
    } catch (err) {
      console.error('Submit error:', err);
      toast.error('Lỗi kết nối cơ sở dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const getDoc1Label = () => {
    if (!isComboMode) return 'Bác sĩ đọc kết quả *';
    const t1 = selectedComboObj.types[0].toUpperCase();
    return `Bác sĩ đọc kết quả phần (${t1}) *`;
  };

  const getDoc2Label = () => {
    const t2 = selectedComboObj.types[1] === 'cell' ? 'CELL' : 'THINPREP';
    return `Bác sĩ đọc kết quả phần (${t2}) *`;
  };

  const showSoiTuoiFields = isComboMode
    ? selectedComboObj.types.includes('soituoi')
    : selectedSingleServices.includes('soituoi');

  const showGiaiPhauBenhFields = isComboMode
    ? selectedComboObj.types.includes('giaiphaubenh')
    : selectedSingleServices.includes('giaiphaubenh');

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <TopHeader />

        <main className="flex-1 p-4 md:p-5 w-full overflow-y-auto">
          <Header
            title="Tạo phiếu xét nghiệm mới"
            subtitle="Chọn 1 hoặc nhiều dịch vụ xét nghiệm đơn lẻ / gói combo & nhập thông tin hành chính bệnh nhân"
            action={
              <button
                type="button"
                onClick={() => router.back()}
                className="btn btn-secondary py-1.5 px-3 text-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay lại</span>
              </button>
            }
          />

          <div className="glass-card p-4 md:p-5 w-full shadow-xs">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* SERVICE SELECTION CONTAINER WITH MULTI-SELECT SUPPORT */}
              <div className="p-4 bg-gradient-to-r from-sky-50/90 via-indigo-50/60 to-purple-50/50 rounded-2xl border border-sky-200/90 shadow-xs space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-100/90 pb-2.5">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-sky-900 uppercase tracking-wide">
                    <span>CHỌN DỊCH VỤ / GÓI XÉT NGHIỆM *</span>
                  </div>

                  <div>
                    {!isComboMode ? (
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-3 py-1 rounded-lg border border-emerald-200 shadow-2xs flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                        <span>Đã chọn {selectedSingleServices.length} dịch vụ đơn lẻ</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-purple-800 bg-purple-100/80 px-3 py-1 rounded-lg border border-purple-200 shadow-2xs flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-purple-600 fill-purple-600" />
                        <span>Đã chọn Gói Combo xét nghiệm</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* 1. DỊCH VỤ ĐƠN LẺ (CHỌN NHIỀU CÙNG LÚC) */}
                <div>
                  <div className="text-[11px] font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                    <span>1. Dịch vụ đơn lẻ (Có thể tích chọn nhiều loại cùng lúc):</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableSingleServices.map((opt) => {
                      const isSelected = !isComboMode && selectedSingleServices.includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => toggleSingleService(opt.id)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 cursor-pointer shadow-2xs ${isSelected
                            ? 'bg-sky-600 text-white border-sky-600 shadow-sky-200 shadow-md ring-2 ring-sky-300'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-sky-300'
                            }`}
                        >
                          <span
                            className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] transition-all ${isSelected
                              ? 'bg-white text-sky-600 font-black shadow-xs'
                              : 'border border-slate-300 bg-slate-50'
                              }`}
                          >
                            {isSelected ? '✓' : ''}
                          </span>
                          <span>{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. GÓI COMBO (CHỌN 1 GÓI CỐ ĐỊNH) */}
                <div className="pt-2.5 border-t border-sky-100/90">
                  <div className="text-[11px] font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                    <span>2. Hoặc chọn Gói Combo (2 xét nghiệm trong 1 phiếu):</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableComboServices.map((opt) => {
                      const isSelected = isComboMode && selectedComboId === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => selectComboPackage(opt.id)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer shadow-2xs ${isSelected
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-600 shadow-indigo-200 shadow-md ring-2 ring-indigo-300'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-indigo-50/70 hover:border-indigo-300'
                            }`}
                        >
                          <Flame className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-300 fill-amber-300' : 'text-orange-500'}`} />
                          <span>{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-sky-700 pb-1.5 border-b border-slate-100 uppercase tracking-wider">
                <UserPlus className="w-4 h-4 text-sky-600" />
                <span>Thông tin hành chính bệnh nhân</span>
              </div>

              {/* 4-COLUMN COMPACT GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {/* ROW 1 */}
                <div className="form-group mb-0 lg:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-600">Họ và tên bệnh nhân *</label>
                  <input
                    type="text"
                    name="hoTen"
                    className="form-input py-1.5 px-3 text-xs"
                    value={formData.hoTen}
                    onChange={handleChange}
                    placeholder="Ví dụ: VƯƠNG THỊ HẰN"
                    required
                  />
                </div>

                <div className="form-group mb-0">
                  <label className="text-[11px] font-semibold text-slate-600">Năm sinh *</label>
                  <input
                    type="number"
                    name="namSinh"
                    className="form-input py-1.5 px-3 text-xs"
                    value={formData.namSinh}
                    onChange={handleChange}
                    placeholder="1994"
                    min={1900}
                    max={new Date().getFullYear()}
                    required
                  />
                </div>

                <div className="form-group mb-0">
                  <label className="text-[11px] font-semibold text-slate-600">Giới tính *</label>
                  <select
                    name="gioiTinh"
                    className="form-select py-1.5 px-3 text-xs"
                    value={formData.gioiTinh}
                    onChange={handleChange}
                  >
                    <option value="Nữ">Nữ</option>
                    <option value="Nam">Nam</option>
                  </select>
                </div>

                {/* ROW 2 */}
                <div className="form-group mb-0 lg:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-600">Địa chỉ</label>
                  <input
                    type="text"
                    name="diaChi"
                    className="form-input py-1.5 px-3 text-xs"
                    value={formData.diaChi}
                    onChange={handleChange}
                    placeholder="Ví dụ: Phường Mão Điền, Tỉnh Bắc Ninh"
                  />
                </div>

                <div className="form-group mb-0">
                  <label className="text-[11px] font-semibold text-slate-600">Số điện thoại</label>
                  <input
                    type="text"
                    name="soDienThoai"
                    className="form-input py-1.5 px-3 text-xs"
                    value={formData.soDienThoai}
                    onChange={handleChange}
                    placeholder="0355 922 657"
                  />
                </div>

                <div className="form-group mb-0">
                  <label className="text-[11px] font-semibold text-slate-600">Loại mẫu</label>
                  <input
                    type="text"
                    name="loaiMau"
                    className="form-input py-1.5 px-3 text-xs"
                    value={formData.loaiMau}
                    onChange={handleChange}
                  />
                </div>

                {/* ROW 3 */}
                <div className="form-group mb-0">
                  <label className="text-[11px] font-semibold text-slate-600">Đơn vị gửi mẫu</label>
                  <input
                    type="text"
                    name="donVi"
                    className="form-input py-1.5 px-3 text-xs"
                    value={formData.donVi}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group mb-0">
                  <label className="text-[11px] font-semibold text-slate-600">Bác sĩ chỉ định</label>
                  <input
                    type="text"
                    name="bacSiChiDinh"
                    className="form-input py-1.5 px-3 text-xs"
                    value={formData.bacSiChiDinh}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group mb-0">
                  <label className="text-[11px] font-semibold text-slate-600">Ngày nhận mẫu</label>
                  <input
                    type="date"
                    name="ngayNhanMau"
                    className="form-input py-1.5 px-3 text-xs"
                    value={formData.ngayNhanMau}
                    onChange={handleChange}
                  />
                </div>

                {/* DOCTOR SELECTION FIELDS */}
                {userRole === 'admin' || userRole === 'lab_admin' ? (
                  <>
                    <div className="form-group mb-0">
                      <label className="text-[11px] font-bold text-sky-700 truncate block">
                        {getDoc1Label()}
                      </label>
                      <select
                        value={bacSiDoc1}
                        onChange={(e) => setBacSiDoc1(e.target.value)}
                        className="form-select font-semibold border-sky-300 bg-sky-50/50 text-slate-800 py-1.5 px-3 text-xs w-full"
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

                    {isComboMode && (
                      <div className="form-group mb-0">
                        <label className="text-[11px] font-bold text-purple-700 truncate block">
                          {getDoc2Label()}
                        </label>
                        <select
                          value={bacSiDoc2}
                          onChange={(e) => setBacSiDoc2(e.target.value)}
                          className="form-select font-semibold border-purple-300 bg-purple-50/50 text-slate-800 py-1.5 px-3 text-xs w-full"
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
                    )}
                  </>
                ) : (
                  <div className="form-group mb-0">
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">
                      Bác sĩ đọc kết quả
                    </label>
                    <div className="p-2 bg-slate-100/80 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 flex items-center justify-between">
                      <span>Chưa phân loại</span>
                    </div>
                  </div>
                )}

                {/* ROW 4 - Chỉ dành riêng cho Xét nghiệm Soi tươi */}
                {showSoiTuoiFields && (
                  <>
                    <div className="form-group mb-0">
                      <label className="text-[11px] font-bold text-emerald-700">Chẩn đoán lâm sàng</label>
                      <input
                        type="text"
                        name="chanDoanLamSang"
                        className="form-input py-1.5 px-3 text-xs border-emerald-200 bg-emerald-50/30"
                        value={formData.chanDoanLamSang || ''}
                        onChange={handleChange}
                        placeholder="Chẩn đoán lâm sàng..."
                      />
                    </div>

                    <div className="form-group mb-0">
                      <label className="text-[11px] font-bold text-emerald-700">Nhận xét đại thể</label>
                      <input
                        type="text"
                        name="nhanXetDaiThe"
                        className="form-input py-1.5 px-3 text-xs border-emerald-200 bg-emerald-50/30"
                        value={formData.nhanXetDaiThe || ''}
                        onChange={handleChange}
                        placeholder="Nhận xét đại thể..."
                      />
                    </div>
                  </>
                )}

                {/* ROW 4 - Chỉ dành riêng cho Xét nghiệm Giải Phẫu Bệnh */}
                {showGiaiPhauBenhFields && (
                  <>
                    <div className="form-group mb-0">
                      <label className="text-[11px] font-bold text-amber-700">Chẩn đoán lâm sàng</label>
                      <input
                        type="text"
                        name="chanDoanLamSang"
                        className="form-input py-1.5 px-3 text-xs border-amber-200 bg-amber-50/30"
                        value={formData.chanDoanLamSang || ''}
                        onChange={handleChange}
                        placeholder="Chẩn đoán lâm sàng..."
                      />
                    </div>

                    <div className="form-group mb-0">
                      <label className="text-[11px] font-bold text-amber-700">Vị trí bệnh phẩm</label>
                      <input
                        type="text"
                        name="viTriBenhPham"
                        className="form-input py-1.5 px-3 text-xs border-amber-200 bg-amber-50/30"
                        value={formData.viTriBenhPham || ''}
                        onChange={handleChange}
                        placeholder="Vị trí bệnh phẩm..."
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-2.5 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="btn btn-secondary py-1.5 px-4 text-xs"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary py-1.5 px-4 text-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>
                    {loading
                      ? 'Đang khởi tạo...'
                      : isComboMode
                        ? 'Tạo phiếu Combo mới'
                        : selectedSingleServices.length > 1
                          ? `Tạo ${selectedSingleServices.length} phiếu xét nghiệm cùng lúc`
                          : 'Tạo phiếu mới'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function NewResultPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Đang tải...</div>}>
      <NewResultFormContent />
    </Suspense>
  );
}
