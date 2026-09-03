import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TestResult from '@/models/TestResult';
import User from '@/models/User';
import Notification from '@/models/Notification';
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
    if (userRole !== 'doctor' && userRole !== 'admin' && userRole !== 'lab_admin') {
      return NextResponse.json({ error: 'Chỉ Bác sĩ, Admin Lab hoặc Admin mới có quyền ký kết quả' }, { status: 403 });
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

    const part = body.part || 1;
    delete body.part;

    const existing = await TestResult.findById(id).lean();
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy phiếu' }, { status: 404 });
    }

    const daKy = part === 1
      ? (body.daKy !== undefined ? body.daKy : true)
      : (body.daKy !== undefined ? body.daKy : (existing.daKy || false));

    const daKy2 = part === 2
      ? (body.daKy2 !== undefined ? body.daKy2 : true)
      : (body.daKy2 !== undefined ? body.daKy2 : (existing.daKy2 || false));

    const updatePayload: any = {
      ...body,
      daKy,
      daKy2,
      $push: {
        lichSuChinhSua: {
          nguoiSua: userName,
          thoiGian: new Date(),
          noiDung: `Bác sĩ ${userName} cập nhật chữ ký phần ${part}`,
        },
      },
    };

    const result = await TestResult.findByIdAndUpdate(id, updatePayload, { new: true }).lean();

    if (!result) {
      return NextResponse.json({ error: 'Không tìm thấy phiếu' }, { status: 404 });
    }

    // Notify admin & lab_admin users that doctor signed
    try {
      const adminsAndLabAdmins = await User.find({ role: { $in: ['admin', 'lab_admin'] } });
      for (const targetUser of adminsAndLabAdmins) {
        await Notification.create({
          userId: targetUser._id,
          testResultId: result._id,
          title: `Bác sĩ đã đọc & ký: ${result.maSo}`,
          message: `${userName} đã đọc và ký kết quả phiếu ${result.maSo} (${result.hoTen}). Vui lòng tải ảnh & trả kết quả.`,
        });
      }
    } catch (notifErr) {
      console.error('Create sign notifications error:', notifErr);
    }

    broadcastEvent({ type: 'REFRESH_TEST_RESULTS' });
    broadcastEvent({ type: 'REFRESH_NOTIFICATIONS' });

    return NextResponse.json(result);
  } catch (error) {
    console.error('POST sign test-result error:', error);
    return NextResponse.json({ error: 'Lỗi ký kết quả' }, { status: 500 });
  }
}
