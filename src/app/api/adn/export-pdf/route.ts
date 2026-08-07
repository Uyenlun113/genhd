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

// Helper to embed image (base64 data URI or file path/buffer) onto PDF
async function embedImageHelper(pdfDoc: PDFDocument, imgStr: string) {
  if (!imgStr || typeof imgStr !== 'string') return null;
  try {
    let imageBytes: Uint8Array | null = null;
    let isPng = false;

    if (imgStr.startsWith('data:image/png;base64,')) {
      isPng = true;
      imageBytes = Buffer.from(imgStr.replace('data:image/png;base64,', ''), 'base64');
    } else if (imgStr.startsWith('data:image/jpeg;base64,') || imgStr.startsWith('data:image/jpg;base64,')) {
      isPng = false;
      imageBytes = Buffer.from(imgStr.replace(/^data:image\/(jpeg|jpg);base64,/, ''), 'base64');
    } else if (imgStr.startsWith('data:')) {
      const base64Data = imgStr.split(',')[1];
      if (base64Data) {
        imageBytes = Buffer.from(base64Data, 'base64');
        isPng = imgStr.includes('png');
      }
    } else if (fs.existsSync(imgStr)) {
      imageBytes = fs.readFileSync(imgStr);
      isPng = imgStr.toLowerCase().endsWith('.png');
    }

    if (!imageBytes) return null;

    if (isPng) {
      return await pdfDoc.embedPng(imageBytes);
    } else {
      return await pdfDoc.embedJpg(imageBytes);
    }
  } catch (err) {
    console.error('Image embedding error:', err);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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
      kiemSoatKetQua = 'TS. BS. Nguyễn Khánh Dương',
      daiDienDonVi = 'CÔNG TY CỔ PHẦN CÔNG NGHỆ VÀ THƯƠNG MẠI HK-TECH',
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

    // Colors
    const primaryBlue = rgb(0.0, 0.2, 0.55);
    const darkColor = rgb(0.0, 0.0, 0.0);
    const redColor = rgb(0.85, 0.1, 0.1);

    // ----------------------------------------------------
    // PAGE 1: MAIN REPORT SHEET (Phiếu Kết Quả ADN HK-TECH)
    // ----------------------------------------------------
    const page1 = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page1.getSize();
    const margin = 36;

    // 1. Logo HK-Tech (public/logo_hk.jpg)
    const logoHkPath = path.join(process.cwd(), 'public', 'logo_hk.jpg');
    if (fs.existsSync(logoHkPath)) {
      const logoBytes = fs.readFileSync(logoHkPath);
      const logoImg = await pdfDoc.embedJpg(logoBytes);
      page1.drawImage(logoImg, {
        x: margin,
        y: height - margin - 55,
        width: 75,
        height: 55,
      });
    }

    let currentY = height - margin - 10;
    const headerX = margin + 85;

    if (loaiXetNghiemADN === 'tu_nguyen') {
      // Header for ADN Tự nguyện (Image 3)
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
      page1.drawText(nfc('Hotline: 0936 654 456'), {
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
    page1.drawText(nfc(ngayBanHanh || 'Hà Nội, ngày .... tháng .... năm ........'), {
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
    const titleWidth = fontBold.widthOfTextAtSize(titleText, 14);
    page1.drawText(titleText, {
      x: (width - titleWidth) / 2,
      y: currentY,
      size: 14,
      font: fontBold,
      color: darkColor,
    });

    // Intro text
    currentY -= 16;
    let introStr = '';
    if (loaiXetNghiemADN === 'tu_nguyen') {
      introStr = `Theo đơn yêu cầu xét nghiệm ADN ngày ${ngayYeuCau || '...................'} của bà(ông) ${nguoiYeuCau || '...................'}, Công ty Cổ phần công nghệ và thương mại HK- Teck thực hiện xét nghiệm ADN cho những mẫu được ghi tên sau:`;
    } else {
      introStr = `Theo đơn yêu cầu xét nghiệm ADN ngày ${ngayYeuCau || '...................'} của bà(ông) ${nguoiYeuCau || '...................'}, Công ty Cổ phần công nghệ và thương mại HK- Teck thực hiện xét nghiệm ADN cho những người sau:`;
    }

    page1.drawText(nfc(introStr), {
      x: margin,
      y: currentY,
      size: 8.5,
      font: fontRegular,
      color: darkColor,
    });

    // Render Samples List
    currentY -= 16;

    for (let idx = 0; idx < mauDanhSach.length; idx++) {
      const sample = mauDanhSach[idx];
      const labelKey = sample.kyHieuMau || `M${idx + 1}`;
      const name = sample.hoTen || '...................';
      const gender = sample.gioiTinh || '......';
      const dob = sample.ngaySinh || '........';
      const sampleType = sample.loaiMau || 'Máu';

      if (loaiXetNghiemADN === 'tu_nguyen') {
        // ADN Tự Nguyện (Image 3 format)
        page1.drawText(nfc(`${idx + 1}.  Người có mẫu ghi tên: ${name}`), {
          x: margin + 15,
          y: currentY,
          size: 8.5,
          font: fontBold,
          color: darkColor,
        });
        currentY -= 12;
        page1.drawText(nfc(`    Giới tính: ${gender}   Ngày sinh: ${dob}   Loại mẫu: ${sampleType}`), {
          x: margin + 15,
          y: currentY,
          size: 8.5,
          font: fontRegular,
          color: darkColor,
        });
        currentY -= 12;
        page1.drawText(nfc(`    Ký hiệu mẫu: ${labelKey}`), {
          x: margin + 15,
          y: currentY,
          size: 8.5,
          font: fontRegular,
          color: darkColor,
        });
        currentY -= 14;
      } else {
        // ADN Pháp Lý (Image 2 format with Portrait Avatar Photo on left)
        const portraitImgStr = sample.anhChanDung || sample.anhCccdMatTruoc;
        let drawnAvatarWidth = 0;

        if (portraitImgStr) {
          const avatarEmbed = await embedImageHelper(pdfDoc, portraitImgStr);
          if (avatarEmbed) {
            drawnAvatarWidth = 50;
            page1.drawImage(avatarEmbed, {
              x: margin + 10,
              y: currentY - 55,
              width: 50,
              height: 60,
            });
          }
        }

        const textX = margin + 10 + (drawnAvatarWidth ? drawnAvatarWidth + 12 : 0);

        if (idx === 0) {
          page1.drawText(nfc(`1.  Họ tên: ${name}    Giới tính: ${gender}   Ngày sinh: ${dob}   Quốc tịch: ${sample.quocTich || 'Việt Nam'}`), {
            x: textX,
            y: currentY,
            size: 8.5,
            font: fontBold,
            color: darkColor,
          });
          currentY -= 11;
          page1.drawText(nfc(`CCCD/Passport: ${sample.cccd || '...................'}   Ngày cấp: ${sample.ngayCap || '...................'}`), {
            x: textX,
            y: currentY,
            size: 8,
            font: fontRegular,
            color: darkColor,
          });
          currentY -= 11;
          page1.drawText(nfc(`Nơi cấp: ${sample.noiCap || '...................'}`), {
            x: textX,
            y: currentY,
            size: 8,
            font: fontRegular,
            color: darkColor,
          });
          currentY -= 11;
          page1.drawText(nfc(`Nơi thường trú: ${sample.noiThuongTru || '...................'}`), {
            x: textX,
            y: currentY,
            size: 8,
            font: fontRegular,
            color: darkColor,
          });
          currentY -= 11;
          page1.drawText(nfc(`Ký hiệu mẫu: ${labelKey}`), {
            x: textX,
            y: currentY,
            size: 8.5,
            font: fontRegular,
            color: darkColor,
          });
          currentY -= 16;
        } else {
          page1.drawText(nfc(`${idx + 1}.  Người có tên dự kiến: ${name}`), {
            x: textX,
            y: currentY,
            size: 8.5,
            font: fontBold,
            color: darkColor,
          });
          currentY -= 11;
          page1.drawText(nfc(`Giới tính: ${gender}   Ngày sinh: ${dob}`), {
            x: textX,
            y: currentY,
            size: 8,
            font: fontRegular,
            color: darkColor,
          });
          currentY -= 11;
          page1.drawText(nfc(`Giấy chứng sinh số: ${sample.cccd || '...................'}   Quyển số: ${sample.quyenSo || '...................'}`), {
            x: textX,
            y: currentY,
            size: 8,
            font: fontRegular,
            color: darkColor,
          });
          currentY -= 11;
          page1.drawText(nfc(`Ngày cấp: ${sample.ngayCap || '...................'}   Nơi cấp: ${sample.noiCap || '...................'}`), {
            x: textX,
            y: currentY,
            size: 8,
            font: fontRegular,
            color: darkColor,
          });
          currentY -= 11;
          page1.drawText(nfc(`Ký hiệu mẫu: ${labelKey}`), {
            x: textX,
            y: currentY,
            size: 8.5,
            font: fontRegular,
            color: darkColor,
          });
          currentY -= 16;
        }
      }
    }

    // Notes Section
    currentY -= 2;
    page1.drawText(nfc(`-  Người ${loaiXetNghiemADN === 'tu_nguyen' ? 'nhận' : 'thu'} mẫu: ${nguoiThuMau || 'Hoàng Văn Luận'}`), {
      x: margin,
      y: currentY,
      size: 7.5,
      font: fontItalic,
      color: darkColor,
    });
    currentY -= 10;
    page1.drawText(nfc(`-  ${loaiXetNghiemADN === 'tu_nguyen' ? 'Mẫu và các thông tin ghi trên mẫu' : 'Các giấy tờ cá nhân'} do người yêu cầu xét nghiệm tự cung cấp và chịu trách nhiệm.`), {
      x: margin,
      y: currentY,
      size: 7.5,
      font: fontItalic,
      color: darkColor,
    });
    currentY -= 10;
    page1.drawText(nfc('-  Các ký hiệu mẫu do Công ty cổ phần công nghệ và thương mại HK- TECK đặt.'), {
      x: margin,
      y: currentY,
      size: 7.5,
      font: fontItalic,
      color: darkColor,
    });
    currentY -= 10;
    page1.drawText(nfc(`-  Phân tích ADN trong nhân tế bào các mẫu trên theo bộ kit ${boKit || 'A27Plex STR Detection Kit'}.`), {
      x: margin,
      y: currentY,
      size: 7.5,
      font: fontItalic,
      color: darkColor,
    });
    currentY -= 14;

    // STR Loci Header
    page1.drawText(nfc('Kết quả phân tích ADN như sau:'), {
      x: margin,
      y: currentY,
      size: 8.5,
      font: fontBold,
      color: darkColor,
    });
    currentY -= 10;

    // ----------------------------------------------------
    // RENDER THE 3 LOCI TABLES (Image 2 & Image 3 exact format)
    // ----------------------------------------------------
    const sampleKeys = mauDanhSach.length > 0 ? mauDanhSach.map((s: any) => s.kyHieuMau || 'M1') : ['M1', 'M2'];

    const lociTable1Def = ['D3S1358', 'vWA', 'D12S391', 'CSF1PO', 'Penta E', 'D2S441', 'D16S539', 'D7S820', 'D13S317'];
    const lociTable2Def = ['D2S1338', 'Penta D', 'Rs199815934', 'AMEL', 'D22S1045', 'D19S433', 'D18S51', 'D6S1043', 'DYS391'];
    const lociTable3Def = ['D8S1179', 'D5S818', 'D21S11', 'FGA', 'D10S1248', 'TH01', 'D1S1656', 'TPOX', 'SE33'];

    const drawStandard9LociTable = (lociList: string[], dataRows: any[]) => {
      const rowHeight = 11;
      const firstColWidth = 52;
      const lociColWidth = Math.floor((width - margin * 2 - firstColWidth) / 9);
      const totalTableWidth = firstColWidth + lociColWidth * 9;

      // Table Header Row
      page1.drawRectangle({
        x: margin,
        y: currentY - rowHeight,
        width: totalTableWidth,
        height: rowHeight,
        borderColor: darkColor,
        borderWidth: 0.5,
      });

      page1.drawText(nfc('Locus'), {
        x: margin + 14,
        y: currentY - rowHeight + 3,
        size: 6.5,
        font: fontBold,
        color: darkColor,
      });
      page1.drawText(nfc('Mẫu'), {
        x: margin + 3,
        y: currentY - rowHeight + 3,
        size: 6.5,
        font: fontBold,
        color: darkColor,
      });

      // Loci columns names
      lociList.forEach((locName, lIdx) => {
        const lx = margin + firstColWidth + lIdx * lociColWidth;
        const tw = fontBold.widthOfTextAtSize(nfc(locName), 6.5);
        page1.drawText(nfc(locName), {
          x: lx + Math.max(1, (lociColWidth - tw) / 2),
          y: currentY - rowHeight + 3,
          size: 6.5,
          font: fontBold,
          color: darkColor,
        });
      });

      currentY -= rowHeight;

      // Sample rows (M1, M2...)
      sampleKeys.forEach((sKey: string) => {
        page1.drawRectangle({
          x: margin,
          y: currentY - rowHeight,
          width: totalTableWidth,
          height: rowHeight,
          borderColor: darkColor,
          borderWidth: 0.5,
        });

        // Sample key on left col
        page1.drawText(nfc(sKey), {
          x: margin + 16,
          y: currentY - rowHeight + 3,
          size: 7,
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
          const tw = fontRegular.widthOfTextAtSize(nfc(alleleVal), 6.5);
          page1.drawText(nfc(alleleVal), {
            x: lx + Math.max(1, (lociColWidth - tw) / 2),
            y: currentY - rowHeight + 3,
            size: 6.5,
            font: fontRegular,
            color: darkColor,
          });
        });

        currentY -= rowHeight;
      });

      currentY -= 2;
    };

    drawStandard9LociTable(lociTable1Def, table1);
    drawStandard9LociTable(lociTable2Def, table2);
    drawStandard9LociTable(lociTable3Def, table3);

    // Conclusion Section
    currentY -= 4;
    page1.drawText(nfc('KẾT LUẬN:'), {
      x: margin + 120,
      y: currentY,
      size: 9,
      font: fontBold,
      color: darkColor,
    });
    currentY -= 12;

    const m1Name = mauDanhSach[0]?.hoTen || '...................';
    const m1Key = mauDanhSach[0]?.kyHieuMau || 'M1';
    const m2Name = mauDanhSach[1]?.hoTen || '...................';
    const m2Key = mauDanhSach[1]?.kyHieuMau || 'M2';

    let conclusionFullText = '';
    if (loaiXetNghiemADN === 'tu_nguyen') {
      conclusionFullText = `Người có mẫu ghi tên ${m1Name} (Kí hiệu: ${m1Key}) có quan hệ huyết thống bố - con ( cha – con) với người có mẫu ghi tên ${m2Name} (Kí hiệu: ${m2Key}) độ tin cậy > 99,9999%.`;
    } else {
      conclusionFullText = `${m1Name} (Kí hiệu: ${m1Key}) có quan hệ huyết thống bố - con ( cha – con) với người có tên dự kiến ${m2Name} (Kí hiệu: ${m2Key}) độ tin cậy > 99,9999%.`;
    }

    if (ketLuan) conclusionFullText = ketLuan;

    page1.drawText(nfc(conclusionFullText), {
      x: margin + 15,
      y: currentY,
      size: 8,
      font: fontBold,
      color: redColor,
    });

    // Signatures
    currentY -= 30;
    page1.drawText(nfc('CÁN BỘ XÉT NGHIỆM'), {
      x: margin + 40,
      y: currentY,
      size: 9,
      font: fontBold,
      color: darkColor,
    });
    page1.drawText(nfc('ĐẠI DIỆN ĐƠN VỊ'), {
      x: width - margin - 140,
      y: currentY,
      size: 9,
      font: fontBold,
      color: darkColor,
    });

    // Footer note for ADN Tự nguyện (Image 3)
    if (loaiXetNghiemADN === 'tu_nguyen') {
      page1.drawText(nfc('Ghi chú: Kết quả xét nghiệm có giá trị trên mẫu phân tích, không có giá trị trong tranh chấp, tổ tụng pháp lý'), {
        x: margin,
        y: margin + 10,
        size: 7,
        font: fontItalic,
        color: rgb(0.4, 0.4, 0.4),
      });
    }

    // ----------------------------------------------------
    // PAGES FOR RUN RESULTS (GeneMapper Peak Charts)
    // Page 2: Run result for Person 1
    // Page 3: Run result for Person 2
    // ----------------------------------------------------
    for (let idx = 0; idx < mauDanhSach.length; idx++) {
      const sample = mauDanhSach[idx];
      const runImgStr = sample.anhKetQuaChay;
      if (!runImgStr) continue;

      const pageRun = pdfDoc.addPage([595.28, 841.89]);
      const pW = pageRun.getSize().width;
      const pH = pageRun.getSize().height;

      // Header Banner
      pageRun.drawRectangle({
        x: margin,
        y: pH - margin - 30,
        width: pW - margin * 2,
        height: 30,
        color: primaryBlue,
      });

      pageRun.drawText(nfc(`KẾT QUẢ CHẠY ADN (GENEMAPPER) - MẪU ${sample.kyHieuMau || `M${idx + 1}`}: ${sample.hoTen || ''}`), {
        x: margin + 15,
        y: pH - margin - 20,
        size: 11,
        font: fontBold,
        color: rgb(1, 1, 1),
      });

      const imgEmbed = await embedImageHelper(pdfDoc, runImgStr);
      if (imgEmbed) {
        const maxImgWidth = pW - margin * 2;
        const maxImgHeight = pH - margin * 2 - 50;
        const imgDims = imgEmbed.scaleToFit(maxImgWidth, maxImgHeight);

        pageRun.drawImage(imgEmbed, {
          x: margin + (maxImgWidth - imgDims.width) / 2,
          y: margin + (maxImgHeight - imgDims.height) / 2,
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

      // Header Banner
      pageCccd.drawRectangle({
        x: margin,
        y: pH - margin - 30,
        width: pW - margin * 2,
        height: 30,
        color: primaryBlue,
      });

      pageCccd.drawText(nfc(`CĂN CƯỚC CÔNG DÂN / GIẤY TỜ MẪU ${sample.kyHieuMau || `M${idx + 1}`}: ${sample.hoTen || ''}`), {
        x: margin + 15,
        y: pH - margin - 20,
        size: 11,
        font: fontBold,
        color: rgb(1, 1, 1),
      });

      let cccdY = pH - margin - 50;

      if (cccdFront) {
        pageCccd.drawText(nfc('Mặt trước CCCD / Giấy chứng sinh:'), {
          x: margin,
          y: cccdY,
          size: 10,
          font: fontBold,
          color: darkColor,
        });
        cccdY -= 15;

        const imgFrontEmbed = await embedImageHelper(pdfDoc, cccdFront);
        if (imgFrontEmbed) {
          const dims = imgFrontEmbed.scaleToFit(pW - margin * 2, 330);
          pageCccd.drawImage(imgFrontEmbed, {
            x: margin + (pW - margin * 2 - dims.width) / 2,
            y: cccdY - dims.height,
            width: dims.width,
            height: dims.height,
          });
          cccdY -= dims.height + 25;
        }
      }

      if (cccdBack) {
        pageCccd.drawText(nfc('Mặt sau CCCD / Giấy tờ bổ sung:'), {
          x: margin,
          y: cccdY,
          size: 10,
          font: fontBold,
          color: darkColor,
        });
        cccdY -= 15;

        const imgBackEmbed = await embedImageHelper(pdfDoc, cccdBack);
        if (imgBackEmbed) {
          const dims = imgBackEmbed.scaleToFit(pW - margin * 2, 330);
          pageCccd.drawImage(imgBackEmbed, {
            x: margin + (pW - margin * 2 - dims.width) / 2,
            y: cccdY - dims.height,
            width: dims.width,
            height: dims.height,
          });
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
