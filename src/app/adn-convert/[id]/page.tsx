'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import TopHeader from '@/components/TopHeader';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import SampleTypeSelect from '@/components/SampleTypeSelect';
import ImageDropzone from '@/components/ImageDropzone';
import {
  Dna,
  FileText,
  Upload,
  Download,
  Save,
  Trash2,
  Loader2,
  Eye,
  Plus,
  ShieldCheck,
  Image as ImageIcon,
  Lock as LockIcon,
  CheckCircle2,
  Package,
  X,
  Sparkles,
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
  loaiGiayTo?: string;
  moiQuanHe?: string;
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
  loaiXetNghiemADN: 'phap_ly' | 'tu_nguyen' | 'y_chr';
  soPhieu: string;
  ngayBanHanh: string;
  ngayYeuCau: string;
  nguoiYeuCau: string;
  nguoiThuMau: string;
  boKit: string;
  canBoXetNghiem?: string;
  daiDienDonVi: string;
  kiemSoatKetQua: string;
  trangThai: 'gui_mau' | 'dang_chay_mau' | 'da_tra_ket_qua';
  dieuKien?: 'du_dieu_kien' | 'khong_du_dieu_kien' | 'chua_xac_nhan';
  anhGuiMau?: string;
  anhNhanMau?: string;
  mauDanhSach: SampleItem[];
  table1: LocusItem[];
  table2: LocusItem[];
  table3: LocusItem[];
  ketLuan: string;
  doTinCay: string;
  totalLikelihoodRatio?: string;
  probabilityOfPaternity?: string;
  anhChayMauList?: string[];
}

const compressBase64Image = (base64Str: string, maxWidth = 1400, quality = 0.75): Promise<string> => {
  return new Promise((resolve) => {
    if (!base64Str || typeof base64Str !== 'string' || !base64Str.startsWith('data:image')) {
      return resolve(base64Str);
    }
    if (base64Str.length < 350000) {
      return resolve(base64Str);
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxWidth) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxWidth) / height);
          height = maxWidth;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(base64Str);

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(base64Str);
    img.src = base64Str;
  });
};

export default function AdnOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();

  const userRole = (session?.user as { role?: string })?.role;
  const isAdmin = userRole === 'admin';

  const [order, setOrder] = useState<AdnOrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [uploadingResultFile, setUploadingResultFile] = useState(false);
  const [uploadingChartFile, setUploadingChartFile] = useState(false);

  const [zoomImage, setZoomImage] = useState<{ url: string; title: string } | null>(null);

  const [anhChayMauList, setAnhChayMauList] = useState<string[]>([]);

  // Form states
  const [soPhieu, setSoPhieu] = useState('');
  const [loaiXetNghiemADN, setLoaiXetNghiemADN] = useState<'phap_ly' | 'tu_nguyen' | 'y_chr' | 'x_chr'>('phap_ly');
  const [ngayYeuCau, setNgayYeuCau] = useState('');
  const [ngayBanHanh, setNgayBanHanh] = useState('');
  const [nguoiYeuCau, setNguoiYeuCau] = useState('');
  const [nguoiThuMau, setNguoiThuMau] = useState('Hoàng Văn Luận');
  const [boKit, setBoKit] = useState('A27Plex STR Detection Kit');
  const [canBoXetNghiem, setCanBoXetNghiem] = useState('');
  const [daiDienDonVi, setDaiDienDonVi] = useState('');
  const [kiemSoatKetQua, setKiemSoatKetQua] = useState('TS. BS. Nguyễn Khánh Dương');
  const [ketLuan, setKetLuan] = useState('');
  const [doTinCay, setDoTinCay] = useState('> 99,9999%');
  const [totalLikelihoodRatio, setTotalLikelihoodRatio] = useState('23109010868637.6');
  const [probabilityOfPaternity, setProbabilityOfPaternity] = useState('99.9999999999957%');
  const [trangThai, setTrangThai] = useState<'gui_mau' | 'dang_chay_mau' | 'da_tra_ket_qua'>('gui_mau');
  const isLocusDisabled = trangThai === 'da_tra_ket_qua' && !isAdmin;
  const [dieuKien, setDieuKien] = useState<'du_dieu_kien' | 'khong_du_dieu_kien' | 'chua_xac_nhan'>('chua_xac_nhan');
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [receiveDieuKien, setReceiveDieuKien] = useState<'du_dieu_kien' | 'khong_du_dieu_kien'>('du_dieu_kien');

  // Genetrust Convert Modal State
  const [showGtModal, setShowGtModal] = useState(false);
  const [gtCanBo, setGtCanBo] = useState('');
  const [gtDaiDien, setGtDaiDien] = useState('');

  const handleConfirmReceive = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/adn/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'nhan_mau',
          trangThai: 'dang_chay_mau',
          dieuKien: receiveDieuKien,
          anhNhanMau,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setTrangThai('dang_chay_mau');
        setDieuKien(receiveDieuKien);
        toast.success('Đã nhận mẫu thành công! Chuyển sang trạng thái Đang chạy mẫu.');
        setShowReceiveModal(false);
      } else {
        toast.error(json.error || 'Lỗi khi nhận mẫu');
      }
    } catch {
      toast.error('Lỗi kết nối khi nhận mẫu');
    } finally {
      setSaving(false);
    }
  };

  const [anhGuiMau, setAnhGuiMau] = useState('');
  const [anhNhanMau, setAnhNhanMau] = useState('');
  const [mauDanhSach, setMauDanhSach] = useState<SampleItem[]>([]);

  // 3 Loci comparison tables
  const [table1, setTable1] = useState<LocusItem[]>([]);
  const [table2, setTable2] = useState<LocusItem[]>([]);
  const [table3, setTable3] = useState<LocusItem[]>([]);

  // Preview tab state
  const [previewTab, setPreviewTab] = useState<'pdf' | 'page1' | 'run' | 'cccd'>('pdf');
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string>('');
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [pdfLang, setPdfLang] = useState<'vi' | 'en'>('vi');

  const generatePdfPreview = async (targetLang?: 'vi' | 'en') => {
    setGeneratingPreview(true);
    const langToUse = targetLang || pdfLang;
    try {
      const payload = {
        loaiXetNghiemADN,
        soPhieu,
        ngayYeuCau,
        ngayBanHanh,
        nguoiYeuCau,
        nguoiThuMau,
        boKit,
        canBoXetNghiem,
        daiDienDonVi,
        mauDanhSach,
        anhChayMauList,
        table1,
        table2,
        table3,
        ketLuan,
        doTinCay,
        totalLikelihoodRatio,
        probabilityOfPaternity,
        lang: langToUse,
      };
      const res = await fetch('/api/adn/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setPdfPreviewUrl(url);
      }
    } catch (e) {
      console.error('PDF Preview error:', e);
    } finally {
      setGeneratingPreview(false);
    }
  };

  const deepNfc = (obj: any): any => {
    if (!obj) return obj;
    if (typeof obj === 'string') {
      if (obj.startsWith('data:') || obj.length > 300) return obj;
      return obj.normalize('NFC');
    }
    if (Array.isArray(obj)) return obj.map(deepNfc);
    if (typeof obj === 'object') {
      const res: any = {};
      for (const key of Object.keys(obj)) {
        res[key] = deepNfc(obj[key]);
      }
      return res;
    }
    return obj;
  };

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/adn/orders/${id}`);
        const json = await res.json();
        if (json.success && json.data) {
          const d: AdnOrderData = deepNfc(json.data);
          setOrder(d);
          setSoPhieu(d.soPhieu || d.maSo || '');
          setLoaiXetNghiemADN(d.loaiXetNghiemADN || 'phap_ly');
          setNgayYeuCau(d.ngayYeuCau || new Date().toISOString().split('T')[0]);
          setNgayBanHanh(d.ngayBanHanh || '');
          setNguoiYeuCau(d.nguoiYeuCau || '');
          setNguoiThuMau(d.nguoiThuMau || 'Hoàng Văn Luận');
          setBoKit(d.boKit || 'A27Plex STR Detection Kit');
          setCanBoXetNghiem(d.canBoXetNghiem || '');
          setDaiDienDonVi(d.daiDienDonVi || '');
          setKiemSoatKetQua(d.kiemSoatKetQua || 'TS. BS. Nguyễn Khánh Dương');
          setKetLuan(d.ketLuan || '');
          setDoTinCay(d.doTinCay || '> 99,9999%');
          setTotalLikelihoodRatio(d.totalLikelihoodRatio || '23109010868637.6');
          setProbabilityOfPaternity(d.probabilityOfPaternity || '99.9999999999957%');
          setTrangThai(d.trangThai || 'gui_mau');
          setDieuKien(d.dieuKien || 'chua_xac_nhan');
          setAnhGuiMau(d.anhGuiMau || '');
          setAnhNhanMau(d.anhNhanMau || '');
          const chartList = d.anhChayMauList || [];
          setAnhChayMauList(chartList);

          let samples = d.mauDanhSach || [];
          const isLocusSample = (s: SampleItem) => {
            const k = (s.kyHieuMau || '').trim().toUpperCase();
            return /^(GATA\w+|DXS\d+|DYS\d+|D\d+S\d+|AMEL|HPRTB|SE\d+|TH\d+|TPOX|CSF1PO|FGA|VWA)/i.test(k) ||
                   /^(Mẫu\s*(1\s*)?D\d*XS|Mẫu\s*GATA|Mẫu\s*DXS)/i.test(s.hoTen || '');
          };
          if (samples.length > 2 && samples.some(isLocusSample)) {
            samples = samples.filter(s => !isLocusSample(s));
          }
          setMauDanhSach(samples);
          const t1 = normalizeLociTable(d.table1 || [], samples);
          const t2 = normalizeLociTable(d.table2 || [], samples);
          const t3 = normalizeLociTable(d.table3 || [], samples);
          setTable1(t1);
          setTable2(t2);
          setTable3(t3);

          setLoading(false);

          // Auto generate initial live PDF preview asynchronously after initial UI paint
          setTimeout(() => {
            const initialPayload = {
              loaiXetNghiemADN: d.loaiXetNghiemADN || 'phap_ly',
              soPhieu: d.soPhieu || d.maSo || '',
              ngayYeuCau: d.ngayYeuCau || '',
              ngayBanHanh: d.ngayBanHanh || '',
              nguoiYeuCau: d.nguoiYeuCau || '',
              nguoiThuMau: d.nguoiThuMau || 'Hoàng Văn Luận',
              boKit: d.boKit || 'A27Plex STR Detection Kit',
              canBoXetNghiem: d.canBoXetNghiem || '',
              daiDienDonVi: d.daiDienDonVi || '',
              mauDanhSach: samples,
              anhChayMauList: chartList,
              table1: t1,
              table2: t2,
              table3: t3,
              ketLuan: d.ketLuan || '',
              doTinCay: d.doTinCay || '> 99,9999%',
              totalLikelihoodRatio: d.totalLikelihoodRatio || '23109010868637.6',
              probabilityOfPaternity: d.probabilityOfPaternity || '99.9999999999957%',
            };
            fetch('/api/adn/export-pdf', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(initialPayload),
            })
              .then((r) => r.blob())
              .then((blob) => setPdfPreviewUrl(URL.createObjectURL(blob)))
              .catch((e) => console.error('Initial PDF preview error:', e));
          }, 200);
        } else {
          toast.error('Không tìm thấy đơn xét nghiệm');
          setLoading(false);
        }
      } catch (err) {
        toast.error('Lỗi khi tải thông tin đơn xét nghiệm');
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
        // 1. Direct match in alleles map
        if (
          item.alleles &&
          item.alleles[sKey] &&
          (item.alleles[sKey].a1 !== undefined || item.alleles[sKey].a2 !== undefined)
        ) {
          alleles[sKey] = {
            a1: String(item.alleles[sKey].a1 ?? ''),
            a2: String(item.alleles[sKey].a2 ?? ''),
          };
          return;
        }

        // 2. Fuzzy match in alleles map (case-insensitive, substring, or index)
        if (item.alleles && typeof item.alleles === 'object') {
          const matchingKey = Object.keys(item.alleles).find(
            (k) =>
              k.toLowerCase() === sKey.toLowerCase() ||
              sKey.toLowerCase().includes(k.toLowerCase()) ||
              k.toLowerCase().includes(sKey.toLowerCase())
          );
          if (matchingKey && item.alleles[matchingKey]) {
            alleles[sKey] = {
              a1: String(item.alleles[matchingKey].a1 ?? ''),
              a2: String(item.alleles[matchingKey].a2 ?? ''),
            };
            return;
          }

          // By index in alleles keys
          const allKeys = Object.keys(item.alleles);
          if (sIdx < allKeys.length) {
            const valByIndex = item.alleles[allKeys[sIdx]];
            if (valByIndex && (valByIndex.a1 !== undefined || valByIndex.a2 !== undefined)) {
              alleles[sKey] = {
                a1: String(valByIndex.a1 ?? ''),
                a2: String(valByIndex.a2 ?? ''),
              };
              return;
            }
          }
        }

        // 3. Fallback to m1_1, m2_1 legacy fields
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
      });

      return { ...item, locus, alleles };
    });
  };

  // Helper for image upload (convert to JPEG & upload to Cloudinary if available)
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

  // 1. Upload DOCX/PDF Result Files from user's computer to parse Loci tables into the current order
  const handleFileUploadLoci = async (e: React.ChangeEvent<HTMLInputElement> | File) => {
    let files: FileList | File[] | null = null;
    if (e instanceof File) {
      files = [e];
    } else if (e.target?.files) {
      files = e.target.files;
    }
    if (!files || files.length === 0) return;

    setUploadingResultFile(true);
    let successCount = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/adn/parse-pdf', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            const d = json.data;

            const hasTable1 = d.table1 && d.table1.length > 0;
            const hasTable2 = d.table2 && d.table2.length > 0;
            const hasTable3 = d.table3 && d.table3.length > 0;

            if (!hasTable1 && !hasTable2 && !hasTable3) {
              toast.error(`❌ Không đọc được dữ liệu bảng Loci từ file "${file.name}". Vui lòng kiểm tra lại cấu trúc bảng trong file!`);
              continue;
            }

            // Synchronize sample codes if detected from file (e.g. BN260002XHK, CG260002XHK or B260001, C260001)
            let currentSamples = [...mauDanhSach];
            // Clean any locus-named samples first
            currentSamples = currentSamples.filter(s => !/^(GATA\w+|DXS\d+|DYS\d+|D\d+S\d+|AMEL|HPRTB)/i.test((s.kyHieuMau || '').trim()));
            if (d.samples && Array.isArray(d.samples) && d.samples.length > 0) {
              const updatedSamples = [...currentSamples];
              d.samples.forEach((sCode: string, idx: number) => {
                if (idx < updatedSamples.length) {
                  updatedSamples[idx] = {
                    ...updatedSamples[idx],
                    kyHieuMau: sCode || updatedSamples[idx].kyHieuMau,
                  };
                }
              });
              // Never push extra samples from locus parsing!
              currentSamples = updatedSamples;
              setMauDanhSach(updatedSamples);
            }

            // Fill Loci tables into form using current samples
            if (hasTable1) setTable1(normalizeLociTable(d.table1, currentSamples));
            if (hasTable2) setTable2(normalizeLociTable(d.table2, currentSamples));
            if (hasTable3) setTable3(normalizeLociTable(d.table3, currentSamples));
            if (d.ketLuan) setKetLuan(d.ketLuan);
            if (d.doTinCay) setDoTinCay(d.doTinCay);
            if (d.totalLikelihoodRatio) setTotalLikelihoodRatio(d.totalLikelihoodRatio);
            if (d.probabilityOfPaternity) setProbabilityOfPaternity(d.probabilityOfPaternity);

            successCount++;

            // Ticket code info notice
            if (d.soPhieu) {
              const fileCode = String(d.soPhieu).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
              const currentCode = String(soPhieu).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

              if (fileCode && currentCode && !currentCode.includes(fileCode) && !fileCode.includes(currentCode)) {
                toast.success(`Đã nạp dữ liệu bảng Locus từ file ${file.name} (Mã ca gốc trong file: ${d.soPhieu})!`, {
                  duration: 6000,
                });
              } else {
                toast.success(`Đã nạp bảng Locus thành công từ file ${file.name}!`);
              }
            } else {
              toast.success(`Đã nạp bảng Locus thành công từ file ${file.name}!`);
            }
          } else {
            toast.error(json.error || `Không thể đọc dữ liệu từ file ${file.name}`);
          }
        } else {
          const json = await res.json().catch(() => ({}));
          toast.error(json.error || `Không thể đọc dữ liệu từ file ${file.name}`);
        }
      }

      if (successCount > 0) {
        toast.success(`Hoàn tất nạp dữ liệu ${successCount}/${files.length} file Loci!`);
        setTimeout(() => {
          generatePdfPreview();
        }, 300);
      }
    } catch (err) {
      toast.error('Lỗi khi đọc bảng Loci từ file');
    } finally {
      setUploadingResultFile(false);
    }
  };

  // 2. Upload GeneMapper / Peak Result Chart Images (Image files or DOCX/PDF) to append to PDF pages
  const handleFileUploadChartImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingChartFile(true);
    let successCount = 0;
    const newChartImages: string[] = [...anhChayMauList];
    const updatedSamples = [...mauDanhSach];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (file.type.startsWith('image/')) {
          // Direct Image File
          const reader = new FileReader();
          await new Promise((resolve) => {
            reader.onload = () => {
              const b64 = reader.result as string;
              if (!newChartImages.includes(b64)) {
                newChartImages.push(b64);
              }
              const emptySample = updatedSamples.find((s) => !s.anhKetQuaChay);
              if (emptySample) {
                emptySample.anhKetQuaChay = b64;
              }
              resolve(null);
            };
            reader.readAsDataURL(file);
          });
          successCount++;
        } else {
          // DOCX or PDF containing embedded chart images
          const formData = new FormData();
          formData.append('file', file);

          const res = await fetch('/api/adn/parse-pdf', {
            method: 'POST',
            body: formData,
          });

          if (res.ok) {
            const json = await res.json();
            if (json.success && json.data && json.data.images) {
              const imgs = json.data.images;
              if (Array.isArray(imgs) && imgs.length > 0) {
                imgs.forEach((imgB64: string) => {
                  newChartImages.push(imgB64);
                  const emptySample = updatedSamples.find((s) => !s.anhKetQuaChay);
                  if (emptySample) {
                    emptySample.anhKetQuaChay = imgB64;
                  }
                });
                successCount++;
                toast.success(`Đã trích xuất ${imgs.length} ảnh đồ thị từ file ${file.name}!`);
              } else {
                toast.error(`Không tìm thấy ảnh đồ thị trong file ${file.name}`);
              }
            } else {
              toast.error(json.error || `Không thể trích xuất ảnh từ file ${file.name}`);
            }
          } else {
            const errJson = await res.json().catch(() => ({}));
            toast.error(errJson.error || `Lỗi xử lý file ${file.name}`);
          }
        }
      }

      setMauDanhSach(updatedSamples);
      setAnhChayMauList(newChartImages);

      if (successCount > 0) {
        toast.success(`Đã đính kèm ${successCount} tệp ảnh đồ thị! Đang cập nhật PDF...`);
        setTimeout(() => {
          generatePdfPreview();
        }, 300);
      }
    } catch (err) {
      toast.error('Lỗi khi tải ảnh đồ thị sắc ký');
    } finally {
      setUploadingChartFile(false);
    }
  };

  // Save changes & update status
  const handleSaveOrder = async (targetStatus?: 'gui_mau' | 'dang_chay_mau' | 'da_tra_ket_qua') => {
    setSaving(true);
    const newStatus = targetStatus || trangThai;

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

    try {
      // Compress image fields before sending to prevent MongoDB 16MB document size limit error
      const compressedMauDanhSach = await Promise.all(
        formattedMauDanhSach.map(async (s) => ({
          ...s,
          anhChanDung: s.anhChanDung ? await compressBase64Image(s.anhChanDung) : '',
          anhCccdMatTruoc: s.anhCccdMatTruoc ? await compressBase64Image(s.anhCccdMatTruoc) : '',
          anhCccdMatSau: s.anhCccdMatSau ? await compressBase64Image(s.anhCccdMatSau) : '',
          anhKetQuaChay: s.anhKetQuaChay ? await compressBase64Image(s.anhKetQuaChay) : '',
        }))
      );

      const compressedAnhChayMauList = await Promise.all(
        anhChayMauList.map((img) => compressBase64Image(img))
      );

      const compressedAnhGuiMau = anhGuiMau ? await compressBase64Image(anhGuiMau) : '';
      const compressedAnhNhanMau = anhNhanMau ? await compressBase64Image(anhNhanMau) : '';

      const res = await fetch(`/api/adn/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          soPhieu,
          loaiXetNghiemADN,
          ngayYeuCau,
          ngayBanHanh: ngayBanHanh && ngayBanHanh.trim()
            ? ngayBanHanh
            : `Hà Nội, ngày ${String(new Date().getDate()).padStart(2, '0')} tháng ${String(new Date().getMonth() + 1).padStart(2, '0')} năm ${new Date().getFullYear()}.`,
          nguoiYeuCau,
          nguoiThuMau,
          boKit,
          canBoXetNghiem,
          daiDienDonVi,
          kiemSoatKetQua,
          ketLuan,
          doTinCay,
          totalLikelihoodRatio,
          probabilityOfPaternity,
          trangThai: newStatus,
          dieuKien,
          anhGuiMau: compressedAnhGuiMau,
          anhNhanMau: compressedAnhNhanMau,
          mauDanhSach: compressedMauDanhSach,
          anhChayMauList: compressedAnhChayMauList,
          table1,
          table2,
          table3,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setTrangThai(newStatus);
        const msg = targetStatus === 'da_tra_ket_qua' ? 'Đã trả kết quả xét nghiệm ADN thành công!' : 'Đã cập nhật kết quả thành công!';
        toast.success(msg);

        // Auto update live PDF preview
        await generatePdfPreview();
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
        canBoXetNghiem,
        daiDienDonVi,
        kiemSoatKetQua,
        ketLuan,
        doTinCay,
        totalLikelihoodRatio,
        probabilityOfPaternity,
        mauDanhSach,
        anhChayMauList,
        table1,
        table2,
        table3,
        lang: pdfLang,
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

  // Download DOCX Result
  const handleDownloadDocx = async () => {
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
        canBoXetNghiem,
        daiDienDonVi,
        kiemSoatKetQua,
        ketLuan,
        doTinCay,
        totalLikelihoodRatio,
        probabilityOfPaternity,
        mauDanhSach,
        anhChayMauList,
        table1,
        table2,
        table3,
        lang: pdfLang,
      };

      const res = await fetch('/api/adn/export-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Ket_Qua_ADN_${soPhieu}.docx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success('Đã tải file DOCX kết quả về máy!');
      } else {
        toast.error('Tạo file DOCX thất bại');
      }
    } catch (err) {
      toast.error('Lỗi khi tải file DOCX');
    } finally {
      setExportingPdf(false);
    }
  };

  // Download DOCX Result (Genetrust Brand)
  const handleDownloadDocxGenetrust = async (overrideCanBo?: string, overrideDaiDien?: string) => {
    setExportingPdf(true);
    try {
      const finalCanBo = overrideCanBo !== undefined ? overrideCanBo : canBoXetNghiem;
      const finalDaiDien = overrideDaiDien !== undefined ? overrideDaiDien : daiDienDonVi;

      if (overrideCanBo !== undefined) setCanBoXetNghiem(overrideCanBo);
      if (overrideDaiDien !== undefined) setDaiDienDonVi(overrideDaiDien);

      const payload = {
        _id: id,
        soPhieu,
        loaiXetNghiemADN,
        ngayYeuCau,
        ngayBanHanh,
        nguoiYeuCau,
        nguoiThuMau,
        boKit,
        canBoXetNghiem: finalCanBo,
        daiDienDonVi: finalDaiDien,
        kiemSoatKetQua,
        ketLuan,
        doTinCay,
        totalLikelihoodRatio,
        probabilityOfPaternity,
        mauDanhSach,
        anhChayMauList,
        table1,
        table2,
        table3,
        isGenetrust: true,
        lang: pdfLang,
      };

      const res = await fetch('/api/adn/export-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Ket_Qua_ADN_Genetrust_${soPhieu}.docx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success('Đã convert và tải file DOCX kết quả Genetrust về máy!');
      } else {
        toast.error('Tạo file DOCX Genetrust thất bại');
      }
    } catch (err) {
      toast.error('Lỗi khi tải file DOCX');
    } finally {
      setExportingPdf(false);
    }
  };

  // Download PDF Result (Genetrust Brand)
  const handleDownloadPdfGenetrust = async (overrideCanBo?: string, overrideDaiDien?: string) => {
    setExportingPdf(true);
    try {
      const finalCanBo = overrideCanBo !== undefined ? overrideCanBo : canBoXetNghiem;
      const finalDaiDien = overrideDaiDien !== undefined ? overrideDaiDien : daiDienDonVi;

      if (overrideCanBo !== undefined) setCanBoXetNghiem(overrideCanBo);
      if (overrideDaiDien !== undefined) setDaiDienDonVi(overrideDaiDien);

      const payload = {
        _id: id,
        soPhieu,
        loaiXetNghiemADN,
        ngayYeuCau,
        ngayBanHanh,
        nguoiYeuCau,
        nguoiThuMau,
        boKit,
        canBoXetNghiem: finalCanBo,
        daiDienDonVi: finalDaiDien,
        kiemSoatKetQua,
        ketLuan,
        doTinCay,
        totalLikelihoodRatio,
        probabilityOfPaternity,
        mauDanhSach,
        anhChayMauList,
        table1,
        table2,
        table3,
        isGenetrust: true,
        lang: pdfLang,
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
        a.download = `Ket_Qua_ADN_Genetrust_${soPhieu}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success('Đã convert và tải file PDF kết quả Genetrust về máy!');
      } else {
        toast.error('Tạo file PDF Genetrust thất bại');
      }
    } catch (err) {
      toast.error('Lỗi khi tải file PDF');
    } finally {
      setExportingPdf(false);
    }
  };

  // Render Loci Table Editor
  const renderLociEditor = (tableData: LocusItem[], setTableData: (val: LocusItem[]) => void, title: string) => {
    if (!mauDanhSach || mauDanhSach.length === 0 || !tableData || tableData.length === 0) return null;
    return (
      <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">{title} ({tableData.length} Locus)</h4>
          <button
            type="button"
            onClick={() => {
              const updated = [...tableData, { locus: '', alleles: {} }];
              setTableData(updated);
            }}
            disabled={isLocusDisabled}
            className="text-[11px] text-sky-600 hover:text-sky-800 font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-40"
          >
            <Plus className="w-3 h-3" />
            <span>Thêm dòng</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-center border-collapse bg-white rounded-lg overflow-hidden shadow-xs">
            <thead>
              <tr className="bg-sky-600 text-white font-bold">
                <th className="p-2 border border-sky-700 w-10 text-center">STT</th>
                <th className="p-2.5 border border-sky-700 w-32">Locus</th>
                {mauDanhSach.map((s, idx) => (
                  <th key={idx} className="p-2.5 border border-sky-700">
                    {s.kyHieuMau || `M${idx + 1}`} ({s.hoTen || 'Chưa nhập tên'})
                  </th>
                ))}
                <th className="p-2 border border-sky-700 w-10 text-center">Xóa</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((item, locIdx) => (
                <tr key={locIdx} className="hover:bg-slate-100/80 transition-colors">
                  <td className="p-1.5 text-center text-slate-400 font-mono text-[11px] border border-slate-200 bg-slate-50">
                    {locIdx + 1}
                  </td>
                  <td className="p-1 border border-slate-200 bg-slate-50">
                    <input
                      type="text"
                      value={item.locus}
                      onChange={(e) => {
                        const updated = [...tableData];
                        updated[locIdx].locus = e.target.value;
                        setTableData(updated);
                      }}
                      disabled={isLocusDisabled}
                      className="w-full text-center font-bold text-slate-800 bg-transparent border-0 focus:ring-1 focus:ring-sky-500 rounded py-1 text-xs"
                      placeholder="Tên Locus"
                    />
                  </td>
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
                            disabled={isLocusDisabled}
                            className="w-12 text-center border border-slate-300 rounded-md py-1 text-xs focus:ring-1 focus:ring-sky-500 font-mono font-bold disabled:bg-slate-100 disabled:text-slate-500"
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
                            disabled={isLocusDisabled}
                            className="w-12 text-center border border-slate-300 rounded-md py-1 text-xs focus:ring-1 focus:ring-sky-500 font-mono font-bold disabled:bg-slate-100 disabled:text-slate-500"
                            placeholder="Alil 2"
                          />
                        </div>
                      </td>
                    );
                  })}
                  <td className="p-1 border border-slate-200 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        const updated = tableData.filter((_, idx) => idx !== locIdx);
                        setTableData(updated);
                      }}
                      disabled={isLocusDisabled}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors disabled:opacity-30 cursor-pointer"
                      title="Xóa dòng locus này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
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
      <div className="min-h-screen bg-slate-50 flex overflow-hidden h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          <TopHeader />
          <main className="flex-1 p-8 text-center text-slate-500">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
              <span className="text-sm font-semibold text-slate-600">Đang tải thông tin phiếu...</span>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const isReadOnly = false;

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <TopHeader />

        <main className="flex-1 p-6 md:p-8 w-full overflow-y-auto">
          <Header
            title={`Phiếu xét nghiệm ADN: ${soPhieu}`}
            subtitle={`Bệnh nhân: ${mauDanhSach[0]?.hoTen || 'Xét nghiệm ADN'} (${
              loaiXetNghiemADN === 'phap_ly'
                ? 'Mẫu ADN Pháp Lý'
                : loaiXetNghiemADN === 'y_chr'
                ? 'Mẫu ADN Nhiễm Sắc Thể Y'
                : loaiXetNghiemADN === 'x_chr'
                ? 'Mẫu ADN Nhiễm Sắc Thể X'
                : 'Mẫu ADN Tự Nguyện'
            })`}
            action={
              <div className="flex items-center gap-3">
                {trangThai === 'gui_mau' && (
                  <>
                    <button
                      onClick={() => setShowReceiveModal(true)}
                      disabled={saving}
                      className="btn btn-primary"
                    >
                      <Package className="w-4 h-4" />
                      <span>Nhận Mẫu</span>
                    </button>

                    <button
                      onClick={() => handleSaveOrder()}
                      disabled={saving}
                      className="btn btn-secondary"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span>Lưu thông tin</span>
                    </button>
                  </>
                )}

                {trangThai === 'dang_chay_mau' && (
                  <>
                    <button
                      onClick={() => handleSaveOrder()}
                      disabled={saving}
                      className="btn btn-primary"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span>Lưu kết quả</span>
                    </button>

                    <button
                      onClick={() => handleSaveOrder('da_tra_ket_qua')}
                      disabled={saving}
                      className="btn btn-success"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      <span>Trả Kết Quả</span>
                    </button>
                  </>
                )}

                {trangThai === 'da_tra_ket_qua' && (
                  <>
                    <button
                      onClick={() => handleSaveOrder()}
                      disabled={saving}
                      className="btn btn-secondary"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span>Lưu thay đổi</span>
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setGtCanBo(canBoXetNghiem || '');
                          setGtDaiDien(daiDienDonVi || 'CÔNG TY CỔ PHẦN GENETRUST VIỆT NAM');
                          setShowGtModal(true);
                        }}
                        disabled={exportingPdf}
                        className="btn bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        {exportingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        <span>Convert kết quả sang Genetrust</span>
                      </button>
                    )}
                  </>
                )}

                <button
                  onClick={handleDownloadPdf}
                  disabled={exportingPdf}
                  className="btn btn-secondary"
                >
                  {exportingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  <span>Download PDF kết quả</span>
                </button>
              </div>
            }
          />

          <div className="space-y-6">
            {/* Status Info Banner */}
            {trangThai === 'da_tra_ket_qua' && (
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 font-semibold flex items-center gap-2.5 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  Đơn đang ở trạng thái <strong>Đã trả kết quả</strong>. Bạn vẫn có thể trực tiếp chỉnh sửa thông tin và bấm <strong>Lưu thay đổi</strong> để cập nhật file PDF.
                </span>
              </div>
            )}

            {/* Section 1: Thông tin hành chính đơn ADN */}
            <div className="glass-card p-6">
              <h3 className="flex items-center gap-2 text-base font-bold text-sky-700 mb-4 pb-3 border-b border-slate-100">
                <Dna className="w-5 h-5 text-sky-600" />
                <span>1. Thông Tin Chung & Danh Sách Mẫu ({mauDanhSach.length} mẫu)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="form-group mb-0">
                  <label>Người yêu cầu</label>
                  <input
                    type="text"
                    value={nguoiYeuCau}
                    onChange={(e) => setNguoiYeuCau(e.target.value)}
                    disabled={isReadOnly}
                    className="form-input font-bold disabled:bg-slate-100 disabled:text-slate-600"
                  />
                </div>

                <div className="form-group mb-0">
                  <label>Ngày yêu cầu</label>
                  <input
                    type="date"
                    value={ngayYeuCau?.includes('/') ? ngayYeuCau.split('/').reverse().join('-') : ngayYeuCau}
                    onChange={(e) => setNgayYeuCau(e.target.value)}
                    disabled={isReadOnly}
                    className="form-input disabled:bg-slate-100 disabled:text-slate-600"
                  />
                </div>

                <div className="form-group mb-0">
                  <label>Bộ kit STR</label>
                  <input
                    type="text"
                    value={boKit}
                    onChange={(e) => setBoKit(e.target.value)}
                    disabled={isReadOnly}
                    className="form-input disabled:bg-slate-100 disabled:text-slate-600"
                  />
                </div>

                <div className="form-group mb-0">
                  <label>Người thu mẫu / nhận mẫu</label>
                  <input
                    type="text"
                    value={nguoiThuMau}
                    onChange={(e) => setNguoiThuMau(e.target.value)}
                    placeholder="VD: Hoàng Văn Luận"
                    disabled={isReadOnly}
                    className="form-input disabled:bg-slate-100 disabled:text-slate-600"
                  />
                </div>
              </div>

              {/* List of Samples (M1, M2, M3...) */}
              <div className="mt-6 pt-4 border-t border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-800">Chi tiết thông tin từng mẫu:</span>
                  {!isReadOnly && (
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
                      className="btn btn-secondary text-xs py-1.5 px-3"
                    >
                      <Plus className="w-4 h-4" /> Thêm mẫu
                    </button>
                  )}
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
                            disabled={isReadOnly}
                            className="form-input w-24 py-1 text-xs font-bold text-sky-700 disabled:bg-slate-100 disabled:text-slate-600"
                          />
                        </div>
                        {!isReadOnly && mauDanhSach.length > 2 && (
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
                          <label>{(loaiXetNghiemADN === 'phap_ly' && idx > 0 && (sample.loaiGiayTo === 'giay_chung_sinh' || (!sample.loaiGiayTo && (sample.quyenSo || true)))) ? 'Tên dự kiến' : 'Họ tên'}</label>
                          <input
                            type="text"
                            value={sample.hoTen}
                            onChange={(e) => {
                              const updated = [...mauDanhSach];
                              updated[idx].hoTen = e.target.value;
                              setMauDanhSach(updated);
                            }}
                            disabled={isReadOnly}
                            className="form-input font-bold disabled:bg-slate-100 disabled:text-slate-600"
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
                            disabled={isReadOnly}
                            className="form-select disabled:bg-slate-100 disabled:text-slate-600"
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
                            disabled={isReadOnly}
                            className="form-input disabled:bg-slate-100 disabled:text-slate-600"
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
                            disabled={isReadOnly}
                          />
                        </div>

                        {/* Legal specific fields for ADN Pháp Lý */}
                        {loaiXetNghiemADN === 'phap_ly' && (
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
                                disabled={isReadOnly}
                                className="form-select disabled:bg-slate-100 disabled:text-slate-600"
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
                                disabled={isReadOnly}
                                className="form-input disabled:bg-slate-100 disabled:text-slate-600"
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
                                disabled={isReadOnly}
                                className="form-input disabled:bg-slate-100 disabled:text-slate-600"
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
                                disabled={isReadOnly}
                                className="form-input disabled:bg-slate-100 disabled:text-slate-600"
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
                                disabled={isReadOnly}
                                className="form-input disabled:bg-slate-100 disabled:text-slate-600"
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
                                disabled={isReadOnly}
                                className="form-input disabled:bg-slate-100 disabled:text-slate-600"
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
                                disabled={isReadOnly}
                                className="form-input disabled:bg-slate-100 disabled:text-slate-600"
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
                              setTimeout(() => generatePdfPreview(), 300);
                            })
                          }
                          disabled={isReadOnly}
                        >
                          <div className="btn btn-secondary text-xs py-1 px-3 cursor-pointer inline-flex items-center gap-1.5 shadow-2xs">
                            <ImageIcon className="w-3.5 h-3.5 text-sky-600" /> Tải/Kéo thả Chân Dung Mẫu {sample.kyHieuMau}
                          </div>
                        </ImageDropzone>
                        {sample.anhChanDung ? (
                          <div className="flex items-center gap-2">
                            <img
                              src={sample.anhChanDung}
                              alt="Chân dung"
                              onClick={() => setZoomImage({ url: sample.anhChanDung!, title: `Ảnh Chân Dung - Mẫu ${sample.kyHieuMau}: ${sample.hoTen}` })}
                              className="w-8 h-10 object-cover rounded border cursor-pointer hover:opacity-85 hover:scale-105 transition-all shadow-xs"
                            />
                            <span className="text-[11px] text-emerald-600 font-bold">✓ Đã có ảnh</span>
                            {!isReadOnly && (
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...mauDanhSach];
                                  updated[idx].anhChanDung = '';
                                  setMauDanhSach(updated);
                                  setTimeout(() => generatePdfPreview(), 300);
                                }}
                                className="text-slate-400 hover:text-rose-600 text-xs p-1 cursor-pointer"
                                title="Xóa ảnh chân dung"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">Chưa có ảnh chân dung</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Display Photos: Ảnh Gửi Mẫu & Ảnh Nhận Mẫu (UI Only) */}
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3">
                  Ảnh Gửi Mẫu & Ảnh Nhận Mẫu (Hiển thị trên UI quản lý)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Ảnh Gửi Mẫu (Bước 1) */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Ảnh Gửi Mẫu (Bước 1):</span>
                      <div className="flex items-center gap-2">
                        {anhGuiMau && (
                          <button
                            type="button"
                            onClick={() => {
                              setAnhGuiMau('');
                              setTimeout(() => generatePdfPreview(), 300);
                              toast.success('Đã xóa ảnh gửi mẫu');
                            }}
                            className="text-xs text-rose-600 hover:underline font-bold cursor-pointer"
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                    </div>

                    {anhGuiMau ? (
                      <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                        <div className="relative group w-36 h-36 flex items-center justify-center overflow-hidden bg-slate-900/5 rounded-xl border border-slate-200 p-1">
                          <img
                            src={anhGuiMau}
                            alt="Ảnh gửi mẫu"
                            onClick={() => setZoomImage({ url: anhGuiMau, title: 'Ảnh Gửi Mẫu (Bước 1)' })}
                            className="w-full h-full object-contain rounded-lg cursor-pointer hover:scale-105 transition-all"
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setZoomImage({ url: anhGuiMau, title: 'Ảnh Gửi Mẫu (Bước 1)' })}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-600" /> Xem phóng to
                          </button>
                          <ImageDropzone
                            onFileSelected={(file) => handleImageUpload(file, (b64) => setAnhGuiMau(b64))}
                            disabled={isReadOnly}
                          >
                            <span className="px-3 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-2xs">
                              Đổi / Kéo thả ảnh mới
                            </span>
                          </ImageDropzone>
                        </div>
                      </div>
                    ) : (
                      <ImageDropzone
                        onFileSelected={(file) => handleImageUpload(file, (b64) => setAnhGuiMau(b64))}
                        disabled={isReadOnly}
                        label="Kéo & thả ảnh gửi mẫu vào đây hoặc bấm để chọn file"
                        className="h-36 bg-white"
                      />
                    )}
                  </div>

                  {/* Ảnh Nhận Mẫu (Bước 2) */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Ảnh Nhận Mẫu (Bước 2):</span>
                      <div className="flex items-center gap-2">
                        {anhNhanMau && (
                          <button
                            type="button"
                            onClick={() => {
                              setAnhNhanMau('');
                              setTimeout(() => generatePdfPreview(), 300);
                              toast.success('Đã xóa ảnh nhận mẫu');
                            }}
                            className="text-xs text-rose-600 hover:underline font-bold cursor-pointer"
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                    </div>

                    {anhNhanMau ? (
                      <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                        <div className="relative group w-36 h-36 flex items-center justify-center overflow-hidden bg-slate-900/5 rounded-xl border border-slate-200 p-1">
                          <img
                            src={anhNhanMau}
                            alt="Ảnh nhận mẫu"
                            onClick={() => setZoomImage({ url: anhNhanMau, title: 'Ảnh Nhận Mẫu (Bước 2)' })}
                            className="w-full h-full object-contain rounded-lg cursor-pointer hover:scale-105 transition-all"
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setZoomImage({ url: anhNhanMau, title: 'Ảnh Nhận Mẫu (Bước 2)' })}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-600" /> Xem phóng to
                          </button>
                          <ImageDropzone
                            onFileSelected={(file) => handleImageUpload(file, (b64) => setAnhNhanMau(b64))}
                            disabled={isReadOnly}
                          >
                            <span className="px-3 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-2xs">
                              Đổi / Kéo thả ảnh mới
                            </span>
                          </ImageDropzone>
                        </div>
                      </div>
                    ) : (
                      <ImageDropzone
                        onFileSelected={(file) => handleImageUpload(file, (b64) => setAnhNhanMau(b64))}
                        disabled={isReadOnly}
                        label="Kéo & thả ảnh nhận mẫu vào đây hoặc bấm để chọn file"
                        className="h-36 bg-white"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Upload File Kết Quả Locus & Đính Kèm File PDF/Ảnh Đồ Thị Sắc Ký */}
            <div className="glass-card p-6 space-y-6">
              <h3 className="flex items-center gap-2 text-base font-bold text-sky-700 mb-4 pb-3 border-b border-slate-100">
                <Upload className="w-5 h-5 text-sky-600" />
                <span>2. Upload File Đọc Locus & File PDF/Ảnh Đồ Thị Sắc Ký (GeneMapper)</span>
              </h3>

              {/* 2 Separate Upload Action Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Button 1: Tải File Đọc Bảng Locus */}
                  <div className="bg-sky-50/90 p-4 rounded-xl border border-sky-200 flex flex-col justify-between space-y-3 shadow-xs">
                    <div>
                      <h4 className="text-xs font-bold text-sky-900 uppercase flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-sky-600" />
                        <span>1. Tải File Đọc Bảng Locus (DOCX, PDF)</span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Tự động đọc và điền dữ liệu Alil Locus
                      </p>
                    </div>

                    <label className="btn btn-primary text-xs w-full cursor-pointer justify-center py-2.5 shadow-sm">
                      {uploadingResultFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      <span>Tải File Đọc Bảng Locus</span>
                      <input type="file" accept=".docx,.doc,.pdf,.csv,.xlsx,.xls,.txt,.tsv" multiple onChange={handleFileUploadLoci} className="hidden" />
                    </label>
                  </div>

                  {/* Button 2: Tải File PDF / Ảnh Đồ Thị Sắc Ký / GeneMapper */}
                  <div className="bg-purple-50/90 p-4 rounded-xl border border-purple-200 flex flex-col justify-between space-y-3 shadow-xs">
                    <div>
                      <h4 className="text-xs font-bold text-purple-950 uppercase flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-purple-600" />
                        <span>2. Tải File PDF / Ảnh Đồ Thị Sắc Ký (GeneMapper)</span>
                      </h4>
                      <p className="text-xs text-purple-800/80 mt-1">
                        Tải file PDF kết quả điện di (bản peak) từ GeneMapper hoặc file ảnh biểu đồ sắc ký. Tất cả sẽ được tự động đính kèm thành các trang phụ lục tiếp theo của file PDF kết quả.
                      </p>
                    </div>

                    <label className="btn bg-purple-600 hover:bg-purple-700 text-white text-xs w-full cursor-pointer justify-center py-2.5 font-bold shadow-sm">
                      {uploadingChartFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                      <span>Tải File PDF / Ảnh Đồ Thị Sắc Ký (GeneMapper)</span>
                      <input type="file" accept="image/*,.docx,.pdf" multiple onChange={handleFileUploadChartImages} className="hidden" />
                    </label>
                  </div>
                </div>

              {/* Display Extracted Chart Images Gallery (Appended to PDF) */}
              {anhChayMauList.length > 0 && (
                <div className="p-4 bg-purple-50/70 rounded-xl border border-purple-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-purple-600" />
                      <span>Đã trích xuất {anhChayMauList.length} ảnh sắc ký / đồ thị STR (Sẽ tự động chèn vào các trang tiếp theo của PDF):</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setAnhChayMauList([]);
                        setTimeout(() => generatePdfPreview(), 300);
                        toast.success('Đã xóa tất cả ảnh đồ thị');
                      }}
                      className="text-[11px] text-red-600 hover:underline font-semibold cursor-pointer"
                    >
                      Xóa tất cả ảnh đồ thị
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {anhChayMauList.map((imgB64, imgIdx) => (
                      <div key={imgIdx} className="relative group bg-white p-2.5 rounded-xl border border-purple-200 text-center shadow-xs flex flex-col justify-between">
                        <img
                          src={imgB64}
                          alt={`Đồ thị ${imgIdx + 1}`}
                          onClick={() => setZoomImage({ url: imgB64, title: `Phụ lục Đồ thị STR Trang ${imgIdx + 1}` })}
                          className="h-24 w-full object-cover rounded-lg border border-purple-100 cursor-pointer hover:opacity-85 transition-all shadow-2xs"
                        />
                        <div className="mt-2 flex items-center justify-between gap-1">
                          <span className="text-[10px] font-bold text-purple-800">Trang {imgIdx + 1}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...anhChayMauList];
                              updated.splice(imgIdx, 1);
                              setAnhChayMauList(updated);
                              setTimeout(() => generatePdfPreview(), 300);
                              toast.success(`Đã xóa ảnh đồ thị trang ${imgIdx + 1}`);
                            }}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded border border-rose-200 cursor-pointer"
                            title="Xóa ảnh này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Photos of CCCD per sample */}
              {mauDanhSach.length > 2 && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      // Keep only the first 2 real samples
                      const cleaned = mauDanhSach.slice(0, 2);
                      setMauDanhSach(cleaned);
                      setTimeout(() => generatePdfPreview(), 300);
                      toast.success('Đã dọn dẹp, chỉ giữ lại 2 mẫu chính!');
                    }}
                    className="text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-amber-600" />
                    <span>Dọn dẹp danh sách mẫu (chỉ giữ 2 mẫu ban đầu)</span>
                  </button>
                </div>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {mauDanhSach.map((sample, idx) => (
                  <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                    <div className="font-bold text-xs text-sky-900 border-b border-slate-200 pb-2 flex items-center justify-between">
                      <span>Mẫu {sample.kyHieuMau}: {sample.hoTen || 'Chưa nhập tên'}</span>
                      {mauDanhSach.length > 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = mauDanhSach.filter((_, sIdx) => sIdx !== idx);
                            setMauDanhSach(updated);
                            setTimeout(() => generatePdfPreview(), 300);
                            toast.success(`Đã xóa mẫu ${sample.kyHieuMau}!`);
                          }}
                          className="text-[11px] text-rose-500 hover:text-rose-700 flex items-center gap-1 font-semibold p-1 hover:bg-rose-50 rounded cursor-pointer"
                          title="Xóa mẫu này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Xóa mẫu</span>
                        </button>
                      )}
                    </div>

                    {/* CCCD Mat Truoc */}
                    <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                      <label className="block text-xs font-bold text-slate-800">Ảnh CCCD Mặt trước</label>
                      <ImageDropzone
                        onFileSelected={(file) =>
                          handleImageUpload(file, (b64) => {
                            const updated = [...mauDanhSach];
                            updated[idx].anhCccdMatTruoc = b64;
                            setMauDanhSach(updated);
                            setTimeout(() => generatePdfPreview(), 300);
                          })
                        }
                        disabled={isReadOnly}
                        label="Kéo & thả ảnh CCCD Mặt trước vào đây hoặc bấm để chọn file"
                      />
                      {sample.anhCccdMatTruoc && (
                        <div className="mt-2 flex items-center justify-between bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 shadow-xs">
                          <div
                            className="flex items-center gap-3 cursor-pointer"
                            onClick={() => setZoomImage({ url: sample.anhCccdMatTruoc!, title: `Ảnh CCCD Mặt trước - Mẫu ${sample.kyHieuMau}: ${sample.hoTen}` })}
                          >
                            <img
                              src={sample.anhCccdMatTruoc}
                              alt="CCCD Trước"
                              className="h-16 w-24 object-cover rounded-lg border border-emerald-300 hover:scale-105 transition-all shadow-2xs"
                            />
                            <div>
                              <span className="text-xs text-emerald-800 font-bold block">✓ Đã tải ảnh CCCD Mặt trước</span>
                              <span className="text-[11px] text-emerald-600 font-medium">Bấm để phóng to</span>
                            </div>
                          </div>

                          {!isReadOnly && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...mauDanhSach];
                                updated[idx].anhCccdMatTruoc = '';
                                setMauDanhSach(updated);
                                setTimeout(() => generatePdfPreview(), 300);
                                toast.success('Đã xóa ảnh CCCD Mặt trước!');
                              }}
                              className="p-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 hover:border-rose-300 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
                              title="Xóa ảnh này"
                            >
                              <Trash2 className="w-4 h-4 text-rose-500" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* CCCD Mat Sau */}
                    <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                      <label className="block text-xs font-bold text-slate-800">Ảnh CCCD Mặt sau / Giấy khai sinh</label>
                      <ImageDropzone
                        onFileSelected={(file) =>
                          handleImageUpload(file, (b64) => {
                            const updated = [...mauDanhSach];
                            updated[idx].anhCccdMatSau = b64;
                            setMauDanhSach(updated);
                            setTimeout(() => generatePdfPreview(), 300);
                          })
                        }
                        disabled={isReadOnly}
                        label="Kéo & thả ảnh CCCD Mặt sau / Giấy khai sinh vào đây hoặc bấm để chọn file"
                      />
                      {sample.anhCccdMatSau && (
                        <div className="mt-2 flex items-center justify-between bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 shadow-xs">
                          <div
                            className="flex items-center gap-3 cursor-pointer"
                            onClick={() => setZoomImage({ url: sample.anhCccdMatSau!, title: `Ảnh CCCD Mặt sau / Giấy khai sinh - Mẫu ${sample.kyHieuMau}: ${sample.hoTen}` })}
                          >
                            <img
                              src={sample.anhCccdMatSau}
                              alt="CCCD Sau"
                              className="h-16 w-24 object-cover rounded-lg border border-emerald-300 hover:scale-105 transition-all shadow-2xs"
                            />
                            <div>
                              <span className="text-xs text-emerald-800 font-bold block">✓ Đã tải mặt sau / giấy khai sinh</span>
                              <span className="text-[11px] text-emerald-600 font-medium">Bấm để phóng to</span>
                            </div>
                          </div>

                          {!isReadOnly && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...mauDanhSach];
                                updated[idx].anhCccdMatSau = '';
                                setMauDanhSach(updated);
                                setTimeout(() => generatePdfPreview(), 300);
                                toast.success('Đã xóa ảnh mặt sau / giấy khai sinh!');
                              }}
                              className="p-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 hover:border-rose-300 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
                              title="Xóa ảnh này"
                            >
                              <Trash2 className="w-4 h-4 text-rose-500" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: Bảng Kết quả phân tích Alil Locus */}
            <div className="glass-card p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <h3 className="flex items-center gap-2 text-base font-bold text-sky-700">
                  <FileText className="w-5 h-5 text-sky-600" />
                  <span>3. Bảng Kết Quả Phân Tích Alil Locus</span>
                </h3>

                <div className="flex items-center gap-2">
                  <label className="btn btn-primary text-xs cursor-pointer flex items-center gap-1.5 py-1.5 px-3 shadow-xs">
                    {uploadingResultFile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>{table1.length > 0 || table2.length > 0 || table3.length > 0 ? 'Tải lại file Loci khác' : 'Tải file kết quả (PDF/DOCX/CSV/Excel)'}</span>
                    <input type="file" accept=".docx,.doc,.pdf,.csv,.xlsx,.xls,.txt,.tsv" onChange={handleFileUploadLoci} className="hidden" />
                  </label>

                  {(table1.length > 0 || table2.length > 0 || table3.length > 0) && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Bạn có chắc muốn xóa toàn bộ bảng Locus để tải file mới?')) {
                          setTable1([]);
                          setTable2([]);
                          setTable3([]);
                        }
                      }}
                      className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-200 transition-colors font-semibold cursor-pointer"
                    >
                      Xóa bảng
                    </button>
                  )}
                </div>
              </div>

              {table1.length === 0 && table2.length === 0 && table3.length === 0 ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      handleFileUploadLoci(e.dataTransfer.files[0]);
                    }
                  }}
                  className="border-2 border-dashed border-sky-300 bg-sky-50/50 hover:bg-sky-50 rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-4 transition-colors"
                >
                  <div className="w-14 h-14 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-600 shadow-inner">
                    <FileText className="w-7 h-7" />
                  </div>
                  <div className="max-w-md">
                    <h4 className="text-sm font-bold text-slate-800">Chưa có dữ liệu bảng Locus</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Kéo thả file kết quả (PDF, Word .docx, CSV, Excel) từ máy tính vào đây hoặc bấm nút bên dưới để chọn file. Hệ thống sẽ tự động phân tích và trích xuất đúng các Locus và Alil của từng mẫu theo cấu trúc file.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <label className="btn btn-primary text-xs cursor-pointer py-2 px-4 shadow-sm flex items-center gap-2">
                      {uploadingResultFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      <span>Chọn file từ máy tính (.pdf / .docx / .csv / .xlsx)</span>
                      <input type="file" accept=".docx,.doc,.pdf,.csv,.xlsx,.xls,.txt,.tsv" onChange={handleFileUploadLoci} className="hidden" />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setTable1([{ locus: 'D3S1358', alleles: {} }]);
                      }}
                      className="btn btn-secondary text-xs py-2 px-3"
                    >
                      <span>+ Thêm dòng Locus thủ công</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {table1.length > 0 && renderLociEditor(table1, setTable1, 'Bảng Locus 1')}
                  {table2.length > 0 && renderLociEditor(table2, setTable2, 'Bảng Locus 2')}
                  {table3.length > 0 && renderLociEditor(table3, setTable3, 'Bảng Locus 3')}
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const newRow: LocusItem = { locus: '', alleles: {} };
                        if (table3.length > 0) setTable3([...table3, newRow]);
                        else if (table2.length > 0) setTable2([...table2, newRow]);
                        else setTable1([...table1, newRow]);
                      }}
                      className="text-xs text-sky-600 hover:text-sky-700 font-bold flex items-center gap-1 border border-sky-200 bg-sky-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm dòng Locus mới</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Section 4: Kết luận & Chữ ký */}
            <div className="glass-card p-6 space-y-4">
              <h3 className="flex items-center gap-2 text-base font-bold text-sky-700 mb-4 pb-3 border-b border-slate-100">
                <ShieldCheck className="w-5 h-5 text-sky-600" />
                <span>4. Kết Luận, Độ Tin Cậy & Chữ Ký Người Ký</span>
              </h3>

              <div className="form-group">
                <label>Kết luận xét nghiệm</label>
                <textarea
                  rows={3}
                  value={ketLuan}
                  onChange={(e) => setKetLuan(e.target.value)}
                  placeholder="VD: có quan hệ huyết thống bố - con ( cha – con)"
                  disabled={isLocusDisabled}
                  className="form-textarea font-bold text-red-600 disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group mb-0">
                  <label>Total Likelyhood Ratio (LR)</label>
                  <input
                    type="text"
                    value={totalLikelihoodRatio}
                    onChange={(e) => setTotalLikelihoodRatio(e.target.value)}
                    disabled={isLocusDisabled}
                    placeholder="VD: 23109010868637.6"
                    className="form-input font-medium disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>

                <div className="form-group mb-0">
                  <label>Probability of paternity (POP)</label>
                  <input
                    type="text"
                    value={probabilityOfPaternity}
                    onChange={(e) => setProbabilityOfPaternity(e.target.value)}
                    disabled={isLocusDisabled}
                    placeholder="VD: 99.9999999999957%"
                    className="form-input font-medium disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="form-group mb-0">
                  <label>Xác suất</label>
                  <input
                    type="text"
                    value={doTinCay}
                    onChange={(e) => setDoTinCay(e.target.value)}
                    disabled={isLocusDisabled}
                    className="form-input disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>

                <div className="form-group mb-0">
                  <div className="flex items-center justify-between mb-1">
                    <label className="mb-0">Ngày lưu kết quả (Ngày ký)</label>
                    <button
                      type="button"
                      onClick={() => {
                        const today = new Date();
                        const dd = String(today.getDate()).padStart(2, '0');
                        const mm = String(today.getMonth() + 1).padStart(2, '0');
                        const yyyy = today.getFullYear();
                        const newDateStr = `Hà Nội, ngày ${dd} tháng ${mm} năm ${yyyy}.`;
                        setNgayBanHanh(newDateStr);
                        setTimeout(() => generatePdfPreview(), 300);
                      }}
                      className="text-[11px] text-sky-600 hover:text-sky-800 font-semibold underline cursor-pointer"
                    >
                      Lấy ngày hôm nay
                    </button>
                  </div>
                  <input
                    type="text"
                    value={ngayBanHanh}
                    onChange={(e) => {
                      setNgayBanHanh(e.target.value);
                      setTimeout(() => generatePdfPreview(), 300);
                    }}
                    placeholder="VD: Hà Nội, ngày 03 tháng 09 năm 2026."
                    className="form-input font-medium"
                  />
                </div>

                <div className="form-group mb-0">
                  <label>Cán bộ xét nghiệm (Tên ký bên trái)</label>
                  <input
                    type="text"
                    value={canBoXetNghiem}
                    onChange={(e) => setCanBoXetNghiem(e.target.value)}
                    placeholder="VD: NGUYỄN VĂN AN"
                    className="form-input font-semibold"
                  />
                </div>

                <div className="form-group mb-0">
                  <label>Đại diện đơn vị (Tên ký bên phải)</label>
                  <input
                    type="text"
                    value={daiDienDonVi}
                    onChange={(e) => setDaiDienDonVi(e.target.value)}
                    placeholder="VD: ĐỖ VĂN TÌNH hoặc CÔNG TY CỔ PHẦN GENETRUST VIỆT NAM"
                    className="form-input font-semibold"
                  />
                </div>
              </div>

              {/* Action Buttons: Thay đổi theo trạng thái quy trình */}
              {trangThai === 'gui_mau' && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => handleSaveOrder()}
                    disabled={saving}
                    className="btn btn-secondary"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Lưu thông tin</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowReceiveModal(true)}
                    disabled={saving}
                    className="btn btn-primary"
                  >
                    <Package className="w-4 h-4" />
                    <span>Nhận Mẫu</span>
                  </button>
                </div>
              )}

              {trangThai === 'dang_chay_mau' && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => handleSaveOrder()}
                    disabled={saving}
                    className="btn btn-primary"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Lưu kết quả</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveOrder('da_tra_ket_qua')}
                    disabled={saving}
                    className="btn btn-success"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>Trả Kết Quả</span>
                  </button>
                </div>
              )}
            </div>

            {/* Section 5: Xem trước PDF kết quả */}
            <div className="glass-card p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="flex items-center gap-2 text-base font-bold text-sky-700">
                  <Eye className="w-5 h-5 text-sky-600" />
                  <span>Xem trước PDF kết quả</span>
                </h3>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        setPdfLang('vi');
                        generatePdfPreview('vi');
                      }}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        pdfLang === 'vi'
                          ? 'bg-white text-sky-700 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      🇻🇳 Tiếng Việt
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPdfLang('en');
                        generatePdfPreview('en');
                      }}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        pdfLang === 'en'
                          ? 'bg-white text-sky-700 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      🇬🇧 English
                    </button>
                  </div>

                  <button
                    onClick={handleDownloadDocx}
                    disabled={exportingPdf}
                    className="btn bg-blue-600 hover:bg-blue-700 text-white text-xs py-1.5 px-3.5 flex items-center gap-1.5 rounded-lg shadow-sm font-bold cursor-pointer"
                  >
                    {exportingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    <span>Tải DOCX {pdfLang === 'en' ? '(EN)' : '(VI)'}</span>
                  </button>

                  <button
                    onClick={handleDownloadPdf}
                    disabled={exportingPdf}
                    className="btn bg-slate-700 hover:bg-slate-800 text-white text-xs py-1.5 px-3.5 flex items-center gap-1.5 rounded-lg font-bold cursor-pointer"
                  >
                    {exportingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    <span>Tải PDF</span>
                  </button>

                  <button
                    onClick={() => router.push('/adn-convert')}
                    className="px-4 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-200 cursor-pointer transition-colors"
                  >
                    Đóng
                  </button>
                </div>
              </div>

              {/* PDF Preview Display Box */}
              <div className="bg-slate-800 p-2 md:p-4 rounded-xl shadow-inner flex items-center justify-center min-h-[450px]">
                {pdfPreviewUrl ? (
                  <iframe
                    src={pdfPreviewUrl}
                    title="PDF Preview"
                    className="w-full h-[850px] border border-slate-700 rounded-lg shadow-lg bg-white"
                  />
                ) : (
                  <div className="h-[400px] flex flex-col items-center justify-center gap-3 bg-white w-full rounded-lg border border-slate-200">
                    <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
                    <p className="text-xs text-slate-500 font-semibold">Đang tự động tải bản xem trước PDF...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal: Bước 2 - Nhận Mẫu & Đánh Giá Điều Kiện Chạy Mẫu */}
      {showReceiveModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-sky-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-sky-600" />
                <span>Bước 2: Nhận Mẫu Xét Nghiệm ADN</span>
              </h3>
              <button
                onClick={() => setShowReceiveModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-sky-50 p-3 rounded-xl text-xs text-sky-900 font-medium">
                Đơn: <strong>{soPhieu}</strong> - Người yêu cầu: <strong>{nguoiYeuCau}</strong>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Đính kèm Ảnh nhận mẫu (*)</label>
                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-sky-300 rounded-xl bg-sky-50/50 hover:bg-sky-50 transition-colors">
                  {anhNhanMau ? (
                    <div className="space-y-2 text-center">
                      <img src={anhNhanMau} alt="Ảnh nhận mẫu" className="max-h-40 mx-auto rounded-lg shadow-sm border" />
                      <button
                        type="button"
                        onClick={() => setAnhNhanMau('')}
                        className="text-xs text-red-600 hover:underline font-bold"
                      >
                        Đổi ảnh khác
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer text-center space-y-2">
                      <Upload className="w-8 h-8 mx-auto text-sky-600" />
                      <span className="block text-xs font-bold text-sky-700">Tải ảnh nhận mẫu lên</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, (b64) => setAnhNhanMau(b64))}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Confirm conditions for running test */}
              <div className="pt-3 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Xác nhận điều kiện chạy mẫu (*):
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setReceiveDieuKien('du_dieu_kien')}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-2.5 ${receiveDieuKien === 'du_dieu_kien'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                  >
                    <input
                      type="radio"
                      name="dieuKienCheckDetail"
                      checked={receiveDieuKien === 'du_dieu_kien'}
                      onChange={() => setReceiveDieuKien('du_dieu_kien')}
                      className="w-4 h-4 text-emerald-600 cursor-pointer"
                    />
                    <div className="text-xs">
                      <div className="font-bold text-emerald-800">Đủ điều kiện</div>
                      <div className="text-[10px] text-emerald-600 font-normal">Mẫu đạt chuẩn chạy ADN</div>
                    </div>
                  </div>

                  <div
                    onClick={() => setReceiveDieuKien('khong_du_dieu_kien')}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-2.5 ${receiveDieuKien === 'khong_du_dieu_kien'
                      ? 'border-red-600 bg-red-50 text-red-900 font-bold shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                  >
                    <input
                      type="radio"
                      name="dieuKienCheckDetail"
                      checked={receiveDieuKien === 'khong_du_dieu_kien'}
                      onChange={() => setReceiveDieuKien('khong_du_dieu_kien')}
                      className="w-4 h-4 text-red-600 cursor-pointer"
                    />
                    <div className="text-xs">
                      <div className="font-bold text-red-800">Không đủ điều kiện</div>
                      <div className="text-[10px] text-red-600 font-normal">Mẫu không đạt chuẩn</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => setShowReceiveModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmReceive}
                disabled={saving}
                className="px-5 py-2 bg-sky-600 text-white font-bold text-xs rounded-xl hover:bg-sky-500 cursor-pointer flex items-center gap-1.5"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Xác nhận nhận mẫu (Đang chạy mẫu)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Zoom Xem Phóng To Ảnh */}
      {zoomImage && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200"
          onClick={() => setZoomImage(null)}
        >
          <div
            className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center bg-slate-900 rounded-2xl p-4 border border-slate-700 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between border-b border-slate-700/80 pb-3">
              <span className="text-sm font-bold text-white tracking-wide">
                {zoomImage.title || 'Xem Phóng To Ảnh'}
              </span>
              <button
                onClick={() => setZoomImage(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold text-base cursor-pointer transition-colors border border-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="overflow-auto max-h-[78vh] flex items-center justify-center w-full p-2">
              <img
                src={zoomImage.url}
                alt={zoomImage.title || 'Phóng to ảnh'}
                className="max-w-full max-h-[72vh] object-contain rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}



      {/* Modal Convert Sang Genetrust */}
      {showGtModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Convert kết quả sang Genetrust</h3>
                  <p className="text-xs text-slate-500">Mã phiếu: <span className="font-semibold text-slate-700">{soPhieu}</span></p>
                </div>
              </div>
              <button
                onClick={() => setShowGtModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tên Cán bộ xét nghiệm (Ký bên trái)
                </label>
                <input
                  type="text"
                  value={gtCanBo}
                  onChange={(e) => setGtCanBo(e.target.value)}
                  placeholder="VD: NGUYỄN VĂN AN"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tên Đại diện đơn vị (Ký bên phải)
                </label>
                <input
                  type="text"
                  value={gtDaiDien}
                  onChange={(e) => setGtDaiDien(e.target.value)}
                  placeholder="VD: ĐỖ VĂN TÌNH hoặc CÔNG TY CỔ PHẦN GENETRUST VIỆT NAM"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Ngôn ngữ xuất file PDF
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPdfLang('vi')}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      pdfLang === 'vi'
                        ? 'bg-sky-50 border-sky-500 text-sky-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    🇻🇳 Tiếng Việt
                  </button>
                  <button
                    type="button"
                    onClick={() => setPdfLang('en')}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      pdfLang === 'en'
                        ? 'bg-sky-50 border-sky-500 text-sky-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    🇬🇧 English
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowGtModal(false)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  const canBo = gtCanBo;
                  const daiDien = gtDaiDien;
                  setShowGtModal(false);
                  handleDownloadDocxGenetrust(canBo, daiDien);
                }}
                disabled={exportingPdf}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-2 transition-all"
              >
                {exportingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>Xác nhận Convert & Tải DOCX</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const canBo = gtCanBo;
                  const daiDien = gtDaiDien;
                  setShowGtModal(false);
                  handleDownloadPdfGenetrust(canBo, daiDien);
                }}
                disabled={exportingPdf}
                className="px-4 py-2.5 bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                <span>Tải PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
