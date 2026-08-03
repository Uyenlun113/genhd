import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TestResult, { generateMaSo } from '@/models/TestResult';
import Notification from '@/models/Notification';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

import { broadcastEvent } from '@/lib/socketServer';

// GET: List test results with doctor & category filter support
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as { role?: string })?.role;
    const userName = session.user?.name;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const doctor = searchParams.get('doctor');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};

    if (status && status !== 'all') {
      query.trangThai = status;
    }

    if (category) {
      query.loaiXetNghiem = category;
    }

    const userId = (session.user as { id?: string })?.id;

    const creator = searchParams.get('creator');

    // Filter by doctor name if provided, or if user is doctor viewing their own menu
    if (creator && userRole === 'admin') {
      query.nguoiNhap = creator;
    }

    if (doctor) {
      query.bacSiDoc = { $regex: doctor, $options: 'i' };
    } else if (userRole === 'doctor' && userName) {
      query.bacSiDoc = { $regex: userName, $options: 'i' };
    } else if (userRole === 'staff' && userId) {
      query.nguoiNhap = userId;
    }

    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(`${startDate}T00:00:00.000Z`);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(`${endDate}T23:59:59.999Z`);
      }
    }

    if (search) {
      query.$or = [
        { hoTen: { $regex: search, $options: 'i' } },
        { maSo: { $regex: search, $options: 'i' } },
        { soDienThoai: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await TestResult.countDocuments(query);
    const results = await TestResult.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-anhTeBao -pdfDaKy')
      .populate('nguoiNhap', 'fullName username')
      .lean();

    return NextResponse.json({
      results,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET test-results error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

// POST: Create new test result and send notification to assigned doctor
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const loaiXetNghiem = body.loaiXetNghiem || 'cell';
    const creatorName = session.user?.name || 'Nhân viên';

    let testResult;
    let attempts = 0;
    const maxAttempts = 5;

    while (!testResult && attempts < maxAttempts) {
      attempts++;
      const maSo = await generateMaSo(loaiXetNghiem);
      try {
        testResult = await TestResult.create({
          ...body,
          maSo,
          loaiXetNghiem,
          trangThai: 'nhap_thong_tin',
          nguoiNhap: (session.user as { id: string }).id,
          lichSuChinhSua: [
            {
              nguoiSua: creatorName,
              thoiGian: new Date(),
              noiDung: 'Tạo mới phiếu xét nghiệm',
            },
          ],
        });
      } catch (err: any) {
        if (err.code === 11000 && attempts < maxAttempts) {
          console.warn(`Duplicate maSo detected on attempt ${attempts}, retrying with next number...`);
          continue;
        }
        throw err;
      }
    }

    if (!testResult) {
      return NextResponse.json({ error: 'Lỗi tạo mã số phiếu' }, { status: 500 });
    }

    // Send notification to doctor if bacSiDoc is specified
    if (body.bacSiDoc) {
      const doctorUser = await User.findOne({
        $or: [
          { fullName: { $regex: body.bacSiDoc, $options: 'i' } },
          { role: 'doctor' },
        ],
      });

      if (doctorUser) {
        await Notification.create({
          userId: doctorUser._id,
          testResultId: testResult._id,
          title: `Phiếu mới: ${testResult.maSo}`,
          message: `${creatorName} đã tạo phiếu mới cho bệnh nhân ${testResult.hoTen}`,
        });
      }
    }

    // Broadcast WebSocket real-time event
    broadcastEvent({ type: 'REFRESH_TEST_RESULTS' });
    broadcastEvent({ type: 'REFRESH_NOTIFICATIONS' });

    return NextResponse.json(testResult, { status: 201 });
  } catch (error) {
    console.error('POST test-results error:', error);
    return NextResponse.json({ error: 'Lỗi tạo phiếu' }, { status: 500 });
  }
}
