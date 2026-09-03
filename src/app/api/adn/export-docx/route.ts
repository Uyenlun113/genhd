import { NextRequest, NextResponse } from 'next/server';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  WidthType,
  BorderStyle,
  ImageRun,
} from 'docx';
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
  if (!dateStr) {
    const now = new Date();
    const d = now.getDate() < 10 ? `0${now.getDate()}` : `${now.getDate()}`;
    const m = now.getMonth() + 1 < 10 ? `0${now.getMonth() + 1}` : `${now.getMonth() + 1}`;
    return `Hà Nội, ngày ${d} tháng ${m} năm ${now.getFullYear()}`;
  }
  const trimmed = String(dateStr).trim();
  if (!trimmed) {
    const now = new Date();
    const d = now.getDate() < 10 ? `0${now.getDate()}` : `${now.getDate()}`;
    const m = now.getMonth() + 1 < 10 ? `0${now.getMonth() + 1}` : `${now.getMonth() + 1}`;
    return `Hà Nội, ngày ${d} tháng ${m} năm ${now.getFullYear()}`;
  }

  const vnMatch = trimmed.match(/ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})/i);
  if (vnMatch) {
    const d = parseInt(vnMatch[1], 10);
    const m = parseInt(vnMatch[2], 10);
    const y = vnMatch[3];
    const dd = d < 10 ? `0${d}` : `${d}`;
    const mm = m < 10 ? `0${m}` : `${m}`;
    return `Hà Nội, ngày ${dd} tháng ${mm} năm ${y}`;
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed) || trimmed.includes('T')) {
    const ymd = trimmed.split('T')[0];
    const parts = ymd.split('-');
    if (parts.length === 3) {
      const y = parts[0];
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      const dd = d < 10 ? `0${d}` : `${d}`;
      const mm = m < 10 ? `0${m}` : `${m}`;
      return `Hà Nội, ngày ${dd} tháng ${mm} năm ${y}`;
    }
  }

  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const parts = trimmed.split('/');
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const y = parts[2];
    const dd = d < 10 ? `0${d}` : `${d}`;
    const mm = m < 10 ? `0${m}` : `${m}`;
    return `Hà Nội, ngày ${dd} tháng ${mm} năm ${y}`;
  }

  return trimmed;
};

const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const formatDateEN = (dateStr: any): string => {
  if (!dateStr) {
    const now = new Date();
    const d = now.getDate() < 10 ? `0${now.getDate()}` : `${now.getDate()}`;
    const mName = MONTH_NAMES_EN[now.getMonth()];
    return `Hanoi, ${mName} ${d}, ${now.getFullYear()}`;
  }
  const trimmed = String(dateStr).trim();
  if (!trimmed) {
    const now = new Date();
    const d = now.getDate() < 10 ? `0${now.getDate()}` : `${now.getDate()}`;
    const mName = MONTH_NAMES_EN[now.getMonth()];
    return `Hanoi, ${mName} ${d}, ${now.getFullYear()}`;
  }

  const vnMatch = trimmed.match(/ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})/i);
  if (vnMatch) {
    const d = parseInt(vnMatch[1], 10);
    const m = parseInt(vnMatch[2], 10) - 1;
    const y = vnMatch[3];
    const monthName = MONTH_NAMES_EN[m] || `${m + 1}`;
    return `Hanoi, ${monthName} ${d < 10 ? '0' + d : d}, ${y}`;
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed) || trimmed.includes('T')) {
    const ymd = trimmed.split('T')[0];
    const [y, m, d] = ymd.split('-');
    const mIdx = parseInt(m, 10) - 1;
    const dayNum = parseInt(d, 10);
    const dd = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
    return `Hanoi, ${MONTH_NAMES_EN[mIdx] || m} ${dd}, ${y}`;
  }

  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const [d, m, y] = trimmed.split('/');
    const mIdx = parseInt(m, 10) - 1;
    const dayNum = parseInt(d, 10);
    const dd = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
    return `Hanoi, ${MONTH_NAMES_EN[mIdx] || m} ${dd}, ${y}`;
  }

  return trimmed;
};

const removeVietnameseTones = (str: string): string => {
  if (!str) return '';
  let s = String(str);
  s = s.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, 'A');
  s = s.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  s = s.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, 'E');
  s = s.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  s = s.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, 'I');
  s = s.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  s = s.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, 'O');
  s = s.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  s = s.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, 'U');
  s = s.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  s = s.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, 'Y');
  s = s.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  s = s.replace(/Đ/g, 'D');
  s = s.replace(/đ/g, 'd');
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

const toEnglishText = (text: any, type: 'name' | 'address' | 'agency' | 'nationality' | 'gender' | 'sampleType' | 'general' = 'general'): string => {
  if (!text || typeof text !== 'string') return '';
  const trimmed = text.trim();
  if (!trimmed) return '';

  if (type === 'gender') {
    const val = trimmed.toLowerCase();
    if (val === 'nam') return 'Male';
    if (val === 'nữ' || val === 'nu') return 'Female';
    return removeVietnameseTones(trimmed);
  }

  if (type === 'nationality') {
    const val = trimmed.toLowerCase();
    if (val.includes('việt nam') || val.includes('viet nam') || val.includes('vietnam')) return 'Vietnamese';
    return removeVietnameseTones(trimmed);
  }

  if (type === 'sampleType') {
    const val = trimmed.toLowerCase();
    if (val.includes('máu') || val.includes('mau')) return 'Blood';
    if (val.includes('niêm mạc') || val.includes('buccal')) return 'Buccal Swab';
    if (val.includes('tóc') || val.includes('toc')) return 'Hair with root';
    if (val.includes('móng') || val.includes('mong')) return 'Fingernail';
    if (val.includes('cuống rốn')) return 'Umbilical cord';
    return removeVietnameseTones(trimmed);
  }

  let s = trimmed;

  s = s.replace(/^Ông\s+/i, 'Mr. ');
  s = s.replace(/^Bà\s+/i, 'Mrs. ');
  s = s.replace(/^TS\.\s*BS\.\s*/i, 'Dr. ');
  s = s.replace(/^ThS\.\s*/i, 'MSc. ');
  s = s.replace(/^BS\.\s*/i, 'Dr. ');

  if (type === 'address' || type === 'agency' || type === 'general') {
    s = s.replace(/Cục Cảnh sát quản lý hành chính về trật tự xã hội/gi, 'Police Dept. of Administrative Management of Social Order');
    s = s.replace(/Cục Cảnh sát QLHC về TTXH/gi, 'Police Dept. of Administrative Management of Social Order');
    s = s.replace(/Công an TP\./gi, 'City Police Dept. of');
    s = s.replace(/Công an tỉnh/gi, 'Provincial Police Dept. of');
    s = s.replace(/Công an huyện/gi, 'District Police Dept. of');
    s = s.replace(/Công an quận/gi, 'District Police Dept. of');
    s = s.replace(/Phường\s+/gi, 'Ward ');
    s = s.replace(/Quận\s+/gi, 'District ');
    s = s.replace(/Huyện\s+/gi, 'District ');
    s = s.replace(/TP\.\s*/gi, 'City ');
    s = s.replace(/TP\s+/gi, 'City ');
    s = s.replace(/Thành phố\s+/gi, 'City ');
    s = s.replace(/Tỉnh\s+/gi, 'Province ');
    s = s.replace(/Xã\s+/gi, 'Commune ');
    s = s.replace(/Thị trấn\s+/gi, 'Town ');
  }

  return removeVietnameseTones(s);
};

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

// Helper for embedding ImageRun in docx
async function getImageRunHelper(imgStr: string, maxW = 200, maxH = 250): Promise<ImageRun | null> {
  if (!imgStr || typeof imgStr !== 'string') return null;
  try {
    let imageBytes: Buffer | null = null;

    if (imgStr.startsWith('http://') || imgStr.startsWith('https://')) {
      const resp = await fetch(imgStr);
      if (!resp.ok) return null;
      const arrayBuffer = await resp.arrayBuffer();
      imageBytes = Buffer.from(arrayBuffer);
    } else if (imgStr.startsWith('data:image')) {
      const parts = imgStr.split(',');
      const base64Data = parts[1];
      if (base64Data) {
        imageBytes = Buffer.from(base64Data, 'base64');
      }
    } else if (imgStr.startsWith('/')) {
      const publicPath = path.join(process.cwd(), 'public', imgStr);
      if (fs.existsSync(publicPath)) {
        imageBytes = fs.readFileSync(publicPath);
      }
    } else if (fs.existsSync(imgStr)) {
      imageBytes = fs.readFileSync(imgStr);
    }

    if (!imageBytes) return null;

    const isPng = imgStr.toLowerCase().includes('png');
    const imgType: 'png' | 'jpg' = isPng ? 'png' : 'jpg';

    return new ImageRun({
      data: new Uint8Array(imageBytes),
      transformation: {
        width: maxW,
        height: maxH,
      },
      type: imgType,
    });
  } catch (err) {
    console.error('Image helper error for docx:', err);
    return null;
  }
}

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
      totalLikelihoodRatio = '23109010868637.6',
      probabilityOfPaternity = '99.9999999999957%',
      canBoXetNghiem = '',
      daiDienDonVi = '',
      isGenetrust = false,
      lang = 'vi',
    } = body;

    const isGtMode = isGenetrust || body.brand === 'genetrust';
    const isEn = lang === 'en';

    const BLUE_COLOR = '00338D';
    const DARK_COLOR = '000000';
    const RED_COLOR = 'D90000';

    const children: any[] = [];

    // Header section with Logo
    const logoGtPath = path.join(process.cwd(), 'public', 'Logo_Genetrust.png');
    const logoHkPath = path.join(process.cwd(), 'public', 'logo_hk.jpg');

    let logoImageRun: ImageRun | null = null;
    if (isGtMode && fs.existsSync(logoGtPath)) {
      logoImageRun = await getImageRunHelper(logoGtPath, 110, 55);
    } else if (fs.existsSync(logoHkPath)) {
      logoImageRun = await getImageRunHelper(logoHkPath, 90, 55);
    }

    const companyInfoParagraphs = isGtMode
      ? [
          new Paragraph({
            children: [
              new TextRun({
                text: nfc(isEn ? 'GENETRUST VIETNAM JOINT STOCK COMPANY' : 'CÔNG TY CỔ PHẦN GENETRUST VIỆT NAM'),
                bold: true,
                color: BLUE_COLOR,
                size: 20,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: nfc(isEn ? 'Address: 15, Alley 5 Hoang Quoc Viet St., Nghia Do, Hanoi' : 'Địa chỉ: 15 ngõ 5 Hoàng Quốc Việt, Nghĩa Đô, Hà Nội'),
                italics: true,
                color: BLUE_COLOR,
                size: 15,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: nfc('Email: gennetrust@gmail.com | Hotline: 0818.992.466 | Website: Genetrust.vn'),
                italics: true,
                color: BLUE_COLOR,
                size: 15,
              }),
            ],
          }),
        ]
      : [
          new Paragraph({
            children: [
              new TextRun({
                text: nfc(isEn ? 'HK-TECH TECHNOLOGY AND TRADING JOINT STOCK COMPANY' : 'CÔNG TY CỔ PHẦN CÔNG NGHỆ VÀ THƯƠNG MẠI HK-TECH'),
                bold: true,
                color: BLUE_COLOR,
                size: 20,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: nfc(isEn ? 'Address: No. 15 Nguyen Nhu Uyen St., Yen Hoa Ward, Cau Giay Dist., Hanoi' : 'Địa chỉ: Số 15 Nguyễn Như Uyên, Phường Yên Hòa, Quận Cầu Giấy, TP Hà Nội'),
                italics: true,
                color: BLUE_COLOR,
                size: 15,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: nfc('Website: hk-tech.vn | Hotline: 0971 553 330 | Email: xetnghiemht.central@gmail.com'),
                italics: true,
                color: BLUE_COLOR,
                size: 15,
              }),
            ],
          }),
        ];

    if (logoImageRun) {
      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
            bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
            left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
            right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
            insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
            insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 18, type: WidthType.PERCENTAGE },
                  children: [new Paragraph({ children: [logoImageRun] })],
                }),
                new TableCell({
                  width: { size: 82, type: WidthType.PERCENTAGE },
                  children: companyInfoParagraphs,
                }),
              ],
            }),
          ],
        })
      );
    } else {
      children.push(...companyInfoParagraphs);
    }

    // Divider Line
    children.push(
      new Paragraph({
        border: {
          bottom: { color: BLUE_COLOR, space: 1, style: BorderStyle.SINGLE, size: 12 },
        },
      })
    );

    // Date & Ref No.
    const formattedNgayBanHanh = isEn ? formatDateEN(ngayBanHanh) : formatDateVN(ngayBanHanh);
    children.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({
            text: nfc(formattedNgayBanHanh || (isEn ? 'Hanoi, Date: .... Month: .... Year: ........' : 'Hà Nội, ngày .... tháng .... năm ........')),
            italics: true,
            size: 18,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({
            text: nfc(`${isEn ? 'Ref No.' : 'Số'}: ${soPhieu}`),
            italics: true,
            size: 18,
          }),
        ],
      })
    );

    // Title
    const titleText = isEn ? 'DNA TEST REPORT' : 'KẾT QUẢ XÉT NGHIỆM ADN';
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 180, after: 180 },
        children: [
          new TextRun({
            text: nfc(titleText),
            bold: true,
            size: 32,
            color: DARK_COLOR,
          }),
        ],
      })
    );

    // Intro paragraph
    const formattedNgayYeuCau = (isEn ? formatDateEN(ngayYeuCau) : formatDateVN(ngayYeuCau)) || '...................';
    const compName = isGtMode
      ? (isEn ? 'Genetrust Vietnam Joint Stock Company' : 'Công ty Cổ phần Genetrust Việt Nam')
      : (isEn ? 'HK-Tech Technology and Trading Joint Stock Company' : 'Công ty Cổ phần công nghệ và thương mại HK- Teck');
    const nguoiYeuCauDisplay = isEn ? toEnglishText(nguoiYeuCau, 'name') : (nguoiYeuCau || '...................');

    let introStr = '';
    if (isEn) {
      if (loaiXetNghiemADN === 'tu_nguyen' || loaiXetNghiemADN === 'y_chr' || loaiXetNghiemADN === 'x_chr') {
        introStr = `According to the request of Mr./Mrs. ${nguoiYeuCauDisplay} on ${formattedNgayYeuCau}, ${compName} performed DNA analysis for the following samples:`;
      } else {
        introStr = `According to the request of Mr./Mrs. ${nguoiYeuCauDisplay} on ${formattedNgayYeuCau}, ${compName} performed DNA analysis for the following individuals:`;
      }
    } else {
      if (loaiXetNghiemADN === 'tu_nguyen' || loaiXetNghiemADN === 'y_chr' || loaiXetNghiemADN === 'x_chr') {
        introStr = `Theo đơn yêu cầu xét nghiệm ADN ngày ${formattedNgayYeuCau} của bà (ông) ${nguoiYeuCau || '...................'}, ${compName} thực hiện xét nghiệm ADN cho những mẫu được ghi tên sau:`;
      } else {
        introStr = `Theo đơn yêu cầu xét nghiệm ADN ngày ${formattedNgayYeuCau} của bà(ông) ${nguoiYeuCau || '...................'}, ${compName} thực hiện xét nghiệm ADN cho những người sau:`;
      }
    }

    children.push(
      new Paragraph({
        spacing: { after: 140 },
        children: [
          new TextRun({
            text: nfc(introStr),
            size: 24,
          }),
        ],
      })
    );

    // Render Samples List
    for (let idx = 0; idx < mauDanhSach.length; idx++) {
      const sample = mauDanhSach[idx];
      const labelKey = sample.kyHieuMau || `M${idx + 1}`;
      const name = (isEn ? toEnglishText(sample.hoTen, 'name') : sample.hoTen) || '...................';
      const gender = (isEn ? toEnglishText(sample.gioiTinh, 'gender') : sample.gioiTinh) || '......';
      const dob = (isEn ? formatDateEN(sample.ngaySinh) : formatDateVN(sample.ngaySinh)) || '........';
      const sampleNgayCap = (isEn ? formatDateEN(sample.ngayCap) : formatDateVN(sample.ngayCap)) || '...................';
      const sampleType = (isEn ? toEnglishText(sample.loaiMau, 'sampleType') : sample.loaiMau) || 'Máu';
      const nationality = (isEn ? toEnglishText(sample.quocTich, 'nationality') : (sample.quocTich || 'Việt Nam'));
      const noiCap = (isEn ? toEnglishText(sample.noiCap, 'agency') : sample.noiCap) || '...................';
      const noiThuongTru = (isEn ? toEnglishText(sample.noiThuongTru, 'address') : sample.noiThuongTru) || '...................';

      if (loaiXetNghiemADN === 'tu_nguyen' || loaiXetNghiemADN === 'y_chr') {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: nfc(isEn ? `${idx + 1}.  Sample donor: ${name}` : `${idx + 1}.  Người có mẫu ghi tên: ${name}`),
                bold: true,
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: nfc(isEn ? `    Gender: ${gender}   Date of Birth: ${dob}   Sample Type: ${sampleType}` : `    Giới tính: ${gender}   Ngày sinh: ${dob}   Loại mẫu: ${sampleType}`),
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: nfc(isEn ? `    Sample Code: ${labelKey}` : `    Ký hiệu mẫu: ${labelKey}`),
                size: 24,
              }),
            ],
          })
        );
      } else {
        // Legal ADN: Sample Portrait Avatar photo on left
        const portraitImgStr = sample.anhChanDung || sample.photoUrl || sample.anhCccdMatTruoc;
        const avatarImageRun = portraitImgStr ? await getImageRunHelper(portraitImgStr, 100, 130) : null;

        const sampleTextParagraphs: Paragraph[] = [];

        if (idx === 0) {
          if (isEn) {
            sampleTextParagraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: nfc(`1.  Alleged Father: ${name}`),
                    bold: true,
                    size: 24,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: nfc(`Gender: ${gender}   Date of Birth: ${dob}   Nationality: ${nationality}`),
                    size: 24,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: nfc(`ID/Passport No.: ${sample.cccd || '...................'}   Date of Issue: ${sampleNgayCap}`),
                    size: 24,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: nfc(`Place of Issue: ${noiCap}`),
                    size: 24,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: nfc(`Permanent Address: ${noiThuongTru}`),
                    size: 24,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { after: 100 },
                children: [
                  new TextRun({
                    text: nfc(`Sample Code: ${labelKey}`),
                    size: 24,
                  }),
                ],
              })
            );
          } else {
            sampleTextParagraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: nfc(`1.  Họ tên: ${name}`),
                    bold: true,
                    size: 24,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: nfc(`Giới tính: ${gender}   Ngày sinh: ${dob}   Quốc tịch: ${sample.quocTich || 'Việt Nam'}`),
                    size: 24,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: nfc(`CCCD/Passport: ${sample.cccd || '...................'}   Ngày cấp: ${sampleNgayCap}`),
                    size: 24,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: nfc(`Nơi cấp: ${sample.noiCap || '...................'}`),
                    size: 24,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: nfc(`Nơi thường trú: ${sample.noiThuongTru || '...................'}`),
                    size: 24,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { after: 100 },
                children: [
                  new TextRun({
                    text: nfc(`Ký hiệu mẫu: ${labelKey}`),
                    size: 24,
                  }),
                ],
              })
            );
          }
        } else {
          if (isEn) {
            sampleTextParagraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: nfc(`${idx + 1}.  Intended Name: ${name}`),
                    bold: true,
                    size: 24,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: nfc(`Gender: ${gender}   Date of Birth: ${dob}`),
                    size: 24,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: nfc(`Birth Certificate No.: ${sample.cccd || '...................'}   Book No.: ${sample.quyenSo || '...................'}`),
                    size: 24,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: nfc(`Date of Issue: ${sampleNgayCap}   Place of Issue: ${noiCap}`),
                    size: 24,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { after: 100 },
                children: [
                  new TextRun({
                    text: nfc(`Sample Code: ${labelKey}`),
                    size: 24,
                  }),
                ],
              })
            );
          } else {
            sampleTextParagraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: nfc(`${idx + 1}.  Người có tên dự kiến: ${name}`),
                    bold: true,
                    size: 24,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: nfc(`Giới tính: ${gender}   Ngày sinh: ${dob}`),
                    size: 24,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: nfc(`Giấy chứng sinh số: ${sample.cccd || '...................'}   Quyển số: ${sample.quyenSo || '...................'}`),
                    size: 24,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: nfc(`Ngày cấp: ${sampleNgayCap}   Nơi cấp: ${sample.noiCap || '...................'}`),
                    size: 24,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { after: 100 },
                children: [
                  new TextRun({
                    text: nfc(`Ký hiệu mẫu: ${labelKey}`),
                    size: 24,
                  }),
                ],
              })
            );
          }
        }

        if (avatarImageRun) {
          children.push(
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: 20, type: WidthType.PERCENTAGE },
                      children: [new Paragraph({ children: [avatarImageRun] })],
                    }),
                    new TableCell({
                      width: { size: 80, type: WidthType.PERCENTAGE },
                      children: sampleTextParagraphs,
                    }),
                  ],
                }),
              ],
            })
          );
        } else {
          children.push(...sampleTextParagraphs);
        }
      }
    }

    // Notes Bullets
    const collectorName = isEn ? toEnglishText(nguoiThuMau, 'name') : (nguoiThuMau || 'Hoàng Văn Luận');
    const bullets = isEn ? [
      `- Sample ${loaiXetNghiemADN === 'tu_nguyen' ? 'received' : 'collected'} by: ${collectorName}`,
      `- ${loaiXetNghiemADN === 'tu_nguyen' ? 'Samples and sample details' : 'Personal identification documents'} were provided by the person(s) requesting the test, who assumes full responsibility.`,
      `- Sample codes were assigned by ${isGtMode ? 'Genetrust Vietnam Joint Stock Company' : 'HK-Tech Technology and Trading Joint Stock Company'}.`,
      `- Extracted Nuclear DNA were amplified by using ${boKit || 'A27Plex STR Detection Kit'}.`,
    ] : [
      `- Người ${loaiXetNghiemADN === 'tu_nguyen' ? 'nhận' : 'thu'} mẫu: ${nguoiThuMau || 'Hoàng Văn Luận'}`,
      `- ${loaiXetNghiemADN === 'tu_nguyen' ? 'Mẫu và các thông tin ghi trên mẫu' : 'Các giấy tờ cá nhân'} do người yêu cầu xét nghiệm tự cung cấp và chịu trách nhiệm.`,
      `- Các ký hiệu mẫu do ${isGtMode ? 'Công ty Cổ phần Genetrust Việt Nam' : 'Công ty cổ phần công nghệ và thương mại HK- TECK'} đặt.`,
      `- Phân tích ADN trong nhân tế bào các mẫu trên theo bộ kit ${boKit || 'A27Plex STR Detection Kit'}.`,
    ];

    for (const b of bullets) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: nfc(b),
              italics: true,
              size: 20,
            }),
          ],
        })
      );
    }

    // Loci Section Header
    children.push(
      new Paragraph({
        spacing: { before: 150, after: 100 },
        children: [
          new TextRun({
            text: nfc(isEn ? 'Profile Comparison Matrix is described in the following table:' : 'Kết quả phân tích ADN như sau:'),
            bold: true,
            size: 24,
          }),
        ],
      })
    );

    // Loci tables
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

    const createLociDocxTable = (lociList: string[], dataRows: any[]) => {
      if (!lociList || lociList.length === 0) return null;

      const headerRowCells = [
        new TableCell({
          width: { size: 18, type: WidthType.PERCENTAGE },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: nfc(isEn ? 'Sample \\ Locus' : 'Mẫu \\ Locus'), bold: true, size: 16 }),
              ],
            }),
          ],
        }),
        ...lociList.map(
          (loc) =>
            new TableCell({
              width: { size: 82 / lociList.length, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: nfc(loc), bold: true, size: 16 })],
                }),
              ],
            })
        ),
      ];

      const rows = [new TableRow({ children: headerRowCells })];

      sampleKeys.forEach((sKey: string) => {
        const cellItems = [
          new TableCell({
            width: { size: 18, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: nfc(sKey), bold: true, size: 16 })],
              }),
            ],
          }),
          ...lociList.map((locName) => {
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
            return new TableCell({
              width: { size: 82 / lociList.length, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: nfc(alleleVal), size: 16 })],
                }),
              ],
            });
          }),
        ];
        rows.push(new TableRow({ children: cellItems }));
      });

      return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows,
      });
    };

    const t1Table = createLociDocxTable(lociTable1Def, table1);
    const t2Table = createLociDocxTable(lociTable2Def, table2);
    const t3Table = createLociDocxTable(lociTable3Def, table3);

    if (t1Table) children.push(t1Table, new Paragraph({ spacing: { after: 60 } }));
    if (t2Table) children.push(t2Table, new Paragraph({ spacing: { after: 60 } }));
    if (t3Table) children.push(t3Table, new Paragraph({ spacing: { after: 60 } }));

    // Summary Table (LR & POP)
    const lrTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 28, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: 'Total Likelyhood Ratio (LR)', bold: true, size: 16 })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 22, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: nfc(totalLikelihoodRatio || '23109010868637.6'), bold: true, size: 16 })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 28, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: 'Probability of paternity (POP)', bold: true, size: 16 })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 22, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: nfc(probabilityOfPaternity || '99.9999999999957%'), bold: true, size: 16 })],
                }),
              ],
            }),
          ],
        }),
      ],
    });
    children.push(lrTable, new Paragraph({ spacing: { after: 120 } }));

    // Conclusion Section
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: nfc(isEn ? 'CONCLUSION:' : 'KẾT LUẬN:'),
            bold: true,
            size: 24,
          }),
        ],
      })
    );

    const m1RawName = mauDanhSach[0]?.hoTen || '...................';
    const m1Name = isEn ? toEnglishText(m1RawName, 'name') : m1RawName;
    const m1Key = mauDanhSach[0]?.kyHieuMau || 'M1';
    const m2RawName = mauDanhSach[1]?.hoTen || '...................';
    const m2Name = isEn ? toEnglishText(m2RawName, 'name') : m2RawName;
    const m2Key = mauDanhSach[1]?.kyHieuMau || 'M2';

    const rawKetLuan = (ketLuan || 'có quan hệ huyết thống bố - con ( cha – con)').trim();
    const isAlreadyFullSentence =
      rawKetLuan.toLowerCase().includes('kí hiệu') ||
      rawKetLuan.toLowerCase().includes('ký hiệu') ||
      rawKetLuan.toLowerCase().startsWith('người có mẫu') ||
      rawKetLuan.toLowerCase().startsWith('sample donor');

    let conclusionFullText = '';
    if (isEn) {
      if (isAlreadyFullSentence) {
        conclusionFullText = rawKetLuan;
      } else {
        const normK = rawKetLuan.toLowerCase();
        let relationStr = 'is the biological father of';
        if (normK.includes('không') || normK.includes('not') || normK.includes('excluded')) {
          if (normK.includes('mẹ') || normK.includes('mother')) {
            relationStr = 'is excluded as the biological mother of';
          } else if (loaiXetNghiemADN === 'x_chr') {
            relationStr = 'does not have a biological relationship along the X-chromosome lineage with';
          } else if (loaiXetNghiemADN === 'y_chr') {
            relationStr = 'does not have a biological relationship along the Y-chromosome lineage with';
          } else {
            relationStr = 'is excluded as the biological father of';
          }
        } else {
          if (normK.includes('mẹ') || normK.includes('mother')) {
            relationStr = 'is the biological mother of';
          } else if (loaiXetNghiemADN === 'x_chr') {
            relationStr = 'has a biological relationship along the X-chromosome lineage with';
          } else if (loaiXetNghiemADN === 'y_chr') {
            relationStr = 'has a biological relationship along the Y-chromosome lineage with';
          } else {
            relationStr = 'is the biological father of';
          }
        }

        const confidenceVal = (doTinCay || '> 99,9999%').trim().replace(/,/g, '.');
        const confidenceStr = `with a probability of ${confidenceVal}`;

        if (loaiXetNghiemADN === 'tu_nguyen' || loaiXetNghiemADN === 'y_chr' || loaiXetNghiemADN === 'x_chr') {
          conclusionFullText = `Sample donor ${m1Name} (Code: ${m1Key}) ${relationStr} sample donor ${m2Name} (Code: ${m2Key}) ${confidenceStr}.`;
        } else {
          conclusionFullText = `${m1Name} (Code: ${m1Key}) ${relationStr} child ${m2Name} (Code: ${m2Key}) ${confidenceStr}.`;
        }
      }
    } else {
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
          conclusionFullText = `${m1Name} (Kí hiệu: ${m1Key}) ${phrase} với người có tên dự kiến ${m2Name} (Kí hiệu: ${m2Key}) ${confidenceStr}.`;
        }
      }
    }

    const redPhraseRegex = isEn
      ? /(is\s+the\s+biological\s+father\s+of|is\s+excluded\s+as\s+the\s+biological\s+father\s+of|is\s+the\s+biological\s+mother\s+of|is\s+excluded\s+as\s+the\s+biological\s+mother\s+of|has\s+a\s+biological\s+relationship\s+along\s+the\s+[XY]-chromosome\s+lineage\s+with|does\s+not\s+have\s+a\s+biological\s+relationship\s+along\s+the\s+[XY]-chromosome\s+lineage\s+with|has\s+a\s+biological\s+relationship\s+with)/i
      : /((không\s+)?có\s+quan\s+hệ\s+huyết\s+thống\s+theo\s+dòng\s+nhiễm\s+sắc\s+thể\s+X|(không\s+)?có\s+quan\s+hệ\s+huyết\s+thống\s+theo\s+dòng\s+nhiễm\s+sắc\s+thể\s+Y|(không\s+)?có\s+quan\s+hệ\s+huyết\s+thống\s+bố\s*-\s*con\s*\(\s*cha\s*–\s*con\s*\)|(không\s+)?có\s+quan\s+hệ\s+huyết\s+thống\s+mẹ\s*-\s*con\s*\(\s*mẹ\s*–\s*con\s*\)|(không\s+)?có\s+quan\s+hệ\s+huyết\s+thống)/i;

    const match = conclusionFullText.match(redPhraseRegex);
    const runs: TextRun[] = [];

    if (match && match.index !== undefined) {
      const startIdx = match.index;
      const matchedText = match[0];
      const beforeText = conclusionFullText.slice(0, startIdx);
      const afterText = conclusionFullText.slice(startIdx + matchedText.length);

      if (beforeText) runs.push(new TextRun({ text: nfc(beforeText), size: 24, bold: true }));
      runs.push(new TextRun({ text: nfc(matchedText), size: 24, bold: true, color: RED_COLOR }));
      if (afterText) runs.push(new TextRun({ text: nfc(afterText), size: 24, bold: true }));
    } else {
      runs.push(new TextRun({ text: nfc(conclusionFullText), size: 24, bold: true }));
    }

    children.push(
      new Paragraph({
        spacing: { before: 100, after: 300 },
        children: runs,
      })
    );

    // Signatures
    const sigLeft = isEn ? 'RESULT CONTROLLER' : 'CÁN BỘ XÉT NGHIỆM';
    const sigRight = isEn ? 'CHIEF EXECUTIVE OFFICER' : 'ĐẠI DIỆN ĐƠN VỊ';
    const sigDateText = formattedNgayBanHanh;

    const canBoName = isEn ? toEnglishText(canBoXetNghiem, 'name') : (canBoXetNghiem || '').trim();
    const daiDienName = isEn ? toEnglishText(daiDienDonVi, 'name') : (daiDienDonVi || '').trim();

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 180 },
                    children: [new TextRun({ text: '', size: 20 })],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: nfc(sigLeft), bold: true, size: 22 })],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 800 },
                    children: [new TextRun({ text: nfc(canBoName), bold: true, size: 20 })],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 180 },
                    children: [new TextRun({ text: nfc(sigDateText), italics: true, size: 20 })],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: nfc(sigRight), bold: true, size: 22 })],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 800 },
                    children: [new TextRun({ text: nfc(daiDienName), bold: true, size: 20 })],
                  }),
                ],
              }),
            ],
          }),
        ],
      })
    );

    // ----------------------------------------------------
    // APPENDED PAGES: GeneMapper Charts / Analysis Results Images
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

    for (let idx = 0; idx < allChartImages.length; idx++) {
      const runImgStr = allChartImages[idx];
      if (!runImgStr) continue;

      const chartImgRun = await getImageRunHelper(runImgStr, 560, 320);
      if (chartImgRun) {
        children.push(
          new Paragraph({
            pageBreakBefore: true,
            alignment: AlignmentType.CENTER,
            children: [chartImgRun],
          })
        );
      }
    }

    // ----------------------------------------------------
    // APPENDED PAGES: Identification Documents (CCCD / Birth Certificates)
    // ----------------------------------------------------
    for (let idx = 0; idx < mauDanhSach.length; idx++) {
      const sample = mauDanhSach[idx];
      const cccdFront = sample.anhCccdMatTruoc;
      const cccdBack = sample.anhCccdMatSau;
      if (!cccdFront && !cccdBack) continue;

      const frontImgRun = cccdFront ? await getImageRunHelper(cccdFront, 500, 290) : null;
      const backImgRun = cccdBack ? await getImageRunHelper(cccdBack, 500, 290) : null;

      if (frontImgRun || backImgRun) {
        const cccdParagraphs: Paragraph[] = [];
        if (frontImgRun) {
          cccdParagraphs.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 150 },
              children: [frontImgRun],
            })
          );
        }
        if (backImgRun) {
          cccdParagraphs.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 150 },
              children: [backImgRun],
            })
          );
        }

        children.push(
          new Paragraph({
            pageBreakBefore: true,
            alignment: AlignmentType.CENTER,
            children: [],
          }),
          ...cccdParagraphs
        );
      }
    }

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 720,
                bottom: 720,
                left: 720,
                right: 720,
              },
            },
          },
          children,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const cleanFileName = `Ket_Qua_ADN_${soPhieu.replace(/[^a-zA-Z0-9_-]/g, '_')}.docx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${cleanFileName}"`,
      },
    });
  } catch (err: any) {
    console.error('ADN Export DOCX Error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Lỗi khi tạo file DOCX' }, { status: 500 });
  }
}
