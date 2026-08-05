import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  BIEN_DOI_VI_SINH_OPTIONS,
  BIEN_DOI_KHAC_OPTIONS,
  BAT_THUONG_VAY_OPTIONS,
  BAT_THUONG_TUYEN_OPTIONS,
} from '@/constants/options';

export {
  BIEN_DOI_VI_SINH_OPTIONS,
  BIEN_DOI_KHAC_OPTIONS,
  BAT_THUONG_VAY_OPTIONS,
  BAT_THUONG_TUYEN_OPTIONS,
};

export interface ITestResult extends Document {
  maSo: string;
  loaiXetNghiem: 'cell' | 'thinprep' | 'hpv40' | 'hpv20' | 'soituoi' | 'giaiphaubenh';

  // Thông tin bệnh nhân
  hoTen: string;
  namSinh: number;
  gioiTinh: 'Nam' | 'Nữ';
  diaChi: string;
  soDienThoai: string;
  loaiMau: string;
  donVi: string;
  bacSiChiDinh: string;

  // Dành cho Soi tươi & Giải Phẫu Bệnh
  chanDoanLamSang?: string;
  viTriBenhPham?: string;
  nhanXetDaiThe?: string;
  daiThe?: string;
  viThe?: string;

  soiTuoiBachCau?: string;
  soiTuoiNam?: string;
  soiTuoiTapKhuan?: string;
  soiTuoiTeBaoBieuMo?: string;
  soiTuoiTrichomonas?: string;

  soiTuoiGhiChuBachCau?: string;
  soiTuoiGhiChuNam?: string;
  soiTuoiGhiChuTapKhuan?: string;
  soiTuoiGhiChuTeBaoBieuMo?: string;
  soiTuoiGhiChuTrichomonas?: string;

  ngayNhanMau: Date;
  ngayDuKienTra: Date;
  ngayTraKetQua: Date;

  lichSuChinhSua: Array<{
    nguoiSua: string;
    thoiGian: Date;
    noiDung: string;
  }>;

  // Dành cho loại 'cell' (Bethesda 2014)
  tinhChatBenhPham: 'dat' | 'khongDat';
  lyDoKhongDat: string;
  khongTonThuong: boolean;
  batThuongKhac: boolean;
  teBaoNoiMac: boolean;
  bienDoiViSinh: string[];
  bienDoiKhac: string[];
  batThuongVay: string[];
  batThuongTuyen: string[];

  // Dành cho HPV 40 & HPV 20 Types
  hpvHighRiskResult: string;      // Type 16, 18
  hpvHighRiskOtherResult: string; // 16 Types
  hpvLowRiskResult: string;       // 2 Types (6, 11)
  hpvOtherTypesResult: string;    // 20 Types (chỉ dành cho HPV40)

  // Chung
  ketLuan: string;
  khuyenNghi: string;
  ngayXetNghiem: Date;
  bacSiDoc: string;

  trangThai: 'nhap_thong_tin' | 'chay_ket_qua' | 'da_tra_ket_qua';

  daKy: boolean;
  anhTeBao: string; // Ảnh soi tế bào hoặc biểu đồ PCR
  pdfDaKy: string;

  nguoiNhap: mongoose.Types.ObjectId;
  bacSiXuLy: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const CounterSchema = new Schema({
  _id: String,
  seq: { type: Number, default: 0 },
});

const Counter: Model<Document & { _id: string; seq: number }> =
  mongoose.models.Counter || mongoose.model('Counter', CounterSchema);

const TestResultSchema = new Schema<ITestResult>(
  {
    maSo: { type: String, unique: true, required: true },
    loaiXetNghiem: {
      type: String,
      enum: ['cell', 'thinprep', 'hpv40', 'hpv20', 'soituoi', 'giaiphaubenh'],
      default: 'cell',
    },

    // Thông tin bệnh nhân
    hoTen: { type: String, required: true },
    namSinh: { type: Number, required: true },
    gioiTinh: { type: String, enum: ['Nam', 'Nữ'], default: 'Nữ' },
    diaChi: { type: String, default: '' },
    soDienThoai: { type: String, default: '' },
    loaiMau: { type: String, default: 'Dịch phết' },
    donVi: { type: String, default: '' },
    bacSiChiDinh: { type: String, default: '' },

    chanDoanLamSang: { type: String, default: '' },
    viTriBenhPham: { type: String, default: '' },
    daiThe: { type: String, default: '' },
    viThe: { type: String, default: '' },

    ngayNhanMau: { type: Date },
    ngayDuKienTra: { type: Date },
    ngayTraKetQua: { type: Date },

    lichSuChinhSua: [
      {
        nguoiSua: { type: String, required: true },
        thoiGian: { type: Date, default: Date.now },
        noiDung: { type: String, required: true },
      },
    ],

    // Cell / Bethesda
    tinhChatBenhPham: { type: String, enum: ['dat', 'khongDat'], default: 'dat' },
    lyDoKhongDat: { type: String, default: '' },
    khongTonThuong: { type: Boolean, default: false },
    batThuongKhac: { type: Boolean, default: false },
    teBaoNoiMac: { type: Boolean, default: false },
    bienDoiViSinh: [{ type: String }],
    bienDoiKhac: [{ type: String }],
    batThuongVay: [{ type: String }],
    batThuongTuyen: [{ type: String }],

    // HPV Types
    hpvHighRiskResult: { type: String, default: 'Âm tính' },
    hpvHighRiskOtherResult: { type: String, default: 'Âm tính' },
    hpvLowRiskResult: { type: String, default: 'Âm tính' },
    hpvOtherTypesResult: { type: String, default: 'Âm tính' },

    // Kết luận & Khuyến nghị
    ketLuan: { type: String, default: '' },
    khuyenNghi: { type: String, default: '' },

    ngayXetNghiem: { type: Date, default: Date.now },
    bacSiDoc: { type: String, default: 'BS CK1 PHẠM THẾ HÙNG' },

    trangThai: {
      type: String,
      enum: ['nhap_thong_tin', 'chay_ket_qua', 'da_tra_ket_qua'],
      default: 'nhap_thong_tin',
    },

    daKy: { type: Boolean, default: false },
    anhTeBao: { type: String, default: '' },
    pdfDaKy: { type: String, default: '' },

    nguoiNhap: { type: Schema.Types.ObjectId, ref: 'User' },
    bacSiXuLy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    strict: false,
  }
);

// Function to generate unique maSo with duplicate check according to requested formats:
// CELL: GTHD-C001, GTHD-C002...
// HPV 40: GTHD-40HP001, GTHD-40HP002...
// HPV 20: GTHD-20HP001, GTHD-20HP002...
export async function generateMaSo(loaiXetNghiem = 'cell'): Promise<string> {
  let prefix = 'GTHD-C';
  if (loaiXetNghiem === 'thinprep') prefix = 'GTHD-TP';
  else if (loaiXetNghiem === 'hpv40') prefix = 'GTHD-40HP';
  else if (loaiXetNghiem === 'hpv20') prefix = 'GTHD-20HP';
  else if (loaiXetNghiem === 'soituoi') prefix = 'GTHD-ST';
  else if (loaiXetNghiem === 'giaiphaubenh') prefix = 'GTHD-GP';

  let uniqueMaSo = '';
  let isUnique = false;

  const TestResultModel = mongoose.models.TestResult || mongoose.model('TestResult', TestResultSchema);

  while (!isUnique) {
    const counter = await Counter.findByIdAndUpdate(
      `testResult_${loaiXetNghiem}`,
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: 'after' }
    );

    const seqNum = counter ? (counter as { seq: number }).seq : 1;
    const seqStr = String(seqNum).padStart(3, '0');
    uniqueMaSo = `${prefix}${seqStr}`;

    // Verify if maSo already exists in DB to prevent E11000 duplicate key error
    const existing = await TestResultModel.findOne({ maSo: uniqueMaSo }).lean();
    if (!existing) {
      isUnique = true;
    }
  }

  return uniqueMaSo;
}

if (mongoose.models.TestResult) {
  delete mongoose.models.TestResult;
}

const TestResult: Model<ITestResult> =
  mongoose.models.TestResult || mongoose.model<ITestResult>('TestResult', TestResultSchema);

export default TestResult;
