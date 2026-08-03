import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TestResult from '@/models/TestResult';
import User from '@/models/User';
import { generatePDF } from '@/lib/pdfExport';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const testResult = await TestResult.findById(id).lean();

    if (!testResult) {
      return NextResponse.json({ error: 'Không tìm thấy phiếu' }, { status: 404 });
    }

    let bacSiTitle = '(Chuyên khoa Xét nghiệm - Giải phẫu bệnh lý)';
    if (testResult.bacSiDoc && testResult.bacSiDoc !== 'Chưa phân loại') {
      const docUser = await User.findOne({ fullName: { $regex: testResult.bacSiDoc.trim(), $options: 'i' } }).lean();
      if (docUser && docUser.title) {
        bacSiTitle = docUser.title;
      }
    }

    const pdfBuffer = await generatePDF({
      maSo: testResult.maSo,
      loaiXetNghiem: testResult.loaiXetNghiem || 'cell',
      hoTen: testResult.hoTen,
      namSinh: testResult.namSinh,
      gioiTinh: testResult.gioiTinh,
      diaChi: testResult.diaChi,
      soDienThoai: testResult.soDienThoai,
      loaiMau: testResult.loaiMau || 'Dịch phết',
      donVi: testResult.donVi,
      bacSiChiDinh: testResult.bacSiChiDinh,
      ngayNhanMau: testResult.ngayNhanMau,
      ngayTraKetQua: testResult.ngayTraKetQua,

      // Cell
      tinhChatBenhPham: testResult.tinhChatBenhPham,
      lyDoKhongDat: testResult.lyDoKhongDat,
      khongTonThuong: testResult.khongTonThuong,
      batThuongKhac: testResult.batThuongKhac,
      teBaoNoiMac: testResult.teBaoNoiMac,
      bienDoiViSinh: testResult.bienDoiViSinh || [],
      bienDoiKhac: testResult.bienDoiKhac || [],
      batThuongVay: testResult.batThuongVay || [],
      batThuongTuyen: testResult.batThuongTuyen || [],

      // HPV
      hpvHighRiskResult: testResult.hpvHighRiskResult,
      hpvHighRiskOtherResult: testResult.hpvHighRiskOtherResult,
      hpvLowRiskResult: testResult.hpvLowRiskResult,
      hpvOtherTypesResult: testResult.hpvOtherTypesResult,

      ketLuan: testResult.ketLuan,
      khuyenNghi: testResult.khuyenNghi || '',
      ngayXetNghiem: testResult.ngayXetNghiem,
      bacSiDoc: testResult.bacSiDoc || 'BS CK1 PHẠM THẾ HÙNG',
      bacSiTitle,
      anhTeBao: testResult.anhTeBao,
    });

    const filename = `${testResult.maSo} ${testResult.hoTen}.pdf`;

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (error) {
    console.error('Export PDF error:', error);
    return NextResponse.json({ error: 'Lỗi tạo file PDF' }, { status: 500 });
  }
}
