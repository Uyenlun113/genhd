import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
  try {
    await dbConnect();

    const hashedPassword = await bcrypt.hash('123456', 12);

    // Auto-create BS CK1 PHẠM THẾ HÙNG if missing
    const hungDoc = await User.findOne({ fullName: 'BS CK1 PHẠM THẾ HÙNG' });
    if (!hungDoc) {
      await User.create({
        username: 'bcsihung',
        password: hashedPassword,
        fullName: 'BS CK1 PHẠM THẾ HÙNG',
        role: 'doctor',
        allowedCategories: ['cell', 'hpv40', 'hpv20'],
      });
    }

    // Check if admin user exists
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      await User.create([
        {
          username: 'admin',
          password: hashedPassword,
          fullName: 'Quản trị viên (Admin)',
          role: 'admin',
          allowedCategories: ['cell', 'hpv40', 'hpv20'],
        },
        {
          username: 'nhanvien',
          password: hashedPassword,
          fullName: 'Nhân viên GenHD',
          role: 'staff',
          allowedCategories: ['cell', 'hpv40', 'hpv20'],
        },
        {
          username: 'bacsi',
          password: hashedPassword,
          fullName: 'TS . BS Nguyễn Khánh Dương',
          role: 'doctor',
          allowedCategories: ['cell', 'hpv40', 'hpv20'],
        },
        {
          username: 'bcsidung',
          password: hashedPassword,
          fullName: 'BS. Đoàn Xuân Dũng',
          role: 'doctor',
          allowedCategories: ['hpv20'],
        },
      ]);
    }

    const count = await User.countDocuments();
    return NextResponse.json({ message: 'Đã hoàn tất kiểm tra và seed dữ liệu Bác sĩ', count });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Lỗi tạo dữ liệu' }, { status: 500 });
  }
}
