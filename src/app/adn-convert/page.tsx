'use client';

import React, { useState } from 'react';
import TopHeader from '@/components/TopHeader';
import Sidebar from '@/components/Sidebar';
import {
  FileUp,
  Download,
  Dna,
  User,
  Baby,
  FileText,
  ImageIcon,
  Sparkles,
  Trash2,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface LocusItem {
  locus: string;
  m1_1: string;
  m1_2: string;
  m2_1: string;
  m2_2: string;
}

const nfc = (str: string) => (str || '').normalize('NFC');

export default function AdnConvertPage() {
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [uploadedPdfBase64, setUploadedPdfBase64] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  // Initial Empty Form State
  const [soPhieu, setSoPhieu] = useState('');
  const [ngayBanHanh, setNgayBanHanh] = useState('');
  const [ngayYeuCau, setNgayYeuCau] = useState('');
  const [nguoiYeuCau, setNguoiYeuCau] = useState('');
  const [nguoiThuMau, setNguoiThuMau] = useState('');
  const [boKit, setBoKit] = useState('');

  const [m1, setM1] = useState({
    hoTen: '',
    gioiTinh: '',
    ngaySinh: '',
    quocTich: '',
    cccd: '',
    ngayCap: '',
    noiCap: '',
    noiThuongTru: '',
    kyHieuMau: 'M1',
    loaiMau: '',
    photoUrl: '',
  });

  const [m2, setM2] = useState({
    hoTen: '',
    gioiTinh: '',
    ngaySinh: '',
    giayChungSinhSo: '',
    quyenSo: '',
    ngayCap: '',
    noiCap: '',
    kyHieuMau: 'M2',
    loaiMau: '',
    photoUrl: '',
  });

  const emptyTable1: LocusItem[] = [
    { locus: 'D3S1358', m1_1: '', m1_2: '', m2_1: '', m2_2: '' },
    { locus: 'vWA', m1_1: '', m1_2: '', m2_1: '', m2_2: '' },
    { locus: 'D12S391', m1_1: '', m1_2: '', m2_1: '', m2_2: '' },
    { locus: 'CSF1PO', m1_1: '', m1_2: '', m2_1: '', m2_2: '' },
    { locus: 'Penta E', m1_1: '', m1_2: '', m2_1: '', m2_2: '' },
    { locus: 'D2S441', m1_1: '', m1_2: '', m2_1: '', m2_2: '' },
    { locus: 'D16S539', m1_1: '', m1_2: '', m2_1: '', m2_2: '' },
    { locus: 'D7S820', m1_1: '', m1_2: '', m2_1: '', m2_2: '' },
    { locus: 'D13S317', m1_1: '', m1_2: '', m2_1: '', m2_2: '' },
  ];

  const emptyTable2: LocusItem[] = [
    { locus: 'D2S1338', m1_1: '', m1_2: '', m2_1: '', m2_2: '' },
    { locus: 'Penta D', m1_1: '', m1_2: '', m2_1: '', m2_2: '' },
    { locus: 'Rs199815934', m1_1: '', m1_2: '', m2_1: '', m2_2: '' },
    { locus: 'AMEL', m1_1: '', m1_2: '', m2_1: '', m2_2: '' },
    { locus: 'D22S1045', m1_1: '', m1_2: '', m2_1: '', m2_2: '' },
    { locus: 'D19S433', m1_1: '', m1_2: '', m2_1: '', m2_2: '' },
    { locus: 'D18S51', m1_1: '', m1_2: '', m2_1: '', m2_2: '' },
    { locus: 'D6S1043', m1_1: '', m1_2: '', m2_1: '', m2_2: '' },
    { locus: 'DYS391', m1_1: '', m1_2: '', m2_1: '', m2_2: '' },
  ];

  const emptyTable3: LocusItem[] = [
    { locus: 'D8S1179', m1_1: '', m1_2: '', m2_1: '', m2_2: '' },
    { locus: 'D5S818', m1_1: '', m1_2: '', m2_1: '', m2_2: '' },
    { locus: 'D21S11', m1_1: '', m1_2: '', m2_1: '', m2_2: '' },
    { locus: 'FGA', m1_1: '', m1_2: '', m2_1: '', m2_2: '' },
    { locus: 'D10S1248', m1_1: '', m1_2: '', m2_1: '', m2_2: '' },
    { locus: 'TH01', m1_1: '', m1_2: '', m2_1: '', m2_2: '' },
    { locus: 'D1S1656', m1_1: '', m1_2: '', m2_1: '', m2_2: '' },
    { locus: 'TPOX', m1_1: '', m1_2: '', m2_1: '', m2_2: '' },
    { locus: 'SE33', m1_1: '', m1_2: '', m2_1: '', m2_2: '' },
  ];

  const [table1, setTable1] = useState<LocusItem[]>(emptyTable1);
  const [table2, setTable2] = useState<LocusItem[]>(emptyTable2);
  const [table3, setTable3] = useState<LocusItem[]>(emptyTable3);

  const [ketLuan, setKetLuan] = useState('');
  const [doTinCay, setDoTinCay] = useState('');
  const [kiemSoatKetQua, setKiemSoatKetQua] = useState(nfc('TS. BS. Nguyễn Khánh Dương'));
  const [daiDienDonVi, setDaiDienDonVi] = useState(nfc('CÔNG TY CỔ PHẦN GENETRUST VIỆT NAM'));

  // Clear all data (Reset form to empty)
  const handleClearAll = () => {
    setUploadedPdfBase64('');
    setUploadedFileName('');
    setSoPhieu('');
    setNgayBanHanh('');
    setNgayYeuCau('');
    setNguoiYeuCau('');
    setNguoiThuMau('');
    setBoKit('');
    setM1({
      hoTen: '',
      gioiTinh: '',
      ngaySinh: '',
      quocTich: '',
      cccd: '',
      ngayCap: '',
      noiCap: '',
      noiThuongTru: '',
      kyHieuMau: 'M1',
      loaiMau: '',
      photoUrl: '',
    });
    setM2({
      hoTen: '',
      gioiTinh: '',
      ngaySinh: '',
      giayChungSinhSo: '',
      quyenSo: '',
      ngayCap: '',
      noiCap: '',
      kyHieuMau: 'M2',
      loaiMau: '',
      photoUrl: '',
    });
    setTable1(emptyTable1);
    setTable2(emptyTable2);
    setTable3(emptyTable3);
    setKetLuan('');
    setDoTinCay('');
    toast.success('Đã xóa dữ liệu, đưa bảng về trạng thái trống!');
  };

  // Upload custom PDF file and parse its contents
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setUploadedFileName(file.name);

    // 1. Read Base64 for export merging
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Str = reader.result as string;
      setUploadedPdfBase64(base64Str);

      // 2. Call backend parse API to extract actual text & form data from the uploaded file
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
            setSoPhieu(nfc(d.soPhieu || ''));
            setNgayBanHanh(nfc(d.ngayBanHanh || 'Hà Nội, ngày 31 tháng 07 năm 2026.'));
            setNgayYeuCau(nfc(d.ngayYeuCau || ''));
            setNguoiYeuCau(nfc(d.nguoiYeuCau || ''));
            setNguoiThuMau(nfc(d.nguoiThuMau || ''));
            setBoKit(nfc(d.boKit || ''));

            if (d.m1) {
              setM1({
                hoTen: nfc(d.m1.hoTen || ''),
                gioiTinh: nfc(d.m1.gioiTinh || ''),
                ngaySinh: nfc(d.m1.ngaySinh || ''),
                quocTich: nfc(d.m1.quocTich || ''),
                cccd: nfc(d.m1.cccd || ''),
                ngayCap: nfc(d.m1.ngayCap || ''),
                noiCap: nfc(d.m1.noiCap || ''),
                noiThuongTru: nfc(d.m1.noiThuongTru || ''),
                kyHieuMau: nfc(d.m1.kyHieuMau || 'M1'),
                loaiMau: nfc(d.m1.loaiMau || ''),
                photoUrl: d.m1.photoUrl || '',
              });
            }

            if (d.m2) {
              setM2({
                hoTen: nfc(d.m2.hoTen || ''),
                gioiTinh: nfc(d.m2.gioiTinh || ''),
                ngaySinh: nfc(d.m2.ngaySinh || ''),
                giayChungSinhSo: nfc(d.m2.giayChungSinhSo || ''),
                quyenSo: nfc(d.m2.quyenSo || ''),
                ngayCap: nfc(d.m2.ngayCap || ''),
                noiCap: nfc(d.m2.noiCap || ''),
                kyHieuMau: nfc(d.m2.kyHieuMau || 'M2'),
                loaiMau: nfc(d.m2.loaiMau || ''),
                photoUrl: d.m2.photoUrl || '',
              });
            }

            if (d.table1) setTable1(d.table1);
            if (d.table2) setTable2(d.table2);
            if (d.table3) setTable3(d.table3);
            if (d.ketLuan) setKetLuan(nfc(d.ketLuan));
            if (d.doTinCay) setDoTinCay(nfc(d.doTinCay || '> 99,9999%'));

            toast.success(`Đã trích xuất dữ liệu từ file "${file.name}"!`);
          }
        }
      } catch (err) {
        console.error('Parse PDF error:', err);
        toast.error('Lỗi khi phân tích nội dung PDF');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Image upload helpers - compress to max 400px, quality 70%
  const compressImage = (dataUrl: string, maxSize = 400, quality = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        if (w > maxSize || h > maxSize) {
          if (w > h) { h = Math.round((h * maxSize) / w); w = maxSize; }
          else { w = Math.round((w * maxSize) / h); h = maxSize; }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = dataUrl;
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'm1' | 'm2') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const raw = reader.result as string;
      const compressed = await compressImage(raw);
      if (target === 'm1') setM1((prev) => ({ ...prev, photoUrl: compressed }));
      else setM2((prev) => ({ ...prev, photoUrl: compressed }));
      toast.success(`Đã cập nhật ảnh chân dung ${target === 'm1' ? 'M1' : 'M2'}!`);
    };
    reader.readAsDataURL(file);
  };

  // Export PDF
  const handleExportPdf = async () => {
    setExporting(true);
    try {
      const payload = {
        soPhieu: nfc(soPhieu),
        ngayBanHanh: nfc(ngayBanHanh),
        ngayYeuCau: nfc(ngayYeuCau),
        nguoiYeuCau: nfc(nguoiYeuCau),
        nguoiThuMau: nfc(nguoiThuMau),
        boKit: nfc(boKit),
        m1: {
          ...m1,
          hoTen: nfc(m1.hoTen),
          gioiTinh: nfc(m1.gioiTinh),
          quocTich: nfc(m1.quocTich),
          noiCap: nfc(m1.noiCap),
          noiThuongTru: nfc(m1.noiThuongTru),
        },
        m2: {
          ...m2,
          hoTen: nfc(m2.hoTen),
          gioiTinh: nfc(m2.gioiTinh),
          noiCap: nfc(m2.noiCap),
        },
        table1,
        table2,
        table3,
        ketLuan: nfc(ketLuan),
        doTinCay: nfc(doTinCay),
        kiemSoatKetQua: nfc(kiemSoatKetQua),
        daiDienDonVi: nfc(daiDienDonVi),
        uploadedPdfBase64,
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
        a.download = `Ket_Qua_Xet_Nghiem_ADN_${soPhieu || 'Chua_Dat_Ten'}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success('Đã tải xuống file PDF 5 trang đầy đủ!');
      } else {
        toast.error('Lỗi xuất file PDF');
      }
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Lỗi kết nối xuất file PDF');
    } finally {
      setExporting(false);
    }
  };

  const handleLocusChange = (
    tableIndex: 1 | 2 | 3,
    locusIdx: number,
    field: 'm1_1' | 'm1_2' | 'm2_1' | 'm2_2',
    value: string
  ) => {
    const updater = (prev: LocusItem[]) =>
      prev.map((item, idx) => (idx === locusIdx ? { ...item, [field]: value } : item));

    if (tableIndex === 1) setTable1(updater);
    else if (tableIndex === 2) setTable2(updater);
    else setTable3(updater);
  };

  const formatAllelePair = (v1: string, v2: string) => {
    const a1 = nfc(v1 || '').trim();
    const a2 = nfc(v2 || '').trim();
    if (a1 && a2) return `${a1} ; ${a2}`;
    return a1 || a2 || '';
  };

  const renderPreviewStrTable = (lociList: LocusItem[]) => {
    return (
      <div className="w-full border border-black my-1 overflow-hidden" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
        <table className="w-full border-collapse text-center text-[10px] leading-tight">
          <thead>
            <tr className="border-b border-black font-bold">
              <th className="border-r border-black w-20 p-1 relative h-8">
                <svg className="w-full h-full absolute inset-0 text-black" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <line x1="0" y1="0" x2="100" y2="100" stroke="black" strokeWidth="1.2" />
                </svg>

                <div className="relative w-full h-full flex flex-col justify-between p-0.5 text-[10px] font-bold">
                  <span className="self-end pr-0.5">Locus</span>
                  <span className="self-start pl-0.5">Mẫu</span>
                </div>
              </th>
              {lociList.map((item) => (
                <th key={item.locus} className="border-r border-black p-1 text-[10px] font-bold last:border-r-0">
                  {nfc(item.locus)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-black">
              <td className="border-r border-black font-bold p-1 text-[10px]">{nfc(m1.kyHieuMau || 'M1')}</td>
              {lociList.map((item) => (
                <td key={item.locus} className="border-r border-black p-1 font-normal last:border-r-0 min-w-[28px] h-5 text-[10px]">
                  {formatAllelePair(item.m1_1, item.m1_2)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="border-r border-black font-bold p-1 text-[10px]">{nfc(m2.kyHieuMau || 'M2')}</td>
              {lociList.map((item) => (
                <td key={item.locus} className="border-r border-black p-1 font-normal last:border-r-0 min-w-[28px] h-5 text-[10px]">
                  {formatAllelePair(item.m2_1, item.m2_2)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans select-none">
      <TopHeader />
      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-4 lg:p-6 overflow-y-auto w-full max-w-none">
          {/* Header Action Bar */}
          <div className="mb-6 bg-white p-4.5 rounded-2xl shadow-xs border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                <Dna className="w-6 h-6 text-indigo-600 animate-pulse" />
                <span>Convert Kết Quả Xét Nghiệm ADN Genetrust</span>
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Chuyển đổi kết quả chi tiết trang 3 thành phiếu kết quả chuẩn Genetrust (Font Times New Roman) & tự động ghép trang 4, 5, 6, 7
                {uploadedFileName && (
                  <span className="ml-2 font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    File vừa tải: {uploadedFileName}
                  </span>
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleClearAll}
                className="inline-flex items-center gap-2 h-10 px-3.5 text-xs font-bold rounded-xl transition-all bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 shadow-xs"
                title="Xóa trống dữ liệu để tạo phiếu mới"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xóa dữ liệu (Trống)</span>
              </button>

              <label className="cursor-pointer inline-flex items-center gap-2 h-10 px-4 text-xs font-bold rounded-xl transition-all bg-slate-100 hover:bg-slate-200 text-slate-700 shadow-xs border border-slate-300/70">
                <FileUp className="w-4 h-4 text-slate-600" />
                <span>Tải file PDF mới lên</span>
                <input type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />
              </label>

              <button
                onClick={handleExportPdf}
                disabled={exporting}
                className="inline-flex items-center gap-2 h-10 px-5 text-xs font-bold rounded-xl transition-all bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md active:scale-[0.98]"
              >
                <Download className={`w-4 h-4 ${exporting ? 'animate-bounce' : ''}`} />
                <span>Tải PDF Kết Quả (5 trang)</span>
              </button>
            </div>
          </div>

          {/* 6 Parts Form (50%) & 6 Parts Preview (50%) Full Width Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT FORM DRAWER (6 Parts = 50%) */}
            <div className="lg:col-span-6 space-y-5 bg-white p-5 rounded-2xl shadow-sm border border-slate-200/90">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-indigo-700 flex items-center gap-2">
                  <FileText className="w-4.5 h-4.5 text-indigo-600" />
                  <span>Bảng Nhập & Sửa Thông Tin Phiếu ADN</span>
                </h2>
                <button
                  onClick={handleClearAll}
                  className="text-[11px] font-bold text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-md transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa trống</span>
                </button>
              </div>

              {/* Thông tin chung */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide bg-slate-50 p-2 rounded-lg">
                  1. Thông tin chung & Số phiếu
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Số phiếu</label>
                    <input
                      type="text"
                      value={soPhieu}
                      placeholder="VD: GT010726"
                      onChange={(e) => setSoPhieu(nfc(e.target.value))}
                      className="form-input text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Ngày ban hành</label>
                    <input
                      type="text"
                      value={ngayBanHanh}
                      placeholder="Hà Nội, ngày 31 tháng 07 năm 2026."
                      onChange={(e) => setNgayBanHanh(nfc(e.target.value))}
                      className="form-input text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Ngày đơn yêu cầu</label>
                    <input
                      type="text"
                      value={ngayYeuCau}
                      placeholder="VD: 28/07/2026"
                      onChange={(e) => setNgayYeuCau(nfc(e.target.value))}
                      className="form-input text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Người yêu cầu bà(ông)</label>
                    <input
                      type="text"
                      value={nguoiYeuCau}
                      placeholder="VD: JIANG JINLAN"
                      onChange={(e) => setNguoiYeuCau(nfc(e.target.value))}
                      className="form-input text-xs font-semibold text-indigo-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Người thu mẫu</label>
                    <input
                      type="text"
                      value={nguoiThuMau}
                      placeholder="VD: Hoàng Văn Luận"
                      onChange={(e) => setNguoiThuMau(nfc(e.target.value))}
                      className="form-input text-xs font-semibold text-rose-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Bộ kit STR</label>
                    <input
                      type="text"
                      value={boKit}
                      placeholder="VD: A27Plex STR Detection Kit"
                      onChange={(e) => setBoKit(nfc(e.target.value))}
                      className="form-input text-xs font-semibold text-rose-600"
                    />
                  </div>
                </div>
              </div>

              {/* Thông tin M1 */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between bg-sky-50 p-2 rounded-lg">
                  <h3 className="text-xs font-bold text-sky-800 uppercase tracking-wide flex items-center gap-1.5">
                    <User className="w-4 h-4 text-sky-600" />
                    <span>2. Thông tin Mẫu 1 (M1 - Người yêu cầu)</span>
                  </h3>
                  <label className="cursor-pointer text-[11px] font-bold text-sky-600 hover:underline flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Tải ảnh M1</span>
                    <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, 'm1')} className="hidden" />
                  </label>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Họ và tên M1</label>
                    <input
                      type="text"
                      value={m1.hoTen}
                      placeholder="Họ và tên M1"
                      onChange={(e) => setM1({ ...m1, hoTen: nfc(e.target.value) })}
                      className="form-input text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Ký hiệu mẫu</label>
                    <input
                      type="text"
                      value={m1.kyHieuMau}
                      placeholder="M1"
                      onChange={(e) => setM1({ ...m1, kyHieuMau: nfc(e.target.value) })}
                      className="form-input text-xs font-bold text-sky-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Loại mẫu</label>
                    <input
                      type="text"
                      value={m1.loaiMau}
                      placeholder="Máu"
                      onChange={(e) => setM1({ ...m1, loaiMau: nfc(e.target.value) })}
                      className="form-input text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Giới tính</label>
                    <input
                      type="text"
                      value={m1.gioiTinh}
                      placeholder="Nam / Nữ"
                      onChange={(e) => setM1({ ...m1, gioiTinh: nfc(e.target.value) })}
                      className="form-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Ngày sinh</label>
                    <input
                      type="text"
                      value={m1.ngaySinh}
                      placeholder="dd/mm/yyyy"
                      onChange={(e) => setM1({ ...m1, ngaySinh: nfc(e.target.value) })}
                      className="form-input text-xs"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Quốc tịch</label>
                    <input
                      type="text"
                      value={m1.quocTich}
                      placeholder="Việt Nam"
                      onChange={(e) => setM1({ ...m1, quocTich: nfc(e.target.value) })}
                      className="form-input text-xs"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">CCCD / Passport</label>
                    <input
                      type="text"
                      value={m1.cccd}
                      placeholder="Số CCCD/Hộ chiếu"
                      onChange={(e) => setM1({ ...m1, cccd: nfc(e.target.value) })}
                      className="form-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Ngày cấp</label>
                    <input
                      type="text"
                      value={m1.ngayCap}
                      placeholder="dd/mm/yyyy"
                      onChange={(e) => setM1({ ...m1, ngayCap: nfc(e.target.value) })}
                      className="form-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Nơi cấp CCCD</label>
                    <input
                      type="text"
                      value={m1.noiCap}
                      placeholder="Cục Cảnh sát QLHC..."
                      onChange={(e) => setM1({ ...m1, noiCap: nfc(e.target.value) })}
                      className="form-input text-xs"
                    />
                  </div>

                  <div className="col-span-4">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Nơi thường trú</label>
                    <input
                      type="text"
                      value={m1.noiThuongTru}
                      placeholder="Địa chỉ nơi thường trú M1"
                      onChange={(e) => setM1({ ...m1, noiThuongTru: nfc(e.target.value) })}
                      className="form-input text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Thông tin M2 */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between bg-amber-50 p-2 rounded-lg">
                  <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wide flex items-center gap-1.5">
                    <Baby className="w-4 h-4 text-amber-600" />
                    <span>3. Thông tin Mẫu 2 (M2 - Người có tên dự kiến)</span>
                  </h3>
                  <label className="cursor-pointer text-[11px] font-bold text-amber-600 hover:underline flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Tải ảnh M2</span>
                    <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, 'm2')} className="hidden" />
                  </label>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Họ tên dự kiến M2</label>
                    <input
                      type="text"
                      value={m2.hoTen}
                      placeholder="Họ tên dự kiến M2"
                      onChange={(e) => setM2({ ...m2, hoTen: nfc(e.target.value) })}
                      className="form-input text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Ký hiệu mẫu</label>
                    <input
                      type="text"
                      value={m2.kyHieuMau}
                      placeholder="M2"
                      onChange={(e) => setM2({ ...m2, kyHieuMau: nfc(e.target.value) })}
                      className="form-input text-xs font-bold text-amber-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Loại mẫu</label>
                    <input
                      type="text"
                      value={m2.loaiMau}
                      placeholder="Máu"
                      onChange={(e) => setM2({ ...m2, loaiMau: nfc(e.target.value) })}
                      className="form-input text-xs"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Giới tính</label>
                    <input
                      type="text"
                      value={m2.gioiTinh}
                      placeholder="Nam / Nữ"
                      onChange={(e) => setM2({ ...m2, gioiTinh: nfc(e.target.value) })}
                      className="form-input text-xs"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Ngày sinh</label>
                    <input
                      type="text"
                      value={m2.ngaySinh}
                      placeholder="dd/mm/yyyy"
                      onChange={(e) => setM2({ ...m2, ngaySinh: nfc(e.target.value) })}
                      className="form-input text-xs"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Giấy chứng sinh số</label>
                    <input
                      type="text"
                      value={m2.giayChungSinhSo}
                      placeholder="Số giấy chứng sinh"
                      onChange={(e) => setM2({ ...m2, giayChungSinhSo: nfc(e.target.value) })}
                      className="form-input text-xs"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Quyền số</label>
                    <input
                      type="text"
                      value={m2.quyenSo}
                      placeholder="Quyền số"
                      onChange={(e) => setM2({ ...m2, quyenSo: nfc(e.target.value) })}
                      className="form-input text-xs"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Ngày cấp</label>
                    <input
                      type="text"
                      value={m2.ngayCap}
                      placeholder="dd/mm/yyyy"
                      onChange={(e) => setM2({ ...m2, ngayCap: nfc(e.target.value) })}
                      className="form-input text-xs"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Nơi cấp</label>
                    <input
                      type="text"
                      value={m2.noiCap}
                      placeholder="Nơi cấp"
                      onChange={(e) => setM2({ ...m2, noiCap: nfc(e.target.value) })}
                      className="form-input text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Editable STR Locus Tables */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide bg-slate-50 p-2 rounded-lg flex items-center justify-between">
                  <span>4. Bảng Allele 27 Loci STR</span>
                  <span className="text-[10px] text-indigo-600 font-normal">Chỉnh sửa giá trị trực tiếp</span>
                </h3>

                {/* Table 1 */}
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <div className="bg-slate-100 px-3 py-1.5 font-bold text-slate-700 text-[11px] border-b border-slate-200">
                    Bảng 1 (9 Loci: D3S1358 - D13S317)
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    <table className="w-full text-center border-collapse">
                      <thead className="bg-slate-50 text-[10px] font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-1 border-r border-slate-200">Locus</th>
                          <th className="p-1 border-r border-slate-200 bg-sky-50 text-sky-800">M1 (Alen 1)</th>
                          <th className="p-1 border-r border-slate-200 bg-sky-50 text-sky-800">M1 (Alen 2)</th>
                          <th className="p-1 border-r border-slate-200 bg-amber-50 text-amber-800">M2 (Alen 1)</th>
                          <th className="p-1 bg-amber-50 text-amber-800">M2 (Alen 2)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px]">
                        {table1.map((row, idx) => (
                          <tr key={row.locus}>
                            <td className="p-1 font-bold border-r border-slate-200">{row.locus}</td>
                            <td className="p-1 border-r border-slate-200">
                              <input
                                type="text"
                                value={row.m1_1}
                                onChange={(e) => handleLocusChange(1, idx, 'm1_1', e.target.value)}
                                className="w-full text-center font-semibold bg-transparent focus:bg-white border-0"
                              />
                            </td>
                            <td className="p-1 border-r border-slate-200">
                              <input
                                type="text"
                                value={row.m1_2}
                                onChange={(e) => handleLocusChange(1, idx, 'm1_2', e.target.value)}
                                className="w-full text-center font-semibold bg-transparent focus:bg-white border-0"
                              />
                            </td>
                            <td className="p-1 border-r border-slate-200">
                              <input
                                type="text"
                                value={row.m2_1}
                                onChange={(e) => handleLocusChange(1, idx, 'm2_1', e.target.value)}
                                className="w-full text-center font-semibold bg-transparent focus:bg-white border-0"
                              />
                            </td>
                            <td className="p-1">
                              <input
                                type="text"
                                value={row.m2_2}
                                onChange={(e) => handleLocusChange(2, idx, 'm2_2', e.target.value)}
                                className="w-full text-center font-semibold bg-transparent focus:bg-white border-0"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Table 2 */}
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <div className="bg-slate-100 px-3 py-1.5 font-bold text-slate-700 text-[11px] border-b border-slate-200">
                    Bảng 2 (9 Loci: D2S1338 - DYS391)
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    <table className="w-full text-center border-collapse">
                      <thead className="bg-slate-50 text-[10px] font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-1 border-r border-slate-200">Locus</th>
                          <th className="p-1 border-r border-slate-200 bg-sky-50 text-sky-800">M1 (Alen 1)</th>
                          <th className="p-1 border-r border-slate-200 bg-sky-50 text-sky-800">M1 (Alen 2)</th>
                          <th className="p-1 border-r border-slate-200 bg-amber-50 text-amber-800">M2 (Alen 1)</th>
                          <th className="p-1 bg-amber-50 text-amber-800">M2 (Alen 2)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px]">
                        {table2.map((row, idx) => (
                          <tr key={row.locus}>
                            <td className="p-1 font-bold border-r border-slate-200">{row.locus}</td>
                            <td className="p-1 border-r border-slate-200">
                              <input
                                type="text"
                                value={row.m1_1}
                                onChange={(e) => handleLocusChange(2, idx, 'm1_1', e.target.value)}
                                className="w-full text-center font-semibold bg-transparent focus:bg-white border-0"
                              />
                            </td>
                            <td className="p-1 border-r border-slate-200">
                              <input
                                type="text"
                                value={row.m1_2}
                                onChange={(e) => handleLocusChange(2, idx, 'm1_2', e.target.value)}
                                className="w-full text-center font-semibold bg-transparent focus:bg-white border-0"
                              />
                            </td>
                            <td className="p-1 border-r border-slate-200">
                              <input
                                type="text"
                                value={row.m2_1}
                                onChange={(e) => handleLocusChange(2, idx, 'm2_1', e.target.value)}
                                className="w-full text-center font-semibold bg-transparent focus:bg-white border-0"
                              />
                            </td>
                            <td className="p-1">
                              <input
                                type="text"
                                value={row.m2_2}
                                onChange={(e) => handleLocusChange(2, idx, 'm2_2', e.target.value)}
                                className="w-full text-center font-semibold bg-transparent focus:bg-white border-0"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Table 3 */}
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <div className="bg-slate-100 px-3 py-1.5 font-bold text-slate-700 text-[11px] border-b border-slate-200">
                    Bảng 3 (9 Loci: D8S1179 - SE33)
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    <table className="w-full text-center border-collapse">
                      <thead className="bg-slate-50 text-[10px] font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-1 border-r border-slate-200">Locus</th>
                          <th className="p-1 border-r border-slate-200 bg-sky-50 text-sky-800">M1 (Alen 1)</th>
                          <th className="p-1 border-r border-slate-200 bg-sky-50 text-sky-800">M1 (Alen 2)</th>
                          <th className="p-1 border-r border-slate-200 bg-amber-50 text-amber-800">M2 (Alen 1)</th>
                          <th className="p-1 bg-amber-50 text-amber-800">M2 (Alen 2)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[11px]">
                        {table3.map((row, idx) => (
                          <tr key={row.locus}>
                            <td className="p-1 font-bold border-r border-slate-200">{row.locus}</td>
                            <td className="p-1 border-r border-slate-200">
                              <input
                                type="text"
                                value={row.m1_1}
                                onChange={(e) => handleLocusChange(3, idx, 'm1_1', e.target.value)}
                                className="w-full text-center font-semibold bg-transparent focus:bg-white border-0"
                              />
                            </td>
                            <td className="p-1 border-r border-slate-200">
                              <input
                                type="text"
                                value={row.m1_2}
                                onChange={(e) => handleLocusChange(3, idx, 'm1_2', e.target.value)}
                                className="w-full text-center font-semibold bg-transparent focus:bg-white border-0"
                              />
                            </td>
                            <td className="p-1 border-r border-slate-200">
                              <input
                                type="text"
                                value={row.m2_1}
                                onChange={(e) => handleLocusChange(3, idx, 'm2_1', e.target.value)}
                                className="w-full text-center font-semibold bg-transparent focus:bg-white border-0"
                              />
                            </td>
                            <td className="p-1">
                              <input
                                type="text"
                                value={row.m2_2}
                                onChange={(e) => handleLocusChange(3, idx, 'm2_2', e.target.value)}
                                className="w-full text-center font-semibold bg-transparent focus:bg-white border-0"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Kết luận & Người ký */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide bg-slate-50 p-2 rounded-lg">
                  5. Kết luận & Người kiểm soát
                </h3>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Nội dung kết luận</label>
                  <input
                    type="text"
                    value={ketLuan}
                    placeholder="VD: có quan hệ huyết thống mẹ - con"
                    onChange={(e) => setKetLuan(nfc(e.target.value))}
                    className="form-input text-xs font-bold text-rose-600"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Độ tin cậy</label>
                    <input
                      type="text"
                      value={doTinCay}
                      placeholder="VD: > 99,9999%"
                      onChange={(e) => setDoTinCay(nfc(e.target.value))}
                      className="form-input text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Người kiểm soát</label>
                    <input
                      type="text"
                      value={kiemSoatKetQua}
                      placeholder="TS. BS. Nguyễn Khánh Dương"
                      onChange={(e) => setKiemSoatKetQua(nfc(e.target.value))}
                      className="form-input text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Đại diện đơn vị</label>
                    <input
                      type="text"
                      value={daiDienDonVi}
                      placeholder="CÔNG TY CỔ PHẦN GENETRUST VIỆT NAM"
                      onChange={(e) => setDaiDienDonVi(nfc(e.target.value))}
                      className="form-input text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT LIVE DOCUMENT PAPER PREVIEW (6 Parts = 50%) */}
            <div className="lg:col-span-6 flex flex-col items-center">
              <div className="w-full mb-3 flex items-center justify-between text-xs text-slate-500 font-semibold px-2">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Xem trước kết quả trực quan (Times New Roman - Trang 1 / 5 trang)</span>
                </span>
                <span className="text-[11px] text-slate-400">Khớp 100% Mẫu Chuẩn</span>
              </div>

              {/* A4 Paper Container - Explicit Times New Roman font family */}
              <div
                className="w-full bg-white border border-slate-300 rounded-xl p-8 sm:p-10 shadow-2xl space-y-3 text-slate-900 text-[13px] leading-relaxed relative min-h-[980px]"
                style={{ fontFamily: '"Times New Roman", Times, serif' }}
              >
                {/* Header Logo & Company Info (Logo 58px, company info shifted towards center) */}
                <div className="flex items-center gap-5 pl-2 pb-1">
                  <div className="shrink-0 pt-0.5">
                    <img
                      src="/Logo_Genetrust.png"
                      alt="Genetrust Logo"
                      className="h-[58px] w-[58px] object-contain"
                    />
                  </div>
                  <div className="text-left text-[#003399] leading-tight pl-3" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                    <h2 className="text-sm font-bold tracking-tight">{nfc('CÔNG TY CỔ PHẦN GENETRUST VIỆT NAM')}</h2>
                    <p className="text-[11.5px] italic mt-0.5">
                      {nfc('Địa chỉ: Số 15, Ngõ 5 Hoàng Quốc Việt, Phường Nghĩa Đô, TP Hà Nội')}
                    </p>
                    <p className="text-[11.5px] italic">{nfc('Webside: genetrust.vn')}</p>
                    <p className="text-[11.5px] italic">{nfc('Hotline: 0818 922 866')}</p>
                    <p className="text-[11.5px] italic">{nfc('Email: genetrust@gmail.com')}</p>
                  </div>
                </div>

                {/* Header Double Blue Bar Lines */}
                <div className="border-t-2 border-[#003399]"></div>
                <div className="border-t border-[#003399] -mt-2"></div>

                {/* Date & Number Box (Pure white background, no gray box) */}
                <div className="flex justify-end pt-1">
                  <div className="text-right text-[12px] italic leading-snug" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                    <p>{nfc(ngayBanHanh || 'Hà Nội, ngày .... tháng .... năm 2026.')}</p>
                    <p>
                      Số: <span className="font-semibold">{nfc(soPhieu || '..........................')}</span>
                    </p>
                  </div>
                </div>

                {/* Title (16pt Bold) */}
                <div className="text-center pt-1">
                  <h1 className="text-[16px] font-bold uppercase tracking-wide text-slate-900" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                    {nfc('KẾT QUẢ XÉT NGHIỆM ADN')}
                  </h1>
                </div>

                {/* Intro (13pt Left-aligned Text) */}
                <div className="text-left text-[13px] px-1 leading-relaxed" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                  <p>
                    {nfc('Theo đơn yêu cầu xét nghiệm ADN ngày')}{' '}
                    <span className="font-semibold">{nfc(ngayYeuCau || '.........................')}</span> {nfc('của bà(ông)')}{' '}
                    <span className="font-semibold">{nfc(nguoiYeuCau || '....................................')}</span>,{' '}
                    {nfc('Công ty Cổ phần Genetrust Việt Nam thực hiện xét nghiệm ADN cho những người sau:')}
                  </p>
                </div>

                {/* Person 1 & Person 2 Layout (Each person: photo left + info right) */}
                {/* Person 1 */}
                <div className="flex items-start gap-3 pt-2 px-1" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                  <div className="w-24 h-28 bg-slate-100 border border-slate-400 rounded-sm overflow-hidden flex items-center justify-center shrink-0">
                    {m1.photoUrl ? (
                      <img src={m1.photoUrl} alt="M1" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[11px] text-slate-400 font-serif">Ảnh M1</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-0.5 text-[12.5px] leading-snug">
                    <p>
                      <strong>1. Họ tên:</strong>{' '}{nfc(m1.hoTen || '...........................')}{' '}
                      <strong className="ml-3">Giới tính:</strong> {nfc(m1.gioiTinh || '......')} ;{' '}
                      <strong className="ml-1">Ngày sinh:</strong> {nfc(m1.ngaySinh || '.......')} ;{' '}
                      <strong className="ml-1">Quốc tịch:</strong> {nfc(m1.quocTich || '..........')}
                    </p>
                    <p>
                      <strong>CCCD/Passport:</strong>{' '}{nfc(m1.cccd || '...................................................')}{' '}
                      <strong className="ml-6">Ngày cấp:</strong> {nfc(m1.ngayCap || '....................')}
                    </p>
                    <p>
                      <strong>Nơi cấp:</strong>{' '}{nfc(m1.noiCap || '...........................................................................................................')}
                    </p>
                    <p>
                      <strong>Nơi thường trú:</strong>{' '}{nfc(m1.noiThuongTru || '...................................................................................................')}
                    </p>
                    <p>
                      <strong>Ký hiệu mẫu:</strong>{' '}<span className="font-bold">{nfc(m1.kyHieuMau || 'M1')}</span> ;{' '}
                      <strong className="ml-3">Loại mẫu:</strong> {nfc(m1.loaiMau || '................................................')}
                    </p>
                  </div>
                </div>

                {/* Person 2 */}
                <div className="flex items-start gap-3 pt-1.5 px-1" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                  <div className="w-24 h-28 bg-slate-100 border border-slate-400 rounded-sm overflow-hidden flex items-center justify-center shrink-0">
                    {m2.photoUrl ? (
                      <img src={m2.photoUrl} alt="M2" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[11px] text-slate-400 font-serif">Ảnh M2</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-0.5 text-[12.5px] leading-snug">
                    <p>
                      <strong>2. Người có tên dự kiến:</strong>{' '}{nfc(m2.hoTen || '...................................................................................')}
                    </p>
                    <p>
                      <strong>Giới tính:</strong> {nfc(m2.gioiTinh || '...............')}{' '}
                      <strong className="ml-6">Ngày sinh:</strong> {nfc(m2.ngaySinh || '........................................')}
                    </p>
                    <p>
                      <strong>Giấy chứng sinh số:</strong>{' '}{nfc(m2.giayChungSinhSo || '.....................')}{' '}
                      <strong className="ml-6">Quyền số:</strong> {nfc(m2.quyenSo || '.......................................')}
                    </p>
                    <p>
                      <strong>Ngày cấp:</strong>{' '}{nfc(m2.ngayCap || '..................................')}{' '}
                      <strong className="ml-6">Nơi cấp:</strong> {nfc(m2.noiCap || '........................................')}
                    </p>
                    <p>
                      <strong>Ký hiệu mẫu:</strong>{' '}<span className="font-bold">{nfc(m2.kyHieuMau || 'M2')}</span> ;{' '}
                      <strong className="ml-3">Loại mẫu:</strong> {nfc(m2.loaiMau || '................................................')}
                    </p>
                  </div>
                </div>

                {/* Bullet Notes (13pt font size) */}
                <div className="text-[13px] italic space-y-0.5 pt-1 pl-1" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                  <p>
                    - Người thu mẫu: <strong className="text-red-600 not-italic font-bold">{nfc(nguoiThuMau || 'Hoàng Văn Luận')}</strong>
                  </p>
                  <p>- {nfc('Các giấy tờ cá nhân do người yêu cầu xét nghiệm tự cung cấp và chịu trách nhiệm.')}</p>
                  <p>- {nfc('Các ký hiệu mẫu do Công ty Cổ phần Genetrust Việt Nam đặt.')}</p>
                  <p>
                    - {nfc('Phân tích ADN trong nhân tế bào các mẫu trên theo bộ kit')}{' '}
                    <strong className="text-red-600 not-italic font-bold">{nfc(boKit || 'A27Plex STR Detection Kit')}</strong>
                  </p>
                </div>

                {/* 3 STR Locus Tables */}
                <div className="pt-1">
                  <h3 className="text-[13px] font-bold text-slate-900 mb-1" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                    {nfc('Kết quả phân tích ADN như sau:')}
                  </h3>
                  {renderPreviewStrTable(table1)}
                  {renderPreviewStrTable(table2)}
                  {renderPreviewStrTable(table3)}
                </div>

                {/* Conclusion Section (13pt font size) */}
                <div className="pt-3 text-left space-y-1.5" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                  <h3 className="text-[14px] font-bold uppercase text-slate-900 tracking-wide">{nfc('KẾT LUẬN:')}</h3>
                  <p className="text-[13px] text-slate-900 leading-relaxed">
                    <span className="font-bold">{nfc(m1.hoTen || '.........................................')}</span> (Kí hiệu:{' '}
                    <span className="font-bold">{nfc(m1.kyHieuMau || 'M1')}</span>){' '}
                    <strong className="text-red-600 font-bold">{nfc(ketLuan || 'có quan hệ huyết thống bố - con ( cha – con)')}</strong>{' '}
                    với người có tên dự kiến{' '}
                    <span className="font-bold">{nfc(m2.hoTen || '.................................................')}</span> (Kí hiệu:{' '}
                    <span className="font-bold">{nfc(m2.kyHieuMau || 'M2')}</span>) độ tin cậy{' '}
                    <span className="font-bold">{nfc(doTinCay || '> 99,9999%')}</span>.
                  </p>
                </div>

                {/* Signatures Footer (13pt font size) */}
                <div className="pt-6 flex justify-between items-start px-12 text-[13px] font-bold text-slate-900" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                  <div className="text-center space-y-16">
                    <p className="uppercase">{nfc('KIỂM SOÁT KẾT QUẢ')}</p>
                    <p className="font-bold text-slate-900">{nfc(kiemSoatKetQua)}</p>
                  </div>

                  <div className="text-center space-y-16">
                    <p className="uppercase">{nfc('ĐẠI DIỆN ĐƠN VỊ')}</p>
                    <p className="font-bold text-slate-900">{nfc(daiDienDonVi)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* FULLSCREEN PROCESSING & LOADING OVERLAY */}
      {(loading || exporting) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-100 animate-ping opacity-30" />
              <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 border-r-indigo-600 border-b-transparent border-l-transparent animate-spin" />
              <Dna className="w-10 h-10 text-indigo-600 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">
                {loading ? 'Đang phân tích & trích xuất file PDF...' : 'Đang khởi tạo & xuất file PDF 5 trang...'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                {loading
                  ? 'Hệ thống đang trích xuất tự động 27 chỉ số Alen Loci STR và thông tin nhân thân từ file của bạn.'
                  : 'Đang tổng hợp thông tin, áp dụng phông chữ chuẩn Times New Roman và ghép các trang phụ lục.'}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 py-2.5 px-4 rounded-xl border border-indigo-100">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Vui lòng đợi trong giây lát...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
