import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

interface Params {
  params: Promise<{ id: string }>;
}

// PUT: Update user / reset password (Admin only)
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserRole = (session.user as { role?: string })?.role;
    if (currentUserRole !== 'admin') {
      return NextResponse.json({ error: 'Chỉ Admin mới có quyền cập nhật user' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { username, fullName, role, password, allowedCategories, title, active } = body;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    if (username) {
      const existingUser = await User.findOne({ username, _id: { $ne: id } });
      if (existingUser) {
        return NextResponse.json({ error: 'Tên đăng nhập đã tồn tại trên hệ thống!' }, { status: 400 });
      }
      updateData.username = username;
    }
    if (fullName) updateData.fullName = fullName;
    if (role) updateData.role = role;
    if (allowedCategories) updateData.allowedCategories = allowedCategories;
    if (title !== undefined) updateData.title = title;
    if (active !== undefined) updateData.active = active;
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true })
      .select('-password')
      .lean();

    if (!updatedUser) {
      return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 });
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('PUT user error:', error);
    return NextResponse.json({ error: 'Lỗi cập nhật user' }, { status: 500 });
  }
}

// DELETE: Deactivate user (Soft delete - Admin only)
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserRole = (session.user as { role?: string })?.role;
    if (currentUserRole !== 'admin') {
      return NextResponse.json({ error: 'Chỉ Admin mới có quyền thao tác' }, { status: 403 });
    }

    const { id } = await params;
    const deactivatedUser = await User.findByIdAndUpdate(id, { active: false }, { new: true });

    if (!deactivatedUser) {
      return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Đã ngừng hoạt động tài khoản thành công' });
  } catch (error) {
    console.error('DELETE user error:', error);
    return NextResponse.json({ error: 'Lỗi xóa user' }, { status: 500 });
  }
}
