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

    // Map bác sĩ đọc kết quả → file chữ ký (Linh hoạt theo tên hoặc từ khóa)
    let signatureImage = '';
    if (testResult.daKy) {
      const docName = (testResult.bacSiDoc || '').toUpperCase();
      if (docName.includes('TRỰC') || docName.includes('TRUC')) {
        signatureImage = 'chu_ki_truc.png';
      } else if (docName.includes('HÙNG') || docName.includes('HUNG')) {
        signatureImage = 'chu_ki_hung.png';
      } else if (docName.includes('DƯƠNG') || docName.includes('DUONG')) {
        signatureImage = 'chu_ki_duong.png';
      } else if (docName.includes('DŨNG') || docName.includes('DUNG')) {
        signatureImage = 'chu_ki_dung.png';
      } else {
        // Mặc định nếu là Admin hoặc chưa map tên cụ thể
        signatureImage = 'chu_ki_hung.png';
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
      khuyenNghi: testResult.khuyenNghi || '',
      ngayXetNghiem: testResult.ngayXetNghiem,
      bacSiDoc: testResult.bacSiDoc || 'BS CK1 PHẠM THẾ HÙNG',
      bacSiTitle,
      anhTeBao: testResult.anhTeBao,
      signatureImage,
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
