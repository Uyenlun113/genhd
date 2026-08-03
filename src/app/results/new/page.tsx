'use client';

import React, { useState, useEffect, Suspense } from 'react';
import TopHeader from '@/components/TopHeader';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserPlus, ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';

interface DoctorUser {
  _id: string;
  fullName: string;
}

function NewResultFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultType = (searchParams.get('type') as 'cell' | 'hpv40' | 'hpv20') || 'cell';

  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const userName = session?.user?.name;

  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<DoctorUser[]>([]);

  const [formData, setFormData] = useState({
    loaiXetNghiem: defaultType,
    hoTen: '',
    namSinh: '',
    gioiTinh: 'Nữ',
    diaChi: '',
    soDienThoai: '',
    loaiMau: defaultType === 'cell' ? 'Dịch phết' : 'Dịch',
    donVi: '',
    bacSiChiDinh: '',
    bacSiDoc: '',
  });

  useEffect(() => {
    if (searchParams.get('type')) {
      const type = searchParams.get('type') as 'cell' | 'hpv40' | 'hpv20';
      setFormData((prev) => ({
        ...prev,
        loaiXetNghiem: type,
        loaiMau: type === 'cell' ? 'Dịch phết' : 'Dịch',
      }));
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

          if (list.length > 0) {
            setFormData((prev) => {
              // If logged in as doctor and doctor exists in list, set to current doctor
              if (userRole === 'doctor' && userName) {
                const matchDoc = list.find((d) => d.fullName.trim() === userName.trim());
                if (matchDoc) {
                  return { ...prev, bacSiDoc: matchDoc.fullName };
                }
              }
              // If prev.bacSiDoc already exists in list, keep it
              if (prev.bacSiDoc && list.some((d) => d.fullName === prev.bacSiDoc)) {
                return prev;
              }
              // Fallback to first doctor in list
              return { ...prev, bacSiDoc: list[0].fullName };
            });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.hoTen.trim()) {
      toast.error('Vui lòng nhập họ và tên bệnh nhân');
      return;
    }
    if (!formData.namSinh) {
      toast.error('Vui lòng nhập năm sinh');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/test-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          namSinh: Number(formData.namSinh),
        }),
      });

      if (res.ok) {
        const newResult = await res.json();
        toast.success(`Đã tạo phiếu thành công! Mã số: ${newResult.maSo}`);
        router.push(`/?category=${formData.loaiXetNghiem}`);
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || 'Lỗi tạo phiếu mới');
      }
    } catch {
      toast.error('Lỗi kết nối cơ sở dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <TopHeader />

      <div className="flex flex-1 w-full">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 w-full">
          <Header
            title={`Tạo phiếu xét nghiệm ${formData.loaiXetNghiem === 'cell' ? 'CELL (Tế bào)' : formData.loaiXetNghiem === 'hpv40' ? 'HPV 40 Types' : 'HPV 20 Types'}`}
            subtitle="Nhập thông tin hành chính của bệnh nhân & chọn Bác sĩ phụ trách"
            action={
              <button
                type="button"
                onClick={() => router.back()}
                className="btn btn-secondary"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại</span>
              </button>
            }
          />

          <div className="glass-card p-6 md:p-8 w-full">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center gap-2 text-base font-bold text-sky-700 pb-3 border-b border-slate-100">
                <UserPlus className="w-5 h-5 text-sky-600" />
                <span>Thông tin hành chính bệnh nhân</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div className="form-group sm:col-span-2">
                  <label>Họ và tên bệnh nhân *</label>
                  <input
                    type="text"
                    name="hoTen"
                    className="form-input"
                    value={formData.hoTen}
                    onChange={handleChange}
                    placeholder="Ví dụ: VƯƠNG THỊ HẰN"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Năm sinh *</label>
                  <input
                    type="number"
                    name="namSinh"
                    className="form-input"
                    value={formData.namSinh}
                    onChange={handleChange}
                    placeholder="1994"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Giới tính *</label>
                  <select
                    name="gioiTinh"
                    className="form-select"
                    value={formData.gioiTinh}
                    onChange={handleChange}
                  >
                    <option value="Nữ">Nữ</option>
                    <option value="Nam">Nam</option>
                  </select>
                </div>

                <div className="form-group sm:col-span-2">
                  <label>Địa chỉ</label>
                  <input
                    type="text"
                    name="diaChi"
                    className="form-input"
                    value={formData.diaChi}
                    onChange={handleChange}
                    placeholder="Ví dụ: Phường Mão Điền, Tỉnh Bắc Ninh"
                  />
                </div>

                <div className="form-group">
                  <label>Số điện thoại</label>
                  <input
                    type="text"
                    name="soDienThoai"
                    className="form-input"
                    value={formData.soDienThoai}
                    onChange={handleChange}
                    placeholder="0355 922 657"
                  />
                </div>

                <div className="form-group">
                  <label>Loại mẫu</label>
                  <input
                    type="text"
                    name="loaiMau"
                    className="form-input"
                    value={formData.loaiMau}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Đơn vị</label>
                  <input
                    type="text"
                    name="donVi"
                    className="form-input"
                    value={formData.donVi}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Bác sĩ chỉ định</label>
                  <input
                    type="text"
                    name="bacSiChiDinh"
                    className="form-input"
                    value={formData.bacSiChiDinh}
                    onChange={handleChange}
                    placeholder=""
                  />
                </div>

                {/* Doctor Assigned Field */}
                <div className="form-group sm:col-span-2">
                  <label className="font-bold text-sky-700">Bác sĩ đọc kết quả (Gán phiếu & Menu) *</label>
                  <select
                    name="bacSiDoc"
                    className="form-select font-semibold border-sky-300 bg-sky-50/50 text-slate-800"
                    value={formData.bacSiDoc}
                    onChange={handleChange}
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
                  onClick={() => router.back()}
                  className="btn btn-secondary"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? 'Đang khởi tạo phiếu...' : 'Tạo phiếu mới'}</span>
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
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center">Đang tải...</div>}>
      <NewResultFormContent />
    </Suspense>
  );
}
