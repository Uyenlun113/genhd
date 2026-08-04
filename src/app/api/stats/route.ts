import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TestResult from '@/models/TestResult';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as { role?: string })?.role;
    const userName = session.user?.name;

    let allowedCategories: string[] = ['cell', 'thinprep', 'hpv40', 'hpv20'];

    // Filter stats for Doctor role
    const filter: Record<string, unknown> = {};
    if (userRole === 'doctor' && userName) {
      filter.bacSiDoc = userName;

      // Get doctor's allowed categories from DB
      const docUser = await User.findOne({ fullName: userName }).lean();
      if (docUser && docUser.allowedCategories && docUser.allowedCategories.length > 0) {
        allowedCategories = docUser.allowedCategories;
      }
    }

    const totalCount = await TestResult.countDocuments(filter);

    // Stats by category
    const cellCount = await TestResult.countDocuments({ ...filter, loaiXetNghiem: 'cell' });
    const thinprepCount = await TestResult.countDocuments({ ...filter, loaiXetNghiem: 'thinprep' });
    const hpv40Count = await TestResult.countDocuments({ ...filter, loaiXetNghiem: 'hpv40' });
    const hpv20Count = await TestResult.countDocuments({ ...filter, loaiXetNghiem: 'hpv20' });

    // Stats by status
    const nhapThongTinCount = await TestResult.countDocuments({ ...filter, trangThai: 'nhap_thong_tin' });
    const chayKetQuaCount = await TestResult.countDocuments({ ...filter, trangThai: 'chay_ket_qua' });
    const daTraKetQuaCount = await TestResult.countDocuments({ ...filter, trangThai: 'da_tra_ket_qua' });

    // Stats by doctor
    const matchStage = userRole === 'doctor' && userName ? [{ $match: { bacSiDoc: userName } }] : [];
    const doctorStats = await TestResult.aggregate([
      ...matchStage,
      {
        $group: {
          _id: { $ifNull: ['$bacSiDoc', 'Chưa gán'] },
          count: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$trangThai', 'da_tra_ket_qua'] }, 1, 0] },
          },
          processing: {
            $sum: { $cond: [{ $eq: ['$trangThai', 'chay_ket_qua'] }, 1, 0] },
          },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return NextResponse.json({
      totalCount,
      userRole,
      userName,
      allowedCategories,
      byCategory: {
        cell: cellCount,
        thinprep: thinprepCount,
        hpv40: hpv40Count,
        hpv20: hpv20Count,
      },
      byStatus: {
        nhap_thong_tin: nhapThongTinCount,
        chay_ket_qua: chayKetQuaCount,
        da_tra_ket_qua: daTraKetQuaCount,
      },
      byDoctor: doctorStats.map((item) => ({
        doctorName: item._id,
        count: item.count,
        completed: item.completed,
        processing: item.processing,
      })),
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
