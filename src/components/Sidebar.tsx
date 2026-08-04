'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  PlusCircle,
  Activity,
  Users,
  Dna,
  TestTube,
  BarChart3,
  FlaskConical,
} from 'lucide-react';

function SidebarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get('category') || 'cell';
  const { data: session } = useSession();

  const user = session?.user as { name?: string; role?: string; allowedCategories?: string[] } | undefined;
  const userRole = user?.role;
  const userName = user?.name;
  const allowedCategories = user?.allowedCategories || ['cell', 'thinprep', 'hpv40', 'hpv20'];

  const canSeeCell = userRole === 'admin' || userRole === 'lab_admin' || allowedCategories.includes('cell');
  const canSeeThinPrep = userRole === 'admin' || userRole === 'lab_admin' || allowedCategories.includes('thinprep');
  const canSeeHPV40 = userRole === 'admin' || userRole === 'lab_admin' || allowedCategories.includes('hpv40');
  const canSeeHPV20 = userRole === 'admin' || userRole === 'lab_admin' || allowedCategories.includes('hpv20');

  // Doctor links auto-filter by doctor name if logged in as doctor
  const getCategoryHref = (cat: string) => {
    if (userRole === 'doctor' && userName) {
      return `/?category=${cat}&doctor=${encodeURIComponent(userName)}`;
    }
    return `/?category=${cat}`;
  };

  const navItems = [
    {
      id: 'dashboard',
      label: 'Báo cáo & Thống kê',
      href: '/dashboard',
      icon: BarChart3,
      isActive: pathname === '/dashboard',
      show: true,
      activeColor: 'text-indigo-600 bg-indigo-50/80 font-bold',
      iconActive: 'text-indigo-600',
    },
    {
      id: 'cell',
      label: 'Xét nghiệm Cell',
      href: getCategoryHref('cell'),
      icon: Activity,
      isActive: pathname === '/' && selectedCategory === 'cell',
      show: canSeeCell,
      activeColor: 'text-sky-600 bg-sky-50/80 font-bold',
      iconActive: 'text-sky-600',
    },
    {
      id: 'thinprep',
      label: 'Xét nghiệm ThinPrep',
      href: getCategoryHref('thinprep'),
      icon: FlaskConical,
      isActive: pathname === '/' && selectedCategory === 'thinprep',
      show: canSeeThinPrep,
      activeColor: 'text-purple-600 bg-purple-50/80 font-bold',
      iconActive: 'text-purple-600',
    },
    {
      id: 'hpv40',
      label: 'Xét nghiệm HPV 40',
      href: getCategoryHref('hpv40'),
      icon: Dna,
      isActive: pathname === '/' && selectedCategory === 'hpv40',
      show: canSeeHPV40,
      activeColor: 'text-indigo-600 bg-indigo-50/80 font-bold',
      iconActive: 'text-indigo-600',
    },
    {
      id: 'hpv20',
      label: 'Xét nghiệm HPV 20',
      href: getCategoryHref('hpv20'),
      icon: TestTube,
      isActive: pathname === '/' && selectedCategory === 'hpv20',
      show: canSeeHPV20,
      activeColor: 'text-teal-600 bg-teal-50/80 font-bold',
      iconActive: 'text-teal-600',
    },
  ];

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-slate-200/80 flex flex-col p-4 sticky top-[61px] h-[calc(100vh-61px)] overflow-y-auto select-none">
      {/* MASTER CREATE BUTTON */}
      {(userRole === 'staff' || userRole === 'admin') && (
        <div className="mb-4">
          <Link
            href="/results/new"
            className="flex items-center justify-center gap-2.5 px-4 py-3 text-sm font-bold rounded-xl transition-all bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-sm hover:shadow-md hover:from-sky-500 hover:to-indigo-500 active:scale-[0.98]"
          >
            <PlusCircle className="w-5 h-5 shrink-0" />
            <span>Tạo phiếu mới</span>
          </Link>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          if (!item.show) return null;
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center gap-3.5 px-3.5 py-2.5 text-sm font-semibold rounded-xl transition-colors ${
                item.isActive
                  ? item.activeColor
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 transition-colors ${
                  item.isActive ? item.iconActive : 'text-slate-400'
                }`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Admin Management Link */}
        {userRole === 'admin' && (
          <div className="pt-3 mt-3 border-t border-slate-100">
            <Link
              href="/users"
              className={`flex items-center gap-3.5 px-3.5 py-2.5 text-sm font-semibold rounded-xl transition-colors ${
                pathname === '/users'
                  ? 'text-purple-700 bg-purple-50/80 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Users
                className={`w-5 h-5 shrink-0 ${
                  pathname === '/users' ? 'text-purple-600' : 'text-slate-400'
                }`}
              />
              <span>Quản lý tài khoản</span>
            </Link>
          </div>
        )}
      </nav>
    </aside>
  );
}

export default function Sidebar() {
  return (
    <Suspense
      fallback={
        <aside className="w-64 shrink-0 bg-white border-r border-slate-200 p-4 h-[calc(100vh-61px)]">
          <div className="animate-pulse space-y-2">
            <div className="h-10 bg-slate-100 rounded-xl" />
            <div className="h-10 bg-slate-100 rounded-xl" />
            <div className="h-10 bg-slate-100 rounded-xl" />
            <div className="h-10 bg-slate-100 rounded-xl" />
          </div>
        </aside>
      }
    >
      <SidebarContent />
    </Suspense>
  );
}
