import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';

const execPromise = util.promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'Không tìm thấy file tải lên từ máy tính' }, { status: 400 });
    }

    const tmpDir = path.join(process.cwd(), 'scratch');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const tmpPath = path.join(tmpDir, `upload_${Date.now()}_${cleanFileName}`);
    const bytes = await file.arrayBuffer();
    fs.writeFileSync(tmpPath, Buffer.from(bytes));

    try {
      const scriptPath = path.join(process.cwd(), 'scripts', 'parse_adn_pdf.py');
      const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
      const { stdout, stderr } = await execPromise(`"${pythonCmd}" "${scriptPath}" "${tmpPath}"`, {
        maxBuffer: 100 * 1024 * 1024, // 100MB buffer
      });

      if (stderr) {
        console.warn('Python parser stderr:', stderr);
      }

      const parsedData = JSON.parse(stdout);

      // Clean up tmp file
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);

      return NextResponse.json({
        success: true,
        message: `Đã đọc thành công bảng Locus từ file ${file.name}`,
        data: parsedData,
      });
    } catch (parseErr: any) {
      console.error('Python parse error:', parseErr);
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);

      return NextResponse.json(
        {
          success: false,
          error: `Không thể phân tích dữ liệu tự động từ file ${file.name}. Chi tiết: ${parseErr.message || 'Lỗi đọc file'}`,
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Parse file error:', error);
    return NextResponse.json({ error: 'Lỗi xử lý file tải lên' }, { status: 500 });
  }
}
