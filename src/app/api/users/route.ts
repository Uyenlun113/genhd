import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET: List users (Doctors list accessible by logged in users, Full list for Admin)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get('role');
    const categoryFilter = searchParams.get('category');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};
    if (roleFilter) {
      query.role = roleFilter;
    }
    if (categoryFilter) {
      query.allowedCategories = categoryFilter;
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ role: 1, fullName: 1 })
      .lean();

    return NextResponse.json(users);
  } catch (error) {
    console.error('GET users error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

// POST: Admin creates new user
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserRole = (session.user as { role?: string })?.role;
    if (currentUserRole !== 'admin') {
      return NextResponse.json({ error: 'Chỉ Admin mới có quyền tạo tài khoản' }, { status: 403 });
    }

    const body = await request.json();
    const { username, password, fullName, role, allowedCategories, title } = body;

    if (!username || !password || !fullName || !role) {
      return NextResponse.json({ error: 'Vui lòng nhập đầy đủ thông tin' }, { status: 400 });
    }

    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ error: 'Tên đăng nhập đã tồn tại' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await User.create({
      username: username.toLowerCase(),
      password: hashedPassword,
      fullName,
      role,
      allowedCategories: allowedCategories || ['cell', 'thinprep', 'hpv40', 'hpv20', 'hpv23'],
      title: title || '(Chuyên khoa Xét nghiệm - Giải phẫu bệnh lý)',
    });

    return NextResponse.json(
      {
        _id: newUser._id,
        username: newUser.username,
        fullName: newUser.fullName,
        role: newUser.role,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST user error:', error);
    return NextResponse.json({ error: 'Lỗi tạo tài khoản' }, { status: 500 });
  }
}
