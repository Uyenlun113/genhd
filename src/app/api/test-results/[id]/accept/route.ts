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

    const testResult = await TestResult.findById(id).lean();

    const userName = session.user?.name || 'Bác sĩ';
    const now = new Date();
    const duKienTra = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // Exactly +3 days (72 hours)

    const body = await request.json().catch(() => ({}));
    const { bacSiDoc, bacSiDoc2 } = body;

    const updateFields: any = {
      trangThai: 'chay_ket_qua',
      bacSiXuLy: userId,
      ngayNhanMau: testResult?.ngayNhanMau || now,
      ngayDuKienTra: duKienTra,
      $push: {
        lichSuChinhSua: {
          nguoiSua: userName,
          thoiGian: now,
          noiDung: bacSiDoc2
            ? `Nhận mẫu & phân công bác sĩ: P1 (${bacSiDoc}), P2 (${bacSiDoc2})`
            : bacSiDoc
            ? `Nhận mẫu & phân công bác sĩ đọc kết quả: ${bacSiDoc}`
            : 'Nhận mẫu & tiếp nhận phiếu xét nghiệm',
        },
      },
    };

    if (bacSiDoc) {
      updateFields.bacSiDoc = bacSiDoc;
    }
    if (bacSiDoc2) {
      updateFields.bacSiDoc2 = bacSiDoc2;
    }

    const result = await TestResult.findByIdAndUpdate(
      id,
      updateFields,
      { new: true }
    ).lean();

    if (!result) {
      return NextResponse.json({ error: 'Không tìm thấy phiếu' }, { status: 404 });
    }

    // Send notifications to doctor and all admin users
    try {
      const targetUserIds = new Set<string>();

      // Admin users always get notified
      const adminUsers = await User.find({ role: 'admin' });
      adminUsers.forEach((u) => targetUserIds.add(u._id.toString()));

      // Assigned doctor
      if (result.bacSiDoc && result.bacSiDoc !== 'Chưa phân loại') {
        const doctorUser = await User.findOne({
          fullName: { $regex: result.bacSiDoc.trim(), $options: 'i' },
        });
        if (doctorUser) {
          targetUserIds.add(doctorUser._id.toString());
        }
      }

      for (const tId of targetUserIds) {
        await Notification.create({
          userId: tId,
          testResultId: result._id,
          title: `Đã nhận mẫu & phân công: ${result.maSo}`,
          message: `${userName} đã nhận mẫu phiếu ${result.maSo} (${result.hoTen}). Bác sĩ đọc: ${result.bacSiDoc || 'Chưa phân loại'}`,
        });
      }
    } catch (notifErr) {
      console.error('Create accept notifications error:', notifErr);
    }

    broadcastEvent({ type: 'REFRESH_TEST_RESULTS' });
    broadcastEvent({ type: 'REFRESH_NOTIFICATIONS' });

    return NextResponse.json(result);
  } catch (error) {
    console.error('POST accept test-result error:', error);
    return NextResponse.json({ error: 'Lỗi xử lý' }, { status: 500 });
  }
}
