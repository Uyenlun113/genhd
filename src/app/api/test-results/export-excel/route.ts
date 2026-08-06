import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TestResult from '@/models/TestResult';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { generateTestResultsExcelBuffer } from '@/lib/excelExport';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as { role?: string })?.role;
    const userName = session.user?.name;
    const userId = (session.user as { id?: string })?.id;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const doctor = searchParams.get('doctor');
    const creator = searchParams.get('creator');
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};

    if (status && status !== 'all') {
      query.trangThai = status;
    }

    if (category && category !== 'all') {
      query.loaiXetNghiem = category;
    }

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

    const results = await TestResult.find(query)
      .sort({ createdAt: -1 })
      .lean();

    const buffer = await generateTestResultsExcelBuffer(results as any);

    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const filename = `Danh_Sach_Xet_Nghiem_${dateStr}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export Excel Error:', error);
    return NextResponse.json({ error: 'Lỗi xuất file Excel' }, { status: 500 });
  }
}
