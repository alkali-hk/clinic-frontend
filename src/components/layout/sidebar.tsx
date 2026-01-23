/**
 * Sidebar Component
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUIStore, useAuthStore } from '@/store';
import {
  Home,
  Users,
  Calendar,
  Stethoscope,
  CreditCard,
  Package,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Truck,
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[];
}

const navItems: NavItem[] = [
  {
    title: '首頁',
    href: '/dashboard',
    icon: <Home className="h-5 w-5" />,
  },
  {
    title: '掛號作業',
    href: '/registration',
    icon: <Calendar className="h-5 w-5" />,
    roles: ['admin', 'receptionist', 'nurse'],
  },
  {
    title: '診療工作台',
    href: '/consultation',
    icon: <Stethoscope className="h-5 w-5" />,
    roles: ['admin', 'doctor'],
  },
  {
    title: '病患管理',
    href: '/patients',
    icon: <Users className="h-5 w-5" />,
  },
  {
    title: '收款作業',
    href: '/billing',
    icon: <CreditCard className="h-5 w-5" />,
    roles: ['admin', 'receptionist'],
  },
  {
    title: '外部訂單',
    href: '/dispensing-orders',
    icon: <Truck className="h-5 w-5" />,
    roles: ['admin', 'pharmacist', 'receptionist'],
  },
  {
    title: '庫存管理',
    href: '/inventory',
    icon: <Package className="h-5 w-5" />,
    roles: ['admin', 'pharmacist'],
  },
  {
    title: '報表作業',
    href: '/reports',
    icon: <FileText className="h-5 w-5" />,
    roles: ['admin'],
  },
  {
    title: '系統設定',
    href: '/settings',
    icon: <Settings className="h-5 w-5" />,
    roles: ['admin'],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { user, logout } = useAuthStore();

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role);
  });

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200 transition-all duration-300',
        sidebarOpen ? 'w-64' : 'w-20'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        {sidebarOpen && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Stethoscope className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-gray-900">診所管理系統</span>
          </Link>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {sidebarOpen ? (
            <ChevronLeft className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-500" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <span className={cn(isActive && 'text-blue-600')}>
                {item.icon}
              </span>
              {sidebarOpen && (
                <span className="font-medium">{item.title}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User info & Logout */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        {sidebarOpen && user && (
          <div className="mb-3 px-3">
            <p className="text-sm font-medium text-gray-900">
              {user.last_name}{user.first_name}
            </p>
            <p className="text-xs text-gray-500">{user.role}</p>
          </div>
        )}
        <button
          onClick={logout}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors',
            !sidebarOpen && 'justify-center'
          )}
        >
          <LogOut className="h-5 w-5" />
          {sidebarOpen && <span className="font-medium">登出</span>}
        </button>
      </div>
    </aside>
  );
}
