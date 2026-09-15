'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TopHeader from '@/components/TopHeader';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import SampleTypeSelect from '@/components/SampleTypeSelect';
import ImageDropzone from '@/components/ImageDropzone';
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
  loaiGiayTo?: string;
  ngayCap?: string;
  noiCap?: string;
  noiThuongTru?: string;
  loaiMau?: string;
  anhChanDung?: string;
}

export default function NewAdnOrderPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [createType, setCreateType] = useState<'phap_ly' | 'tu_nguyen' | 'y_chr' | 'x_chr'>('phap_ly');
  const [soPhieu, setSoPhieu] = useState('');
  const [ngayYeuCau, setNgayYeuCau] = useState(() => new Date().toISOString().split('T')[0]);
  const [ngayBanHanh, setNgayBanHanh] = useState('');
  const [nguoiYeuCau, setNguoiYeuCau] = useState('');
  const [nguoiThuMau, setNguoiThuMau] = useState('Hoàng Văn Luận');
  const [boKit, setBoKit] = useState('A27Plex STR Detection Kit');
  const [canBoXetNghiem, setCanBoXetNghiem] = useState('');
  const [daiDienDonVi, setDaiDienDonVi] = useState('');
  const [anhGuiMau, setAnhGuiMau] = useState('');

  const [mauDanhSach, setMauDanhSach] = useState<SampleItem[]>([
    { kyHieuMau: 'B', hoTen: '', gioiTinh: 'Nam', ngaySinh: '', loaiMau: 'Máu', cccd: '' },
    { kyHieuMau: 'C', hoTen: '', gioiTinh: 'Nữ', ngaySinh: '', loaiMau: 'Máu', cccd: '' },
  ]);

  // Auto-generate ticket number & request date on mount / type change
  useEffect(() => {
    const today = new Date();
    const yy = String(today.getFullYear()).slice(-2);
    const tag = createType === 'phap_ly' ? 'HHK/ADN' : createType === 'y_chr' ? 'YHK/ADN' : createType === 'x_chr' ? 'XHK/ADN' : 'THK/ADN';

    if (createType === 'x_chr') {
      setBoKit('X18Plex STR Detection Kit');
    } else if (createType === 'y_chr') {
      setBoKit('Y27Plex STR Detection Kit');
    } else if (boKit === 'Y27Plex STR Detection Kit' || boKit === 'X18Plex STR Detection Kit') {
      setBoKit('A27Plex STR Detection Kit');
    }

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
    setNgayBanHanh(`Hà Nội, ngày ${ddIso} tháng ${mmIso} năm ${yyyy}.`);
  }, [createType]);

  // Image Upload Helper (convert to JPEG & upload to Cloudinary if available)
  const handleImageUpload = async (fileOrEvent: File | React.ChangeEvent<HTMLInputElement>, callback: (urlOrB64: string) => void) => {
    const file = fileOrEvent instanceof File ? fileOrEvent : fileOrEvent.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const origB64 = reader.result as string;
      const img = new Image();
      img.onload = async () => {
        // Convert any format (WebP, PNG, HEIC) to standard JPEG via Canvas
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        }
        const jpegB64 = canvas.toDataURL('image/jpeg', 0.85);

        // Upload to Cloudinary via /api/upload
        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileData: jpegB64, folder: 'adn_images', resourceType: 'image' }),
          });
          if (res.ok) {
            const json = await res.json();
            if (json.url && json.url.startsWith('http')) {
              callback(json.url);
              toast.success('Đã tải ảnh lên Cloudinary thành công!');
              return;
            }
          }
        } catch (err) {
          console.warn('Cloudinary upload fallback to JPEG base64:', err);
        }

        // Fallback to compressed JPEG base64 if Cloudinary keys not configured
        callback(jpegB64);
        toast.success('Đã tải ảnh thành công!');
      };
      img.onerror = () => {
        callback(origB64);
        toast.success('Đã tải ảnh thành công!');
      };
      img.src = origB64;
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
    // nguoiYeuCau is optional

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
          canBoXetNghiem,
          daiDienDonVi,
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
    <div className="min-h-screen bg-slate-50 flex overflow-hidden h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <TopHeader />

        <main className="flex-1 p-6 md:p-8 w-full overflow-y-auto">
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
              <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <label
                  onClick={() => setCreateType('phap_ly')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${createType === 'phap_ly'
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
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${createType === 'tu_nguyen'
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

                <label
                  onClick={() => setCreateType('y_chr')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${createType === 'y_chr'
                    ? 'border-sky-600 bg-sky-50/50 text-sky-900 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                >
                  <input
                    type="radio"
                    name="adnType"
                    checked={createType === 'y_chr'}
                    onChange={() => setCreateType('y_chr')}
                    className="w-4 h-4 text-sky-600"
                  />
                  <div>
                    <div className="font-bold text-sm">ADN Nhiễm Sắc Thể Y</div>
                  </div>
                </label>

                <label
                  onClick={() => setCreateType('x_chr')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${createType === 'x_chr'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                >
                  <input
                    type="radio"
                    name="adnType"
                    checked={createType === 'x_chr'}
                    onChange={() => setCreateType('x_chr')}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <div>
                    <div className="font-bold text-sm">ADN Nhiễm Sắc Thể X</div>
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
                          <label>{(createType === 'phap_ly' && idx > 0 && (sample.loaiGiayTo === 'giay_chung_sinh' || (!sample.loaiGiayTo && (sample.quyenSo || true)))) ? 'Tên dự kiến' : 'Họ tên'}</label>
                          <input
                            type="text"
                            value={sample.hoTen}
                            onChange={(e) => {
                              const updated = [...mauDanhSach];
                              updated[idx].hoTen = e.target.value;
                              setMauDanhSach(updated);
                            }}
                            placeholder={createType === 'phap_ly' && idx > 0 ? "Nhập tên mẫu con" : "Nhập họ tên mẫu"}
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
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Loại mẫu</label>
                          <SampleTypeSelect
                            value={sample.loaiMau ?? ''}
                            onChange={(val) => {
                              const updated = [...mauDanhSach];
                              updated[idx].loaiMau = val;
                              setMauDanhSach(updated);
                            }}
                          />
                        </div>

                        {/* Legal specific fields for ADN Pháp Lý */}
                        {createType === 'phap_ly' && (
                          <>
                            <div className="form-group mb-0">
                              <label>Loại giấy tờ</label>
                              <select
                                value={sample.loaiGiayTo || (idx > 0 ? 'giay_chung_sinh' : 'cccd')}
                                onChange={(e) => {
                                  const updated = [...mauDanhSach];
                                  updated[idx].loaiGiayTo = e.target.value;
                                  setMauDanhSach(updated);
                                }}
                                className="form-select"
                              >
                                <option value="cccd">CCCD</option>
                                <option value="ho_chieu">Hộ chiếu</option>
                                <option value="gks">Giấy khai sinh</option>
                                <option value="giay_chung_sinh">Giấy chứng sinh</option>
                                <option value="khac">Khác</option>
                              </select>
                            </div>
                            <div className="form-group mb-0">
                              <label>
                                {sample.loaiGiayTo === 'cccd'
                                  ? 'Số CCCD'
                                  : sample.loaiGiayTo === 'ho_chieu'
                                  ? 'Số Hộ chiếu'
                                  : sample.loaiGiayTo === 'gks'
                                  ? 'Số Giấy khai sinh'
                                  : sample.loaiGiayTo === 'giay_chung_sinh'
                                  ? 'Giấy chứng sinh số'
                                  : 'CCCD / Passport / Chứng sinh số'}
                              </label>
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

                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                        <ImageDropzone
                          onFileSelected={(file) =>
                            handleImageUpload(file, (b64) => {
                              const updated = [...mauDanhSach];
                              updated[idx].anhChanDung = b64;
                              setMauDanhSach(updated);
                            })
                          }
                        >
                          <div className="btn btn-secondary text-xs py-1 px-3 cursor-pointer inline-flex items-center gap-1.5 shadow-2xs">
                            <ImageIcon className="w-3.5 h-3.5 text-sky-600" /> Tải/Kéo thả Chân Dung Mẫu {sample.kyHieuMau}
                          </div>
                        </ImageDropzone>
                        {sample.anhChanDung ? (
                          <div className="flex items-center gap-2">
                            <img src={sample.anhChanDung} alt="Chân dung" className="w-8 h-10 object-cover rounded border" />
                            <span className="text-[11px] text-emerald-600 font-bold">✓ Đã có ảnh</span>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...mauDanhSach];
                                updated[idx].anhChanDung = '';
                                setMauDanhSach(updated);
                              }}
                              className="text-slate-400 hover:text-rose-600 text-xs p-1 cursor-pointer"
                              title="Xóa ảnh"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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
                  {anhGuiMau && (
                    <button
                      type="button"
                      onClick={() => setAnhGuiMau('')}
                      className="text-xs text-rose-600 hover:underline font-bold cursor-pointer"
                    >
                      Xóa ảnh
                    </button>
                  )}
                </div>

                {anhGuiMau ? (
                  <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white p-2">
                    <img src={anhGuiMau} alt="Ảnh gửi mẫu" className="h-44 object-contain rounded-lg w-full" />
                    <div className="mt-2 flex justify-center">
                      <ImageDropzone
                        onFileSelected={(file) => handleImageUpload(file, (b64) => setAnhGuiMau(b64))}
                      >
                        <span className="px-3 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg text-xs font-bold shadow-2xs">
                          Đổi / Kéo thả ảnh mới
                        </span>
                      </ImageDropzone>
                    </div>
                  </div>
                ) : (
                  <ImageDropzone
                    onFileSelected={(file) => handleImageUpload(file, (b64) => setAnhGuiMau(b64))}
                    label="Kéo & thả ảnh gửi mẫu vào đây hoặc bấm để chọn file"
                    className="h-36 bg-white"
                  />
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
