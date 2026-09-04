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

    // Map bác sĩ đọc kết quả → file chữ ký
    const getSig = (docName?: string, isSigned?: boolean) => {
      if (!isSigned || !docName) return '';
      const upper = docName.toUpperCase();
      if (upper.includes('TRỰC') || upper.includes('TRUC')) return 'chu_ki_truc.png';
      if (upper.includes('HÙNG') || upper.includes('HUNG')) return 'chu_ki_hung.png';
      if (upper.includes('DƯƠNG') || upper.includes('DUONG')) return 'chu_ki_duong.png';
      if (upper.includes('DŨNG') || upper.includes('DUNG')) return 'chu_ki_duong.png';
      if (upper.includes('SƠN') || upper.includes('SON')) return 'chu_ki_son.png';
      return 'chu_ki_hung.png';
    };

    const signatureImage1 = getSig(testResult.bacSiDoc, testResult.daKy);
    const signatureImage2 = getSig(testResult.bacSiDoc2 || testResult.bacSiDoc, testResult.daKy2 !== undefined ? testResult.daKy2 : testResult.daKy);

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

      // Soi Tươi & Giải Phẫu Bệnh
      chanDoanLamSang: testResult.chanDoanLamSang,
      viTriBenhPham: testResult.viTriBenhPham,
      nhanXetDaiThe: testResult.nhanXetDaiThe,
      daiThe: testResult.daiThe,
      viThe: testResult.viThe,
      soiTuoiBachCau: testResult.soiTuoiBachCau,
      soiTuoiNam: testResult.soiTuoiNam,
      soiTuoiTapKhuan: testResult.soiTuoiTapKhuan,
      soiTuoiTeBaoBieuMo: testResult.soiTuoiTeBaoBieuMo,
      soiTuoiTrichomonas: testResult.soiTuoiTrichomonas,
      soiTuoiGhiChuBachCau: testResult.soiTuoiGhiChuBachCau,
      soiTuoiGhiChuNam: testResult.soiTuoiGhiChuNam,
      soiTuoiGhiChuTapKhuan: testResult.soiTuoiGhiChuTapKhuan,
      soiTuoiGhiChuTeBaoBieuMo: testResult.soiTuoiGhiChuTeBaoBieuMo,
      soiTuoiGhiChuTrichomonas: testResult.soiTuoiGhiChuTrichomonas,

      ketLuan: testResult.ketLuan,
      ketLuan2: testResult.ketLuan2,
      khuyenNghi: testResult.khuyenNghi,
      ngayXetNghiem: testResult.ngayXetNghiem,
      ngayXetNghiem2: testResult.ngayXetNghiem2,
      bacSiDoc: testResult.bacSiDoc,
      bacSiDoc2: testResult.bacSiDoc2,
      bacSiTitle,
      anhTeBao: testResult.anhTeBao,
      anhHpv: testResult.anhHpv,
      signatureImage: signatureImage1,
      signatureImage2: signatureImage2,
    });

    const filename = `${testResult.maSo} ${testResult.hoTen}.pdf`;

    // Support inline preview mode via ?mode=preview
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode');
    const disposition = mode === 'preview' ? 'inline' : `attachment; filename="${encodeURIComponent(filename)}"`;

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': disposition,
      },
    });
  } catch (error) {
    console.error('Export PDF error:', error);
    return NextResponse.json({ error: 'Lỗi tạo file PDF' }, { status: 500 });
  }
}
