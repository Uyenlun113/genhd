'use client';

import React, { useState, useEffect, Suspense } from 'react';
import TopHeader from '@/components/TopHeader';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserPlus, ArrowLeft, Save, Sparkles, Stethoscope } from 'lucide-react';
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

const SERVICE_OPTIONS: ServiceOption[] = [
  { id: 'cell', label: 'Cell', isCombo: false, types: ['cell'] },
  { id: 'thinprep', label: 'ThinPrep', isCombo: false, types: ['thinprep'] },
  { id: 'hpv40', label: 'HPV 40', isCombo: false, types: ['hpv40'] },
  { id: 'hpv20', label: 'HPV 20', isCombo: false, types: ['hpv20'] },
  { id: 'soituoi', label: 'Soi tươi', isCombo: false, types: ['soituoi'] },
  { id: 'giaiphaubenh', label: 'Giải Phẫu Bệnh', isCombo: false, types: ['giaiphaubenh'] },
  { id: 'combo_hpv20_cell', label: '🔥 Gói Combo: HPV 20 + Cell', isCombo: true, types: ['hpv20', 'cell'] },
  { id: 'combo_hpv40_cell', label: '🔥 Gói Combo: HPV 40 + Cell', isCombo: true, types: ['hpv40', 'cell'] },
  { id: 'combo_hpv20_thinprep', label: '🔥 Gói Combo: HPV 20 + ThinPrep', isCombo: true, types: ['hpv20', 'thinprep'] },
  { id: 'combo_hpv40_thinprep', label: '🔥 Gói Combo: HPV 40 + ThinPrep', isCombo: true, types: ['hpv40', 'thinprep'] },
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

  const [serviceChoice, setServiceChoice] = useState<string>(paramType);
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
  });

  const hasCategoryPermission = (cat: string) => {
    if (userRole === 'admin' || userRole === 'lab_admin') return true;
    const userAllowed: string[] = (session?.user as any)?.allowedCategories || [];
    return userAllowed.includes(cat);
  };

  const availableServiceOptions = SERVICE_OPTIONS.filter((opt) => {
    return opt.types.every((t) => hasCategoryPermission(t));
  });

  const selectedServiceObj =
    availableServiceOptions.find((s) => s.id === serviceChoice) ||
    availableServiceOptions[0] ||
    SERVICE_OPTIONS[0];

  const targetCategory = selectedServiceObj.types[0] || 'cell';

  useEffect(() => {
    if (availableServiceOptions.length > 0) {
      const isChoiceAvailable = availableServiceOptions.some((opt) => opt.id === serviceChoice);
      if (!isChoiceAvailable) {
        setServiceChoice(availableServiceOptions[0].id);
      }
    }
  }, [availableServiceOptions, serviceChoice]);

  useEffect(() => {
    const urlType = searchParams.get('type');
    if (urlType) {
      const isValidChoice = availableServiceOptions.some((opt) => opt.id === urlType);
      if (isValidChoice) {
        setServiceChoice(urlType);
      }
    }
  }, [searchParams, availableServiceOptions]);

  useEffect(() => {
    async function fetchDoctors() {
      try {
        const res = await fetch(`/api/users?role=doctor&category=${targetCategory}`);
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
  }, [userRole, userName, targetCategory]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setServiceChoice(val);

    const isCellOrThinPrep = val === 'cell' || val === 'thinprep';
    setFormData((prev) => ({
      ...prev,
      loaiMau: isCellOrThinPrep ? 'Dịch phết' : 'Dịch',
    }));
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
    if ((userRole === 'admin' || userRole === 'lab_admin') && selectedServiceObj.isCombo && !bacSiDoc2) {
      toast.error('Vui lòng chọn Bác sĩ đọc kết quả thứ 2 cho gói Combo');
      return;
    }

    setLoading(true);
    try {
      if (!selectedServiceObj.isCombo) {
        // SINGLE SERVICE CREATION
        const type = selectedServiceObj.types[0];
        const res = await fetch('/api/test-results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            namSinh: Number(formData.namSinh),
            loaiXetNghiem: type,
            bacSiDoc: bacSiDoc1,
          }),
        });

        if (res.ok) {
          const newResult = await res.json();
          toast.success(`Đã tạo phiếu thành công! Mã số: ${newResult.maSo}`);
          router.push(`/?category=${type}`);
        } else {
          const errorData = await res.json();
          toast.error(errorData.error || 'Lỗi tạo phiếu mới');
        }
      } else {
        // COMBO SERVICE CREATION (Creates 2 separate test results)
        const type1 = selectedServiceObj.types[0]; // e.g. hpv20 or hpv40
        const type2 = selectedServiceObj.types[1]; // e.g. cell or thinprep

        // 1. Create first test (HPV)
        const res1 = await fetch('/api/test-results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            namSinh: Number(formData.namSinh),
            loaiXetNghiem: type1,
            loaiMau: 'Dịch',
            bacSiDoc: bacSiDoc1,
          }),
        });

        if (!res1.ok) {
          const err1 = await res1.json();
          toast.error(`Lỗi khởi tạo phiếu ${type1.toUpperCase()}: ${err1.error || ''}`);
          setLoading(false);
          return;
        }

        const data1 = await res1.json();

        // 2. Create second test (Cell or ThinPrep)
        const res2 = await fetch('/api/test-results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            namSinh: Number(formData.namSinh),
            loaiXetNghiem: type2,
            loaiMau: 'Dịch phết',
            bacSiDoc: bacSiDoc2,
          }),
        });

        if (!res2.ok) {
          const err2 = await res2.json();
          toast.error(`Tạo phiếu ${data1.maSo} thành công nhưng lỗi phiếu 2: ${err2.error || ''}`);
        } else {
          const data2 = await res2.json();
          toast.success(
            `🎉 Đã tạo thành công Gói Combo 2 phiếu xét nghiệm:\n1. Mã ${data1.maSo} (${type1.toUpperCase()})\n2. Mã ${data2.maSo} (${type2.toUpperCase()})`,
            { duration: 6000 }
          );
        }

        router.push(`/?category=${type1}`);
      }
    } catch (err) {
      console.error('Submit error:', err);
      toast.error('Lỗi kết nối cơ sở dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const getDoc1Label = () => {
    if (!selectedServiceObj.isCombo) return 'Bác sĩ đọc kết quả (Gán phiếu & Menu) *';
    const type1 = selectedServiceObj.types[0].toUpperCase();
    return `Bác sĩ đọc kết quả cho Phiếu 1 (${type1}) *`;
  };

  const getDoc2Label = () => {
    const type2 = selectedServiceObj.types[1] === 'cell' ? 'CELL' : 'THINPREP';
    return `Bác sĩ đọc kết quả cho Phiếu 2 (${type2}) *`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <TopHeader />

      <div className="flex flex-1 w-full">
        <Sidebar />

        <main className="flex-1 p-4 md:p-5 w-full overflow-hidden">
          <Header
            title="Tạo phiếu xét nghiệm mới"
            subtitle="Chọn dịch vụ xét nghiệm / gói combo & nhập thông tin hành chính bệnh nhân"
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
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* SERVICE SELECTION CARD - HORIZONTAL COMPACT */}
              <div className="p-3 bg-gradient-to-r from-sky-50 via-indigo-50/50 to-purple-50/40 rounded-xl border border-sky-200/80 flex flex-wrap md:flex-nowrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-sky-800 shrink-0">
                  <Sparkles className="w-4 h-4 text-sky-600" />
                  <span>CHỌN DỊCH VỤ / GÓI XÉT NGHIỆM *</span>
                </div>
                <div className="flex-1 min-w-[280px]">
                  <select
                    value={serviceChoice}
                    onChange={handleServiceChange}
                    className="form-select font-bold text-slate-800 border-sky-300 bg-white shadow-xs text-xs py-1.5 w-full"
                  >
                    {availableServiceOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedServiceObj.isCombo && (
                  <div className="text-[11px] font-semibold text-indigo-700 bg-indigo-100/70 px-2.5 py-1 rounded-md border border-indigo-200 shrink-0">
                    💡 Khởi tạo <b>2 phiếu riêng biệt</b> tự động
                  </div>
                )}
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

                {/* ROW 4 - Chỉ dành riêng cho Xét nghiệm Soi tươi */}
                {selectedServiceObj.types.includes('soituoi') && (
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
                {selectedServiceObj.types.includes('giaiphaubenh') && (
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

                {/* DOCTOR SELECTION FIELDS */}
                {userRole === 'admin' || userRole === 'lab_admin' ? (
                  <>
                    <div className={selectedServiceObj.isCombo ? 'form-group mb-0 lg:col-span-1' : 'form-group mb-0 lg:col-span-2'}>
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
                        {doctors.map((doc) => (
                          <option key={doc._id} value={doc.fullName}>
                            {doc.fullName}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedServiceObj.isCombo && (
                      <div className="form-group mb-0 lg:col-span-1">
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
                          {doctors.map((doc) => (
                            <option key={doc._id} value={doc.fullName}>
                              {doc.fullName}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="form-group mb-0 lg:col-span-2">
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">
                      Bác sĩ đọc kết quả
                    </label>
                    <div className="p-2.5 bg-slate-100/80 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 flex items-center justify-between">
                      <span>Chưa phân loại</span>
                      <span className="text-[11px] font-normal text-slate-400 italic">
                        (Admin Lab sẽ phân công bác sĩ khi tiếp nhận mẫu)
                      </span>
                    </div>
                  </div>
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
                      : selectedServiceObj.isCombo
                        ? 'Khởi tạo Combo 2 phiếu mới'
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
