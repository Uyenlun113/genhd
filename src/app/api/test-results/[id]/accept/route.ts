import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TestResult from '@/models/TestResult';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

import { broadcastEvent } from '@/lib/socketServer';

interface Params {
  params: Promise<{ id: string }>;
}

// POST: Doctor accepts test result -> status 'chay_ket_qua'
export async function POST(request: NextRequest, { params }: Params) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const userId = (session.user as { id: string }).id;

    const userName = session.user?.name || 'Bác sĩ';
    const now = new Date();
    const duKienTra = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // Exactly +3 days (72 hours)

    const result = await TestResult.findByIdAndUpdate(
      id,
      {
        trangThai: 'chay_ket_qua',
        bacSiXuLy: userId,
        ngayNhanMau: now,
        ngayDuKienTra: duKienTra,
        $push: {
          lichSuChinhSua: {
            nguoiSua: userName,
            thoiGian: now,
            noiDung: 'Bác sĩ nhận mẫu & tiếp nhận phiếu xét nghiệm',
          },
        },
      },
      { new: true }
    ).lean();

    if (!result) {
      return NextResponse.json({ error: 'Không tìm thấy phiếu' }, { status: 404 });
    }

    broadcastEvent({ type: 'REFRESH_TEST_RESULTS' });
    broadcastEvent({ type: 'REFRESH_NOTIFICATIONS' });

    return NextResponse.json(result);
  } catch (error) {
    console.error('POST accept test-result error:', error);
    return NextResponse.json({ error: 'Lỗi xử lý' }, { status: 500 });
  }
}
