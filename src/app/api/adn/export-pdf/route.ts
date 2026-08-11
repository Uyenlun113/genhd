import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs';
import path from 'path';

export const maxDuration = 60;

const cleanVietnameseNFC = (str: any): string => {
  if (str === null || str === undefined) return '';
  let s = String(str).normalize('NFC');
  const map: Record<string, string> = {
    'ế': 'ế', 'ề': 'ề', 'ể': 'ể', 'ễ': 'ễ', 'ệ': 'ệ', 'ê': 'ê',
    'Ế': 'Ế', 'Ề': 'Ề', 'Ể': 'Ể', 'Ễ': 'Ễ', 'Ệ': 'Ệ', 'Ê': 'Ê',
    'ố': 'ố', 'ồ': 'ồ', 'ổ': 'ổ', 'ỗ': 'ỗ', 'ộ': 'ộ', 'ô': 'ô',
    'Ố': 'Ố', 'Ồ': 'Ồ', 'Ổ': 'Ổ', 'Ỗ': 'Ỗ', 'Ộ': 'Ộ', 'Ô': 'Ô',
    'ấ': 'ấ', 'ầ': 'ầ', 'ẩ': 'ẩ', 'ẫ': 'ẫ', 'ậ': 'ậ', 'â': 'â',
    'Ấ': 'Ấ', 'Ầ': 'Ầ', 'Ẩ': 'Ẩ', 'Ẫ': 'Ẫ', 'Ậ': 'Ậ', 'Â': 'Â',
    'ắ': 'ắ', 'ằ': 'ằ', 'ẳ': 'ẳ', 'ẵ': 'ẵ', 'ặ': 'ặ', 'ă': 'ă',
    'Ắ': 'Ắ', 'Ằ': 'Ằ', 'Ẳ': 'Ẳ', 'Ẵ': 'Ẵ', 'Ặ': 'Ặ', 'Ă': 'Ă',
    'ứ': 'ứ', 'ừ': 'ừ', 'ử': 'ử', 'ữ': 'ữ', 'ự': 'ự', 'ư': 'ư',
    'Ứ': 'Ứ', 'Ừ': 'Ừ', 'Ử': 'Ử', 'Ữ': 'Ữ', 'Ự': 'Ự', 'Ư': 'Ư',
    'ớ': 'ớ', 'ờ': 'ờ', 'ở': 'ở', 'ỡ': 'ỡ', 'ợ': 'ợ', 'ơ': 'ơ',
    'Ớ': 'Ớ', 'Ờ': 'Ờ', 'Ở': 'Ở', 'Ỡ': 'Ỡ', 'Ợ': 'Ợ', 'Ơ': 'Ơ',
    'á': 'á', 'à': 'à', 'ả': 'ả', 'ã': 'ã', 'ạ': 'ạ',
    'Á': 'Á', 'À': 'À', 'Ả': 'Ả', 'Ã': 'Ã', 'Ạ': 'Ạ',
    'é': 'é', 'è': 'è', 'ẻ': 'ẻ', 'ẽ': 'ẽ', 'ẹ': 'ẹ',
    'É': 'É', 'È': 'È', 'Ẻ': 'Ẻ', 'Ẽ': 'Ẽ', 'Ẹ': 'Ẹ',
    'í': 'í', 'ì': 'ì', 'ỉ': 'ỉ', 'ĩ': 'ĩ', 'ị': 'ị',
    'Í': 'Í', 'Ì': 'Ì', 'Ỉ': 'Ỉ', 'Ĩ': 'Ĩ', 'Ị': 'Ị',
    'ó': 'ó', 'ò': 'ò', 'ỏ': 'ỏ', 'õ': 'õ', 'ọ': 'ọ',
    'Ó': 'Ó', 'Ò': 'Ò', 'Ỏ': 'Ỏ', 'Õ': 'Õ', 'Ọ': 'Ọ',
    'ú': 'ú', 'ù': 'ù', 'ủ': 'ủ', 'ũ': 'ũ', 'ụ': 'ụ',
    'Ú': 'Ú', 'Ù': 'Ù', 'Ủ': 'Ủ', 'Ũ': 'Ũ', 'Ụ': 'Ụ',
    'ý': 'ý', 'ỳ': 'ỳ', 'ỷ': 'ỷ', 'ỹ': 'ỹ', 'ỵ': 'ỵ',
    'Ý': 'Ý', 'Ỳ': 'Ỳ', 'Ỷ': 'Ỷ', 'Ỹ': 'Ỹ', 'Ỵ': 'Ỵ',
  };
  for (const key in map) {
    s = s.split(key).join(map[key]);
  }
  s = s.replace(/[\u0300-\u036f]/g, '');
  return s.normalize('NFC');
};

const nfc = (text: any) => cleanVietnameseNFC(text);

const formatAllelePair = (v1: any, v2: any) => {
  const a1 = nfc(String(v1 || '')).trim();
  const a2 = nfc(String(v2 || '')).trim();
  if (a1 && a2) return `${a1} ; ${a2}`;
  return a1 || a2 || '';
};

const formatDateVN = (dateStr: any): string => {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const trimmed = dateStr.trim();
  if (!trimmed) return '';

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split('-');
    return `${d}/${m}/${y}`;
  }
  if (trimmed.includes('T') && /^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const ymd = trimmed.split('T')[0];
    const [y, m, d] = ymd.split('-');
    return `${d}/${m}/${y}`;
  }
  return trimmed;
};

// Helper to embed image (base64 data URI or file path/buffer) onto PDF
async function embedImageHelper(pdfDoc: PDFDocument, imgStr: string) {
  if (!imgStr || typeof imgStr !== 'string') return null;
  try {
    let imageBytes: Uint8Array | null = null;
    let isPng = false;

    if (imgStr.startsWith('http://') || imgStr.startsWith('https://')) {
      const resp = await fetch(imgStr);
      if (!resp.ok) return null;
      const arrayBuffer = await resp.arrayBuffer();
      imageBytes = new Uint8Array(arrayBuffer);
      const contentType = resp.headers.get('content-type') || '';
      isPng = contentType.includes('png') || imgStr.toLowerCase().endsWith('.png');
    } else if (imgStr.startsWith('data:image/png;base64,')) {
      isPng = true;
      imageBytes = Buffer.from(imgStr.replace('data:image/png;base64,', ''), 'base64');
    } else if (imgStr.startsWith('data:image/jpeg;base64,') || imgStr.startsWith('data:image/jpg;base64,')) {
      isPng = false;
      imageBytes = Buffer.from(imgStr.replace(/^data:image\/(jpeg|jpg);base64,/, ''), 'base64');
    } else if (imgStr.startsWith('data:')) {
      const parts = imgStr.split(',');
      const header = parts[0] || '';
      const base64Data = parts[1];
      if (base64Data) {
        imageBytes = Buffer.from(base64Data, 'base64');
        isPng = header.includes('png');
      }
    } else if (imgStr.startsWith('/')) {
      const publicPath = path.join(process.cwd(), 'public', imgStr);
      if (fs.existsSync(publicPath)) {
        imageBytes = fs.readFileSync(publicPath);
        isPng = publicPath.toLowerCase().endsWith('.png');
      }
    } else if (fs.existsSync(imgStr)) {
      imageBytes = fs.readFileSync(imgStr);
      isPng = imgStr.toLowerCase().endsWith('.png');
    }

    if (!imageBytes) return null;

    if (isPng) {
      try {
        return await pdfDoc.embedPng(imageBytes);
      } catch {
        return await pdfDoc.embedJpg(imageBytes);
      }
    } else {
      try {
        return await pdfDoc.embedJpg(imageBytes);
      } catch {
        return await pdfDoc.embedPng(imageBytes);
      }
    }
  } catch (err) {
    console.error('Image embedding error:', err);
    return null;
  }
}
function wrapText(text: string, font: any, fontSize: number, maxWidth: number): string[] {
  if (!text) return [];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(nfc(testLine), fontSize);
    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

const deepNfc = (obj: any): any => {
  if (!obj) return obj;
  if (typeof obj === 'string') return obj.normalize('NFC');
  if (Array.isArray(obj)) return obj.map(deepNfc);
  if (typeof obj === 'object') {
    const res: any = {};
    for (const key of Object.keys(obj)) {
      res[key] = deepNfc(obj[key]);
    }
    return res;
  }
  return obj;
};

export async function POST(request: NextRequest) {
  try {
    const body = deepNfc(await request.json());
    const {
      loaiXetNghiemADN = 'phap_ly',
      soPhieu = 'HCGT-070826-01',
      ngayBanHanh = 'Hà Nội, ngày 07 tháng 08 năm 2026.',
      ngayYeuCau = '07/08/2026',
      nguoiYeuCau = '',
      nguoiThuMau = 'Hoàng Văn Luận',
      boKit = 'A27Plex STR Detection Kit',
      mauDanhSach = [],
      table1 = [],
      table2 = [],
      table3 = [],
      ketLuan = '',
      doTinCay = '> 99,9999%',
      canBoXetNghiem = '',
      daiDienDonVi = '',
      kiemSoatKetQua = 'TS. BS. Nguyễn Khánh Dương',
      isGenetrust = false,
    } = body;

    const isGtMode = isGenetrust || body.brand === 'genetrust';

    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    // Load Times New Roman TTF fonts
    const fontRegularBytes = fs.readFileSync(path.join(process.cwd(), 'public', 'Times-New-Roman.ttf'));
    const fontBoldBytes = fs.readFileSync(path.join(process.cwd(), 'public', 'Times-New-Roman-Bold.ttf'));
    const fontItalicBytes = fs.readFileSync(path.join(process.cwd(), 'public', 'Times-New-Roman-Italic.ttf'));

    const fontRegular = await pdfDoc.embedFont(fontRegularBytes);
    const fontBold = await pdfDoc.embedFont(fontBoldBytes);
    const fontItalic = await pdfDoc.embedFont(fontItalicBytes);

    // Colors
    const primaryBlue = rgb(0.0, 0.2, 0.55);
    const darkColor = rgb(0.0, 0.0, 0.0);
    const redColor = rgb(0.88, 0.0, 0.0);

    // ----------------------------------------------------
    // PAGE 1: MAIN REPORT SHEET (Phiếu Kết Quả ADN)
    // ----------------------------------------------------
    const page1 = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page1.getSize();
    const margin = 36;

    // 0. Watermark Overlay on Page 1
    const logoGtPath = path.join(process.cwd(), 'public', 'Logo_Genetrust.png');
    const watermarkJpgPath = path.join(process.cwd(), 'public', 'logo_hk.jpg');
    const watermarkPngPath = path.join(process.cwd(), 'public', 'logo.png');

    try {
      if (isGtMode && fs.existsSync(logoGtPath)) {
        const wmBytes = fs.readFileSync(logoGtPath);
        const wmImg = await pdfDoc.embedPng(wmBytes);
        const wmWidth = 340;
        const wmHeight = wmWidth * (wmImg.height / wmImg.width);
        page1.drawImage(wmImg, {
          x: (width - wmWidth) / 2,
          y: (height - wmHeight) / 2,
          width: wmWidth,
          height: wmHeight,
          opacity: 0.14,
        });
      } else if (fs.existsSync(watermarkJpgPath)) {
        const wmBytes = fs.readFileSync(watermarkJpgPath);
        const wmImg = await pdfDoc.embedJpg(wmBytes);
        const wmWidth = 360;
        const wmHeight = wmWidth * (wmImg.height / wmImg.width);
        page1.drawImage(wmImg, {
          x: (width - wmWidth) / 2,
          y: (height - wmHeight) / 2,
          width: wmWidth,
          height: wmHeight,
          opacity: 0.14,
        });
      } else if (fs.existsSync(watermarkPngPath)) {
        const wmBytes = fs.readFileSync(watermarkPngPath);
        const wmImg = await pdfDoc.embedPng(wmBytes);
        const wmWidth = 360;
        const wmHeight = wmWidth * (wmImg.height / wmImg.width);
        page1.drawImage(wmImg, {
          x: (width - wmWidth) / 2,
          y: (height - wmHeight) / 2,
          width: wmWidth,
          height: wmHeight,
          opacity: 0.14,
        });
      }
    } catch (err) {
      console.error('Page 1 watermark drawing error:', err);
    }

    // 1. Top Logo Header
    let logoGtWidth = 0;
    if (isGtMode && fs.existsSync(logoGtPath)) {
      const logoBytes = fs.readFileSync(logoGtPath);
      const logoImg = await pdfDoc.embedPng(logoBytes);
      const targetH = 78;
      const targetW = targetH * (logoImg.width / logoImg.height);
      logoGtWidth = targetW;
      page1.drawImage(logoImg, {
        x: margin,
        y: height - 18 - targetH,
        width: targetW,
        height: targetH,
      });
    } else {
      const logoHkPath = path.join(process.cwd(), 'public', 'logo_hk.jpg');
      if (fs.existsSync(logoHkPath)) {
        const logoBytes = fs.readFileSync(logoHkPath);
        const logoImg = await pdfDoc.embedJpg(logoBytes);
        page1.drawImage(logoImg, {
          x: margin,
          y: height - margin - 48,
          width: 72,
          height: 48,
        });
      }
    }

    let currentY = isGtMode ? height - 22 : height - margin - 8;
    const headerX = isGtMode
      ? margin + (logoGtWidth ? logoGtWidth + 10 : 75)
      : margin + 85;

    if (isGtMode) {
      // Header for Genetrust Brand
      page1.drawText(nfc('CÔNG TY CỔ PHẦN GENETRUST VIỆT NAM'), {
        x: headerX,
        y: currentY,
        size: 11,
        font: fontBold,
        color: primaryBlue,
      });
      currentY -= 13;
      page1.drawText(nfc('Địa chỉ: 15 ngõ 5 Hoàng Quốc Việt, Nghĩa Đô, Hà Nội'), {
        x: headerX,
        y: currentY,
        size: 7.5,
        font: fontItalic,
        color: primaryBlue,
      });
      currentY -= 11;
      page1.drawText(nfc('Email: gennetrust@gmail.com'), {
        x: headerX,
        y: currentY,
        size: 7.5,
        font: fontItalic,
        color: primaryBlue,
      });
      currentY -= 11;
      page1.drawText(nfc('Hotline: 0818.992.466'), {
        x: headerX,
        y: currentY,
        size: 7.5,
        font: fontItalic,
        color: primaryBlue,
      });
      currentY -= 11;
      page1.drawText(nfc('Website: Genetrust.vn'), {
        x: headerX,
        y: currentY,
        size: 7.5,
        font: fontItalic,
        color: primaryBlue,
      });
      currentY = height - 90; // Ensure currentY ends right above blue bar line (height - 98)
    } else if (loaiXetNghiemADN === 'tu_nguyen' || loaiXetNghiemADN === 'y_chr' || loaiXetNghiemADN === 'x_chr') {
      // Header for ADN Tự nguyện, Nhiễm sắc thể Y & X (Image 1, 3, 4)
      page1.drawText(nfc('VIỆN NGHIÊN CỨU VÀ PHÂN TÍCH DI TRUYỀN'), {
        x: headerX,
        y: currentY,
        size: 9.5,
        font: fontBold,
        color: primaryBlue,
      });
      currentY -= 12;
      page1.drawText(nfc('CÔNG TY CỔ PHẦN CÔNG NGHỆ VÀ THƯƠNG MẠI HK-TECH'), {
        x: headerX,
        y: currentY,
        size: 9.5,
        font: fontBold,
        color: primaryBlue,
      });
      currentY -= 11;
      page1.drawText(nfc('Địa chỉ: Số 15 Nguyễn Như Uyên, Phường Yên Hòa, Quận Cầu Giấy, TP Hà Nội'), {
        x: headerX,
        y: currentY,
        size: 7.5,
        font: fontItalic,
        color: primaryBlue,
      });
      currentY -= 10;
      page1.drawText(nfc('Website: hk-tech.vn'), {
        x: headerX,
        y: currentY,
        size: 7.5,
        font: fontItalic,
        color: primaryBlue,
      });
      currentY -= 10;
      page1.drawText(nfc('Hotline: 0971 553 330'), {
        x: headerX,
        y: currentY,
        size: 7.5,
        font: fontItalic,
        color: primaryBlue,
      });
      currentY -= 10;
      page1.drawText(nfc('Email: xetnghiemht.central@gmail.com'), {
        x: headerX,
        y: currentY,
        size: 7.5,
        font: fontItalic,
        color: primaryBlue,
      });
    } else {
      // Header for ADN Pháp lý (Image 2)
      page1.drawText(nfc('CÔNG TY CỔ PHẦN CÔNG NGHỆ VÀ THƯƠNG MẠI HK-TECH'), {
        x: headerX,
        y: currentY,
        size: 10,
        font: fontBold,
        color: primaryBlue,
      });
      currentY -= 12;
      page1.drawText(nfc('Địa chỉ: Số 15 Nguyễn Như Uyên, Phường Yên Hòa, Quận Cầu Giấy, TP Hà Nội'), {
        x: headerX,
        y: currentY,
        size: 7.5,
        font: fontItalic,
        color: primaryBlue,
      });
      currentY -= 10;
      page1.drawText(nfc('Website: hk-tech.vn'), {
        x: headerX,
        y: currentY,
        size: 7.5,
        font: fontItalic,
        color: primaryBlue,
      });
      currentY -= 10;
      page1.drawText(nfc('Hotline: 0971 553 330'), {
        x: headerX,
        y: currentY,
        size: 7.5,
        font: fontItalic,
        color: primaryBlue,
      });
      currentY -= 10;
      page1.drawText(nfc('Email: xetnghiemht.central@gmail.com'), {
        x: headerX,
        y: currentY,
        size: 7.5,
        font: fontItalic,
        color: primaryBlue,
      });
    }

    // Top Header Blue Bar Line
    currentY -= 8;
    page1.drawRectangle({
      x: margin,
      y: currentY,
      width: width - margin * 2,
      height: 2.5,
      color: primaryBlue,
    });

    // Date & Code at top right
    currentY -= 18;
    const formattedNgayBanHanh = formatDateVN(ngayBanHanh);
    page1.drawText(nfc(formattedNgayBanHanh || 'Hà Nội, ngày .... tháng .... năm ........'), {
      x: width - margin - 170,
      y: currentY,
      size: 8.5,
      font: fontItalic,
      color: darkColor,
    });
    currentY -= 12;
    page1.drawText(nfc(`Số: ${soPhieu}`), {
      x: width - margin - 170,
      y: currentY,
      size: 8.5,
      font: fontItalic,
      color: darkColor,
    });

    // Title KẾT QUẢ XÉT NGHIỆM ADN
    currentY -= 20;
    const titleText = nfc('KẾT QUẢ XÉT NGHIỆM ADN');
    const titleWidth = fontBold.widthOfTextAtSize(titleText, 16);
    page1.drawText(titleText, {
      x: (width - titleWidth) / 2,
      y: currentY,
      size: 16,
      font: fontBold,
      color: darkColor,
    });

    // Intro text
    currentY -= 18;
    const formattedNgayYeuCau = formatDateVN(ngayYeuCau) || '...................';
    const compName = isGtMode ? 'Công ty Cổ phần Genetrust Việt Nam' : 'Công ty Cổ phần công nghệ và thương mại HK- Teck';
    let introStr = '';
    if (loaiXetNghiemADN === 'tu_nguyen' || loaiXetNghiemADN === 'y_chr' || loaiXetNghiemADN === 'x_chr') {
      introStr = `Theo đơn yêu cầu xét nghiệm ADN ngày ${formattedNgayYeuCau} của bà (ông) ${nguoiYeuCau || '...................'}, ${compName} thực hiện xét nghiệm ADN cho những mẫu được ghi tên sau:`;
    } else {
      introStr = `Theo đơn yêu cầu xét nghiệm ADN ngày ${formattedNgayYeuCau} của bà(ông) ${nguoiYeuCau || '...................'}, ${compName} thực hiện xét nghiệm ADN cho những người sau:`;
    }

    const introLines = wrapText(introStr, fontRegular, 13, width - margin * 2);
    for (const line of introLines) {
      page1.drawText(nfc(line), {
        x: margin,
        y: currentY,
        size: 13,
        font: fontRegular,
        color: darkColor,
      });
      currentY -= 15;
    }

    // Render Samples List
    currentY -= 14;

    for (let idx = 0; idx < mauDanhSach.length; idx++) {
      const sample = mauDanhSach[idx];
      const labelKey = sample.kyHieuMau || `M${idx + 1}`;
      const name = sample.hoTen || '...................';
      const gender = sample.gioiTinh || '......';
      const dob = formatDateVN(sample.ngaySinh) || '........';
      const sampleNgayCap = formatDateVN(sample.ngayCap) || '...................';
      const sampleType = sample.loaiMau || 'Máu';

      if (loaiXetNghiemADN === 'tu_nguyen' || loaiXetNghiemADN === 'y_chr') {
        // ADN Tự Nguyện & Nhiễm sắc thể Y (Image 1 & 3 format)
        page1.drawText(nfc(`${idx + 1}.  Người có mẫu ghi tên: ${name}`), {
          x: margin + 15,
          y: currentY,
          size: 13,
          font: fontBold,
          color: darkColor,
        });
        currentY -= 15;
        page1.drawText(nfc(`    Giới tính: ${gender}   Ngày sinh: ${dob}   Loại mẫu: ${sampleType}`), {
          x: margin + 15,
          y: currentY,
          size: 13,
          font: fontRegular,
          color: darkColor,
        });
        currentY -= 15;
        page1.drawText(nfc(`    Ký hiệu mẫu: ${labelKey}`), {
          x: margin + 15,
          y: currentY,
          size: 13,
          font: fontRegular,
          color: darkColor,
        });
        currentY -= 16;
      } else {
        // ADN Pháp Lý (Image 2 format with Portrait Avatar Photo on left)
        const portraitImgStr = sample.anhChanDung || sample.photoUrl || sample.anhCccdMatTruoc;
        let drawnAvatarWidth = 0;

        if (portraitImgStr) {
          const avatarEmbed = await embedImageHelper(pdfDoc, portraitImgStr);
          if (avatarEmbed) {
            drawnAvatarWidth = 52;
            const avatarHeight = 68;
            page1.drawImage(avatarEmbed, {
              x: margin + 10,
              y: currentY + 8 - avatarHeight,
              width: 52,
              height: avatarHeight,
            });
          }
        }

        const textX = margin + 10 + (drawnAvatarWidth ? drawnAvatarWidth + 12 : 0);

        if (idx === 0) {
          page1.drawText(nfc(`1.  Họ tên: ${name}`), {
            x: textX,
            y: currentY,
            size: 13,
            font: fontBold,
            color: darkColor,
          });
          currentY -= 15;
          page1.drawText(nfc(`Giới tính: ${gender}   Ngày sinh: ${dob}   Quốc tịch: ${sample.quocTich || 'Việt Nam'}`), {
            x: textX,
            y: currentY,
            size: 13,
            font: fontRegular,
            color: darkColor,
          });
          currentY -= 15;
          page1.drawText(nfc(`CCCD/Passport: ${sample.cccd || '...................'}   Ngày cấp: ${sampleNgayCap}`), {
            x: textX,
            y: currentY,
            size: 13,
            font: fontRegular,
            color: darkColor,
          });
          currentY -= 15;
          page1.drawText(nfc(`Nơi cấp: ${sample.noiCap || '...................'}`), {
            x: textX,
            y: currentY,
            size: 13,
            font: fontRegular,
            color: darkColor,
          });
          currentY -= 15;
          page1.drawText(nfc(`Nơi thường trú: ${sample.noiThuongTru || '...................'}`), {
            x: textX,
            y: currentY,
            size: 13,
            font: fontRegular,
            color: darkColor,
          });
          currentY -= 15;
          page1.drawText(nfc(`Ký hiệu mẫu: ${labelKey}`), {
            x: textX,
            y: currentY,
            size: 13,
            font: fontRegular,
            color: darkColor,
          });
          currentY -= 18;
        } else {
          page1.drawText(nfc(`${idx + 1}.  Người có tên dự kiến: ${name}`), {
            x: textX,
            y: currentY,
            size: 13,
            font: fontBold,
            color: darkColor,
          });
          currentY -= 15;
          page1.drawText(nfc(`Giới tính: ${gender}   Ngày sinh: ${dob}`), {
            x: textX,
            y: currentY,
            size: 13,
            font: fontRegular,
            color: darkColor,
          });
          currentY -= 15;
          page1.drawText(nfc(`Giấy chứng sinh số: ${sample.cccd || '...................'}   Quyển số: ${sample.quyenSo || '...................'}`), {
            x: textX,
            y: currentY,
            size: 13,
            font: fontRegular,
            color: darkColor,
          });
          currentY -= 15;
          page1.drawText(nfc(`Ngày cấp: ${sampleNgayCap}   Nơi cấp: ${sample.noiCap || '...................'}`), {
            x: textX,
            y: currentY,
            size: 13,
            font: fontRegular,
            color: darkColor,
          });
          currentY -= 15;
          page1.drawText(nfc(`Ký hiệu mẫu: ${labelKey}`), {
            x: textX,
            y: currentY,
            size: 13,
            font: fontRegular,
            color: darkColor,
          });
          currentY -= 18;
        }
      }
    }

    // Notes Section (Khoảng cách vừa vặn với phần thông tin mẫu bên trên)
    currentY -= 6;
    // Notes Section (Khoảng cách vừa vặn với phần thông tin mẫu bên trên)
    currentY -= 6;
    if (loaiXetNghiemADN === 'x_chr') {
      const bullets = [
        `-  Người nhận mẫu: ${nguoiThuMau || 'Hoàng Văn Luận'}`,
        '-  Mẫu và các thông tin ghi trên mẫu do người yêu cầu xét nghiệm tự cung cấp và chịu trách nhiệm.',
        '-  Các ký hiệu mẫu do Công ty cổ phần công nghệ và thương mại HK- TECK đặt.',
        '-  Phương pháp xét nghiệm: Phân tích nhiễm sắc thể X.',
        '-  Các mẫu được tách chiết ADN bằng bộ kit ReliaPrep gDNA Miniprep (Promega, Mỹ).',
        `-  Mẫu ADN sau khi tách chiết được khuếch đại bằng bộ kit ${boKit || 'X18Plex STR Detection Kit'}, sử dụng máy chu trình nhiệt MultiGene OptiMax Cycler (Labnet, Mỹ).`,
        '-  Sản phẩm PCR được điện di mao quản trên hệ thống 3500-Genetic Analyzer (Applied Biosystems, Mỹ).',
        '-  Kết quả được xử lý bằng phần mềm GeneMapper ID-X v1.5 (Applied Biosystems, Mỹ).',
      ];
      for (const b of bullets) {
        page1.drawText(nfc(b), {
          x: margin,
          y: currentY,
          size: 8.5,
          font: fontItalic,
          color: darkColor,
        });
        currentY -= 10.5;
      }
      currentY -= 4;
    } else if (loaiXetNghiemADN === 'y_chr') {
      const bullets = [
        `-  Người nhận mẫu: ${nguoiThuMau || 'Hoàng Văn Luận'}`,
        '-  Mẫu và các thông tin ghi trên mẫu do người yêu cầu xét nghiệm tự cung cấp và chịu trách nhiệm.',
        '-  Các ký hiệu mẫu do Công ty cổ phần công nghệ và thương mại HK- TECK đặt.',
        '-  Phương pháp xét nghiệm: Phân tích nhiễm sắc thể Y.',
        '-  Các mẫu được tách chiết ADN bằng bộ kit ReliaPrep gDNA Miniprep (Promega, Mỹ).',
        `-  Mẫu ADN sau khi tách chiết được khuếch đại bằng bộ kit ${boKit || 'Y27Plex STR Detection Kit'}, sử dụng máy chu trình nhiệt MultiGene OptiMax Cycler (Labnet, Mỹ).`,
        '-  Sản phẩm PCR được điện di mao quản trên hệ thống 3500-Genetic Analyzer (Applied Biosystems, Mỹ).',
        '-  Kết quả được xử lý bằng phần mềm GeneMapper ID-X v1.5 (Applied Biosystems, Mỹ).',
      ];
      for (const b of bullets) {
        page1.drawText(nfc(b), {
          x: margin,
          y: currentY,
          size: 8.5,
          font: fontItalic,
          color: darkColor,
        });
        currentY -= 10.5;
      }
      currentY -= 4;
    } else {
      page1.drawText(nfc(`-  Người ${loaiXetNghiemADN === 'tu_nguyen' ? 'nhận' : 'thu'} mẫu: ${nguoiThuMau || 'Hoàng Văn Luận'}`), {
        x: margin,
        y: currentY,
        size: 10,
        font: fontItalic,
        color: darkColor,
      });
      currentY -= 12;
      page1.drawText(nfc(`-  ${loaiXetNghiemADN === 'tu_nguyen' ? 'Mẫu và các thông tin ghi trên mẫu' : 'Các giấy tờ cá nhân'} do người yêu cầu xét nghiệm tự cung cấp và chịu trách nhiệm.`), {
        x: margin,
        y: currentY,
        size: 10,
        font: fontItalic,
        color: darkColor,
      });
      currentY -= 12;
      page1.drawText(nfc(`-  Các ký hiệu mẫu do ${isGtMode ? 'Công ty Cổ phần Genetrust Việt Nam' : 'Công ty cổ phần công nghệ và thương mại HK- TECK'} đặt.`), {
        x: margin,
        y: currentY,
        size: 10,
        font: fontItalic,
        color: darkColor,
      });
      currentY -= 12;
      page1.drawText(nfc(`-  Phân tích ADN trong nhân tế bào các mẫu trên theo bộ kit ${boKit || 'A27Plex STR Detection Kit'}.`), {
        x: margin,
        y: currentY,
        size: 10,
        font: fontItalic,
        color: darkColor,
      });
      currentY -= 16;
    }

    // STR Loci Header
    if (loaiXetNghiemADN === 'y_chr' || loaiXetNghiemADN === 'x_chr') {
      currentY -= 8; // Clear vertical gap from bullet text above
      const yTitle = nfc('KẾT QUẢ PHÂN TÍCH ADN');
      const yTitleW = fontBold.widthOfTextAtSize(yTitle, 13);
      page1.drawText(yTitle, {
        x: (width - yTitleW) / 2,
        y: currentY,
        size: 13,
        font: fontBold,
        color: primaryBlue,
      });
      currentY -= 16; // Clear vertical gap before loci table
    } else {
      page1.drawText(nfc('Kết quả phân tích ADN như sau:'), {
        x: margin,
        y: currentY,
        size: 13,
        font: fontBold,
        color: darkColor,
      });
      currentY -= 14;
    }

    // ----------------------------------------------------
    // RENDER THE 3 LOCI TABLES
    // ----------------------------------------------------
    const sampleKeys = mauDanhSach.length > 0 ? mauDanhSach.map((s: any) => s.kyHieuMau || 'M1') : ['M1', 'M2'];

    const isYchr = loaiXetNghiemADN === 'y_chr';
    const isXchr = loaiXetNghiemADN === 'x_chr';
    const lociTable1Def = isXchr
      ? ['GATA172D05', 'GATA165B12', 'DXS6795', 'DXS981', 'DXS6807', 'DXS7133', 'DXS8378', 'DXS9902', 'DXS6810']
      : isYchr
      ? ['DYS481', 'DYS389I', 'DYS635', 'DYS389II', 'DYS391', 'DYS533', 'DYS627', 'DYS460', 'DYS458']
      : ['D3S1358', 'vWA', 'D12S391', 'CSF1PO', 'Penta E', 'D2S441', 'D16S539', 'D7S820', 'D13S317'];

    const lociTable2Def = isXchr
      ? ['DXS10159', 'DXS7423', 'DXS7132', 'GATA31E08', 'DXS6789', 'AMEL', 'HPRTB', 'DXS6803', 'DXS101']
      : isYchr
      ? ['DYS19', 'DYF387S1', 'DYS456', 'DYS385', 'DYS576', 'DYS437', 'DYS439', 'DYS392', 'DYS448']
      : ['D2S1338', 'Penta D', 'Rs199815934', 'AMEL', 'D22S1045', 'D19S433', 'D18S51', 'D6S1043', 'DYS391'];

    const lociTable3Def = isXchr
      ? []
      : isYchr
      ? ['DYS518', 'DYS393', 'DYS570', 'DYS390', 'DYS438', 'Y_GATA_H4', 'DYS449']
      : ['D8S1179', 'D5S818', 'D21S11', 'FGA', 'D10S1248', 'TH01', 'D1S1656', 'TPOX', 'SE33'];

    const drawStandard9LociTable = (lociList: string[], dataRows: any[]) => {
      if (!lociList || lociList.length === 0) return;
      const numCols = lociList.length;
      const rowHeight = 14;
      const firstColWidth = 78;
      const lociColWidth = Math.floor((width - margin * 2 - firstColWidth) / numCols);
      const totalTableWidth = firstColWidth + lociColWidth * numCols;
      const tableHeight = rowHeight * (1 + sampleKeys.length);
      const tableStartY = currentY;

      // Outer border box
      page1.drawRectangle({
        x: margin,
        y: tableStartY - tableHeight,
        width: totalTableWidth,
        height: tableHeight,
        borderColor: (isYchr || isXchr) ? primaryBlue : darkColor,
        borderWidth: 0.5,
      });

      // Horizontal inner lines
      for (let r = 1; r <= sampleKeys.length; r++) {
        const ry = tableStartY - r * rowHeight;
        page1.drawLine({
          start: { x: margin, y: ry },
          end: { x: margin + totalTableWidth, y: ry },
          color: (isYchr || isXchr) ? primaryBlue : darkColor,
          thickness: 0.5,
        });
      }

      // Vertical line separating first column (Mẫu \ Locus)
      page1.drawLine({
        start: { x: margin + firstColWidth, y: tableStartY },
        end: { x: margin + firstColWidth, y: tableStartY - tableHeight },
        color: (isYchr || isXchr) ? primaryBlue : darkColor,
        thickness: 0.5,
      });

      // Vertical lines separating each of the locus columns
      for (let lIdx = 1; lIdx <= numCols; lIdx++) {
        const vx = margin + firstColWidth + lIdx * lociColWidth;
        page1.drawLine({
          start: { x: vx, y: tableStartY },
          end: { x: vx, y: tableStartY - tableHeight },
          color: (isYchr || isXchr) ? primaryBlue : darkColor,
          thickness: 0.5,
        });
      }

      // Diagonal slash line in top-left cell header (Mẫu \ Locus)
      page1.drawLine({
        start: { x: margin, y: tableStartY },
        end: { x: margin + firstColWidth, y: tableStartY - rowHeight },
        color: (isYchr || isXchr) ? primaryBlue : darkColor,
        thickness: 0.5,
      });

      // Table Header Row Text
      page1.drawText(nfc('Locus'), {
        x: margin + firstColWidth - 32,
        y: currentY - rowHeight + 8,
        size: 7,
        font: fontBold,
        color: (isYchr || isXchr) ? primaryBlue : darkColor,
      });
      page1.drawText(nfc('Mẫu'), {
        x: margin + 6,
        y: currentY - rowHeight + 2,
        size: 7,
        font: fontBold,
        color: (isYchr || isXchr) ? primaryBlue : darkColor,
      });

      // Loci columns names
      lociList.forEach((locName, lIdx) => {
        const lx = margin + firstColWidth + lIdx * lociColWidth;
        const tw = fontBold.widthOfTextAtSize(nfc(locName), 7.5);
        page1.drawText(nfc(locName), {
          x: lx + Math.max(1, (lociColWidth - tw) / 2),
          y: currentY - rowHeight + 4,
          size: 7.5,
          font: fontBold,
          color: (isYchr || isXchr) ? primaryBlue : darkColor,
        });
      });

      currentY -= rowHeight;

      // Sample rows (B260001HHK, C260001HHK...)
      sampleKeys.forEach((sKey: string) => {
        const keyText = nfc(sKey);
        let keyFontSize = 7.5;
        let keyWidth = fontBold.widthOfTextAtSize(keyText, keyFontSize);
        if (keyWidth > firstColWidth - 4) {
          keyFontSize = Math.max(5.5, ((firstColWidth - 4) / keyWidth) * keyFontSize);
          keyWidth = fontBold.widthOfTextAtSize(keyText, keyFontSize);
        }
        const keyX = margin + Math.max(2, (firstColWidth - keyWidth) / 2);

        page1.drawText(keyText, {
          x: keyX,
          y: currentY - rowHeight + 3.5,
          size: keyFontSize,
          font: fontBold,
          color: darkColor,
        });

        // Allele values for each locus
        lociList.forEach((locName, lIdx) => {
          const matchedItem = dataRows.find((item) => (item.locus || '').toLowerCase() === locName.toLowerCase());
          let alleleVal = '';
          if (matchedItem) {
            if (matchedItem.alleles && matchedItem.alleles[sKey]) {
              alleleVal = formatAllelePair(matchedItem.alleles[sKey].a1, matchedItem.alleles[sKey].a2);
            } else if (sKey === 'M1') {
              alleleVal = formatAllelePair(matchedItem.m1_1, matchedItem.m1_2);
            } else if (sKey === 'M2') {
              alleleVal = formatAllelePair(matchedItem.m2_1, matchedItem.m2_2);
            }
          }

          const lx = margin + firstColWidth + lIdx * lociColWidth;
          const tw = fontRegular.widthOfTextAtSize(nfc(alleleVal), 7.5);
          page1.drawText(nfc(alleleVal), {
            x: lx + Math.max(1, (lociColWidth - tw) / 2),
            y: currentY - rowHeight + 4,
            size: 7.5,
            font: fontRegular,
            color: darkColor,
          });
        });

        currentY -= rowHeight;
      });

      currentY -= 3;
    };

    drawStandard9LociTable(lociTable1Def, table1);
    drawStandard9LociTable(lociTable2Def, table2);
    drawStandard9LociTable(lociTable3Def, table3);

    // Conclusion Section
    currentY -= 10;
    page1.drawText(nfc('KẾT LUẬN:'), {
      x: margin,
      y: currentY,
      size: 13,
      font: fontBold,
      color: darkColor,
    });
    currentY -= 15;

    const m1Name = mauDanhSach[0]?.hoTen || '...................';
    const m1Key = mauDanhSach[0]?.kyHieuMau || 'M1';
    const m2Name = mauDanhSach[1]?.hoTen || '...................';
    const m2Key = mauDanhSach[1]?.kyHieuMau || 'M2';

    const rawKetLuan = (ketLuan || 'có quan hệ huyết thống bố - con ( cha – con)').trim();
    const isAlreadyFullSentence =
      rawKetLuan.toLowerCase().includes('kí hiệu') ||
      rawKetLuan.toLowerCase().includes('ký hiệu') ||
      rawKetLuan.toLowerCase().startsWith('người có mẫu');

    let conclusionFullText = '';
    if (isAlreadyFullSentence) {
      conclusionFullText = rawKetLuan;
    } else {
      const phrase = rawKetLuan;
      const confidenceVal = (doTinCay || '> 99,9999%').trim();
      const confidenceStr = confidenceVal.toLowerCase().startsWith('độ tin cậy')
        ? confidenceVal
        : `độ tin cậy ${confidenceVal}`;

      if (loaiXetNghiemADN === 'x_chr') {
        conclusionFullText = `Người có mẫu ghi tên ${m1Name} (Kí hiệu: ${m1Key}) ${phrase.includes('theo dòng') ? phrase : 'có quan hệ huyết thống theo dòng nhiễm sắc thể X'} với người có mẫu ghi tên ${m2Name} (Kí hiệu: ${m2Key}) ${confidenceStr}.`;
      } else if (loaiXetNghiemADN === 'y_chr') {
        conclusionFullText = `Người có mẫu ghi tên ${m1Name} (Kí hiệu: ${m1Key}) ${phrase.includes('theo dòng') ? phrase : 'có quan hệ huyết thống theo dòng nhiễm sắc thể Y'} với người có mẫu ghi tên ${m2Name} (Kí hiệu: ${m2Key}) ${confidenceStr}.`;
      } else if (loaiXetNghiemADN === 'tu_nguyen') {
        conclusionFullText = `Người có mẫu ghi tên ${m1Name} (Kí hiệu: ${m1Key}) ${phrase} với người có mẫu ghi tên ${m2Name} (Kí hiệu: ${m2Key}) ${confidenceStr}.`;
      } else {
        // ADN Pháp lý
        conclusionFullText = `${m1Name} (Kí hiệu: ${m1Key}) ${phrase} với người có tên dự kiến ${m2Name} (Kí hiệu: ${m2Key}) ${confidenceStr}.`;
      }
    }

    const redPhraseRegex = /((không\s+)?có\s+quan\s+hệ\s+huyết\s+thống\s+theo\s+dòng\s+nhiễm\s+sắc\s+thể\s+X|(không\s+)?có\s+quan\s+hệ\s+huyết\s+thống\s+theo\s+dòng\s+nhiễm\s+sắc\s+thể\s+Y|(không\s+)?có\s+quan\s+hệ\s+huyết\s+thống\s+bố\s*-\s*con\s*\(\s*cha\s*–\s*con\s*\)|(không\s+)?có\s+quan\s+hệ\s+huyết\s+thống\s+mẹ\s*-\s*con\s*\(\s*mẹ\s*–\s*con\s*\)|(không\s+)?có\s+quan\s+hệ\s+huyết\s+thống)/i;
    const match = conclusionFullText.match(redPhraseRegex);
    const wordTokens: { word: string; color: any }[] = [];

    if (match && match.index !== undefined) {
      const idx = match.index;
      const matchedStr = match[0];
      const partBefore = conclusionFullText.slice(0, idx);
      const partAfter = conclusionFullText.slice(idx + matchedStr.length);

      partBefore.split(/\s+/).filter(Boolean).forEach((w) => wordTokens.push({ word: w, color: darkColor }));
      matchedStr.split(/\s+/).filter(Boolean).forEach((w) => wordTokens.push({ word: w, color: redColor }));
      partAfter.split(/\s+/).filter(Boolean).forEach((w) => wordTokens.push({ word: w, color: darkColor }));
    } else {
      conclusionFullText.split(/\s+/).filter(Boolean).forEach((w) => wordTokens.push({ word: w, color: darkColor }));
    }

    let concCurrentX = margin;
    const concFontSize = 13;
    const spaceW = fontBold.widthOfTextAtSize(' ', concFontSize);
    const maxConcW = width - margin * 2;

    for (const item of wordTokens) {
      const wW = fontBold.widthOfTextAtSize(nfc(item.word), concFontSize);
      if (concCurrentX + wW > margin + maxConcW && concCurrentX > margin) {
        concCurrentX = margin;
        currentY -= 15;
      }
      page1.drawText(nfc(item.word), {
        x: concCurrentX,
        y: currentY,
        size: concFontSize,
        font: fontBold,
        color: item.color,
      });
      concCurrentX += wW + spaceW;
    }
    currentY -= 16;

    // Signatures
    currentY -= 35;
    const canBoTitleText = nfc('CÁN BỘ XÉT NGHIỆM');
    const daiDienTitleText = nfc('ĐẠI DIỆN ĐƠN VỊ');

    const canBoTitleWidth = fontBold.widthOfTextAtSize(canBoTitleText, 13);
    const daiDienTitleWidth = fontBold.widthOfTextAtSize(daiDienTitleText, 13);

    const canBoXPos = margin + 35;
    const daiDienXPos = width - margin - daiDienTitleWidth - 30;

    page1.drawText(canBoTitleText, {
      x: canBoXPos,
      y: currentY,
      size: 13,
      font: fontBold,
      color: darkColor,
    });
    page1.drawText(daiDienTitleText, {
      x: daiDienXPos,
      y: currentY,
      size: 13,
      font: fontBold,
      color: darkColor,
    });

    // Render Signer Names Below Signature Area (if provided)
    const canBoName = (canBoXetNghiem || '').trim();
    const daiDienName = (daiDienDonVi || '').trim();

    if (canBoName || daiDienName) {
      const nameY = currentY - 75; // Expanded signature space for hand signing & stamping
      if (canBoName) {
        const canBoNameText = nfc(canBoName);
        let fontSize = 11;
        let canBoNameW = fontBold.widthOfTextAtSize(canBoNameText, fontSize);
        let canBoNameX = canBoXPos + (canBoTitleWidth - canBoNameW) / 2;

        const maxHalfW = (width / 2) - margin;
        while (canBoNameW > maxHalfW && fontSize > 7) {
          fontSize -= 0.5;
          canBoNameW = fontBold.widthOfTextAtSize(canBoNameText, fontSize);
          canBoNameX = canBoXPos + (canBoTitleWidth - canBoNameW) / 2;
        }

        page1.drawText(canBoNameText, {
          x: Math.max(margin, canBoNameX),
          y: nameY,
          size: fontSize,
          font: fontBold,
          color: darkColor,
        });
      }

      if (daiDienName) {
        const daiDienNameText = nfc(daiDienName);
        let fontSize = 10;
        let daiDienNameW = fontBold.widthOfTextAtSize(daiDienNameText, fontSize);
        const maxRightBound = width - margin;

        while (fontSize > 6.5 && (daiDienXPos + (daiDienTitleWidth - daiDienNameW) / 2 + daiDienNameW > maxRightBound)) {
          fontSize -= 0.5;
          daiDienNameW = fontBold.widthOfTextAtSize(daiDienNameText, fontSize);
        }

        let daiDienNameX = daiDienXPos + (daiDienTitleWidth - daiDienNameW) / 2;
        if (daiDienNameX + daiDienNameW > maxRightBound) {
          daiDienNameX = maxRightBound - daiDienNameW;
        }

        page1.drawText(daiDienNameText, {
          x: Math.max(width / 2, daiDienNameX),
          y: nameY,
          size: fontSize,
          font: fontBold,
          color: darkColor,
        });
      }
    }

    // Footer note for ADN Tự nguyện & Nhiễm sắc thể Y
    if (loaiXetNghiemADN === 'tu_nguyen' || loaiXetNghiemADN === 'y_chr') {
      page1.drawText(nfc('Ghi chú: Kết quả xét nghiệm có giá trị trên mẫu phân tích, không có giá trị trong tranh chấp, tổ tụng pháp lý'), {
        x: margin,
        y: margin + 10,
        size: 7,
        font: fontItalic,
        color: rgb(0.4, 0.4, 0.4),
      });
    }

    // ----------------------------------------------------
    // PAGES FOR RUN RESULTS (GeneMapper / Result Chart Images)
    // Appends all result chart images as dedicated next pages of the PDF (clean full page without headers)
    // ----------------------------------------------------
    const allChartImages: string[] = [];

    const extraCharts = body.anhChayMauList || body.anhChayMau || [];
    if (Array.isArray(extraCharts) && extraCharts.length > 0) {
      extraCharts.forEach((imgStr: string) => {
        if (imgStr) allChartImages.push(imgStr);
      });
    } else {
      mauDanhSach.forEach((sample: any) => {
        if (sample.anhKetQuaChay) allChartImages.push(sample.anhKetQuaChay);
      });
    }

    // Embed each chart image on dedicated appended PDF page (Clean full-page image)
    for (let idx = 0; idx < allChartImages.length; idx++) {
      const runImgStr = allChartImages[idx];
      if (!runImgStr) continue;

      const pageRun = pdfDoc.addPage([595.28, 841.89]);
      const pW = pageRun.getSize().width;
      const pH = pageRun.getSize().height;

      const imgEmbed = await embedImageHelper(pdfDoc, runImgStr);
      if (imgEmbed) {
        const maxImgWidth = pW - margin * 2;
        const maxImgHeight = pH - margin * 2;
        const imgDims = imgEmbed.scaleToFit(maxImgWidth, maxImgHeight);

        pageRun.drawImage(imgEmbed, {
          x: (pW - imgDims.width) / 2,
          y: (pH - imgDims.height) / 2,
          width: imgDims.width,
          height: imgDims.height,
        });
      }
    }

    // ----------------------------------------------------
    // PAGES FOR CCCD / IDENTIFICATION PHOTOS
    // Page 4: CCCD Front & Back for Person 1
    // Page 5: CCCD Front & Back for Person 2
    // ----------------------------------------------------
    for (let idx = 0; idx < mauDanhSach.length; idx++) {
      const sample = mauDanhSach[idx];
      const cccdFront = sample.anhCccdMatTruoc;
      const cccdBack = sample.anhCccdMatSau;
      if (!cccdFront && !cccdBack) continue;

      const pageCccd = pdfDoc.addPage([595.28, 841.89]);
      const pW = pageCccd.getSize().width;
      const pH = pageCccd.getSize().height;

      let cccdY = pH - margin;

      const availWidth = pW - margin * 2;
      const availHeight = pH - margin * 2;

      if (cccdFront && cccdBack) {
        // Both Front & Back present: render stacked straight and centered with equal height allocations
        const singleMaxH = Math.floor((availHeight - 30) / 2);

        // 1. Front Image
        const imgFrontEmbed = await embedImageHelper(pdfDoc, cccdFront);
        if (imgFrontEmbed) {
          const dimsFront = imgFrontEmbed.scaleToFit(availWidth, singleMaxH);
          const imgX = margin + (availWidth - dimsFront.width) / 2;
          const imgY = cccdY - dimsFront.height;

          // Draw border frame
          pageCccd.drawRectangle({
            x: imgX - 2,
            y: imgY - 2,
            width: dimsFront.width + 4,
            height: dimsFront.height + 4,
            borderColor: rgb(0.8, 0.8, 0.8),
            borderWidth: 0.5,
          });

          pageCccd.drawImage(imgFrontEmbed, {
            x: imgX,
            y: imgY,
            width: dimsFront.width,
            height: dimsFront.height,
          });

          cccdY -= dimsFront.height + 25;
        }

        // 2. Back Image
        const imgBackEmbed = await embedImageHelper(pdfDoc, cccdBack);
        if (imgBackEmbed) {
          const dimsBack = imgBackEmbed.scaleToFit(availWidth, singleMaxH);
          const imgX = margin + (availWidth - dimsBack.width) / 2;
          const imgY = cccdY - dimsBack.height;

          // Draw border frame
          pageCccd.drawRectangle({
            x: imgX - 2,
            y: imgY - 2,
            width: dimsBack.width + 4,
            height: dimsBack.height + 4,
            borderColor: rgb(0.8, 0.8, 0.8),
            borderWidth: 0.5,
          });

          pageCccd.drawImage(imgBackEmbed, {
            x: imgX,
            y: imgY,
            width: dimsBack.width,
            height: dimsBack.height,
          });
        }
      } else {
        // Single Image present (Front or Back)
        const targetImg = cccdFront || cccdBack;
        if (targetImg) {
          const imgEmbed = await embedImageHelper(pdfDoc, targetImg);
          if (imgEmbed) {
            const dims = imgEmbed.scaleToFit(availWidth, availHeight);
            const imgX = margin + (availWidth - dims.width) / 2;
            const imgY = margin + (availHeight - dims.height) / 2;

            pageCccd.drawRectangle({
              x: imgX - 2,
              y: imgY - 2,
              width: dims.width + 4,
              height: dims.height + 4,
              borderColor: rgb(0.8, 0.8, 0.8),
              borderWidth: 0.5,
            });

            pageCccd.drawImage(imgEmbed, {
              x: imgX,
              y: imgY,
              width: dims.width,
              height: dims.height,
            });
          }
        }
      }
    }

    // Save & Return Combined PDF
    const pdfBytes = await pdfDoc.save();
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=Ket_Qua_ADN_${soPhieu}.pdf`,
      },
    });
  } catch (error: any) {
    console.error('Export ADN PDF error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi tạo file PDF ADN' }, { status: 500 });
  }
}
