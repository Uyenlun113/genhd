import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TestResult from '@/models/TestResult';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

import { broadcastEvent } from '@/lib/socketServer';

interface Params {
  params: Promise<{ id: string }>;
}

// POST: Doctor signs (ký) test result — saves results + marks daKy=true
export async function POST(request: NextRequest, { params }: Params) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any)?.role;
    if (userRole !== 'doctor' && userRole !== 'admin') {
      return NextResponse.json({ error: 'Chỉ bác sĩ hoặc admin mới có quyền ký kết quả' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const userName = session.user?.name || 'Bác sĩ';

    // Remove read-only fields
    delete body.maSo;
    delete body.lichSuChinhSua;
    delete body._id;
    delete body.createdAt;
    delete body.updatedAt;

    const updatePayload: any = {
      ...body,
      daKy: true,
      $push: {
        lichSuChinhSua: {
          nguoiSua: userName,
          thoiGian: new Date(),
          noiDung: 'Bác sĩ lưu kết quả và ký xét nghiệm',
        },
      },
    };

    const result = await TestResult.findByIdAndUpdate(id, updatePayload, { new: true }).lean();

    if (!result) {
      return NextResponse.json({ error: 'Không tìm thấy phiếu' }, { status: 404 });
    }

    broadcastEvent({ type: 'REFRESH_TEST_RESULTS' });
    broadcastEvent({ type: 'REFRESH_NOTIFICATIONS' });

    return NextResponse.json(result);
  } catch (error) {
    console.error('POST sign test-result error:', error);
    return NextResponse.json({ error: 'Lỗi ký kết quả' }, { status: 500 });
  }
}
