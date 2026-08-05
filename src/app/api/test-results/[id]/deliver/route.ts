import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TestResult from '@/models/TestResult';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

import { broadcastEvent } from '@/lib/socketServer';

interface Params {
  params: Promise<{ id: string }>;
}

// POST: Admin Lab delivers (trả) test result -> status 'da_tra_ket_qua'
export async function POST(request: NextRequest, { params }: Params) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any)?.role;
    if (userRole !== 'admin' && userRole !== 'lab_admin') {
      return NextResponse.json({ error: 'Chỉ Admin hoặc Admin Lab mới có quyền trả kết quả' }, { status: 403 });
    }

    const { id } = await params;
    const userName = session.user?.name || 'Admin Lab';

    const body = await request.json().catch(() => ({}));
    const { anhTeBao } = body;

    const updateFields: any = {
      trangThai: 'da_tra_ket_qua',
      ngayTraKetQua: new Date(),
      $push: {
        lichSuChinhSua: {
          nguoiSua: userName,
          thoiGian: new Date(),
          noiDung: 'Admin Lab trả kết quả xét nghiệm',
        },
      },
    };

    if (typeof anhTeBao === 'string') {
      updateFields.anhTeBao = anhTeBao;
    }

    const result = await TestResult.findByIdAndUpdate(
      id,
      updateFields,
      { new: true }
    ).lean();

    if (!result) {
      return NextResponse.json({ error: 'Không tìm thấy phiếu' }, { status: 404 });
    }

    broadcastEvent({ type: 'REFRESH_TEST_RESULTS' });
    broadcastEvent({ type: 'REFRESH_NOTIFICATIONS' });

    return NextResponse.json(result);
  } catch (error) {
    console.error('POST deliver test-result error:', error);
    return NextResponse.json({ error: 'Lỗi trả kết quả' }, { status: 500 });
  }
}
