import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISampleItem {
  kyHieuMau: string; // e.g. M1, M2, M3
  hoTen: string;
  gioiTinh: string;
  ngaySinh: string;
  quocTich?: string;
  cccd?: string; // CCCD / Passport / Giấy chứng sinh số
  quyenSo?: string; // Quyển số (dành cho giấy chứng sinh)
  ngayCap?: string;
  noiCap?: string;
  noiThuongTru?: string;
  loaiMau?: string; // Máu, Tế bào niêm mạc miệng...
  anhChanDung?: string; // Base64 or Cloudinary URL (Ảnh chân dung mẫu)
  anhCccdMatTruoc?: string; // Base64 or Cloudinary URL
  anhCccdMatSau?: string; // Base64 or Cloudinary URL
  anhKetQuaChay?: string; // Base64 or Cloudinary URL (Biểu đồ GeneMapper)
}

export interface ILocusTableItem {
  locus: string;
  alleles: {
    [sampleKey: string]: {
      a1: string;
      a2: string;
    };
  };
}

export interface IAdnOrder extends Document {
  maSo: string;
  loaiXetNghiemADN: 'phap_ly' | 'tu_nguyen';
  soPhieu: string;
  ngayBanHanh: string;
  ngayYeuCau: string;
  nguoiYeuCau: string;
  nguoiThuMau: string; // Người thu mẫu / Người nhận mẫu
  boKit: string;
  daiDienDonVi: string;
  kiemSoatKetQua: string;

  trangThai: 'gui_mau' | 'dang_chay_mau' | 'da_tra_ket_qua';

  anhGuiMau?: string;
  anhNhanMau?: string;

  mauDanhSach: ISampleItem[];

  // Bảng so sánh STR Locus (dữ liệu động cho 2, 3+ mẫu)
  table1: ILocusTableItem[];
  table2: ILocusTableItem[];
  table3: ILocusTableItem[];

  ketLuan: string;
  doTinCay: string;

  createdAt: Date;
  updatedAt: Date;
}

const SampleItemSchema = new Schema({
  kyHieuMau: { type: String, required: true },
  hoTen: { type: String, required: true },
  gioiTinh: { type: String, default: 'Nam' },
  ngaySinh: { type: String, default: '' },
  quocTich: { type: String, default: 'Việt Nam' },
  cccd: { type: String, default: '' },
  quyenSo: { type: String, default: '' },
  ngayCap: { type: String, default: '' },
  noiCap: { type: String, default: '' },
  noiThuongTru: { type: String, default: '' },
  loaiMau: { type: String, default: 'Máu' },
  anhChanDung: { type: String, default: '' },
  anhCccdMatTruoc: { type: String, default: '' },
  anhCccdMatSau: { type: String, default: '' },
  anhKetQuaChay: { type: String, default: '' },
});

const AdnOrderSchema = new Schema<IAdnOrder>(
  {
    maSo: { type: String, unique: true, required: true },
    loaiXetNghiemADN: {
      type: String,
      enum: ['phap_ly', 'tu_nguyen'],
      default: 'phap_ly',
    },
    soPhieu: { type: String, default: '' },
    ngayBanHanh: { type: String, default: '' },
    ngayYeuCau: { type: String, default: '' },
    nguoiYeuCau: { type: String, default: '' },
    nguoiThuMau: { type: String, default: 'Hoàng Văn Luận' },
    boKit: { type: String, default: 'A27Plex STR Detection Kit' },
    daiDienDonVi: { type: String, default: 'CÔNG TY CỔ PHẦN GENETRUST VIỆT NAM' },
    kiemSoatKetQua: { type: String, default: 'TS. BS. Nguyễn Khánh Dương' },

    trangThai: {
      type: String,
      enum: ['gui_mau', 'dang_chay_mau', 'da_tra_ket_qua'],
      default: 'gui_mau',
    },

    anhGuiMau: { type: String, default: '' },
    anhNhanMau: { type: String, default: '' },

    mauDanhSach: [SampleItemSchema],

    table1: { type: Schema.Types.Mixed, default: [] },
    table2: { type: Schema.Types.Mixed, default: [] },
    table3: { type: Schema.Types.Mixed, default: [] },

    ketLuan: { type: String, default: '' },
    doTinCay: { type: String, default: '> 99,9999%' },
  },
  {
    timestamps: true,
    strict: false,
  }
);

export const AdnOrder: Model<IAdnOrder> =
  mongoose.models.AdnOrder || mongoose.model<IAdnOrder>('AdnOrder', AdnOrderSchema);
