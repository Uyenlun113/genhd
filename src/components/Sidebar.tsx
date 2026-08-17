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
  FileText,
  Flame,
} from 'lucide-react';
import Image from 'next/image';
import logoGenetrust from '../../public/Logo_Genetrust.png';
import { useSidebar } from '@/context/SidebarContext';

function getInitials(name?: string) {
  if (!name) return 'QV';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function SidebarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get('category') || 'cell';
  const { data: session } = useSession();
  const { isCollapsed } = useSidebar();

  const user = session?.user as { name?: string; role?: string; allowedCategories?: string[] } | undefined;
  const userRole = user?.role;
  const userName = user?.name;
  const allowedCategories = user?.allowedCategories || [];
  const isAdmin = userRole === 'admin' || userRole === 'lab_admin';

  const displayName = userRole === 'admin' ? 'Quản trị viên' : (userName || 'Bác sĩ');
  const displayRole = userRole === 'admin' ? 'Admin' : (userRole === 'doctor' ? 'Bác sĩ' : userRole === 'lab_admin' ? 'Admin Lab' : userRole === 'lab_adn' ? 'Admin Lab ADN' : 'Nhân viên');
  const userInitials = userRole === 'admin' ? 'QV' : getInitials(userName);

  const canSeeCell = isAdmin || allowedCategories.includes('cell');
  const canSeeThinPrep = isAdmin || allowedCategories.includes('thinprep');
  const canSeeHPV40 = isAdmin || allowedCategories.includes('hpv40');
  const canSeeHPV20 = isAdmin || allowedCategories.includes('hpv20');
  const canSeeHPV23 = isAdmin || allowedCategories.includes('hpv23');
  const canSeeSoiTuoi = isAdmin || allowedCategories.includes('soituoi');
  const canSeeGiaiPhauBenh = isAdmin || allowedCategories.includes('giaiphaubenh');
  const canSeeAdnConvert = userRole === 'admin' || userRole === 'lab_adn' || allowedCategories.includes('adn');

  const canSeeComboHpv20Cell = isAdmin || canSeeHPV20 || canSeeCell;
  const canSeeComboHpv40Cell = isAdmin || canSeeHPV40 || canSeeCell;
  const canSeeComboHpv20Thinprep = isAdmin || canSeeHPV20 || canSeeThinPrep;
  const canSeeComboHpv40Thinprep = isAdmin || canSeeHPV40 || canSeeThinPrep;

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
      activeColor: 'text-[#0284c7] bg-sky-50/90 font-bold',
      iconActive: 'text-[#0284c7]',
    },
    {
      id: 'cell',
      label: 'Xét nghiệm Cell',
      href: getCategoryHref('cell'),
      icon: Activity,
      isActive: pathname === '/' && selectedCategory === 'cell',
      show: canSeeCell,
      activeColor: 'text-[#0284c7] bg-sky-50/90 font-bold',
      iconActive: 'text-[#0284c7]',
    },
    {
      id: 'thinprep',
      label: 'Xét nghiệm ThinPrep',
      href: getCategoryHref('thinprep'),
      icon: FlaskConical,
      isActive: pathname === '/' && selectedCategory === 'thinprep',
      show: canSeeThinPrep,
      activeColor: 'text-purple-600 bg-purple-50/90 font-bold',
      iconActive: 'text-purple-600',
    },
    {
      id: 'hpv40',
      label: 'Xét nghiệm HPV 40',
      href: getCategoryHref('hpv40'),
      icon: TestTube,
      isActive: pathname === '/' && selectedCategory === 'hpv40',
      show: canSeeHPV40,
      activeColor: 'text-indigo-600 bg-indigo-50/90 font-bold',
      iconActive: 'text-indigo-600',
    },
    {
      id: 'hpv20',
      label: 'Xét nghiệm HPV 20',
      href: getCategoryHref('hpv20'),
      icon: TestTube,
      isActive: pathname === '/' && selectedCategory === 'hpv20',
      show: canSeeHPV20,
      activeColor: 'text-teal-600 bg-teal-50/90 font-bold',
      iconActive: 'text-teal-600',
    },
    {
      id: 'hpv23',
      label: 'Xét nghiệm HPV 23',
      href: getCategoryHref('hpv23'),
      icon: TestTube,
      isActive: pathname === '/' && selectedCategory === 'hpv23',
      show: canSeeHPV23,
      activeColor: 'text-cyan-600 bg-cyan-50/90 font-bold',
      iconActive: 'text-cyan-600',
    },
    {
      id: 'soituoi',
      label: 'Xét nghiệm Soi tươi',
      href: getCategoryHref('soituoi'),
      icon: Activity,
      isActive: pathname === '/' && selectedCategory === 'soituoi',
      show: canSeeSoiTuoi,
      activeColor: 'text-emerald-600 bg-emerald-50/90 font-bold',
      iconActive: 'text-emerald-600',
    },
    {
      id: 'giaiphaubenh',
      label: 'Giải Phẫu Bệnh',
      href: getCategoryHref('giaiphaubenh'),
      icon: FileText,
      isActive: pathname === '/' && selectedCategory === 'giaiphaubenh',
      show: canSeeGiaiPhauBenh,
      activeColor: 'text-amber-600 bg-amber-50/90 font-bold',
      iconActive: 'text-amber-600',
    },
    {
      id: 'combo_hpv20_cell',
      label: 'Combo: HPV 20 + Cell',
      href: getCategoryHref('combo_hpv20_cell'),
      icon: Flame,
      isActive: pathname === '/' && selectedCategory === 'combo_hpv20_cell',
      show: canSeeComboHpv20Cell,
      activeColor: 'text-orange-600 bg-orange-50/90 font-bold',
      iconActive: 'text-orange-600',
    },
    {
      id: 'combo_hpv40_cell',
      label: 'Combo: HPV 40 + Cell',
      href: getCategoryHref('combo_hpv40_cell'),
      icon: Flame,
      isActive: pathname === '/' && selectedCategory === 'combo_hpv40_cell',
      show: canSeeComboHpv40Cell,
      activeColor: 'text-rose-600 bg-rose-50/90 font-bold',
      iconActive: 'text-rose-600',
    },
    {
      id: 'combo_hpv20_thinprep',
      label: 'Combo: HPV 20 + ThinPrep',
      href: getCategoryHref('combo_hpv20_thinprep'),
      icon: Flame,
      isActive: pathname === '/' && selectedCategory === 'combo_hpv20_thinprep',
      show: canSeeComboHpv20Thinprep,
      activeColor: 'text-purple-600 bg-purple-50/90 font-bold',
      iconActive: 'text-purple-600',
    },
    {
      id: 'combo_hpv40_thinprep',
      label: 'Combo: HPV 40 + ThinPrep',
      href: getCategoryHref('combo_hpv40_thinprep'),
      icon: Flame,
      isActive: pathname === '/' && selectedCategory === 'combo_hpv40_thinprep',
      show: canSeeComboHpv40Thinprep,
      activeColor: 'text-red-600 bg-red-50/90 font-bold',
      iconActive: 'text-red-600',
    },
    {
      id: 'adn-convert',
      label: 'Xét Nghiệm ADN',
      href: '/adn-convert',
      icon: Dna,
      isActive: pathname === '/adn-convert',
      show: canSeeAdnConvert,
      activeColor: 'text-indigo-600 bg-indigo-50/90 font-bold',
      iconActive: 'text-indigo-600',
    },
  ];

  return (
    <aside
      className={`shrink-0 bg-white border-r border-slate-200/80 flex flex-col sticky top-0 h-screen overflow-y-auto select-none transition-all duration-300 z-40 ${
        isCollapsed ? 'w-16 p-2 items-center' : 'w-64 p-4'
      }`}
    >
      {/* BRAND LOGO AT TOP OF SIDEBAR */}
      <div className="pb-3 mb-3 border-b border-slate-100/90 w-full flex items-center justify-center">
        {isCollapsed ? (
          <Link href="/" className="flex items-center justify-center group" title="GENETRUST Việt Nam">
            <Image
              src={logoGenetrust}
              alt="Genetrust Logo"
              width={38}
              height={38}
              style={{ objectFit: 'contain', width: '38px', height: '38px' }}
              className="group-hover:scale-105 transition-transform"
            />
          </Link>
        ) : (
          <Link href="/" className="flex items-center gap-3 group w-full px-1">
            <Image
              src={logoGenetrust}
              alt="Genetrust Logo"
              width={42}
              height={42}
              style={{ objectFit: 'contain', width: '42px', height: '42px' }}
              className="group-hover:scale-105 transition-transform shrink-0"
            />
            <div className="leading-tight">
              <span className="text-lg font-black text-[#003399] tracking-tight block">
                GENETRUST
              </span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                Việt Nam
              </span>
            </div>
          </Link>
        )}
      </div>
      {/* MASTER CREATE BUTTON */}
      {(userRole === 'staff' || userRole === 'admin') && (
        <div className="mb-4 w-full flex justify-center">
          {isCollapsed ? (
            <Link
              href="/results/new"
              className="flex items-center justify-center w-11 h-11 rounded-xl transition-all bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-xs hover:shadow-md hover:from-sky-500 hover:to-indigo-500 active:scale-95 relative group"
              title="Tạo phiếu mới"
            >
              <PlusCircle className="w-5 h-5 shrink-0" />
              <span className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-lg whitespace-nowrap z-50 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150">
                Tạo phiếu mới
              </span>
            </Link>
          ) : (
            <Link
              href="/results/new"
              className="flex items-center justify-center gap-2.5 px-4 py-3 text-sm font-bold rounded-xl transition-all bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-xs hover:shadow-md hover:from-sky-500 hover:to-indigo-500 active:scale-[0.98] w-full"
            >
              <PlusCircle className="w-5 h-5 shrink-0" />
              <span>Tạo phiếu mới</span>
            </Link>
          )}
        </div>
      )}

      {/* Navigation Links */}
      <nav className={`flex-1 w-full ${isCollapsed ? 'space-y-2 flex flex-col items-center' : 'space-y-1'}`}>
        {navItems.map((item) => {
          if (!item.show) return null;
          const Icon = item.icon;
          const isActive = item.isActive;

          if (isCollapsed) {
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center justify-center w-11 h-11 rounded-xl transition-all relative group ${
                  isActive
                    ? 'bg-sky-50 text-sky-600 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-sky-600 rounded-r-full" />
                )}
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? item.iconActive : 'text-slate-400'}`} />

                {/* Tooltip */}
                <span className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-lg whitespace-nowrap z-50 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center gap-3.5 px-3.5 py-2.5 text-sm font-semibold rounded-xl transition-all relative group ${
                isActive
                  ? `${item.activeColor} shadow-2xs`
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-sky-600 rounded-r-full" />
              )}
              <Icon
                className={`w-5 h-5 shrink-0 transition-colors ${
                  isActive ? item.iconActive : 'text-slate-400'
                }`}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}

        {/* Admin Management Link */}
        {userRole === 'admin' && (
          <div className={`pt-3 mt-3 border-t border-slate-100 ${isCollapsed ? 'w-full flex justify-center' : ''}`}>
            {isCollapsed ? (
              <Link
                href="/users"
                className={`flex items-center justify-center w-11 h-11 rounded-xl transition-all relative group ${
                  pathname === '/users'
                    ? 'bg-purple-50 text-purple-700 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                {pathname === '/users' && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-purple-600 rounded-r-full" />
                )}
                <Users className={`w-5 h-5 shrink-0 ${pathname === '/users' ? 'text-purple-600' : 'text-slate-400'}`} />
                <span className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-lg whitespace-nowrap z-50 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150">
                  Quản lý tài khoản
                </span>
              </Link>
            ) : (
              <Link
                href="/users"
                className={`flex items-center gap-3.5 px-3.5 py-2.5 text-sm font-semibold rounded-xl transition-all relative ${
                  pathname === '/users'
                    ? 'text-purple-700 bg-purple-50/90 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                {pathname === '/users' && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-purple-600 rounded-r-full" />
                )}
                <Users
                  className={`w-5 h-5 shrink-0 ${
                    pathname === '/users' ? 'text-purple-600' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">Quản lý tài khoản</span>
              </Link>
            )}
          </div>
        )}
      </nav>

      {/* USER PROFILE FOOTER CARD (Matching Image 2 & 3) */}
      <div className="mt-auto pt-3 border-t border-slate-100 w-full">
        {isCollapsed ? (
          <div className="flex items-center justify-center p-1 relative group cursor-pointer" title={`${displayName} (${displayRole})`}>
            <div className="w-10 h-10 rounded-xl bg-sky-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs tracking-wider">
              {userInitials}
            </div>
            <span className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-lg whitespace-nowrap z-50 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150">
              {displayName} ({displayRole})
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/90 border border-slate-100/90 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-sky-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs tracking-wider">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate leading-tight">{displayName}</p>
              <p className="text-[11px] font-medium text-slate-500 truncate mt-0.5">{displayRole}</p>
            </div>
          </div>
        )}
      </div>
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
