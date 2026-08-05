import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TestResult from '@/models/TestResult';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

import { broadcastEvent } from '@/lib/socketServer';

interface Params {
  params: Promise<{ id: string }>;
}

// GET: Get single test result
export async function GET(request: NextRequest, { params }: Params) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const result = await TestResult.findById(id).lean();

    if (!result) {
      return NextResponse.json({ error: 'Không tìm thấy phiếu' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET test-result error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

// PUT: Update test result
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Don't allow changing read-only & system fields
    delete body.maSo;
    delete body.lichSuChinhSua;
    delete body._id;
    delete body.createdAt;
    delete body.updatedAt;

    if (body.namSinh !== undefined) {
      const currentYear = new Date().getFullYear();
      const yearNum = Number(body.namSinh);
      if (isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear) {
        return NextResponse.json(
          { error: `Năm sinh không hợp lệ. Vui lòng nhập năm sinh từ 1900 đến ${currentYear}` },
          { status: 400 }
        );
      }
    }

    const editorName = session.user?.name || 'Người dùng';
    let actionDesc = 'Cập nhật thông tin phiếu xét nghiệm';

    if (body.trangThai === 'da_tra_ket_qua') {
      body.ngayTraKetQua = new Date();
      actionDesc = 'Hoàn tất & Trả kết quả xét nghiệm';
    } else if (body.ketLuan || body.hpvHighRiskResult || body.bienDoiViSinh) {
      actionDesc = 'Cập nhật kết quả xét nghiệm chuyên môn';
    }

    const updatePayload: any = {
      ...body,
      $push: {
        lichSuChinhSua: {
          nguoiSua: editorName,
          thoiGian: new Date(),
          noiDung: actionDesc,
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
    console.error('PUT test-result error:', error);
    return NextResponse.json({ error: 'Lỗi cập nhật' }, { status: 500 });
  }
}

// DELETE: Delete test result
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const result = await TestResult.findByIdAndDelete(id);

    if (!result) {
      return NextResponse.json({ error: 'Không tìm thấy phiếu' }, { status: 404 });
    }

    broadcastEvent({ type: 'REFRESH_TEST_RESULTS' });
    broadcastEvent({ type: 'REFRESH_NOTIFICATIONS' });

    return NextResponse.json({ message: 'Đã xóa phiếu thành công' });
  } catch (error) {
    console.error('DELETE test-result error:', error);
    return NextResponse.json({ error: 'Lỗi xóa' }, { status: 500 });
  }
}
