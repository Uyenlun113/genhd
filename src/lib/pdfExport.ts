import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs';
import path from 'path';

export interface ITestResultData {
  maSo: string;
  loaiXetNghiem?: 'cell' | 'thinprep' | 'hpv40' | 'hpv20' | 'soituoi';
  hoTen: string;
  namSinh: number;
  gioiTinh: string;
  diaChi: string;
  soDienThoai: string;
  loaiMau: string;
  donVi: string;
  bacSiChiDinh: string;
  ngayNhanMau?: string | Date;
  ngayTraKetQua?: string | Date;

  // Dành cho Soi tươi & thông tin thêm
  chanDoanLamSang?: string;
  nhanXetDaiThe?: string;

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

  // Dành cho loại 'cell'
  tinhChatBenhPham?: 'dat' | 'khongDat';
  lyDoKhongDat?: string;
  khongTonThuong?: boolean;
  batThuongKhac?: boolean;
  teBaoNoiMac?: boolean;
  bienDoiViSinh?: string[];
  bienDoiKhac?: string[];
  batThuongVay?: string[];
  batThuongTuyen?: string[];

  // Dành cho HPV40 & HPV20
  hpvHighRiskResult?: string;
  hpvHighRiskOtherResult?: string;
  hpvLowRiskResult?: string;
  hpvOtherTypesResult?: string;

  // Chung
  ketLuan: string;
  khuyenNghi?: string;
  ngayXetNghiem: string | Date;
  bacSiDoc?: string;
  bacSiTitle?: string;
  anhTeBao?: string;
  signatureImage?: string; // tên file ảnh chữ ký trong public/ (vd: chu_ky_hung.jpg)
}

export async function generatePDF(data: ITestResultData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  // A4 dimensions: 595.32 x 841.92
  const page1 = pdfDoc.addPage([595.32, 841.92]);

  // Load Arial Fonts for Vietnamese Unicode support
  let fontBytes: Buffer | null = null;
  let boldFontBytes: Buffer | null = null;
  let italicFontBytes: Buffer | null = null;

  const fontPath = path.join(process.cwd(), 'public', 'Arial.ttf');
  const boldFontPath = path.join(process.cwd(), 'public', 'Arial-Bold.ttf');
  const italicFontPath = path.join(process.cwd(), 'public', 'Arial-Italic.ttf');

  if (fs.existsSync(fontPath)) {
    try {
      fontBytes = fs.readFileSync(fontPath);
    } catch (err) {
      console.error('Error reading Arial font:', err);
    }
  }

  if (fs.existsSync(boldFontPath)) {
    try {
      boldFontBytes = fs.readFileSync(boldFontPath);
    } catch (err) {
      console.error('Error reading Arial Bold font:', err);
    }
  }

  if (fs.existsSync(italicFontPath)) {
    try {
      italicFontBytes = fs.readFileSync(italicFontPath);
    } catch (err) {
      console.error('Error reading Arial Italic font:', err);
    }
  }

  let font: any;
  let boldFont: any;
  let italicFont: any;

  if (fontBytes) {
    font = await pdfDoc.embedFont(fontBytes);
  } else {
    font = await pdfDoc.embedFont('Helvetica');
  }

  if (boldFontBytes) {
    boldFont = await pdfDoc.embedFont(boldFontBytes);
  } else {
    boldFont = font;
  }

  if (italicFontBytes) {
    italicFont = await pdfDoc.embedFont(italicFontBytes);
  } else {
    italicFont = font;
  }

  // Colors
  const primaryBlue = rgb(0.05, 0.25, 0.45); // #0d4073
  const lightBlueBg = rgb(0.92, 0.96, 0.99); // #ebf4fa
  const borderGray = rgb(0.75, 0.85, 0.92); // #bfd9eb
  const blackColor = rgb(0, 0, 0);
  const whiteColor = rgb(1, 1, 1);
  const redColor = rgb(0.8, 0.15, 0.15);
  const orangeColor = rgb(0.9, 0.5, 0.1);
  const lightYellowBg = rgb(1, 0.98, 0.92);

  const drawTextOnPage = (
    targetPage: typeof page1,
    text: string,
    x: number,
    y: number,
    size = 9.5,
    isBold = false,
    color = blackColor,
    isItalic = false
  ) => {
    if (!text) return;
    try {
      const fontToUse = isItalic ? italicFont : isBold ? boldFont : font;
      targetPage.drawText(String(text), {
        x,
        y,
        size,
        font: fontToUse,
        color,
      });
    } catch (err) {
      console.error(`Failed to draw text "${text}":`, err);
    }
  };

  // Helper for centered text between xStart and xEnd
  const drawCenteredText = (
    targetPage: typeof page1,
    text: string,
    xStart: number,
    xEnd: number,
    y: number,
    size = 9.5,
    isBold = false,
    color = blackColor
  ) => {
    if (!text) return;
    try {
      const selectedFont = isBold ? boldFont : font;
      const textWidth = selectedFont.widthOfTextAtSize(String(text), size);
      const x = xStart + (xEnd - xStart - textWidth) / 2;
      targetPage.drawText(String(text), {
        x,
        y,
        size,
        font: selectedFont,
        color,
      });
    } catch (err) {
      console.error(`Failed to draw centered text "${text}":`, err);
    }
  };

  const drawCheckboxSymbolOnPage = (targetPage: typeof page1, isChecked: boolean, x: number, y: number) => {
    targetPage.drawRectangle({
      x,
      y: y - 1,
      width: 9,
      height: 9,
      borderColor: rgb(0.25, 0.25, 0.25),
      borderWidth: 0.8,
      color: whiteColor,
    });

    if (isChecked) {
      targetPage.drawText('X', {
        x: x + 1.5,
        y,
        size: 7.5,
        font: boldFont,
        color: primaryBlue,
      });
    }
  };

  const formatDateStr = (dateVal?: string | Date) => {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const wrapTextLines = (text: string, maxLen = 70): string[] => {
    if (!text) return [];
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + ' ' + word).trim().length > maxLen) {
        lines.push(currentLine.trim());
        currentLine = word;
      } else {
        currentLine += (currentLine ? ' ' : '') + word;
      }
    }
    if (currentLine.trim()) lines.push(currentLine.trim());
    return lines;
  };

  // Embed Logo
  let logoImage: any = null;
  const logoPath = path.join(process.cwd(), 'public', 'logo.png');
  if (fs.existsSync(logoPath)) {
    try {
      const logoBytes = fs.readFileSync(logoPath);
      logoImage = await pdfDoc.embedPng(logoBytes);
    } catch (err) {
      console.error('Failed to embed logo:', err);
    }
  }

  // Embed Red Stamp (dau-do.png)
  let stampImage: any = null;
  const stampPath = path.join(process.cwd(), 'public', 'dau-do.png');
  if (fs.existsSync(stampPath)) {
    try {
      const stampBytes = fs.readFileSync(stampPath);
      stampImage = await pdfDoc.embedPng(stampBytes);
    } catch (err) {
      console.error('Failed to embed stamp:', err);
    }
  }

  // Soft Watermark Overlay (opacity 0.06)
  const drawWatermarkOverlay = (targetPage: typeof page1) => {
    if (logoImage) {
      try {
        const watermarkSize = 535;
        const xPos = (595.32 - watermarkSize) / 2;
        const yPos = (841.92 - watermarkSize) / 2;

        targetPage.drawImage(logoImage, {
          x: xPos,
          y: yPos,
          width: watermarkSize,
          height: watermarkSize,
          opacity: 0.06,
        });
      } catch (err) {
        console.error('Failed to draw watermark:', err);
      }
    }
  };

  // Embed Signature Image if provided
  let signatureImg: any = null;
  if (data.signatureImage) {
    let sigPath = path.join(process.cwd(), 'public', data.signatureImage);
    if (!fs.existsSync(sigPath)) {
      const altName1 = data.signatureImage.replace('.jpg', '.png').replace('chu_ky_', 'chu_ki_');
      const altName2 = data.signatureImage.replace('.png', '.jpg').replace('chu_ki_', 'chu_ky_');
      if (fs.existsSync(path.join(process.cwd(), 'public', altName1))) {
        sigPath = path.join(process.cwd(), 'public', altName1);
      } else if (fs.existsSync(path.join(process.cwd(), 'public', altName2))) {
        sigPath = path.join(process.cwd(), 'public', altName2);
      }
    }

    if (fs.existsSync(sigPath)) {
      try {
        const sigBytes = fs.readFileSync(sigPath);
        try {
          signatureImg = await pdfDoc.embedPng(sigBytes);
        } catch {
          try {
            signatureImg = await pdfDoc.embedJpg(sigBytes);
          } catch {
            const sharp = require('sharp');
            const cleanPngBytes = await sharp(sigBytes).png().toBuffer();
            signatureImg = await pdfDoc.embedPng(cleanPngBytes);
          }
        }
      } catch (err) {
        console.error('Failed to embed signature image:', err);
      }
    }
  }

  // Common Top Header: Logo + Company Info + Red Stamp overlay
  if (logoImage) {
    page1.drawImage(logoImage, {
      x: 35,
      y: 765,
      width: 65,
      height: 65,
    });
  }

  drawTextOnPage(page1, 'CÔNG TY TNHH GIẢI PHÁP DI TRUYỀN Y HỌC GEN HD', 115, 810, 11, true, blackColor);
  drawTextOnPage(page1, 'CƠ SỞ XÉT NGHIỆM GEN HD', 115, 796, 11, true, primaryBlue);
  drawTextOnPage(page1, 'Địa chỉ: Số 217 Yên Tân, P. Bồ Đề, Q. Long Biên, Hà Nội', 115, 783, 9, false, rgb(0.3, 0.3, 0.3));
  drawTextOnPage(page1, 'Hotline / Zalo: 0915.891.616 - 0942.023.555', 115, 771, 9, false, rgb(0.3, 0.3, 0.3));

  // Red Stamp overlaying on top of logo and company info text (Super Large 200x200 size)
  if (stampImage) {
    page1.drawImage(stampImage, {
      x: 20,
      y: 670,
      width: 200,
      height: 200,
    });
  }

  page1.drawLine({
    start: { x: 35, y: 755 },
    end: { x: 560, y: 755 },
    thickness: 2,
    color: primaryBlue,
  });

  const loaiXetNghiem = data.loaiXetNghiem || 'cell';

  // Helper for centered Doctor Signature block on the right half (x: 295 to 560)
  const drawDoctorSignatureBlock = (targetPage: typeof page1, dateVal: string | Date, yStart: number) => {
    const rightXStart = 295;
    const rightXEnd = 560;

    const dateObj = dateVal ? new Date(dateVal) : new Date();
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    const dateStr = `Hà Nội, ngày ${day} tháng ${month} năm ${year}`;

    // 1. Date string centered
    drawCenteredText(targetPage, dateStr, rightXStart, rightXEnd, yStart, 9.5, false, rgb(0.2, 0.2, 0.2));

    // 2. Title centered
    drawCenteredText(targetPage, 'BÁC SĨ ĐỌC KẾT QUẢ', rightXStart, rightXEnd, yStart - 16, 10.5, true, primaryBlue);

    // 3. Doctor Name dynamically using assigned / logged-in doctor
    const docName = data.bacSiDoc || 'BS CK1 PHẠM THẾ HÙNG';

    // 3.5. Embed Signature Image (top is 5px below "BÁC SĨ ĐỌC KẾT QUẢ" text)
    if (signatureImg) {
      try {
        const sigWidth = 190;
        const sigHeight = 85;
        const sigX = rightXStart + (rightXEnd - rightXStart - sigWidth) / 2;
        // Text baseline is yStart - 16, bottom is yStart - 18. Top of img at yStart - 23 (5px gap).
        const sigY = yStart - 108;
        targetPage.drawImage(signatureImg, {
          x: sigX,
          y: sigY,
          width: sigWidth,
          height: sigHeight,
        });
      } catch (err) {
        console.error('Failed to draw signature image on PDF:', err);
      }
    }

    drawCenteredText(targetPage, docName, rightXStart, rightXEnd, yStart - 122, 11, true, blackColor);

    // 4. Subtitle centered
    const titleText = data.bacSiTitle || '(Chuyên khoa Xét nghiệm - Giải phẫu bệnh lý)';
    drawCenteredText(
      targetPage,
      titleText,
      rightXStart,
      rightXEnd,
      yStart - 135,
      8.5,
      false,
      rgb(0.35, 0.35, 0.35)
    );
  };

  // -------------------------------------------------------------
  // BRANCH 3: SOI TƯƠI DỊCH
  // -------------------------------------------------------------
  if (loaiXetNghiem === 'soituoi') {
    drawCenteredText(page1, 'PHIẾU KẾT QUẢ XÉT NGHIỆM SOI TƯƠI', 35, 560, 735, 14, true, primaryBlue);

    // Administrative Table Grid with 8 Rows
    const tableX = 35;
    const tableY = 715;
    const tableW = 525;
    const rowH = 18;
    const tableH = rowH * 8;

    page1.drawRectangle({
      x: tableX,
      y: tableY - tableH,
      width: tableW,
      height: tableH,
      borderColor: borderGray,
      borderWidth: 1,
      color: whiteColor,
    });

    const drawHorizDivider = (rowIndex: number) => {
      page1.drawLine({
        start: { x: tableX, y: tableY - rowIndex * rowH },
        end: { x: tableX + tableW, y: tableY - rowIndex * rowH },
        thickness: 1,
        color: borderGray,
      });
    };

    for (let i = 1; i < 8; i++) {
      drawHorizDivider(i);
    }

    page1.drawLine({
      start: { x: 295, y: tableY },
      end: { x: 295, y: tableY - tableH },
      thickness: 1,
      color: borderGray,
    });

    const drawRowText = (rIdx: number, label1: string, val1: string, label2?: string, val2?: string) => {
      const lineY = tableY - rIdx * rowH - 12;
      drawTextOnPage(page1, label1, tableX + 8, lineY, 9, true, rgb(0.2, 0.2, 0.2));
      drawTextOnPage(page1, val1 || '', tableX + 115, lineY, 9.5, false, blackColor);

      if (label2) {
        drawTextOnPage(page1, label2, 303, lineY, 9, true, rgb(0.2, 0.2, 0.2));
        drawTextOnPage(page1, val2 || '', 400, lineY, 9.5, false, blackColor);
      }
    };

    drawRowText(0, 'Mã bệnh nhân:', data.maSo, 'Họ và tên:', data.hoTen);
    drawRowText(1, 'Năm sinh:', String(data.namSinh || ''), 'Giới tính:', data.gioiTinh);
    drawRowText(2, 'Địa chỉ:', data.diaChi);
    drawRowText(3, 'Điện thoại:', data.soDienThoai, 'Bác sĩ chỉ định:', data.bacSiChiDinh);
    drawRowText(4, 'Đơn vị gửi mẫu:', data.donVi);
    drawRowText(5, 'Chẩn đoán lâm sàng:', data.chanDoanLamSang || '');
    drawRowText(6, 'Nhận xét đại thể:', data.nhanXetDaiThe || '');
    drawRowText(7, 'Ngày nhận mẫu:', formatDateStr(data.ngayNhanMau), 'Ngày trả kết quả:', formatDateStr(data.ngayTraKetQua));

    // Section Bar: KẾT QUẢ XÉT NGHIỆM SOI TƯƠI
    const secY = 540;
    page1.drawRectangle({
      x: tableX,
      y: secY,
      width: tableW,
      height: 24,
      color: lightBlueBg,
      borderColor: borderGray,
      borderWidth: 1,
    });
    drawCenteredText(page1, 'KẾT QUẢ XÉT NGHIỆM SOI TƯƠI', tableX, tableX + tableW, secY + 6, 11, true, primaryBlue);

    // Results Table
    const resTableY = 505;
    const resTableH = 150;
    page1.drawRectangle({
      x: tableX,
      y: resTableY - resTableH,
      width: tableW,
      height: resTableH,
      color: whiteColor,
      borderColor: borderGray,
      borderWidth: 1,
    });

    // Table Header Bar (Dark Blue)
    page1.drawRectangle({
      x: tableX,
      y: resTableY - 25,
      width: tableW,
      height: 25,
      color: primaryBlue,
    });

    const colX = [35, 70, 175, 260, 420, 560];

    drawCenteredText(page1, 'STT', colX[0], colX[1], resTableY - 17, 9.5, true, whiteColor);
    drawCenteredText(page1, 'SOI TƯƠI', colX[1], colX[2], resTableY - 17, 9.5, true, whiteColor);
    drawCenteredText(page1, 'KẾT QUẢ', colX[2], colX[3], resTableY - 17, 9.5, true, whiteColor);
    drawCenteredText(page1, 'Ý NGHĨA', colX[3], colX[4], resTableY - 17, 9.5, true, whiteColor);
    drawCenteredText(page1, 'GHI CHÚ', colX[4], colX[5], resTableY - 17, 9.5, true, whiteColor);

    const rowsData = [
      { stt: '1', name: 'Bạch cầu', res: data.soiTuoiBachCau || '', mean: 'Đánh giá mức độ viêm nhiễm', note: data.soiTuoiGhiChuBachCau || '' },
      { stt: '2', name: 'Nấm', res: data.soiTuoiNam || '', mean: 'Đánh giá sự xuất hiện của nấm', note: data.soiTuoiGhiChuNam || '' },
      { stt: '3', name: 'Tạp khuẩn', res: data.soiTuoiTapKhuan || '', mean: 'Viêm do vi khuẩn', note: data.soiTuoiGhiChuTapKhuan || '' },
      { stt: '4', name: 'Tế bào biểu mô', res: data.soiTuoiTeBaoBieuMo || '', mean: 'Đánh giá chất lượng mẫu', note: data.soiTuoiGhiChuTeBaoBieuMo || '' },
      { stt: '5', name: 'Trichomonas vaginalis', isItalic: true, res: data.soiTuoiTrichomonas || '', mean: '', note: data.soiTuoiGhiChuTrichomonas || '' },
    ];

    rowsData.forEach((row, idx) => {
      const rY = resTableY - 25 - (idx + 1) * 25;

      page1.drawLine({
        start: { x: tableX, y: rY + 25 },
        end: { x: tableX + tableW, y: rY + 25 },
        thickness: 1,
        color: borderGray,
      });

      if (idx % 2 === 1) {
        page1.drawRectangle({
          x: tableX + 1,
          y: rY + 1,
          width: tableW - 2,
          height: 23,
          color: lightBlueBg,
        });
      }

      drawCenteredText(page1, row.stt, colX[0], colX[1], rY + 8, 9, false, blackColor);
      drawTextOnPage(page1, row.name, colX[1] + 8, rY + 8, 9, false, blackColor, row.isItalic);
      drawCenteredText(page1, row.res, colX[2], colX[3], rY + 8, 9.5, true, primaryBlue);
      drawTextOnPage(page1, row.mean, colX[3] + 8, rY + 8, 8.5, false, rgb(0.2, 0.2, 0.2));
      drawTextOnPage(page1, row.note, colX[4] + 8, rY + 8, 8.5, false, blackColor);
    });

    // Draw vertical column dividers ON TOP of all backgrounds to ensure high visibility
    for (let c = 1; c < colX.length - 1; c++) {
      page1.drawLine({
        start: { x: colX[c], y: resTableY - 25 },
        end: { x: colX[c], y: resTableY - resTableH },
        thickness: 1,
        color: borderGray,
      });

      // White vertical dividers inside dark blue header
      page1.drawLine({
        start: { x: colX[c], y: resTableY },
        end: { x: colX[c], y: resTableY - 25 },
        thickness: 1,
        color: whiteColor,
      });
    }

    // Conclusion Box (KẾT LUẬN)
    const ketLuanBoxY = 280;
    const ketLuanBoxH = 65;
    page1.drawRectangle({
      x: tableX,
      y: ketLuanBoxY,
      width: tableW,
      height: ketLuanBoxH,
      color: lightBlueBg,
      borderColor: borderGray,
      borderWidth: 1,
    });

    drawTextOnPage(page1, 'KẾT LUẬN:', tableX + 10, ketLuanBoxY + ketLuanBoxH - 18, 9.5, true, primaryBlue);
    const klLines = wrapTextLines(data.ketLuan || 'BÌNH THƯỜNG', 68);
    klLines.forEach((lText, lIdx) => {
      drawTextOnPage(page1, lText, tableX + 90, ketLuanBoxY + ketLuanBoxH - 18 - lIdx * 14, 9.5, true, blackColor);
    });

    // Doctor Signature
    drawDoctorSignatureBlock(page1, data.ngayXetNghiem, 220);

    drawWatermarkOverlay(page1);
    drawTextOnPage(page1, 'Trang 1 / 1', 510, 16, 8, false, rgb(0.5, 0.5, 0.5));

    const modifiedPdfBytes = await pdfDoc.save();
    return modifiedPdfBytes;
  }

  // -------------------------------------------------------------
  // BRANCH 1 & 2: HPV 40 TYPES / HPV 20 TYPES
  // -------------------------------------------------------------
  if (loaiXetNghiem === 'hpv40' || loaiXetNghiem === 'hpv20') {
    const isHPV40 = loaiXetNghiem === 'hpv40';
    const titleStr = isHPV40
      ? 'PHIẾU KẾT QUẢ XÉT NGHIỆM HPV 40 TYPES'
      : 'PHIẾU KẾT QUẢ XÉT NGHIỆM HPV 20 TYPES';
    const subTitleStr = isHPV40
      ? '(Kỹ thuật Real-time PCR / Genotyping định danh 40 chủng HPV)'
      : '(Kỹ thuật Real-time PCR / Genotyping định danh 20 chủng HPV)';

    drawCenteredText(page1, titleStr, 35, 560, 735, 14, true, primaryBlue);
    drawCenteredText(page1, subTitleStr, 35, 560, 722, 9, false, rgb(0.4, 0.4, 0.4));

    // Patient Info Table Grid
    const tableX = 35;
    const tableY = 712;
    const tableW = 525;
    const rowH = 17.5;
    const tableH = rowH * 7;

    page1.drawRectangle({
      x: tableX,
      y: tableY - tableH,
      width: tableW,
      height: tableH,
      borderColor: borderGray,
      borderWidth: 1,
      color: whiteColor,
    });

    const drawVertDivider = (topRowIndex: number, bottomRowIndex: number) => {
      page1.drawLine({
        start: { x: 295, y: tableY - topRowIndex * rowH },
        end: { x: 295, y: tableY - bottomRowIndex * rowH },
        thickness: 1,
        color: borderGray,
      });
    };

    drawVertDivider(0, 2);
    drawVertDivider(3, 4);
    drawVertDivider(5, 7);

    for (let i = 1; i < 7; i++) {
      page1.drawLine({
        start: { x: tableX, y: tableY - i * rowH },
        end: { x: tableX + tableW, y: tableY - i * rowH },
        thickness: 0.8,
        color: borderGray,
      });
    }

    // Row 1: Mã & Họ tên
    drawTextOnPage(page1, 'Mã bệnh nhân:', tableX + 8, tableY - 13, 9, true, rgb(0.2, 0.2, 0.2));
    drawTextOnPage(page1, data.maSo || '', tableX + 90, tableY - 13, 9.5, true);
    drawTextOnPage(page1, 'Họ và tên:', 303, tableY - 13, 9, true, rgb(0.2, 0.2, 0.2));
    drawTextOnPage(page1, data.hoTen || '', 365, tableY - 13, 9.5, true);

    // Row 2: Năm sinh & Giới tính
    drawTextOnPage(page1, 'Năm sinh:', tableX + 8, tableY - 30, 9, true, rgb(0.2, 0.2, 0.2));
    drawTextOnPage(page1, data.namSinh ? String(data.namSinh) : '', tableX + 90, tableY - 30, 9.5);
    drawTextOnPage(page1, 'Giới tính:', 303, tableY - 30, 9, true, rgb(0.2, 0.2, 0.2));
    drawTextOnPage(page1, data.gioiTinh || 'Nữ', 365, tableY - 30, 9.5);

    // Row 3: Địa chỉ
    drawTextOnPage(page1, 'Địa chỉ:', tableX + 8, tableY - 48, 9, true, rgb(0.2, 0.2, 0.2));
    drawTextOnPage(page1, data.diaChi || '', tableX + 90, tableY - 48, 9.5);

    // Row 4: Điện thoại & BS chỉ định
    drawTextOnPage(page1, 'Điện thoại:', tableX + 8, tableY - 65, 9, true, rgb(0.2, 0.2, 0.2));
    drawTextOnPage(page1, data.soDienThoai || '', tableX + 90, tableY - 65, 9.5);
    drawTextOnPage(page1, 'Bác sĩ chỉ định:', 303, tableY - 65, 9, true, rgb(0.2, 0.2, 0.2));
    drawTextOnPage(page1, data.bacSiChiDinh || '', 385, tableY - 65, 9.5);

    // Row 5: Đơn vị gửi mẫu
    drawTextOnPage(page1, 'Đơn vị gửi mẫu:', tableX + 8, tableY - 83, 9, true, rgb(0.2, 0.2, 0.2));
    drawTextOnPage(page1, data.donVi || '', tableX + 95, tableY - 83, 9.5);

    // Row 6: Loại mẫu
    drawTextOnPage(page1, 'Loại mẫu:', tableX + 8, tableY - 100, 9, true, rgb(0.2, 0.2, 0.2));
    drawTextOnPage(page1, data.loaiMau || 'Dịch', tableX + 90, tableY - 100, 9.5);

    // Row 7: Ngày nhận & Ngày trả
    drawTextOnPage(page1, 'Ngày nhận mẫu:', tableX + 8, tableY - 118, 9, true, rgb(0.2, 0.2, 0.2));
    drawTextOnPage(page1, formatDateStr(data.ngayNhanMau || data.ngayXetNghiem), tableX + 105, tableY - 118, 9.5);
    drawTextOnPage(page1, 'Ngày trả kết quả:', 303, tableY - 118, 9, true, rgb(0.2, 0.2, 0.2));
    drawTextOnPage(page1, formatDateStr(data.ngayTraKetQua || data.ngayXetNghiem), 400, tableY - 118, 9.5);

    // Method Header Bar
    const methodY = 572;
    page1.drawRectangle({
      x: tableX,
      y: methodY,
      width: tableW,
      height: 18,
      color: lightBlueBg,
      borderColor: borderGray,
      borderWidth: 1,
    });
    const methodStr = isHPV40
      ? 'Phương pháp xét nghiệm: Kỹ thuật Multiplex Nested-PCR nhân bản và phát hiện đoạn gen đặc hiệu của 40 chủng HPV.'
      : 'Phương pháp xét nghiệm: Kỹ thuật Multiplex Nested-PCR nhân bản và phát hiện đoạn gen đặc hiệu của 20 chủng HPV.';
    drawTextOnPage(page1, methodStr, tableX + 8, methodY + 4, 8.5, true, primaryBlue);

    // Genotype Table with explicit row heights per row to prevent line overlaps
    const gTableY = 550;

    const hpvRowsData = [
      {
        group: 'HPV Nguy Cơ Cao\n(Type 16, 18)',
        types: '16, 18',
        result: data.hpvHighRiskResult || 'Âm tính',
        color: redColor,
        height: isHPV40 ? 28 : 32,
      },
      {
        group: 'HPV Nguy Cơ Cao Khác\n(16 Types)',
        types: '26, 31, 33, 35, 39, 45, 51, 52, 53, 56, 58, 59, 66, 68, 73, 82',
        result: data.hpvHighRiskOtherResult || 'Âm tính',
        color: redColor,
        height: isHPV40 ? 38 : 42,
      },
      {
        group: 'HPV Nguy Cơ Thấp\n(2 Types)',
        types: '6, 11',
        result: data.hpvLowRiskResult || 'Âm tính',
        color: primaryBlue,
        height: isHPV40 ? 28 : 32,
      },
    ];

    if (isHPV40) {
      hpvRowsData.push({
        group: 'Các Type HPV Khác\n(20 Types)',
        types: '30, 32, 34, 40, 42, 43, 44, 54, 55, 61, 62, 67, 71, 72, 74, 81, 83, 84, 87, 90',
        result: data.hpvOtherTypesResult || 'Âm tính',
        color: rgb(0.3, 0.3, 0.3),
        height: 38,
      });
    }

    const totalBodyH = hpvRowsData.reduce((sum, r) => sum + r.height, 0);
    const gTableH = 20 + totalBodyH;

    // Header (Dark Blue)
    page1.drawRectangle({
      x: tableX,
      y: gTableY,
      width: tableW,
      height: 20,
      color: primaryBlue,
    });
    drawCenteredText(page1, 'NHÓM GENOTYPE HPV', tableX, tableX + 140, gTableY + 5, 9, true, whiteColor);
    drawCenteredText(
      page1,
      isHPV40 ? 'CÁC TYPE HPV KHẢO SÁT (40 TYPES)' : 'CÁC TYPE HPV KHẢO SÁT (20 TYPES)',
      tableX + 140,
      tableX + 410,
      gTableY + 5,
      9,
      true,
      whiteColor
    );
    drawCenteredText(page1, 'KẾT QUẢ', tableX + 410, tableX + tableW, gTableY + 5, 9, true, whiteColor);

    // Table Body Box
    page1.drawRectangle({
      x: tableX,
      y: gTableY - gTableH + 20,
      width: tableW,
      height: totalBodyH,
      color: whiteColor,
      borderColor: borderGray,
      borderWidth: 1,
    });

    // Column Dividers
    page1.drawLine({
      start: { x: tableX + 140, y: gTableY },
      end: { x: tableX + 140, y: gTableY - totalBodyH },
      thickness: 1,
      color: borderGray,
    });
    page1.drawLine({
      start: { x: tableX + 410, y: gTableY },
      end: { x: tableX + 410, y: gTableY - totalBodyH },
      thickness: 1,
      color: borderGray,
    });

    // Render each row with precise vertical bounds
    let currentYTop = gTableY; // Starts right below header

    hpvRowsData.forEach((row, idx) => {
      const rowTop = currentYTop;
      const rowBottom = rowTop - row.height;
      currentYTop = rowBottom;

      // Horizontal divider line between rows (except last row)
      if (idx < hpvRowsData.length - 1) {
        page1.drawLine({
          start: { x: tableX, y: rowBottom },
          end: { x: tableX + tableW, y: rowBottom },
          thickness: 0.8,
          color: borderGray,
        });
      }

      // 1. Group Title (Column 1)
      const groupLines = row.group.split('\n');
      if (groupLines.length === 2) {
        drawTextOnPage(page1, groupLines[0], tableX + 8, rowTop - 13, 8.5, true, row.color);
        drawTextOnPage(page1, groupLines[1], tableX + 8, rowTop - 24, 8.5, true, row.color);
      } else {
        drawTextOnPage(page1, groupLines[0], tableX + 8, rowTop - (row.height / 2 + 3), 8.5, true, row.color);
      }

      // 2. Types List (Column 2)
      const typeLines = wrapTextLines(row.types, 55);
      if (typeLines.length === 2) {
        drawTextOnPage(page1, typeLines[0], tableX + 148, rowTop - 13, 8.5, false, blackColor);
        drawTextOnPage(page1, typeLines[1], tableX + 148, rowTop - 24, 8.5, false, blackColor);
      } else {
        drawTextOnPage(page1, typeLines[0], tableX + 148, rowTop - (row.height / 2 + 3), 8.5, false, blackColor);
      }

      // 3. Result Text Centered in Column 3
      drawCenteredText(
        page1,
        row.result,
        tableX + 410,
        tableX + tableW,
        rowTop - (row.height / 2 + 3),
        9.5,
        true,
        primaryBlue
      );
    });

    // Real-time PCR Chart Box
    const chartBoxY = isHPV40 ? 300 : 310;
    const chartBoxH = 90;

    page1.drawRectangle({
      x: tableX,
      y: chartBoxY,
      width: tableW,
      height: chartBoxH,
      color: whiteColor,
      borderColor: primaryBlue,
      borderWidth: 1,
    });

    drawTextOnPage(
      page1,
      'BIỂU ĐỒ TÍN HIỆU TẢI LƯỢNG KẾT QUẢ (REAL-TIME PCR)',
      tableX + 10,
      chartBoxY + chartBoxH - 14,
      9,
      true,
      primaryBlue
    );

    // Embedded PCR chart image if uploaded
    if (data.anhTeBao && data.anhTeBao.length > 20) {
      try {
        let imageBytes: Buffer;
        if (data.anhTeBao.startsWith('http://') || data.anhTeBao.startsWith('https://')) {
          const res = await fetch(data.anhTeBao);
          const arrayBuf = await res.arrayBuffer();
          imageBytes = Buffer.from(arrayBuf);
        } else {
          const base64Data = data.anhTeBao.replace(/^data:image\/\w+;base64,/, '');
          imageBytes = Buffer.from(base64Data, 'base64');
        }

        let embeddedImg;
        if (data.anhTeBao.includes('.png') || data.anhTeBao.includes('image/png')) {
          embeddedImg = await pdfDoc.embedPng(imageBytes);
        } else {
          embeddedImg = await pdfDoc.embedJpg(imageBytes);
        }

        page1.drawImage(embeddedImg, {
          x: tableX + 10,
          y: chartBoxY + 6,
          width: tableW - 20,
          height: chartBoxH - 24,
        });
      } catch (err) {
        console.error('Failed to embed PCR chart image:', err);
      }
    } else {
      drawCenteredText(
        page1,
        '[ Khung hiển thị đồ thị tín hiệu huỳnh quang Real-time PCR / Đồ thị điện di ]',
        tableX,
        tableX + tableW,
        chartBoxY + 36,
        8.5,
        false,
        rgb(0.5, 0.5, 0.5)
      );
    }

    // Kết luận Box
    const ketLuanBoxY = chartBoxY - 52;
    const ketLuanBoxH = 44;
    page1.drawRectangle({
      x: tableX,
      y: ketLuanBoxY,
      width: tableW,
      height: ketLuanBoxH,
      color: lightBlueBg,
      borderColor: borderGray,
      borderWidth: 1,
    });

    drawTextOnPage(page1, 'KẾT LUẬN:', tableX + 10, ketLuanBoxY + 26, 9.5, true, primaryBlue);
    const kLines = wrapTextLines(data.ketLuan || 'ÂM TÍNH VỚI CÁC CHỦNG HPV KHẢO SÁT', 70);
    kLines.forEach((lText, lIdx) => {
      drawTextOnPage(page1, lText, tableX + 85, ketLuanBoxY + 26 - lIdx * 12, 9.5, true, blackColor);
    });

    // Draw Doctor Signature Block (Centered in right half: x 295 -> 560)
    drawDoctorSignatureBlock(page1, data.ngayXetNghiem, ketLuanBoxY - 20);

    // Bottom Orange/Yellow Note Box
    const noteBoxY = 22;
    page1.drawRectangle({
      x: tableX,
      y: noteBoxY,
      width: tableW,
      height: 40,
      color: lightYellowBg,
      borderColor: orangeColor,
      borderWidth: 0.8,
    });

    drawTextOnPage(page1, 'GHI CHÚ & CHÚ Ý:', tableX + 8, noteBoxY + 28, 8, true, orangeColor);
    drawTextOnPage(
      page1,
      '• Xét nghiệm này không phát hiện các type HPV ngoài vùng khảo sát, không phân biệt nhiễm cũ/mới và không đánh giá mức độ tổn thương tế bào.',
      tableX + 8,
      noteBoxY + 18,
      7.2,
      false,
      rgb(0.3, 0.3, 0.3)
    );
    drawTextOnPage(
      page1,
      '• Kết quả xét nghiệm không đồng nghĩa hoàn toàn với chẩn đoán ung thư lâm sàng.',
      tableX + 8,
      noteBoxY + 9,
      7.2,
      false,
      rgb(0.3, 0.3, 0.3)
    );
    drawTextOnPage(
      page1,
      '• Kết quả chỉ có giá trị trên mẫu bệnh phẩm nhận được tại thời điểm xét nghiệm.',
      tableX + 8,
      noteBoxY + 1,
      7.2,
      false,
      rgb(0.3, 0.3, 0.3)
    );

    drawTextOnPage(page1, 'Trang 1 / 1', 510, 10, 7.5, false, rgb(0.5, 0.5, 0.5));
    drawWatermarkOverlay(page1);

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  }

  // -------------------------------------------------------------
  // BRANCH 3: CELL / BETHESDA 2014 (MẪU CELL)
  // -------------------------------------------------------------

  const cellTitleStr = data.loaiXetNghiem === 'thinprep'
    ? 'PHIẾU KẾT QUẢ XÉT NGHIỆM TẾ BÀO CỔ TỬ CUNG (THIN PREP PAP TEST)'
    : 'PHIẾU KẾT QUẢ XÉT NGHIỆM TẾ BÀO CỔ TỬ CUNG';

  drawCenteredText(page1, cellTitleStr, 35, 560, 735, 14, true, primaryBlue);

  // Patient Information Table Grid
  const tableX = 35;
  const tableY = 720;
  const tableW = 525;
  const rowH = 18;
  const tableH = rowH * 8;

  page1.drawRectangle({
    x: tableX,
    y: tableY - tableH,
    width: tableW,
    height: tableH,
    borderColor: borderGray,
    borderWidth: 1,
    color: whiteColor,
  });

  const drawVertDivider = (topRowIndex: number, bottomRowIndex: number) => {
    page1.drawLine({
      start: { x: 295, y: tableY - topRowIndex * rowH },
      end: { x: 295, y: tableY - bottomRowIndex * rowH },
      thickness: 1,
      color: borderGray,
    });
  };

  drawVertDivider(0, 2);
  drawVertDivider(3, 4);
  drawVertDivider(5, 8);

  for (let i = 1; i < 8; i++) {
    page1.drawLine({
      start: { x: tableX, y: tableY - i * rowH },
      end: { x: tableX + tableW, y: tableY - i * rowH },
      thickness: 0.8,
      color: borderGray,
    });
  }

  // Row 1: Mã BN & Họ tên
  drawTextOnPage(page1, 'Mã bệnh nhân:', tableX + 8, tableY - 13, 9, true, rgb(0.2, 0.2, 0.2));
  drawTextOnPage(page1, data.maSo || '', tableX + 90, tableY - 13, 9.5, true);
  drawTextOnPage(page1, 'Họ và tên:', 303, tableY - 13, 9, true, rgb(0.2, 0.2, 0.2));
  drawTextOnPage(page1, data.hoTen || '', 365, tableY - 13, 9.5, true);

  // Row 2: Năm sinh & Giới tính
  drawTextOnPage(page1, 'Năm sinh:', tableX + 8, tableY - 31, 9, true, rgb(0.2, 0.2, 0.2));
  drawTextOnPage(page1, data.namSinh ? String(data.namSinh) : '', tableX + 90, tableY - 31, 9.5);
  drawTextOnPage(page1, 'Giới tính:', 303, tableY - 31, 9, true, rgb(0.2, 0.2, 0.2));
  drawTextOnPage(page1, data.gioiTinh || 'Nữ', 365, tableY - 31, 9.5);

  // Row 3: Địa chỉ
  drawTextOnPage(page1, 'Địa chỉ:', tableX + 8, tableY - 49, 9, true, rgb(0.2, 0.2, 0.2));
  drawTextOnPage(page1, data.diaChi || '', tableX + 90, tableY - 49, 9.5);

  // Row 4: Điện thoại & Bác sĩ chỉ định
  drawTextOnPage(page1, 'Điện thoại:', tableX + 8, tableY - 67, 9, true, rgb(0.2, 0.2, 0.2));
  drawTextOnPage(page1, data.soDienThoai || '', tableX + 90, tableY - 67, 9.5);
  drawTextOnPage(page1, 'Bác sĩ chỉ định:', 303, tableY - 67, 9, true, rgb(0.2, 0.2, 0.2));
  drawTextOnPage(page1, data.bacSiChiDinh || '', 385, tableY - 67, 9.5);

  // Row 5: Đơn vị gửi mẫu
  drawTextOnPage(page1, 'Đơn vị gửi mẫu:', tableX + 8, tableY - 85, 9, true, rgb(0.2, 0.2, 0.2));
  drawTextOnPage(page1, data.donVi || '', tableX + 95, tableY - 85, 9.5);

  // Row 6: Loại mẫu
  drawTextOnPage(page1, 'Loại mẫu:', tableX + 8, tableY - 103, 9, true, rgb(0.2, 0.2, 0.2));
  drawTextOnPage(page1, data.loaiMau || 'Dịch phết', tableX + 90, tableY - 103, 9.5);

  // Row 7: Đánh giá tiêu bản
  drawTextOnPage(page1, 'Đánh giá tiêu bản:', tableX + 8, tableY - 121, 9, true, rgb(0.2, 0.2, 0.2));
  drawCheckboxSymbolOnPage(page1, data.tinhChatBenhPham === 'dat', tableX + 115, tableY - 121);
  drawTextOnPage(page1, 'Đạt', tableX + 128, tableY - 121, 9);
  drawCheckboxSymbolOnPage(page1, data.tinhChatBenhPham === 'khongDat', tableX + 165, tableY - 121);
  drawTextOnPage(page1, 'Không đạt', tableX + 178, tableY - 121, 9);
  drawTextOnPage(page1, 'Lý do:', 303, tableY - 121, 9, true, rgb(0.2, 0.2, 0.2));
  drawTextOnPage(page1, data.lyDoKhongDat || '', 338, tableY - 121, 9);

  // Row 8: Ngày nhận mẫu & Ngày trả kết quả
  drawTextOnPage(page1, 'Ngày nhận mẫu:', tableX + 8, tableY - 139, 9, true, rgb(0.2, 0.2, 0.2));
  drawTextOnPage(page1, formatDateStr(data.ngayNhanMau || data.ngayXetNghiem), tableX + 105, tableY - 139, 9.5);
  drawTextOnPage(page1, 'Ngày trả kết quả:', 303, tableY - 139, 9, true, rgb(0.2, 0.2, 0.2));
  drawTextOnPage(page1, formatDateStr(data.ngayTraKetQua || data.ngayXetNghiem), 400, tableY - 139, 9.5);

  // Section 2 Header Bar
  const sec2Y = 556;
  page1.drawRectangle({
    x: tableX,
    y: sec2Y,
    width: tableW,
    height: 22,
    color: lightBlueBg,
    borderColor: borderGray,
    borderWidth: 1,
  });
  drawCenteredText(
    page1,
    'KẾT QUẢ TẾ BÀO HỌC CỔ TỬ CUNG THEO HỆ THỐNG BETHESDA',
    tableX,
    tableX + tableW,
    sec2Y + 6,
    10.5,
    true,
    primaryBlue
  );

  // 3 Main Result Checkboxes Row
  const sec2CheckY = 528;
  page1.drawRectangle({
    x: tableX,
    y: sec2CheckY,
    width: tableW,
    height: 24,
    color: lightBlueBg,
    borderColor: borderGray,
    borderWidth: 1,
  });
  page1.drawLine({
    start: { x: 265, y: sec2CheckY },
    end: { x: 265, y: sec2CheckY + 24 },
    thickness: 1,
    color: borderGray,
  });
  page1.drawLine({
    start: { x: 380, y: sec2CheckY },
    end: { x: 380, y: sec2CheckY + 24 },
    thickness: 1,
    color: borderGray,
  });

  drawCheckboxSymbolOnPage(page1, !!data.khongTonThuong, 42, sec2CheckY + 7);
  drawTextOnPage(page1, 'Không tổn thương trong biểu mô hay ung thư', 55, sec2CheckY + 7, 8, false, primaryBlue);

  drawCheckboxSymbolOnPage(page1, !!data.batThuongKhac, 272, sec2CheckY + 7);
  drawTextOnPage(page1, 'Bất thường khác', 285, sec2CheckY + 7, 8, false, primaryBlue);

  drawCheckboxSymbolOnPage(page1, !!data.teBaoNoiMac, 387, sec2CheckY + 7);
  drawTextOnPage(page1, 'Tế bào nội mạc tử cung', 400, sec2CheckY + 7, 8, false, primaryBlue);

  // Section: BIẾN ĐỔI TẾ BÀO DO VI SINH vs BIẾN ĐỔI TẾ BÀO KHÁC
  const sec3HeaderY = 500;
  const sec3TableH = 100;

  page1.drawRectangle({
    x: tableX,
    y: sec3HeaderY,
    width: tableW,
    height: 20,
    color: primaryBlue,
  });
  drawCenteredText(page1, 'BIẾN ĐỔI TẾ BÀO DO VI SINH', tableX, tableX + 260, sec3HeaderY + 5, 9.5, true, whiteColor);
  drawCenteredText(page1, 'BIẾN ĐỔI TẾ BÀO KHÁC', tableX + 260, tableX + tableW, sec3HeaderY + 5, 9.5, true, whiteColor);

  page1.drawRectangle({
    x: tableX,
    y: sec3HeaderY - sec3TableH,
    width: tableW,
    height: sec3TableH,
    color: lightBlueBg,
    borderColor: borderGray,
    borderWidth: 1,
  });
  page1.drawLine({
    start: { x: 295, y: sec3HeaderY },
    end: { x: 295, y: sec3HeaderY - sec3TableH },
    thickness: 1,
    color: borderGray,
  });

  const viSinhList = [
    { key: 'trichomonas', label: 'Trichomonas vaginalis', isItalic: true },
    { key: 'candida', label: 'Candida spp', isItalic: true },
    { key: 'actinomyces', label: 'Actinomyces spp', isItalic: true },
    { key: 'gardnerella', label: 'Gardnerella vaginalis', isItalic: true },
    { key: 'hpv', label: 'HPV', isItalic: false },
    { key: 'tapKhuan', label: 'Tạp khuẩn', isItalic: false },
  ];

  viSinhList.forEach((item, idx) => {
    const isChecked = (data.bienDoiViSinh || []).includes(item.key);
    const itemY = sec3HeaderY - 15 - idx * 15;
    drawCheckboxSymbolOnPage(page1, isChecked, 42, itemY);
    drawTextOnPage(page1, item.label, 55, itemY, 8.5, false, primaryBlue, item.isItalic);
  });

  const bienDoiKhacList = [
    { key: 'viem', label: 'Tế bào biến đổi do viêm' },
    { key: 'xaTri', label: 'Tế bào biến đổi do xạ trị' },
    { key: 'iud', label: 'Tế bào biến đổi do vòng tránh thai (IUD)' },
    { key: 'teo', label: 'Tế bào biểu mô teo' },
  ];

  bienDoiKhacList.forEach((item, idx) => {
    const isChecked = (data.bienDoiKhac || []).includes(item.key);
    const itemY = sec3HeaderY - 15 - idx * 15;
    drawCheckboxSymbolOnPage(page1, isChecked, 303, itemY);
    drawTextOnPage(page1, item.label, 316, itemY, 8.5, false, primaryBlue);
  });

  // Section: BẤT THƯỜNG TẾ BÀO BIỂU MÔ
  const sec4TitleY = 378;
  page1.drawRectangle({
    x: tableX,
    y: sec4TitleY,
    width: tableW,
    height: 18,
    color: lightBlueBg,
    borderColor: borderGray,
    borderWidth: 1,
  });
  drawCenteredText(page1, 'BẤT THƯỜNG TẾ BÀO BIỂU MÔ', tableX, tableX + tableW, sec4TitleY + 4, 10, true, redColor);

  const sec4HeaderY = 358;
  const sec4TableH = 125;

  page1.drawRectangle({
    x: tableX,
    y: sec4HeaderY,
    width: tableW,
    height: 18,
    color: primaryBlue,
  });
  drawCenteredText(page1, 'TẾ BÀO VẢY', tableX, tableX + 260, sec4HeaderY + 4, 9.5, true, whiteColor);
  drawCenteredText(page1, 'TẾ BÀO TUYẾN', tableX + 260, tableX + tableW, sec4HeaderY + 4, 9.5, true, whiteColor);

  page1.drawRectangle({
    x: tableX,
    y: sec4HeaderY - sec4TableH,
    width: tableW,
    height: sec4TableH,
    color: lightBlueBg,
    borderColor: borderGray,
    borderWidth: 1,
  });

  page1.drawLine({
    start: { x: 295, y: sec4HeaderY },
    end: { x: 295, y: sec4HeaderY - sec4TableH },
    thickness: 1,
    color: borderGray,
  });

  const vayList = [
    { key: 'ascUs', label: 'Tế bào vảy không điển hình ý nghĩa không xác định (ASC-US)' },
    { key: 'ascH', label: 'Tế bào vảy không điển hình, chưa loại trừ HSIL (ASC-H)' },
    { key: 'lsil', label: 'Tổn thương trong biểu mô vảy grade thấp (LSIL)' },
    { key: 'lsilHpv', label: 'Tổn thương trong biểu mô vảy grade thấp (LSIL) + HPV' },
    { key: 'hsil', label: 'Tổn thương trong biểu mô vảy grade cao (HSIL)' },
    { key: 'carcinomaVay', label: 'Carcinoma tế bào vảy' },
  ];

  vayList.forEach((item, idx) => {
    const isChecked = (data.batThuongVay || []).includes(item.key);
    const itemY = sec4HeaderY - 14 - idx * 14;
    drawCheckboxSymbolOnPage(page1, isChecked, 42, itemY);
    drawTextOnPage(page1, item.label, 55, itemY, 7.5, false, isChecked ? redColor : primaryBlue);
  });

  const tuyenList = [
    { key: 'agc', label: 'Tế bào tuyến không điển hình (AGC)' },
    { key: 'agcKdh', label: 'AGC, loại không đặc hiệu' },
    { key: 'agcKCtc', label: 'AGC, hướng về K tuyến CTC' },
    { key: 'agcKTuyen', label: 'AGC, hướng về K tuyến' },
    { key: 'carcinomaTaiCho', label: 'Carcinoma tuyến tại chỗ' },
    { key: 'carcinomaCtc', label: 'Carcinoma tuyến cổ trong CTC' },
    { key: 'carcinomaNoiMac', label: 'Carcinoma tuyến nội mạc tử cung' },
    { key: 'carcinomaKdh', label: 'Carcinoma tuyến, loại không đặc hiệu' },
  ];

  tuyenList.forEach((item, idx) => {
    const isChecked = (data.batThuongTuyen || []).includes(item.key);
    const itemY = sec4HeaderY - 14 - idx * 14;
    drawCheckboxSymbolOnPage(page1, isChecked, 303, itemY);
    drawTextOnPage(page1, item.label, 316, itemY, 7.5, false, isChecked ? redColor : primaryBlue);
  });

  // Multi-page Pagination Logic for KẾT LUẬN & KHUYẾN NGHỊ
  const ketLuanStr = data.ketLuan || 'KHÔNG THẤY TẾ BÀO BẤT THƯỜNG TRÊN PHIẾN ĐỒ';
  const khuyenNghiStr = data.khuyenNghi || '';

  const ketLuanLines = wrapTextLines(ketLuanStr, 68);
  const khuyenNghiLines = wrapTextLines(khuyenNghiStr, 68);

  const totalLinesCount = ketLuanLines.length + khuyenNghiLines.length;
  const maxPage1Lines = 3;

  let page1KetLuanLines = ketLuanLines;
  let page2KetLuanLines: string[] = [];

  let page1KhuyenNghiLines: string[] = [];
  let page2KhuyenNghiLines: string[] = [];

  const requiresPage2 = totalLinesCount > maxPage1Lines;

  if (requiresPage2) {
    if (ketLuanLines.length > maxPage1Lines) {
      page1KetLuanLines = ketLuanLines.slice(0, maxPage1Lines);
      page2KetLuanLines = ketLuanLines.slice(maxPage1Lines);
      page2KhuyenNghiLines = khuyenNghiLines;
    } else {
      page1KetLuanLines = ketLuanLines;
      const remainingSpaceOnP1 = maxPage1Lines - ketLuanLines.length;
      page1KhuyenNghiLines = khuyenNghiLines.slice(0, remainingSpaceOnP1);
      page2KhuyenNghiLines = khuyenNghiLines.slice(remainingSpaceOnP1);
    }
  } else {
    page1KetLuanLines = ketLuanLines;
    page1KhuyenNghiLines = khuyenNghiLines;
  }

  // Draw Page 1 KẾT LUẬN & KHUYẾN NGHỊ Box
  const page1BoxLines = page1KetLuanLines.length + (page1KhuyenNghiLines.length > 0 ? page1KhuyenNghiLines.length : 0);
  const page1BoxH = Math.max(45, page1BoxLines * 13 + 18);
  const page1BoxY = 222 - page1BoxH;

  page1.drawRectangle({
    x: tableX,
    y: page1BoxY,
    width: tableW,
    height: page1BoxH,
    color: lightBlueBg,
    borderColor: borderGray,
    borderWidth: 1,
  });

  drawTextOnPage(page1, 'KẾT LUẬN:', tableX + 10, page1BoxY + page1BoxH - 15, 9.5, true, primaryBlue);
  page1KetLuanLines.forEach((lineText, lIdx) => {
    const lineY = page1BoxY + page1BoxH - 15 - lIdx * 13;
    drawTextOnPage(page1, lineText, tableX + 90, lineY, 9.5, true, blackColor);
  });

  if (page1KhuyenNghiLines.length > 0) {
    const knStartY = page1BoxY + page1BoxH - 15 - page1KetLuanLines.length * 13;
    drawTextOnPage(page1, 'KHUYẾN NGHỊ:', tableX + 10, knStartY, 9.5, true, primaryBlue);
    page1KhuyenNghiLines.forEach((lineText, lIdx) => {
      const lineY = knStartY - lIdx * 13;
      drawTextOnPage(page1, lineText, tableX + 105, lineY, 9, false, blackColor);
    });
  }

  // Footer Block for Cell Test
  const drawFooterBlock = async (targetPage: typeof page1) => {
    const footerY = 36;

    if (data.anhTeBao && data.anhTeBao.length > 20) {
      const anhTeBaoUrl = data.anhTeBao;
      try {
        let imageBytes: Buffer;
        if (anhTeBaoUrl.startsWith('http://') || anhTeBaoUrl.startsWith('https://')) {
          const res = await fetch(anhTeBaoUrl);
          const arrayBuf = await res.arrayBuffer();
          imageBytes = Buffer.from(arrayBuf);
        } else {
          const base64Data = anhTeBaoUrl.replace(/^data:image\/\w+;base64,/, '');
          imageBytes = Buffer.from(base64Data, 'base64');
        }

        let img: any = null;
        try {
          img = await pdfDoc.embedPng(imageBytes);
        } catch {
          try {
            img = await pdfDoc.embedJpg(imageBytes);
          } catch {
            const sharp = require('sharp');
            const cleanPngBytes = await sharp(imageBytes).png().toBuffer();
            img = await pdfDoc.embedPng(cleanPngBytes);
          }
        }

        if (img) {
          targetPage.drawImage(img, {
            x: tableX + 20,
            y: footerY,
            width: 170,
            height: 115,
          });
        }
      } catch (err) {
        console.error('Failed to embed cell image:', err);
      }
    }

    drawDoctorSignatureBlock(targetPage, data.ngayXetNghiem, footerY + 115);
  };

  await drawFooterBlock(page1);

  let page2: any = null;
  if (requiresPage2) {
    page2 = pdfDoc.addPage([595.32, 841.92]);

    if (logoImage) {
      page2.drawImage(logoImage, {
        x: 35,
        y: 770,
        width: 50,
        height: 50,
      });
    }

    drawTextOnPage(page2, 'CƠ SỞ XÉT NGHIỆM GEN HD', 95, 800, 10.5, true, primaryBlue);
    drawTextOnPage(page2, `PHIẾU XÉT NGHIỆM TẾ BÀO - MÃ SỐ: ${data.maSo} (Tiếp theo)`, 95, 785, 9.5, true, blackColor);

    page2.drawLine({
      start: { x: 35, y: 765 },
      end: { x: 560, y: 765 },
      thickness: 1.5,
      color: primaryBlue,
    });

    const p2TotalLines = page2KetLuanLines.length + page2KhuyenNghiLines.length;
    const p2BoxH = Math.max(60, p2TotalLines * 15 + 30);
    const p2BoxY = 740 - p2BoxH;

    page2.drawRectangle({
      x: tableX,
      y: p2BoxY,
      width: tableW,
      height: p2BoxH,
      color: lightBlueBg,
      borderColor: borderGray,
      borderWidth: 1,
    });

    let currentY = p2BoxY + p2BoxH - 18;

    if (page2KetLuanLines.length > 0) {
      drawTextOnPage(page2, 'KẾT LUẬN (Tiếp theo):', tableX + 10, currentY, 9.5, true, primaryBlue);
      page2KetLuanLines.forEach((lineText) => {
        drawTextOnPage(page2, lineText, tableX + 140, currentY, 9.5, true, blackColor);
        currentY -= 14;
      });
      currentY -= 6;
    }

    if (page2KhuyenNghiLines.length > 0) {
      drawTextOnPage(page2, 'KHUYẾN NGHỊ:', tableX + 10, currentY, 9.5, true, primaryBlue);
      page2KhuyenNghiLines.forEach((lineText) => {
        drawTextOnPage(page2, lineText, tableX + 105, currentY, 9, false, blackColor);
        currentY -= 14;
      });
    }

    await drawFooterBlock(page2);

    drawTextOnPage(page1, 'Trang 1 / 2', 510, 16, 8, false, rgb(0.5, 0.5, 0.5));
    drawTextOnPage(page2, 'Trang 2 / 2', 510, 16, 8, false, rgb(0.5, 0.5, 0.5));
  } else {
    drawTextOnPage(page1, 'Trang 1 / 1', 510, 16, 8, false, rgb(0.5, 0.5, 0.5));
  }

  // Draw 0.06 watermark overlay on all pages
  drawWatermarkOverlay(page1);
  if (page2) {
    drawWatermarkOverlay(page2);
  }

  const modifiedPdfBytes = await pdfDoc.save();
  return modifiedPdfBytes;
}
