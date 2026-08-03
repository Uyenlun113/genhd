import { NextRequest, NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { fileData, folder, resourceType } = body;

    if (!fileData) {
      return NextResponse.json({ error: 'Không tìm thấy dữ liệu file' }, { status: 400 });
    }

    const fileUrl = await uploadToCloudinary(fileData, folder || 'genhd_results', resourceType || 'auto');

    return NextResponse.json({ url: fileUrl });
  } catch (error) {
    console.error('POST upload API error:', error);
    return NextResponse.json({ error: 'Lỗi tải file lên Cloudinary' }, { status: 500 });
  }
}
