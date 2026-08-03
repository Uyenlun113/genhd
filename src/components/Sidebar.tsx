'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  FileText,
  PlusCircle,
  ChevronDown,
  ChevronRight,
  Activity,
  Users,
  Dna,
  TestTube,
  BarChart3,
} from 'lucide-react';

function SidebarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get('category') || 'cell';
  const { data: session } = useSession();

  const [openCell, setOpenCell] = useState(true);
  const [openHPV40, setOpenHPV40] = useState(true);
  const [openHPV20, setOpenHPV20] = useState(true);

  const user = session?.user as { name?: string; role?: string; allowedCategories?: string[] } | undefined;
  const userRole = user?.role;
  const userName = user?.name;
  const allowedCategories = user?.allowedCategories || ['cell', 'hpv40', 'hpv20'];

  const canSeeCell = userRole === 'admin' || userRole === 'staff' || allowedCategories.includes('cell');
  const canSeeHPV40 = userRole === 'admin' || userRole === 'staff' || allowedCategories.includes('hpv40');
  const canSeeHPV20 = userRole === 'admin' || userRole === 'staff' || allowedCategories.includes('hpv20');

  // Doctor links auto-filter by doctor name if logged in as doctor
  const getCategoryHref = (cat: string) => {
    if (userRole === 'doctor' && userName) {
      return `/?category=${cat}&doctor=${encodeURIComponent(userName)}`;
    }
    return `/?category=${cat}`;
  };

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-slate-200 flex flex-col p-4 sticky top-[61px] h-[calc(100vh-61px)] overflow-y-auto select-none">
      {/* Navigation Modules */}
      <nav className="flex-1 space-y-3">
        {/* Module 0: BÁO CÁO THỐNG KÊ */}
        <Link
          href="/dashboard"
          className={`flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all ${
            pathname === '/dashboard'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-slate-100/80 text-slate-700 hover:bg-slate-200/80'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>BÁO CÁO & THỐNG KÊ</span>
        </Link>
        {canSeeCell && (
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 overflow-hidden">
            <button
              onClick={() => setOpenCell(!openCell)}
              className="w-full flex items-center justify-between px-3.5 py-3 text-xs font-extrabold text-slate-700 uppercase tracking-wider hover:bg-slate-100/80 transition-colors"
            >
              <div className="flex items-center gap-2 text-sky-600">
                <Activity className="w-4 h-4" />
                <span className="truncate">XÉT NGHIỆM CELL</span>
              </div>
              {openCell ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {openCell && (
              <div className="px-2 pb-2.5 space-y-1 mt-1">
                <Link
                  href={getCategoryHref('cell')}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                    pathname === '/' && selectedCategory === 'cell'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{userRole === 'doctor' ? 'Phiếu CELL của tôi' : 'Tất cả phiếu CELL'}</span>
                </Link>

                {(userRole === 'staff' || userRole === 'admin') && (
                  <Link
                    href="/results/new?type=cell"
                    className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                      pathname === '/results/new' && searchParams.get('type') === 'cell'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                    }`}
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Tạo phiếu CELL mới</span>
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {/* Module 2: XÉT NGHIỆM HPV 40 TYPES */}
        {canSeeHPV40 && (
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 overflow-hidden">
            <button
              onClick={() => setOpenHPV40(!openHPV40)}
              className="w-full flex items-center justify-between px-3.5 py-3 text-xs font-extrabold text-slate-700 uppercase tracking-wider hover:bg-slate-100/80 transition-colors"
            >
              <div className="flex items-center gap-2 text-indigo-600">
                <Dna className="w-4 h-4" />
                <span className="truncate">XÉT NGHIỆM HPV 40</span>
              </div>
              {openHPV40 ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {openHPV40 && (
              <div className="px-2 pb-2.5 space-y-1 mt-1">
                <Link
                  href={getCategoryHref('hpv40')}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                    pathname === '/' && selectedCategory === 'hpv40'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{userRole === 'doctor' ? 'Phiếu HPV 40 của tôi' : 'Tất cả phiếu HPV 40'}</span>
                </Link>

                {(userRole === 'staff' || userRole === 'admin') && (
                  <Link
                    href="/results/new?type=hpv40"
                    className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                      pathname === '/results/new' && searchParams.get('type') === 'hpv40'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                    }`}
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Tạo phiếu HPV 40 mới</span>
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {/* Module 3: XÉT NGHIỆM HPV 20 TYPES */}
        {canSeeHPV20 && (
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 overflow-hidden">
            <button
              onClick={() => setOpenHPV20(!openHPV20)}
              className="w-full flex items-center justify-between px-3.5 py-3 text-xs font-extrabold text-slate-700 uppercase tracking-wider hover:bg-slate-100/80 transition-colors"
            >
              <div className="flex items-center gap-2 text-teal-600">
                <TestTube className="w-4 h-4" />
                <span className="truncate">XÉT NGHIỆM HPV 20</span>
              </div>
              {openHPV20 ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {openHPV20 && (
              <div className="px-2 pb-2.5 space-y-1 mt-1">
                <Link
                  href={getCategoryHref('hpv20')}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                    pathname === '/' && selectedCategory === 'hpv20'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{userRole === 'doctor' ? 'Phiếu HPV 20 của tôi' : 'Tất cả phiếu HPV 20'}</span>
                </Link>

                {(userRole === 'staff' || userRole === 'admin') && (
                  <Link
                    href="/results/new?type=hpv20"
                    className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                      pathname === '/results/new' && searchParams.get('type') === 'hpv20'
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
                    }`}
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Tạo phiếu HPV 20 mới</span>
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {/* Admin Navigation */}
        {userRole === 'admin' && (
          <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-2 space-y-1 mt-4">
            <div className="px-2 py-1 text-[10px] font-extrabold text-purple-600 uppercase tracking-wider">
              Quản Trị Hệ Thống
            </div>
            <Link
              href="/users"
              className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                pathname === '/users'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-purple-900 hover:bg-purple-100/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Quản lý Tài Khoản & Phân Quyền</span>
            </Link>
          </div>
        )}
      </nav>
    </aside>
  );
}

export default function Sidebar() {
  return (
    <Suspense fallback={<aside className="w-64 bg-white border-r border-slate-200 p-4 sticky top-[61px] h-[calc(100vh-61px)]" />}>
      <SidebarContent />
    </Suspense>
  );
}
