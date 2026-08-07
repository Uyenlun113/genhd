import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { AdnOrder } from '@/models/AdnOrder';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const query: any = {};
    if (status && status !== 'all') {
      query.trangThai = status;
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(`${startDate}T00:00:00.000Z`);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(`${endDate}T23:59:59.999Z`);
      }
    }
    if (search) {
      query.$or = [
        { maSo: { $regex: search, $options: 'i' } },
        { soPhieu: { $regex: search, $options: 'i' } },
        { nguoiYeuCau: { $regex: search, $options: 'i' } },
        { 'mauDanhSach.hoTen': { $regex: search, $options: 'i' } },
      ];
    }

    const orders = await AdnOrder.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: orders });
  } catch (error: any) {
    console.error('GET ADN orders error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();

    const {
      loaiXetNghiemADN = 'phap_ly',
      soPhieu,
      ngayBanHanh = '',
      ngayYeuCau = '',
      nguoiYeuCau = '',
      nguoiThuMau = 'Hoàng Văn Luận',
      boKit = 'A27Plex STR Detection Kit',
      daiDienDonVi = 'CÔNG TY CỔ PHẦN GENETRUST VIỆT NAM',
      kiemSoatKetQua = 'TS. BS. Nguyễn Khánh Dương',
      anhGuiMau = '',
      mauDanhSach = [],
    } = body;

    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = String(now.getFullYear()).slice(-2);
    const dateTag = `${d}${m}${y}`;

    const prefix = loaiXetNghiemADN === 'phap_ly' ? 'HCGT' : 'TNGT';
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const countToday = await AdnOrder.countDocuments({
      createdAt: { $gte: startOfDay },
    });
    const seq = String(countToday + 1).padStart(2, '0');

    const generatedMaSo = `${prefix}-${dateTag}-${seq}`;
    const maSo = soPhieu && soPhieu.trim() ? soPhieu.trim() : generatedMaSo;
    const finalSoPhieu = maSo;

    // Initialize default loci tables for dynamic samples
    const sampleKeys = mauDanhSach.length > 0 ? mauDanhSach.map((s: any) => s.kyHieuMau || 'M1') : ['M1', 'M2'];

    const initLoci = (lociList: string[]) =>
      lociList.map((loc) => {
        const alleles: Record<string, { a1: string; a2: string }> = {};
        sampleKeys.forEach((key: string) => {
          alleles[key] = { a1: '', a2: '' };
        });
        return { locus: loc, alleles };
      });

    const defaultTable1 = initLoci([
      'D3S1358',
      'vWA',
      'D12S391',
      'CSF1PO',
      'Penta E',
      'D2S441',
      'D16S539',
      'D7S820',
      'D13S317',
    ]);

    const defaultTable2 = initLoci([
      'D2S1338',
      'Penta D',
      'Rs199815934',
      'AMEL',
      'D22S1045',
      'D19S433',
      'D18S51',
      'D6S1043',
      'DYS391',
    ]);

    const defaultTable3 = initLoci([
      'D8S1179',
      'D5S818',
      'D21S11',
      'FGA',
      'D10S1248',
      'TH01',
      'D1S1656',
      'TPOX',
      'SE33',
    ]);

    const newOrder = await AdnOrder.create({
      maSo,
      loaiXetNghiemADN,
      soPhieu: finalSoPhieu,
      ngayBanHanh: ngayBanHanh || `Hà Nội, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}.`,
      ngayYeuCau: ngayYeuCau || new Date().toLocaleDateString('vi-VN'),
      nguoiYeuCau,
      nguoiThuMau,
      boKit,
      daiDienDonVi,
      kiemSoatKetQua,
      trangThai: 'gui_mau', // Step 1: Gửi mẫu
      dieuKien: 'chua_xac_nhan',
      anhGuiMau,
      mauDanhSach,
      table1: defaultTable1,
      table2: defaultTable2,
      table3: defaultTable3,
      ketLuan: '',
      doTinCay: '> 99,9999%',
    });

    return NextResponse.json({ success: true, data: newOrder });
  } catch (error: any) {
    console.error('POST create ADN order error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
