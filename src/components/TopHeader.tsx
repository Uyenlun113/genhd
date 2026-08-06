'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import {
  Bell,
  UserCheck,
  Stethoscope,
  ShieldCheck,
  LogOut,
  Users,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import Image from 'next/image';
import logoImg from '../../public/logo.png';

interface NotificationItem {
  _id: string;
  testResultId?: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

import { useWebSocket } from '@/hooks/useWebSocket';
import ConfirmModal from '@/components/ConfirmModal';

export default function TopHeader() {
  const { data: session } = useSession();
  const userRole = (session?.user as { role?: string })?.role;
  const userName = session?.user?.name || session?.user?.email || 'User';

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showBellMenu, setShowBellMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Fetch notifications error:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Listen to WebSocket events instantly
  useWebSocket((event) => {
    if (event.type === 'REFRESH_NOTIFICATIONS') {
      fetchNotifications();
    }
  });

  const handleMarkSingleRead = async (id: string, isRead: boolean) => {
    if (!isRead) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) =>
        prev.map((item) => (item._id === id ? { ...item, isRead: true } : item))
      );
      try {
        await fetch('/api/notifications', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationId: id }),
        });
      } catch (err) {
        console.error('Mark single read error:', err);
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowBellMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="w-full bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shadow-xs sticky top-0 z-40">
      {/* Left: Brand Logo & App Name */}
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2.5 group">
          <Image
            src={logoImg}
            alt="Logo GEN HD"
            width={40}
            height={40}
            style={{ objectFit: 'contain' }}
            className="group-hover:scale-105 transition-transform"
          />
          <div>
            <h1 className="text-lg font-extrabold text-sky-600 tracking-tight leading-none">
              GEN HD
            </h1>
            <p className="text-[11px] text-slate-500 font-semibold tracking-wide">
              GIẢI PHÁP DI TRUYỀN Y HỌC
            </p>
          </div>
        </Link>
      </div>

      {/* Right: Actions (Notification Bell, Admin Link, User Profile) */}
      <div className="flex items-center gap-3">
        {/* Notification Bell Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowBellMenu(!showBellMenu)}
            className="relative p-2 text-slate-600 hover:text-sky-600 hover:bg-slate-100 rounded-full transition-colors"
            title="Thông báo"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Bell Dropdown Modal */}
          {showBellMenu && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
              <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Thông Báo Mới ({unreadCount})
                </h3>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-sky-600 hover:underline font-semibold flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Đọc tất cả</span>
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    Không có thông báo nào
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item._id}
                      onClick={() => handleMarkSingleRead(item._id, item.isRead)}
                      className={`p-3.5 text-xs transition-colors cursor-pointer hover:bg-slate-50 ${
                        !item.isRead ? 'bg-sky-50/60 font-medium' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between text-slate-800 font-bold mb-1">
                        <span>{item.title}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {new Date(item.createdAt).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-slate-600 mb-2">{item.message}</p>
                      {item.testResultId && (
                        <Link
                          href={`/results/${item.testResultId}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkSingleRead(item._id, item.isRead);
                            setShowBellMenu(false);
                          }}
                          className="inline-flex items-center gap-1 text-sky-600 hover:underline font-semibold"
                        >
                          <span>Xem phiếu</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Admin Link if role is Admin */}
        {userRole === 'admin' && (
          <Link
            href="/users"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors"
          >
            <Users className="w-4 h-4" />
            <span>Quản Lý User</span>
          </Link>
        )}

        {/* User Info Badge */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
            {userRole === 'admin' ? (
              <ShieldCheck className="w-4 h-4 text-purple-600" />
            ) : userRole === 'doctor' ? (
              <Stethoscope className="w-4 h-4 text-sky-600" />
            ) : (
              <UserCheck className="w-4 h-4 text-emerald-600" />
            )}
          </div>

          <div className="hidden md:block">
            <div className="text-xs font-bold text-slate-800 leading-tight">{userName}</div>
            <div className="text-[11px] text-slate-500 font-medium capitalize">
              {userRole === 'admin' ? 'Quản trị viên' : userRole === 'doctor' ? 'Bác sĩ' : 'Nhân viên'}
            </div>
          </div>

          <button
            onClick={() => setShowLogoutModal(true)}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1"
            title="Đăng xuất"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modal xác nhận đăng xuất */}
      <ConfirmModal
        isOpen={showLogoutModal}
        title="Đăng xuất khỏi hệ thống"
        message="Bạn có chắc chắn muốn đăng xuất tài khoản khỏi hệ thống GenHD?"
        confirmText="Đăng xuất"
        cancelText="Hủy bỏ"
        type="danger"
        onConfirm={() => signOut({ callbackUrl: '/login' })}
        onCancel={() => setShowLogoutModal(false)}
      />
    </header>
  );
}
