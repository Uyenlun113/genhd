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
  role: 'admin' | 'doctor' | 'staff';
  allowedCategories?: Array<'cell' | 'hpv40' | 'hpv20'>;
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
    role: 'doctor' as 'admin' | 'doctor' | 'staff',
    allowedCategories: ['cell', 'hpv40', 'hpv20'] as string[],
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
      allowedCategories: ['cell', 'hpv40', 'hpv20'],
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
      allowedCategories: user.allowedCategories || ['cell', 'hpv40', 'hpv20'],
    });
    setShowModal(true);
  };

  const handleCategoryToggle = (category: string) => {
    setFormData((prev) => {
      const exists = prev.allowedCategories.includes(category);
      const updated = exists
        ? prev.allowedCategories.filter((c) => c !== category)
        : [...prev.allowedCategories, category];
      return { ...prev, allowedCategories: updated };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editUser ? `/api/users/${editUser._id}` : '/api/users';
      const method = editUser ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editUser ? 'Đã cập nhật tài khoản!' : 'Đã tạo tài khoản mới thành công!');
        setShowModal(false);
        fetchUsers();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Lỗi xử lý tài khoản!');
      }
    } catch {
      toast.error('Lỗi kết nối!');
    }
  };

  const handleDeleteClick = (id: string, name: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Xóa tài khoản người dùng',
      message: `Bạn có chắc chắn muốn xóa tài khoản "${name}"? Hành động này không thể hoàn tác.`,
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
          if (res.ok) {
            toast.success(`Đã xóa tài khoản "${name}" thành công!`);
            fetchUsers();
          } else {
            toast.error('Lỗi xóa tài khoản!');
          }
        } catch {
          toast.error('Lỗi kết nối!');
        }
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <TopHeader />

      <div className="flex flex-1 w-full">
        <Sidebar />

        <main className="flex-1 p-8 w-full">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
                <Users className="w-6 h-6 text-sky-600" />
                <span>Quản Lý Danh Sách Tài Khoản & Phân Quyền</span>
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Tạo tài khoản Bác sĩ, Nhân viên, phân quyền danh mục xét nghiệm và đổi mật khẩu
              </p>
            </div>

            <button onClick={handleOpenAddModal} className="btn btn-primary">
              <UserPlus className="w-4 h-4" />
              <span>Thêm tài khoản mới</span>
            </button>
          </div>

          {/* Users Table */}
          <div className="glass-card overflow-hidden">
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Họ và tên</th>
                    <th>Tên đăng nhập</th>
                    <th>Vai trò</th>
                    <th>Quyền danh mục xét nghiệm</th>
                    <th style={{ textAlign: 'right' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-slate-400 text-sm">
                        Đang tải danh sách tài khoản...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-slate-400 text-sm">
                        Không có tài khoản nào
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user._id}>
                        <td className="font-bold text-slate-800 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                            {user.fullName.charAt(0).toUpperCase()}
                          </div>
                          <span>{user.fullName}</span>
                        </td>
                        <td className="font-mono text-sky-600">{user.username}</td>
                        <td>
                          {user.role === 'admin' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Admin</span>
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

          {/* Create / Edit Modal */}
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
                      disabled={!!editUser}
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
                          role: e.target.value as 'admin' | 'doctor' | 'staff',
                        })
                      }
                    >
                      <option value="doctor">👨‍⚕️ Bác sĩ đọc kết quả</option>
                      <option value="staff">🧑‍💼 Phòng khám / Nhân viên nhập phiếu</option>
                      <option value="admin">🛡️ Quản trị viên (Admin)</option>
                    </select>
                  </div>

                  {/* Allowed Categories Checkboxes for Doctors */}
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
                          <span className="text-xs">🔬 XÉT NGHIỆM CELL</span>
                        </label>
                        <label className="checkbox-item">
                          <input
                            type="checkbox"
                            checked={formData.allowedCategories.includes('hpv40')}
                            onChange={() => handleCategoryToggle('hpv40')}
                          />
                          <span className="text-xs">🧬 XÉT NGHIỆM HPV 40 TYPES</span>
                        </label>
                        <label className="checkbox-item">
                          <input
                            type="checkbox"
                            checked={formData.allowedCategories.includes('hpv20')}
                            onChange={() => handleCategoryToggle('hpv20')}
                          />
                          <span className="text-xs">🧪 XÉT NGHIỆM HPV 20 TYPES</span>
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
