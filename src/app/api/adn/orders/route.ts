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
    const yy = String(now.getFullYear()).slice(-2);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const countThisYear = await AdnOrder.countDocuments({
      createdAt: { $gte: startOfYear },
    });
    const seqStr = String(countThisYear + 1).padStart(4, '0');
    const tag = loaiXetNghiemADN === 'tu_nguyen' ? 'THK/ADN' : 'HHK/ADN';

    const generatedMaSo = `${yy}${seqStr}${tag}`;
    const maSo = soPhieu && soPhieu.trim() ? soPhieu.trim() : generatedMaSo;
    const finalSoPhieu = maSo;

    const baseCode = finalSoPhieu.split('/')[0].trim();

    // Format sample symbols (kyHieuMau): B + 260001HHK -> B260001HHK
    const formattedMauDanhSach = mauDanhSach.map((s: any, idx: number) => {
      const defaultRaw = idx === 0 ? 'B' : idx === 1 ? 'C' : `M${idx + 1}`;
      const rawKey = s.kyHieuMau && String(s.kyHieuMau).trim() ? String(s.kyHieuMau).trim() : defaultRaw;
      const fullKey = rawKey.endsWith(baseCode) ? rawKey : `${rawKey}${baseCode}`;
      return {
        ...s,
        kyHieuMau: fullKey,
      };
    });

    // Initialize default loci tables for dynamic samples
    const sampleKeys = formattedMauDanhSach.length > 0
      ? formattedMauDanhSach.map((s: any) => s.kyHieuMau)
      : [`B${baseCode}`, `C${baseCode}`];

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
      ngayYeuCau: ngayYeuCau || new Date().toISOString().split('T')[0],
      nguoiYeuCau,
      nguoiThuMau,
      boKit,
      daiDienDonVi,
      kiemSoatKetQua,
      trangThai: 'gui_mau', // Step 1: Gửi mẫu
      dieuKien: 'chua_xac_nhan',
      anhGuiMau,
      mauDanhSach: formattedMauDanhSach,
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
