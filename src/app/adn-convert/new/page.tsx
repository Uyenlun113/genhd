'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TopHeader from '@/components/TopHeader';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import {
  Dna,
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  ImageIcon,
  Upload,
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
}

export default function NewAdnOrderPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [createType, setCreateType] = useState<'phap_ly' | 'tu_nguyen'>('phap_ly');
  const [soPhieu, setSoPhieu] = useState('');
  const [ngayYeuCau, setNgayYeuCau] = useState(() => new Date().toISOString().split('T')[0]);
  const [ngayBanHanh, setNgayBanHanh] = useState('');
  const [nguoiYeuCau, setNguoiYeuCau] = useState('');
  const [nguoiThuMau, setNguoiThuMau] = useState('Hoàng Văn Luận');
  const [boKit, setBoKit] = useState('A27Plex STR Detection Kit');
  const [anhGuiMau, setAnhGuiMau] = useState('');

  const [mauDanhSach, setMauDanhSach] = useState<SampleItem[]>([
    { kyHieuMau: 'B', hoTen: '', gioiTinh: 'Nam', ngaySinh: '', loaiMau: 'Máu', cccd: '' },
    { kyHieuMau: 'C', hoTen: '', gioiTinh: 'Nữ', ngaySinh: '', loaiMau: 'Máu', cccd: '' },
  ]);

  // Auto-generate ticket number & request date on mount / type change
  useEffect(() => {
    const today = new Date();
    const yy = String(today.getFullYear()).slice(-2);
    const tag = createType === 'phap_ly' ? 'HHK/ADN' : 'THK/ADN';

    fetch('/api/adn/orders')
      .then((res) => res.json())
      .then((json) => {
        const count = json.data?.length || 0;
        const seq = String(count + 1).padStart(4, '0');
        setSoPhieu(`${yy}${seq}${tag}`);
      })
      .catch(() => {
        setSoPhieu(`${yy}0001${tag}`);
      });

    const yyyy = today.getFullYear();
    const mmIso = String(today.getMonth() + 1).padStart(2, '0');
    const ddIso = String(today.getDate()).padStart(2, '0');
    setNgayYeuCau(`${yyyy}-${mmIso}-${ddIso}`);
    setNgayBanHanh(`Hà Nội, ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}`);
  }, [createType]);

  // Image Upload Helper
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

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!soPhieu.trim()) {
      toast.error('Vui lòng nhập Số phiếu / Mã ca');
      return;
    }
    if (!nguoiYeuCau.trim()) {
      toast.error('Vui lòng nhập Người yêu cầu');
      return;
    }

    const baseCode = (soPhieu || '').split('/')[0].trim();
    const formattedMauDanhSach = mauDanhSach.map((s, idx) => {
      const defaultRaw = idx === 0 ? 'B' : idx === 1 ? 'C' : `M${idx + 1}`;
      const rawKey = s.kyHieuMau && s.kyHieuMau.trim() ? s.kyHieuMau.trim() : defaultRaw;
      const fullKey = rawKey.endsWith(baseCode) ? rawKey : `${rawKey}${baseCode}`;
      return {
        ...s,
        kyHieuMau: fullKey,
      };
    });

    setLoading(true);
    try {
      const res = await fetch('/api/adn/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loaiXetNghiemADN: createType,
          soPhieu,
          ngayYeuCau,
          ngayBanHanh,
          nguoiYeuCau,
          nguoiThuMau,
          boKit,
          anhGuiMau,
          mauDanhSach: formattedMauDanhSach,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        toast.success('Tạo đơn xét nghiệm ADN mới thành công!');
        router.push('/adn-convert');
      } else {
        toast.error(json.error || 'Tạo đơn thất bại');
      }
    } catch (err) {
      toast.error('Lỗi khi kết nối hệ thống');
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
            title="Tạo mới đơn xét nghiệm ADN"
            subtitle="Nhập thông tin ban đầu, đính kèm ảnh gửi mẫu và các thông tin mẫu xét nghiệm"
            action={
              <button
                onClick={() => router.push('/adn-convert')}
                className="btn btn-secondary text-xs flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại danh sách</span>
              </button>
            }
          />

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Chọn loại ADN & Thông tin ban đầu */}
            <div className="glass-card p-6">
              <h3 className="flex items-center gap-2 text-base font-bold text-sky-700 mb-4 pb-3 border-b border-slate-100">
                <Dna className="w-5 h-5 text-sky-600" />
                <span>1. Loại Xét Nghiệm & Thông Tin Đơn</span>
              </h3>

              {/* ADN Type Selector */}
              <div className="mb-6 flex gap-4">
                <label
                  onClick={() => setCreateType('phap_ly')}
                  className={`flex-1 p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${createType === 'phap_ly'
                    ? 'border-purple-600 bg-purple-50/50 text-purple-900 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                >
                  <input
                    type="radio"
                    name="adnType"
                    checked={createType === 'phap_ly'}
                    onChange={() => setCreateType('phap_ly')}
                    className="w-4 h-4 text-purple-600"
                  />
                  <div>
                    <div className="font-bold text-sm">ADN Pháp Lý</div>
                  </div>
                </label>

                <label
                  onClick={() => setCreateType('tu_nguyen')}
                  className={`flex-1 p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${createType === 'tu_nguyen'
                    ? 'border-teal-600 bg-teal-50/50 text-teal-900 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                >
                  <input
                    type="radio"
                    name="adnType"
                    checked={createType === 'tu_nguyen'}
                    onChange={() => setCreateType('tu_nguyen')}
                    className="w-4 h-4 text-teal-600"
                  />
                  <div>
                    <div className="font-bold text-sm">ADN Tự Nguyện</div>
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="form-group mb-0">
                  <label>Người yêu cầu *</label>
                  <input
                    type="text"
                    value={nguoiYeuCau}
                    onChange={(e) => setNguoiYeuCau(e.target.value)}
                    placeholder="Nhập tên người yêu cầu"
                    className="form-input font-bold"
                    required
                  />
                </div>

                <div className="form-group mb-0">
                  <label>Ngày yêu cầu</label>
                  <input
                    type="date"
                    value={ngayYeuCau?.includes('/') ? ngayYeuCau.split('/').reverse().join('-') : ngayYeuCau}
                    onChange={(e) => setNgayYeuCau(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group mb-0">
                  <label>Bộ kit STR</label>
                  <input
                    type="text"
                    value={boKit}
                    onChange={(e) => setBoKit(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group mb-0">
                  <label>Người thu mẫu / nhận mẫu</label>
                  <input
                    type="text"
                    value={nguoiThuMau}
                    onChange={(e) => setNguoiThuMau(e.target.value)}
                    placeholder="VD: Hoàng Văn Luận"
                    className="form-input"
                  />
                </div>
              </div>

              {/* List of Samples */}
              <div className="mt-6 pt-4 border-t border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-800">Chi tiết thông tin từng mẫu ({mauDanhSach.length} mẫu):</span>
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
                          cccd: '',
                        },
                      ])
                    }
                    className="btn btn-secondary text-xs py-1.5 px-3"
                  >
                    <Plus className="w-4 h-4" /> Thêm mẫu
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {mauDanhSach.map((sample, idx) => (
                    <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2 text-xs">
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
                            className="form-input w-24 py-1 text-xs font-bold text-sky-700"
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

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="form-group mb-0">
                          <label>Họ tên</label>
                          <input
                            type="text"
                            value={sample.hoTen}
                            onChange={(e) => {
                              const updated = [...mauDanhSach];
                              updated[idx].hoTen = e.target.value;
                              setMauDanhSach(updated);
                            }}
                            placeholder="Nhập họ tên mẫu"
                            className="form-input font-bold"
                          />
                        </div>
                        <div className="form-group mb-0">
                          <label>Giới tính</label>
                          <select
                            value={sample.gioiTinh}
                            onChange={(e) => {
                              const updated = [...mauDanhSach];
                              updated[idx].gioiTinh = e.target.value;
                              setMauDanhSach(updated);
                            }}
                            className="form-select"
                          >
                            <option value="Nam">Nam</option>
                            <option value="Nữ">Nữ</option>
                          </select>
                        </div>
                        <div className="form-group mb-0">
                          <label>Ngày sinh</label>
                          <input
                            type="date"
                            value={sample.ngaySinh?.includes('/') ? sample.ngaySinh.split('/').reverse().join('-') : sample.ngaySinh || ''}
                            onChange={(e) => {
                              const updated = [...mauDanhSach];
                              updated[idx].ngaySinh = e.target.value;
                              setMauDanhSach(updated);
                            }}
                            className="form-input"
                          />
                        </div>
                        <div className="form-group mb-0">
                          <label>Loại mẫu</label>
                          <input
                            type="text"
                            value={sample.loaiMau || 'Máu'}
                            onChange={(e) => {
                              const updated = [...mauDanhSach];
                              updated[idx].loaiMau = e.target.value;
                              setMauDanhSach(updated);
                            }}
                            className="form-input"
                          />
                        </div>

                        {/* Legal specific fields for ADN Pháp Lý */}
                        {createType === 'phap_ly' && (
                          <>
                            <div className="form-group mb-0">
                              <label>CCCD / Passport / Chứng sinh số</label>
                              <input
                                type="text"
                                value={sample.cccd || ''}
                                onChange={(e) => {
                                  const updated = [...mauDanhSach];
                                  updated[idx].cccd = e.target.value;
                                  setMauDanhSach(updated);
                                }}
                                placeholder="Nhập số CCCD / Passport / Chứng sinh"
                                className="form-input"
                              />
                            </div>
                            <div className="form-group mb-0">
                              <label>Quyển số (Giấy chứng sinh)</label>
                              <input
                                type="text"
                                value={sample.quyenSo || ''}
                                onChange={(e) => {
                                  const updated = [...mauDanhSach];
                                  updated[idx].quyenSo = e.target.value;
                                  setMauDanhSach(updated);
                                }}
                                placeholder="Nhập quyển số"
                                className="form-input"
                              />
                            </div>
                            <div className="form-group mb-0">
                              <label>Quốc tịch</label>
                              <input
                                type="text"
                                value={sample.quocTich || 'Việt Nam'}
                                onChange={(e) => {
                                  const updated = [...mauDanhSach];
                                  updated[idx].quocTich = e.target.value;
                                  setMauDanhSach(updated);
                                }}
                                className="form-input"
                              />
                            </div>
                            <div className="form-group mb-0">
                              <label>Ngày cấp</label>
                              <input
                                type="date"
                                value={sample.ngayCap?.includes('/') ? sample.ngayCap.split('/').reverse().join('-') : sample.ngayCap || ''}
                                onChange={(e) => {
                                  const updated = [...mauDanhSach];
                                  updated[idx].ngayCap = e.target.value;
                                  setMauDanhSach(updated);
                                }}
                                className="form-input"
                              />
                            </div>
                            <div className="form-group mb-0 md:col-span-2">
                              <label>Nơi cấp</label>
                              <input
                                type="text"
                                value={sample.noiCap || ''}
                                onChange={(e) => {
                                  const updated = [...mauDanhSach];
                                  updated[idx].noiCap = e.target.value;
                                  setMauDanhSach(updated);
                                }}
                                placeholder="VD: Cục QLHC về TTXH"
                                className="form-input"
                              />
                            </div>
                            <div className="form-group mb-0 md:col-span-2">
                              <label>Nơi thường trú</label>
                              <input
                                type="text"
                                value={sample.noiThuongTru || ''}
                                onChange={(e) => {
                                  const updated = [...mauDanhSach];
                                  updated[idx].noiThuongTru = e.target.value;
                                  setMauDanhSach(updated);
                                }}
                                placeholder="Nhập địa chỉ nơi thường trú"
                                className="form-input"
                              />
                            </div>
                          </>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                        <label className="btn btn-secondary text-xs py-1 px-3 cursor-pointer">
                          <ImageIcon className="w-3.5 h-3.5 text-sky-600" /> Ảnh Chân Dung Mẫu {sample.kyHieuMau}
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
                            <span className="text-[11px] text-emerald-600 font-bold">✓ Đã có ảnh</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">Chưa có ảnh chân dung</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 2: Upload Ảnh Gửi Mẫu (Bước 1) */}
            <div className="glass-card p-6 space-y-4">
              <h3 className="flex items-center gap-2 text-base font-bold text-sky-700 mb-4 pb-3 border-b border-slate-100">
                <Upload className="w-5 h-5 text-sky-600" />
                <span>2. Upload Ảnh Gửi Mẫu</span>
              </h3>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Đính kèm ảnh chụp mẫu khi gửi phòng Lab:</span>
                  <label className="btn btn-primary text-xs cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <span>Tải ảnh gửi mẫu</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, (b64) => setAnhGuiMau(b64))}
                      className="hidden"
                    />
                  </label>
                </div>

                {anhGuiMau ? (
                  <div className="relative">
                    <img src={anhGuiMau} alt="Ảnh gửi mẫu" className="h-44 object-cover rounded-lg border w-full" />
                    <button
                      type="button"
                      onClick={() => setAnhGuiMau('')}
                      className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 shadow-md"
                    >
                      Xóa ảnh
                    </button>
                  </div>
                ) : (
                  <div className="h-32 flex flex-col items-center justify-center bg-white border border-dashed border-slate-300 rounded-lg text-slate-400 text-xs gap-1">
                    <ImageIcon className="w-6 h-6 text-slate-300" />
                    <span>Chưa đính kèm ảnh gửi mẫu</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.push('/adn-convert')}
                className="btn btn-secondary"
              >
                Hủy bỏ
              </button>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Tạo Đơn ADN</span>
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
