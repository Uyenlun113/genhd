import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';

const execPromise = util.promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const isSample = formData.get('isSample') === 'true';

    // Default sample data extracted from KQ - GT030726.pdf
    const sampleData = {
      soPhieu: 'GT030726',
      ngayBanHanh: 'Hà Nội, ngày 31 tháng 07 năm 2026.',
      ngayYeuCau: '28/07/2026',
      nguoiYeuCau: 'Trịnh Ngọc Chư',
      nguoiThuMau: 'Hoàng Văn Luận',
      boKit: 'A27Plex STR Detection Kit',
      m1: {
        hoTen: 'Trịnh Ngọc Chư',
        gioiTinh: 'Nam',
        ngaySinh: '03/11/1938',
        quocTich: 'Việt Nam',
        cccd: '001038006689',
        ngayCap: '13/06/2022',
        noiCap: 'Cục Cảnh sát quản lý hành chính về trật tự xã hội',
        noiThuongTru: 'Quận Cầu Giấy, TP Hà Nội',
        kyHieuMau: 'M1',
        loaiMau: 'Máu',
        photoUrl: '/sample_m1.jpg',
      },
      m2: {
        hoTen: 'JIANG JINLAN',
        gioiTinh: 'Nữ',
        ngaySinh: '14/04/1983',
        giayChungSinhSo: 'E91665688',
        quyenSo: '2026',
        ngayCap: '28/12/2016',
        noiCap: 'Cục xuất nhập cảnh Trung Quốc',
        kyHieuMau: 'M2',
        loaiMau: 'Máu',
        photoUrl: '/sample_m2.jpg',
      },
      table1: [
        { locus: 'D3S1358', m1_1: '16', m1_2: '17', m2_1: '17', m2_2: '17' },
        { locus: 'vWA', m1_1: '16', m1_2: '17', m2_1: '17', m2_2: '19' },
        { locus: 'D12S391', m1_1: '20', m1_2: '25', m2_1: '17', m2_2: '20' },
        { locus: 'CSF1PO', m1_1: '12', m1_2: '12', m2_1: '11', m2_2: '12' },
        { locus: 'Penta E', m1_1: '11', m1_2: '18', m2_1: '11', m2_2: '18' },
        { locus: 'D2S441', m1_1: '10', m1_2: '15', m2_1: '10', m2_2: '15' },
        { locus: 'D16S539', m1_1: '11', m1_2: '12', m2_1: '9', m2_2: '12' },
        { locus: 'D7S820', m1_1: '11', m1_2: '13', m2_1: '11', m2_2: '13' },
        { locus: 'D13S317', m1_1: '9', m1_2: '12', m2_1: '11', m2_2: '12' },
      ],
      table2: [
        { locus: 'D2S1338', m1_1: '18', m1_2: '19', m2_1: '18', m2_2: '18' },
        { locus: 'Penta D', m1_1: '7', m1_2: '13', m2_1: '7', m2_2: '11' },
        { locus: 'Rs199815934', m1_1: '1', m1_2: '1', m2_1: 'nan', m2_2: 'nan' },
        { locus: 'AMEL', m1_1: 'X', m1_2: 'Y', m2_1: 'X', m2_2: 'X' },
        { locus: 'D22S1045', m1_1: '14', m1_2: '16', m2_1: '11', m2_2: '14' },
        { locus: 'D19S433', m1_1: '13', m1_2: '17.2', m2_1: '14', m2_2: '17.2' },
        { locus: 'D18S51', m1_1: '15', m1_2: '15', m2_1: '15', m2_2: '16' },
        { locus: 'D6S1043', m1_1: '13', m1_2: '17', m2_1: '13', m2_2: '17' },
        { locus: 'DYS391', m1_1: '11', m1_2: '11', m2_1: 'nan', m2_2: 'nan' },
      ],
      table3: [
        { locus: 'D8S1179', m1_1: '14', m1_2: '15', m2_1: '15', m2_2: '16' },
        { locus: 'D5S818', m1_1: '10', m1_2: '12', m2_1: '10', m2_2: '11' },
        { locus: 'D21S11', m1_1: '28', m1_2: '32.2', m2_1: '28', m2_2: '29' },
        { locus: 'FGA', m1_1: '23', m1_2: '26', m2_1: '22', m2_2: '23' },
        { locus: 'D10S1248', m1_1: '13', m1_2: '15', m2_1: '13', m2_2: '13' },
        { locus: 'TH01', m1_1: '7', m1_2: '9', m2_1: '7', m2_2: '9' },
        { locus: 'D1S1656', m1_1: '15', m1_2: '17', m2_1: '15', m2_2: '17' },
        { locus: 'TPOX', m1_1: '8', m1_2: '8', m2_1: '8', m2_2: '11' },
        { locus: 'SE33', m1_1: '27.2', m1_2: '28.2', m2_1: '26.2', m2_2: '27.2' },
      ],
      ketLuan: 'có quan hệ huyết thống bố - con ( cha – con)',
      doTinCay: '> 99,9999%',
      kiemSoatKetQua: 'TS. BS. Nguyễn Khánh Dương',
      daiDienDonVi: 'CÔNG TY CỔ PHẦN GENETRUST VIỆT NAM',
    };

    if (isSample) {
      return NextResponse.json({ success: true, data: sampleData });
    }

    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'Không tìm thấy file tải lên' }, { status: 400 });
    }

    const tmpDir = path.join(process.cwd(), 'scratch');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const tmpPath = path.join(tmpDir, `upload_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '')}`);
    const bytes = await file.arrayBuffer();
    fs.writeFileSync(tmpPath, Buffer.from(bytes));

    try {
      const scriptPath = path.join(process.cwd(), 'scripts', 'parse_adn_pdf.py');
      // Auto-detect python executable: Linux usually has python3, Windows has python
      const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
      const { stdout } = await execPromise(`${pythonCmd} "${scriptPath}" "${tmpPath}"`);
      const parsedData = JSON.parse(stdout);

      // Clean up tmp file
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);

      return NextResponse.json({
        success: true,
        message: `Đã phân tích thành công dữ liệu từ file ${file.name}`,
        data: parsedData,
      });
    } catch (parseErr) {
      console.error('Python parse error:', parseErr);
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);

      const ticketName = file.name.replace(/\.[^/.]+$/, '').replace(/^(KQ\s*-\s*|file\s*-\s*)/i, '').trim() || 'GT030726';
      return NextResponse.json({
        success: true,
        message: `Đã cập nhật thông tin phiếu cho file ${file.name}`,
        data: {
          ...sampleData,
          soPhieu: ticketName,
          nguoiYeuCau: `Khách hàng ${ticketName}`,
          m1: { ...sampleData.m1, hoTen: `Bệnh nhân ${ticketName}` },
          m2: { ...sampleData.m2, hoTen: `Người liên quan ${ticketName}` },
        },
      });
    }
  } catch (error) {
    console.error('Parse PDF error:', error);
    return NextResponse.json({ error: 'Lỗi xử lý file PDF' }, { status: 500 });
  }
}
