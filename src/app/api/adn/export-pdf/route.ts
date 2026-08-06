import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs';
import path from 'path';

// Increase body size limit for this API route (photos can be large)
export const maxDuration = 60;

// Helper to normalize Unicode strings to NFC (eliminates floating/split Vietnamese combining accents)
const nfc = (text: string) => (text || '').normalize('NFC');

const formatAllelePair = (v1: string, v2: string) => {
  const a1 = nfc(v1 || '').trim();
  const a2 = nfc(v2 || '').trim();
  if (a1 && a2) return `${a1} ; ${a2}`;
  return a1 || a2 || '';
};

// Word wrapper for pdf-lib to ensure lines span full page width before breaking
const splitTextIntoLines = (text: string, font: any, fontSize: number, maxWidth: number): string[] => {
  const words = (text || '').split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(nfc(testLine), fontSize);
    if (testWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      soPhieu = 'GT030726',
      ngayBanHanh = 'Hà Nội, ngày 31 tháng 07 năm 2026.',
      ngayYeuCau = '28/07/2026',
      nguoiYeuCau = 'Trịnh Ngọc Chư',
      nguoiThuMau = 'Hoàng Văn Luận',
      boKit = 'A27Plex STR Detection Kit',
      m1 = {},
      m2 = {},
      table1 = [],
      table2 = [],
      table3 = [],
      ketLuan = 'có quan hệ huyết thống bố - con ( cha – con)',
      doTinCay = '> 99,9999%',
      kiemSoatKetQua = 'TS. BS. Nguyễn Khánh Dương',
      daiDienDonVi = 'CÔNG TY CỔ PHẦN GENETRUST VIỆT NAM',
      uploadedPdfBase64 = '',
    } = body;

    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    // Load Times New Roman TTF fonts
    const fontRegularBytes = fs.readFileSync(path.join(process.cwd(), 'public', 'Times-New-Roman.ttf'));
    const fontBoldBytes = fs.readFileSync(path.join(process.cwd(), 'public', 'Times-New-Roman-Bold.ttf'));
    const fontItalicBytes = fs.readFileSync(path.join(process.cwd(), 'public', 'Times-New-Roman-Italic.ttf'));

    const fontRegular = await pdfDoc.embedFont(fontRegularBytes);
    const fontBold = await pdfDoc.embedFont(fontBoldBytes);
    const fontItalic = await pdfDoc.embedFont(fontItalicBytes);

    // Page 1: A4 (595.28 x 841.89 pt)
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();
    const margin = 36; // 0.5 inch margins

    const primaryBlue = rgb(0.0, 0.2, 0.55);
    const darkColor = rgb(0.0, 0.0, 0.0);
    const redColor = rgb(0.85, 0.1, 0.1);

    // 1. HEADER LOGO & COMPANY INFO (Logo 58x58, company info shifted towards center)
    const logoPath = path.join(process.cwd(), 'public', 'Logo_Genetrust.png');
    if (fs.existsSync(logoPath)) {
      const logoBytes = fs.readFileSync(logoPath);
      const logoImg = await pdfDoc.embedPng(logoBytes);
      page.drawImage(logoImg, {
        x: margin + 10,
        y: height - margin - 58,
        width: 58,
        height: 58,
      });
    }

    const headerX = margin + 82;
    let currentY = height - margin - 12;

    page.drawText(nfc('CÔNG TY CỔ PHẦN GENETRUST VIỆT NAM'), {
      x: headerX,
      y: currentY,
      size: 11.5,
      font: fontBold,
      color: primaryBlue,
    });

    currentY -= 12;
    page.drawText(nfc('Địa chỉ: Số 15, Ngõ 5 Hoàng Quốc Việt, Phường Nghĩa Đô, TP Hà Nội'), {
      x: headerX,
      y: currentY,
      size: 9,
      font: fontItalic,
      color: primaryBlue,
    });

    currentY -= 11;
    page.drawText(nfc('Webside: genetrust.vn'), {
      x: headerX,
      y: currentY,
      size: 9,
      font: fontItalic,
      color: primaryBlue,
    });

    currentY -= 11;
    page.drawText(nfc('Hotline: 0818 922 866'), {
      x: headerX,
      y: currentY,
      size: 9,
      font: fontItalic,
      color: primaryBlue,
    });

    currentY -= 11;
    page.drawText(nfc('Email: genetrust@gmail.com'), {
      x: headerX,
      y: currentY,
      size: 9,
      font: fontItalic,
      color: primaryBlue,
    });

    // Double Header Bar Lines
    currentY -= 8;
    page.drawLine({
      start: { x: margin, y: currentY },
      end: { x: width - margin, y: currentY },
      thickness: 2.5,
      color: primaryBlue,
    });
    page.drawLine({
      start: { x: margin, y: currentY - 3 },
      end: { x: width - margin, y: currentY - 3 },
      thickness: 0.8,
      color: primaryBlue,
    });

    // 2. DATE & NUMBER (Pure white background)
    currentY -= 16;
    page.drawText(nfc(ngayBanHanh || 'Hà Nội, ngày .... tháng .... năm 2026.'), {
      x: width - margin - 190,
      y: currentY,
      size: 9,
      font: fontItalic,
      color: darkColor,
    });
    currentY -= 12;
    page.drawText(nfc(`Số: ${soPhieu || '..........................'}`), {
      x: width - margin - 190,
      y: currentY,
      size: 9,
      font: fontItalic,
      color: darkColor,
    });

    // 3. TITLE & INTRO (Title 18pt Bold)
    currentY -= 22;
    const titleText = nfc('KẾT QUẢ XÉT NGHIỆM ADN');
    page.drawText(titleText, {
      x: width / 2 - 130,
      y: currentY,
      size: 18,
      font: fontBold,
      color: darkColor,
    });

    currentY -= 22;
    const introFullText = nfc(`Theo đơn yêu cầu xét nghiệm ADN ngày ${ngayYeuCau || '.........................'} của bà(ông) ${nguoiYeuCau || '....................................'}, Công ty Cổ phần Genetrust Việt Nam thực hiện xét nghiệm ADN cho những người sau:`);
    const introLines = splitTextIntoLines(introFullText, fontRegular, 11, width - margin * 2 - 20);

    for (const line of introLines) {
      page.drawText(line, {
        x: margin + 10,
        y: currentY,
        size: 11,
        font: fontRegular,
        color: darkColor,
      });
      currentY -= 15;
    }

    // 4. PERSON 1 & PERSON 2 DETAILS WITH STACKED PHOTOS ON LEFT
    currentY -= 14;

    const embedImageSafely = async (imgSrc: string) => {
      try {
        if (!imgSrc) return null;
        if (imgSrc.startsWith('data:image/png;base64,')) {
          const base64Data = imgSrc.replace(/^data:image\/png;base64,/, '');
          return await pdfDoc.embedPng(Buffer.from(base64Data, 'base64'));
        }
        if (imgSrc.startsWith('data:image/jpeg;base64,') || imgSrc.startsWith('data:image/jpg;base64,')) {
          const base64Data = imgSrc.replace(/^data:image\/j(peg|pg);base64,/, '');
          return await pdfDoc.embedJpg(Buffer.from(base64Data, 'base64'));
        }
        if (imgSrc.startsWith('/')) {
          const fullPath = path.join(process.cwd(), 'public', imgSrc);
          if (fs.existsSync(fullPath)) {
            const fileBytes = fs.readFileSync(fullPath);
            return imgSrc.endsWith('.png') ? await pdfDoc.embedPng(fileBytes) : await pdfDoc.embedJpg(fileBytes);
          }
        }
      } catch (err) {
        console.error('Image embed error:', err);
      }
      return null;
    };

    const photoW = 70;
    const photoH = 82;

    // --- PERSON 1 BLOCK (photo left + info right) ---
    const p1TopY = currentY - 5;
    const infoX = margin + photoW + 20;

    // Embed M1 photo
    const m1Img = await embedImageSafely(m1.photoUrl);
    if (m1Img) {
      page.drawImage(m1Img, {
        x: margin + 10,
        y: p1TopY - photoH,
        width: photoW,
        height: photoH,
      });
    } else {
      page.drawRectangle({
        x: margin + 10,
        y: p1TopY - photoH,
        width: photoW,
        height: photoH,
        borderColor: rgb(0.6, 0.6, 0.6),
        borderWidth: 0.8,
        color: rgb(0.95, 0.95, 0.95),
      });
      page.drawText(nfc('Ảnh M1'), {
        x: margin + 28,
        y: p1TopY - photoH / 2 - 4,
        size: 8.5,
        font: fontRegular,
        color: rgb(0.5, 0.5, 0.5),
      });
    }

    // Person 1 Info Text (5 lines on right of photo)
    let p1Y = p1TopY - 10;
    page.drawText(nfc('1. Họ tên: '), { x: infoX, y: p1Y, size: 9, font: fontBold, color: darkColor });
    page.drawText(nfc(`${m1.hoTen || '............................'}   `), { x: infoX + 50, y: p1Y, size: 9, font: fontRegular, color: darkColor });
    page.drawText(nfc('Giới tính: '), { x: infoX + 160, y: p1Y, size: 9, font: fontBold, color: darkColor });
    page.drawText(nfc(`${m1.gioiTinh || '......'} ; `), { x: infoX + 205, y: p1Y, size: 9, font: fontRegular, color: darkColor });
    page.drawText(nfc('Ngày sinh: '), { x: infoX + 235, y: p1Y, size: 9, font: fontBold, color: darkColor });
    page.drawText(nfc(`${m1.ngaySinh || '.......'} ; `), { x: infoX + 285, y: p1Y, size: 9, font: fontRegular, color: darkColor });
    page.drawText(nfc('Quốc tịch: '), { x: infoX + 335, y: p1Y, size: 9, font: fontBold, color: darkColor });
    page.drawText(nfc(`${m1.quocTich || '..........'}`), { x: infoX + 380, y: p1Y, size: 9, font: fontRegular, color: darkColor });

    p1Y -= 13;
    page.drawText(nfc('CCCD/Passport: '), { x: infoX, y: p1Y, size: 9, font: fontBold, color: darkColor });
    page.drawText(nfc(`${m1.cccd || '...................................................'} `), { x: infoX + 80, y: p1Y, size: 9, font: fontRegular, color: darkColor });
    page.drawText(nfc('Ngày cấp: '), { x: infoX + 240, y: p1Y, size: 9, font: fontBold, color: darkColor });
    page.drawText(nfc(`${m1.ngayCap || '................................'}`), { x: infoX + 285, y: p1Y, size: 9, font: fontRegular, color: darkColor });

    p1Y -= 13;
    page.drawText(nfc('Nơi cấp: '), { x: infoX, y: p1Y, size: 9, font: fontBold, color: darkColor });
    page.drawText(nfc(`${m1.noiCap || '.......................................................................................................................'}`), { x: infoX + 45, y: p1Y, size: 9, font: fontRegular, color: darkColor });

    p1Y -= 13;
    page.drawText(nfc('Nơi thường trú: '), { x: infoX, y: p1Y, size: 9, font: fontBold, color: darkColor });
    page.drawText(nfc(`${m1.noiThuongTru || '.........................................................................................................'}`), { x: infoX + 75, y: p1Y, size: 9, font: fontRegular, color: darkColor });

    p1Y -= 13;
    page.drawText(nfc('Ký hiệu mẫu: '), { x: infoX, y: p1Y, size: 9, font: fontBold, color: darkColor });
    page.drawText(nfc(`${m1.kyHieuMau || 'M1'} ; `), { x: infoX + 65, y: p1Y, size: 9, font: fontRegular, color: darkColor });
    page.drawText(nfc('Loại mẫu:'), { x: infoX + 105, y: p1Y, size: 9, font: fontBold, color: darkColor });
    page.drawText(nfc(`${m1.loaiMau || '................................................'}`), { x: infoX + 150, y: p1Y, size: 9, font: fontRegular, color: darkColor });

    // --- PERSON 2 BLOCK (photo left + info right) ---
    const p2TopY = p1TopY - photoH - 8;

    // Embed M2 photo
    const m2Img = await embedImageSafely(m2.photoUrl);
    if (m2Img) {
      page.drawImage(m2Img, {
        x: margin + 10,
        y: p2TopY - photoH,
        width: photoW,
        height: photoH,
      });
    } else {
      page.drawRectangle({
        x: margin + 10,
        y: p2TopY - photoH,
        width: photoW,
        height: photoH,
        borderColor: rgb(0.6, 0.6, 0.6),
        borderWidth: 0.8,
        color: rgb(0.95, 0.95, 0.95),
      });
      page.drawText(nfc('Ảnh M2'), {
        x: margin + 28,
        y: p2TopY - photoH / 2 - 4,
        size: 8.5,
        font: fontRegular,
        color: rgb(0.5, 0.5, 0.5),
      });
    }

    // Person 2 Info Text (5 lines on right of photo)
    let p2Y = p2TopY - 10;
    page.drawText(nfc('2. Người có tên dự kiến: '), { x: infoX, y: p2Y, size: 9, font: fontBold, color: darkColor });
    page.drawText(nfc(`${m2.hoTen || '...................................................................................'}`).substring(0, 50), { x: infoX + 115, y: p2Y, size: 9, font: fontRegular, color: darkColor });

    p2Y -= 13;
    page.drawText(nfc('Giới tính: '), { x: infoX, y: p2Y, size: 9, font: fontBold, color: darkColor });
    page.drawText(nfc(`${m2.gioiTinh || '........................'}   `), { x: infoX + 45, y: p2Y, size: 9, font: fontRegular, color: darkColor });
    page.drawText(nfc('Ngày sinh: '), { x: infoX + 150, y: p2Y, size: 9, font: fontBold, color: darkColor });
    page.drawText(nfc(`${m2.ngaySinh || '........................................'}`), { x: infoX + 200, y: p2Y, size: 9, font: fontRegular, color: darkColor });

    p2Y -= 13;
    page.drawText(nfc('Giấy chứng sinh số: '), { x: infoX, y: p2Y, size: 9, font: fontBold, color: darkColor });
    page.drawText(nfc(`${m2.giayChungSinhSo || '.....................'} `), { x: infoX + 90, y: p2Y, size: 9, font: fontRegular, color: darkColor });
    page.drawText(nfc('Quyền số: '), { x: infoX + 210, y: p2Y, size: 9, font: fontBold, color: darkColor });
    page.drawText(nfc(`${m2.quyenSo || '...............................'}`), { x: infoX + 255, y: p2Y, size: 9, font: fontRegular, color: darkColor });

    p2Y -= 13;
    page.drawText(nfc('Ngày cấp: '), { x: infoX, y: p2Y, size: 9, font: fontBold, color: darkColor });
    page.drawText(nfc(`${m2.ngayCap || '..................................'} ; `), { x: infoX + 50, y: p2Y, size: 9, font: fontRegular, color: darkColor });
    page.drawText(nfc('Nơi cấp: '), { x: infoX + 180, y: p2Y, size: 9, font: fontBold, color: darkColor });
    page.drawText(nfc(`${m2.noiCap || '........................................'}`), { x: infoX + 220, y: p2Y, size: 9, font: fontRegular, color: darkColor });

    p2Y -= 13;
    page.drawText(nfc('Ký hiệu mẫu: '), { x: infoX, y: p2Y, size: 9, font: fontBold, color: darkColor });
    page.drawText(nfc(`${m2.kyHieuMau || 'M2'} ; `), { x: infoX + 65, y: p2Y, size: 9, font: fontRegular, color: darkColor });
    page.drawText(nfc('Loại mẫu:'), { x: infoX + 105, y: p2Y, size: 9, font: fontBold, color: darkColor });
    page.drawText(nfc(`${m2.loaiMau || '................................................'}`), { x: infoX + 150, y: p2Y, size: 9, font: fontRegular, color: darkColor });

    // 5. BULLET NOTES (Kit name placed directly after bộ kit with no large gap)
    currentY = p2TopY - photoH - 12;
    page.drawText(nfc('-  Người thu mẫu: '), { x: margin + 10, y: currentY, size: 8.5, font: fontItalic, color: darkColor });
    page.drawText(nfc(nguoiThuMau || 'Hoàng Văn Luận'), { x: margin + 95, y: currentY, size: 8.5, font: fontItalic, color: redColor });

    currentY -= 11;
    page.drawText(nfc('-  Các giấy tờ cá nhân do người yêu cầu xét nghiệm tự cung cấp và chịu trách nhiệm.'), { x: margin + 10, y: currentY, size: 8.5, font: fontItalic, color: darkColor });

    currentY -= 11;
    page.drawText(nfc('-  Các ký hiệu mẫu do Công ty Cổ phần Genetrust Việt Nam đặt.'), { x: margin + 10, y: currentY, size: 8.5, font: fontItalic, color: darkColor });

    currentY -= 11;
    const noteKitPrefix = nfc('-  Phân tích ADN trong nhân tế bào các mẫu trên theo bộ kit ');
    page.drawText(noteKitPrefix, { x: margin + 10, y: currentY, size: 8.5, font: fontItalic, color: darkColor });
    const noteKitPrefixW = fontItalic.widthOfTextAtSize(noteKitPrefix, 8.5);
    page.drawText(nfc(boKit || 'A27Plex STR Detection Kit'), { x: margin + 10 + noteKitPrefixW, y: currentY, size: 8.5, font: fontItalic, color: redColor });

    // 6. STR ANALYSIS TABLE HEADER & 3 TABLES
    currentY -= 16;
    page.drawText(nfc('Kết quả phân tích ADN như sau:'), { x: margin + 10, y: currentY, size: 10, font: fontBold, color: darkColor });

    currentY -= 8;

    const drawStrTable = (
      lociData: Array<{ locus: string; m1_1: string; m1_2: string; m2_1: string; m2_2: string }>
    ) => {
      const tableX = margin + 10;
      const totalW = width - margin * 2 - 20;
      const firstColW = 55;
      const locusColW = (totalW - firstColW) / 9;

      const rowH = 14;
      const startY = currentY;

      // Outer Border
      page.drawRectangle({
        x: tableX,
        y: startY - rowH * 3,
        width: totalW,
        height: rowH * 3,
        borderColor: rgb(0, 0, 0),
        borderWidth: 0.8,
      });

      // Grid Lines
      for (let i = 1; i <= 3; i++) {
        page.drawLine({
          start: { x: tableX, y: startY - rowH * i },
          end: { x: tableX + totalW, y: startY - rowH * i },
          thickness: 0.5,
          color: rgb(0, 0, 0),
        });
      }

      // Vertical line for first column
      page.drawLine({
        start: { x: tableX + firstColW, y: startY },
        end: { x: tableX + firstColW, y: startY - rowH * 3 },
        thickness: 0.5,
        color: rgb(0, 0, 0),
      });

      // Diagonal line in first header cell
      page.drawLine({
        start: { x: tableX, y: startY },
        end: { x: tableX + firstColW, y: startY - rowH },
        thickness: 0.5,
        color: rgb(0, 0, 0),
      });

      // Locus (Top-Right, ABOVE diagonal line)
      page.drawText(nfc('Locus'), { x: tableX + 28, y: startY - 7, size: 7.5, font: fontBold, color: darkColor });
      // Mẫu (Bottom-Left, BELOW diagonal line)
      page.drawText(nfc('Mẫu'), { x: tableX + 4, y: startY - 12, size: 7.5, font: fontBold, color: darkColor });

      page.drawText(nfc(m1.kyHieuMau || 'M1'), { x: tableX + 16, y: startY - rowH - 10, size: 8, font: fontBold, color: darkColor });
      page.drawText(nfc(m2.kyHieuMau || 'M2'), { x: tableX + 16, y: startY - rowH * 2 - 10, size: 8, font: fontBold, color: darkColor });

      // Columns
      for (let c = 0; c < 9; c++) {
        const cX = tableX + firstColW + c * locusColW;
        const item = lociData[c] || { locus: '', m1_1: '', m1_2: '', m2_1: '', m2_2: '' };

        if (c < 8) {
          page.drawLine({
            start: { x: cX + locusColW, y: startY },
            end: { x: cX + locusColW, y: startY - rowH * 3 },
            thickness: 0.5,
            color: rgb(0, 0, 0),
          });
        }

        const locusName = nfc(item.locus);
        const locusW = fontBold.widthOfTextAtSize(locusName, 8);
        page.drawText(locusName, { x: cX + (locusColW - locusW) / 2, y: startY - 10, size: 8, font: fontBold, color: darkColor });

        const m1ValStr = formatAllelePair(item.m1_1, item.m1_2);
        const m1W = fontRegular.widthOfTextAtSize(m1ValStr, 8);
        page.drawText(m1ValStr, { x: cX + (locusColW - m1W) / 2, y: startY - rowH - 10, size: 8, font: fontRegular, color: darkColor });

        const m2ValStr = formatAllelePair(item.m2_1, item.m2_2);
        const m2W = fontRegular.widthOfTextAtSize(m2ValStr, 8);
        page.drawText(m2ValStr, { x: cX + (locusColW - m2W) / 2, y: startY - rowH * 2 - 10, size: 8, font: fontRegular, color: darkColor });
      }

      currentY = startY - rowH * 3 - 4;
    };

    drawStrTable(table1);
    drawStrTable(table2);
    drawStrTable(table3);

    // 7. KẾT LUẬN (Aligned LEFT & shifted down slightly, font size 12pt heading, 11pt body)
    currentY -= 12;
    page.drawText(nfc('KẾT LUẬN:'), {
      x: margin + 10,
      y: currentY,
      size: 12,
      font: fontBold,
      color: darkColor,
    });

    currentY -= 16;
    const concFullText = nfc(`${m1.hoTen || '.........................................'} (Kí hiệu: ${m1.kyHieuMau || 'M1'}) ${ketLuan || 'có quan hệ huyết thống bố - con ( cha – con)'} với người có tên dự kiến ${m2.hoTen || '.........................................'} (Kí hiệu: ${m2.kyHieuMau || 'M2'}) độ tin cậy ${doTinCay || '> 99,9999%'}.`);
    const concLines = splitTextIntoLines(concFullText, fontRegular, 11, width - margin * 2 - 20);

    for (const line of concLines) {
      page.drawText(line, {
        x: margin + 10,
        y: currentY,
        size: 11,
        font: fontRegular,
        color: darkColor,
      });
      currentY -= 15;
    }

    // 8. SIGNATURE SECTION
    currentY -= 28;
    page.drawText(nfc('KIỂM SOÁT KẾT QUẢ'), {
      x: margin + 50,
      y: currentY,
      size: 9.5,
      font: fontBold,
      color: darkColor,
    });

    page.drawText(nfc('ĐẠI DIỆN ĐƠN VỊ'), {
      x: width - margin - 150,
      y: currentY,
      size: 9.5,
      font: fontBold,
      color: darkColor,
    });

    // 9. COPY PAGES 4, 5, 6, 7 FROM UPLOADED PDF OR SAMPLE PDF
    let sourcePdfBytes: Uint8Array | null = null;
    if (uploadedPdfBase64 && uploadedPdfBase64.startsWith('data:application/pdf;base64,')) {
      const base64Data = uploadedPdfBase64.replace(/^data:application\/pdf;base64,/, '');
      sourcePdfBytes = Buffer.from(base64Data, 'base64');
    } else {
      const samplePdfPath = path.join(process.cwd(), 'public', 'KQ - GT030726.pdf');
      if (fs.existsSync(samplePdfPath)) {
        sourcePdfBytes = fs.readFileSync(samplePdfPath);
      }
    }

    if (sourcePdfBytes) {
      const srcDoc = await PDFDocument.load(sourcePdfBytes);
      const srcPageCount = srcDoc.getPageCount();

      const pagesToCopy: number[] = [];
      for (let p = 3; p <= 6; p++) {
        if (p < srcPageCount) {
          pagesToCopy.push(p);
        }
      }

      if (pagesToCopy.length > 0) {
        const copiedPages = await pdfDoc.copyPages(srcDoc, pagesToCopy);
        copiedPages.forEach((p) => pdfDoc.addPage(p));
      }
    }

    const pdfBuffer = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Ket_Qua_Xet_Nghiem_ADN_${soPhieu}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Export PDF error:', error);
    return NextResponse.json({ error: 'Lỗi xuất file PDF' }, { status: 500 });
  }
}
