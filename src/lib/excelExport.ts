import ExcelJS from 'exceljs';

export interface TestResultExportItem {
  _id?: any;
  maSo?: string;
  hoTen?: string;
  namSinh?: number;
  gioiTinh?: string;
  diaChi?: string;
  soDienThoai?: string;
  chanDoanLamSang?: string;
  loaiMau?: string;
  donVi?: string;
  bacSiChiDinh?: string;
  loaiXetNghiem?: string;
  trangThai?: string;
  ngayNhanMau?: string | Date;
  ngayTraKetQua?: string | Date;
  bacSiDoc?: string;
}

function formatDate(dateInput?: string | Date | null): string {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatTrangThai(status?: string): string {
  if (status === 'nhap_thong_tin') return 'nhập thông tin';
  if (status === 'chay_ket_qua') return 'chạy kết quả';
  if (status === 'da_tra_ket_qua') return 'đã trả kết quả';
  return status || '';
}

function formatGoiXetNghiem(loai?: string): string {
  if (!loai) return 'Chưa xác định';
  const l = loai.toLowerCase();
  if (l === 'cell') return 'CELL';
  if (l === 'thinprep') return 'ThinPrep';
  if (l === 'hpv40') return 'HPV 40';
  if (l === 'hpv20') return 'HPV 20';
  if (l === 'hpv23') return 'HPV 23';
  if (l === 'soituoi') return 'Soi tươi';
  if (l === 'giaiphaubenh') return 'Giải Phẫu Bệnh';
  return loai.toUpperCase();
}

export async function generateTestResultsExcelBuffer(items: TestResultExportItem[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'GenHD System';
  workbook.lastModifiedBy = 'GenHD System';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Danh Sách Xét Nghiệm', {
    views: [{ showGridLines: true }],
  });

  // Header definition matching the template image:
  // Columns: A-P
  const columns = [
    { header: 'STT', key: 'stt', width: 8, align: 'center', isYellow: false },
    { header: 'Mã ca', key: 'maSo', width: 16, align: 'center', isYellow: false },
    { header: 'Tên KH', key: 'hoTen', width: 25, align: 'left', isYellow: false },
    { header: 'Ngày sinh', key: 'namSinh', width: 14, align: 'center', isYellow: false },
    { header: 'Giới tính', key: 'gioiTinh', width: 12, align: 'center', isYellow: true },
    { header: 'Địa Chỉ', key: 'diaChi', width: 30, align: 'left', isYellow: false },
    { header: 'SĐT', key: 'soDienThoai', width: 16, align: 'center', isYellow: true },
    { header: 'Chuẩn đoán', key: 'chanDoanLamSang', width: 25, align: 'left', isYellow: false },
    { header: 'Loại mẫu', key: 'loaiMau', width: 16, align: 'left', isYellow: false },
    { header: 'Đơn Vị', key: 'donVi', width: 20, align: 'left', isYellow: false },
    { header: 'Bác sỹ chỉ định', key: 'bacSiChiDinh', width: 22, align: 'left', isYellow: false },
    { header: 'Gói Xét Nghiệm', key: 'goiXetNghiem', width: 20, align: 'left', isYellow: false },
    { header: 'trạng thái mẫu', key: 'trangThaiMau', width: 22, align: 'left', isYellow: false },
    { header: 'ngày nhận mẫu', key: 'ngayNhanMau', width: 16, align: 'center', isYellow: true },
    { header: 'ngày trả kết quả', key: 'ngayTraKetQua', width: 16, align: 'center', isYellow: true },
    { header: 'bác sỹ trả kết quả', key: 'bacSyTraKetQua', width: 22, align: 'left', isYellow: true },
  ];

  worksheet.columns = columns.map((col) => ({
    key: col.key,
    width: col.width,
  }));

  // Add header row at row 1
  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;

  columns.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = col.header;
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

    if (col.isYellow) {
      // Yellow Header Style (#FFFF00)
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFF00' },
      };
      cell.font = {
        name: 'Arial',
        size: 11,
        bold: true,
        color: { argb: 'FF000000' },
      };
    } else {
      // Dark Green Header Style (#006100)
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF006100' },
      };
      cell.font = {
        name: 'Arial',
        size: 11,
        bold: true,
        color: { argb: 'FFFFFFFF' },
      };
    }

    cell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } },
    };
  });

  // Add Data Rows
  items.forEach((item, index) => {
    const rowNumber = index + 2;
    const row = worksheet.getRow(rowNumber);
    row.height = 22;

    const rowData = {
      stt: index + 1,
      maSo: item.maSo || '',
      hoTen: item.hoTen || '',
      namSinh: item.namSinh || '',
      gioiTinh: item.gioiTinh || '',
      diaChi: item.diaChi || '',
      soDienThoai: item.soDienThoai || '',
      chanDoanLamSang: item.chanDoanLamSang || '',
      loaiMau: item.loaiMau || '',
      donVi: item.donVi || '',
      bacSiChiDinh: item.bacSiChiDinh || '',
      goiXetNghiem: formatGoiXetNghiem(item.loaiXetNghiem),
      trangThaiMau: formatTrangThai(item.trangThai),
      ngayNhanMau: formatDate(item.ngayNhanMau),
      ngayTraKetQua: formatDate(item.ngayTraKetQua),
      bacSyTraKetQua: item.bacSiDoc || '',
    };

    columns.forEach((col, colIdx) => {
      const cell = row.getCell(colIdx + 1);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cell.value = (rowData as any)[col.key];

      cell.font = {
        name: 'Arial',
        size: 10,
      };

      cell.alignment = {
        vertical: 'middle',
        horizontal: (col.align as 'center' | 'left' | 'right') || 'left',
      };

      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
        left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
        bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
        right: { style: 'thin', color: { argb: 'FFD9D9D9' } },
      };
    });
  });

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

export interface DoctorStatExportItem {
  doctorName: string;
  count: number;
  completed: number;
  processing: number;
}

export async function exportDoctorStatsExcel(byDoctorData: DoctorStatExportItem[]): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'GenHD System';
  workbook.lastModifiedBy = 'GenHD System';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Thống Kê Bác Sĩ', {
    views: [{ showGridLines: true }],
  });

  const columns = [
    { header: 'STT', key: 'stt', width: 8, align: 'center' },
    { header: 'Bác sĩ đọc kết quả', key: 'doctorName', width: 32, align: 'left' },
    { header: 'Tổng', key: 'count', width: 14, align: 'center' },
    { header: 'Đã hoàn tất', key: 'completed', width: 16, align: 'center' },
    { header: 'Đang xử lý', key: 'processing', width: 16, align: 'center' },
  ];

  worksheet.columns = columns.map((col) => ({
    key: col.key,
    width: col.width,
  }));

  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;

  columns.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = col.header;
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF006100' },
    };
    cell.font = {
      name: 'Arial',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } },
    };
  });

  byDoctorData.forEach((item, index) => {
    const rowNumber = index + 2;
    const row = worksheet.getRow(rowNumber);
    row.height = 22;

    row.getCell(1).value = index + 1;
    row.getCell(2).value = item.doctorName || '';
    row.getCell(3).value = item.count || 0;
    row.getCell(4).value = item.completed || 0;
    row.getCell(5).value = item.processing || 0;

    columns.forEach((col, colIdx) => {
      const cell = row.getCell(colIdx + 1);
      cell.font = { name: 'Arial', size: 10 };
      cell.alignment = {
        vertical: 'middle',
        horizontal: (col.align as 'center' | 'left' | 'right') || 'left',
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
        left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
        bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
        right: { style: 'thin', color: { argb: 'FFD9D9D9' } },
      };
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  a.download = `Thong_Ke_Bac_Si_${dateStr}.xlsx`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  a.remove();
}

