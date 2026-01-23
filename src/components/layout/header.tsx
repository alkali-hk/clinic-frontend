/**
 * Header Component
 */

'use client';

import { useUIStore, useAuthStore } from '@/store';
import { cn } from '@/lib/utils';
import { Bell, Search, User } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export function Header() {
  const { sidebarOpen } = useUIStore();
  const { user } = useAuthStore();

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 h-16 bg-white border-b border-gray-200 transition-all duration-300',
        sidebarOpen ? 'left-64' : 'left-20'
      )}
    >
      <div className="flex items-center justify-between h-full px-6">
        {/* Left side - Date & Search */}
        <div className="flex items-center gap-6">
          <div>
            <p className="text-sm text-gray-500">今日日期</p>
            <p className="font-semibold text-gray-900">
              {formatDate(new Date(), 'yyyy年MM月dd日 EEEE')}
            </p>
          </div>
          
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜尋病患、病歷號..."
              className="w-80 pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Right side - Notifications & User */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User */}
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-900">
                {user ? `${user.last_name}${user.first_name}` : '使用者'}
              </p>
              <p className="text-xs text-gray-500">
                {user?.role === 'admin' && '系統管理員'}
                {user?.role === 'doctor' && '醫師'}
                {user?.role === 'nurse' && '護理師'}
                {user?.role === 'receptionist' && '櫃檯人員'}
                {user?.role === 'pharmacist' && '藥師'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
