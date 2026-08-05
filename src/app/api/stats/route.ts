import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
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

    const userRole = (session.user as { role?: string; id?: string })?.role;
    const userName = session.user?.name;
    const userId = (session.user as { role?: string; id?: string })?.id;

    let allowedCategories: string[] = ['cell', 'thinprep', 'hpv40', 'hpv20'];

    // Filter stats for Doctor or Staff role
    const filter: Record<string, unknown> = {};
    if (userRole === 'doctor' && userName) {
      filter.bacSiDoc = userName;

      // Get doctor's allowed categories from DB
      const docUser = await User.findOne({ fullName: userName }).lean();
      if (docUser && docUser.allowedCategories && docUser.allowedCategories.length > 0) {
        allowedCategories = docUser.allowedCategories;
      }
    } else if (userRole === 'staff' && userId) {
      filter.nguoiNhap = userId;

      // Get staff's allowed categories from DB
      const staffUser = await User.findById(userId).lean();
      if (staffUser && staffUser.allowedCategories && staffUser.allowedCategories.length > 0) {
        allowedCategories = staffUser.allowedCategories;
      }
    }

    const totalCount = await TestResult.countDocuments(filter);

    // Stats by category
    const cellCount = await TestResult.countDocuments({ ...filter, loaiXetNghiem: 'cell' });
    const thinprepCount = await TestResult.countDocuments({ ...filter, loaiXetNghiem: 'thinprep' });
    const hpv40Count = await TestResult.countDocuments({ ...filter, loaiXetNghiem: 'hpv40' });
    const hpv20Count = await TestResult.countDocuments({ ...filter, loaiXetNghiem: 'hpv20' });
    const soituoiCount = await TestResult.countDocuments({ ...filter, loaiXetNghiem: 'soituoi' });

    // Stats by status
    const nhapThongTinCount = await TestResult.countDocuments({ ...filter, trangThai: 'nhap_thong_tin' });
    const chayKetQuaCount = await TestResult.countDocuments({ ...filter, trangThai: 'chay_ket_qua' });
    const daTraKetQuaCount = await TestResult.countDocuments({ ...filter, trangThai: 'da_tra_ket_qua' });

    // Stats by doctor
    let matchStage: any[] = [];
    if (userRole === 'doctor' && userName) {
      matchStage = [{ $match: { bacSiDoc: userName } }];
    } else if (userRole === 'staff' && userId) {
      matchStage = [{ $match: { nguoiNhap: new mongoose.Types.ObjectId(userId) } }];
    }
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
        soituoi: soituoiCount,
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
