'use client';

import React, { useState, useEffect } from 'react';
import TopHeader from '@/components/TopHeader';
import Sidebar from '@/components/Sidebar';
import ConfirmModal from '@/components/ConfirmModal';
import {
  Users,
  UserPlus,
  Trash2,
  Edit,
  ShieldCheck,
  Stethoscope,
  UserCheck,
  X,
  Check,
  Key,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface UserItem {
  _id: string;
  username: string;
  fullName: string;
  role: 'admin' | 'doctor' | 'staff' | 'lab_admin';
  allowedCategories?: Array<'cell' | 'thinprep' | 'hpv40' | 'hpv20'>;
  title?: string;
  createdAt: string;
}

export default function UserManagementPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as { role?: string })?.role;
  const router = useRouter();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<UserItem | null>(null);

  // Modal confirm state
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    role: 'doctor' as 'admin' | 'doctor' | 'staff' | 'lab_admin',
    allowedCategories: ['cell', 'thinprep', 'hpv40', 'hpv20'] as string[],
    title: '(Chuyên khoa Xét nghiệm - Giải phẫu bệnh lý)',
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data || []);
      }
    } catch (err) {
      console.error('Fetch users error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userRole && userRole !== 'admin') {
      toast.error('Chỉ Admin mới có quyền truy cập trang này');
      router.push('/');
      return;
    }
    fetchUsers();
  }, [userRole, router]);

  const handleOpenAddModal = () => {
    setEditUser(null);
    setFormData({
      username: '',
      password: '',
      fullName: '',
      role: 'doctor',
      allowedCategories: ['cell', 'thinprep', 'hpv40', 'hpv20'],
      title: '(Chuyên khoa Xét nghiệm - Giải phẫu bệnh lý)',
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (user: UserItem) => {
    setEditUser(user);
    setFormData({
      username: user.username,
      password: '',
      fullName: user.fullName,
      role: user.role,
      allowedCategories: user.allowedCategories || ['cell', 'thinprep', 'hpv40', 'hpv20'],
      title: user.title || '(Chuyên khoa Xét nghiệm - Giải phẫu bệnh lý)',
    });
    setShowModal(true);
  };

  const handleCategoryToggle = (category: string) => {
    setFormData((prev) => {
      const exists = prev.allowedCategories.includes(category);
      if (exists) {
        return {
          ...prev,
          allowedCategories: prev.allowedCategories.filter((c) => c !== category),
        };
      } else {
        return {
          ...prev,
          allowedCategories: [...prev.allowedCategories, category],
        };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username.trim() || !formData.fullName.trim()) {
      toast.error('Vui lòng điền đầy đủ tên đăng nhập và họ tên');
      return;
    }

    if (!editUser && !formData.password) {
      toast.error('Vui lòng nhập mật khẩu cho tài khoản mới');
      return;
    }

    try {
      const url = editUser ? `/api/users/${editUser._id}` : '/api/users';
      const method = editUser ? 'PUT' : 'POST';

      const payload: any = {
        username: formData.username,
        fullName: formData.fullName,
        role: formData.role,
        allowedCategories: formData.allowedCategories,
        title: formData.title,
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(editUser ? 'Cập nhật tài khoản thành công!' : 'Tạo tài khoản mới thành công!');
        setShowModal(false);
        fetchUsers();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || 'Thao tác thất bại');
      }
    } catch {
      toast.error('Lỗi kết nối cơ sở dữ liệu');
    }
  };

  const handleDeleteClick = (userId: string, userName: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Xác nhận xóa tài khoản',
      message: `Bạn có chắc chắn muốn xóa tài khoản "${userName}"? Thao tác này không thể hoàn tác.`,
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
          if (res.ok) {
            toast.success('Xóa tài khoản thành công');
            fetchUsers();
          } else {
            toast.error('Không thể xóa tài khoản này');
          }
        } catch {
          toast.error('Lỗi khi gửi yêu cầu xóa');
        }
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <TopHeader />

      <div className="flex flex-1 w-full">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 w-full">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-6 h-6 text-sky-600" />
                <span>Quản lý Tài Khoản & Phân Quyền</span>
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Tạo mới, phân quyền danh mục xét nghiệm và quản lý tài khoản Bác sĩ / Nhân viên
              </p>
            </div>

            <button onClick={handleOpenAddModal} className="btn btn-primary text-xs">
              <UserPlus className="w-4 h-4" />
              <span>Thêm tài khoản mới</span>
            </button>
          </div>

          <div className="glass-card">
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tên đăng nhập</th>
                    <th>Họ và tên</th>
                    <th>Vai trò</th>
                    <th>Danh mục được phân quyền</th>
                    <th style={{ textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-400 text-sm">
                        Đang tải danh sách tài khoản...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-400 text-sm">
                        Chưa có tài khoản nào
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user._id}>
                        <td className="font-semibold text-slate-800 text-xs">{user.username}</td>
                        <td className="font-bold text-sky-900 text-xs">{user.fullName}</td>
                        <td>
                          {user.role === 'admin' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Admin Hệ Thống</span>
                            </span>
                          ) : user.role === 'lab_admin' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Admin Phòng Lab</span>
                            </span>
                          ) : user.role === 'doctor' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                              <Stethoscope className="w-3.5 h-3.5" />
                              <span>Bác sĩ</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Phòng khám / Nhân viên</span>
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="flex flex-wrap gap-1 text-[11px]">
                            {(!user.allowedCategories || user.allowedCategories.length === 0) ? (
                              <span className="text-slate-400">Tất cả</span>
                            ) : (
                              user.allowedCategories.map((cat) => (
                                <span
                                  key={cat}
                                  className={`px-2 py-0.5 rounded-md font-bold uppercase ${
                                    cat === 'cell'
                                      ? 'bg-sky-100 text-sky-700'
                                      : cat === 'thinprep'
                                      ? 'bg-purple-100 text-purple-700'
                                      : cat === 'hpv40'
                                      ? 'bg-indigo-100 text-indigo-700'
                                      : 'bg-teal-100 text-teal-700'
                                  }`}
                                >
                                  {cat}
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="flex gap-2 justify-end items-center">
                            <button
                              onClick={() => handleOpenEditModal(user)}
                              className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-md transition-colors"
                              title="Chỉnh sửa / Đổi mật khẩu & Phân quyền"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(user._id, user.fullName)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="Xóa tài khoản"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {showModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-200">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    <Key className="w-5 h-5 text-sky-600" />
                    <span>{editUser ? 'Sửa tài khoản & Phân quyền' : 'Thêm tài khoản mới'}</span>
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="form-group">
                    <label>Tên đăng nhập *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="bacsi_duong"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Họ và tên *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="TS. BS. Nguyễn Khánh Dương"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Vai trò hệ thống *</label>
                    <select
                      className="form-select"
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          role: e.target.value as 'admin' | 'doctor' | 'staff' | 'lab_admin',
                        })
                      }
                    >
                      <option value="doctor">Bác sĩ đọc kết quả</option>
                      <option value="staff">Phòng khám / Nhân viên nhập phiếu</option>
                      <option value="lab_admin">Admin Phòng Lab (Xem tất cả phiếu các Bác sĩ)</option>
                      <option value="admin">Quản trị viên (Admin Hệ Thống)</option>
                    </select>
                  </div>

                  {formData.role === 'doctor' && (
                    <div className="form-group">
                      <label className="font-bold text-sky-800 text-xs">Chức danh / Chuyên khoa (Hiển thị dưới chữ ký PDF)</label>
                      <input
                        type="text"
                        className="form-input text-xs"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="(Chuyên khoa Xét nghiệm - Giải phẫu bệnh lý)"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Ví dụ: (Chuyên khoa Xét nghiệm - Giải phẫu bệnh lý) hoặc (Chuyên khoa Sản phụ khoa)
                      </span>
                    </div>
                  )}

                  {formData.role === 'doctor' && (
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <label className="block text-xs font-bold text-sky-800 uppercase tracking-wider">
                        Phân quyền xem/xử lý danh mục xét nghiệm:
                      </label>
                      <div className="space-y-1.5">
                        <label className="checkbox-item">
                          <input
                            type="checkbox"
                            checked={formData.allowedCategories.includes('cell')}
                            onChange={() => handleCategoryToggle('cell')}
                          />
                          <span className="text-xs">XÉT NGHIỆM CELL</span>
                        </label>
                        <label className="checkbox-item">
                          <input
                            type="checkbox"
                            checked={formData.allowedCategories.includes('thinprep')}
                            onChange={() => handleCategoryToggle('thinprep')}
                          />
                          <span className="text-xs">XÉT NGHIỆM THINPREP</span>
                        </label>
                        <label className="checkbox-item">
                          <input
                            type="checkbox"
                            checked={formData.allowedCategories.includes('hpv40')}
                            onChange={() => handleCategoryToggle('hpv40')}
                          />
                          <span className="text-xs">XÉT NGHIỆM HPV 40 TYPES</span>
                        </label>
                        <label className="checkbox-item">
                          <input
                            type="checkbox"
                            checked={formData.allowedCategories.includes('hpv20')}
                            onChange={() => handleCategoryToggle('hpv20')}
                          />
                          <span className="text-xs">XÉT NGHIỆM HPV 20 TYPES</span>
                        </label>
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label>
                      {editUser ? 'Mật khẩu mới (Để trống nếu không đổi)' : 'Mật khẩu *'}
                    </label>
                    <input
                      type="password"
                      className="form-input"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      required={!editUser}
                    />
                  </div>

                  <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="btn btn-secondary"
                    >
                      Hủy
                    </button>
                    <button type="submit" className="btn btn-primary">
                      <Check className="w-4 h-4" />
                      <span>{editUser ? 'Cập nhật' : 'Tạo mới'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Confirm Delete Modal */}
          <ConfirmModal
            isOpen={confirmConfig.isOpen}
            title={confirmConfig.title}
            message={confirmConfig.message}
            confirmText="Xóa tài khoản"
            type="danger"
            onConfirm={confirmConfig.onConfirm}
            onCancel={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
          />
        </main>
      </div>
    </div>
  );
}
