/**
 * Utility functions
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';
import { zhTW } from 'date-fns/locale';

// Tailwind class merge helper
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Date formatting
export function formatDate(date: string | Date | null | undefined, formatStr: string = 'yyyy-MM-dd'): string {
  if (!date) return '';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    if (isNaN(d.getTime())) return '';
    return format(d, formatStr, { locale: zhTW });
  } catch {
    return '';
  }
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, 'yyyy-MM-dd HH:mm');
}

export function formatTime(date: string | Date): string {
  return formatDate(date, 'HH:mm');
}

// Currency formatting
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Phone number formatting
export function formatPhone(phone: string): string {
  if (!phone) return '';
  // Format as XXXX-XXX-XXX for mobile
  if (phone.length === 10 && phone.startsWith('09')) {
    return `${phone.slice(0, 4)}-${phone.slice(4, 7)}-${phone.slice(7)}`;
  }
  return phone;
}

// ID card masking
export function maskIdCard(idCard: string): string {
  if (!idCard || idCard.length < 4) return idCard;
  return `${idCard.slice(0, 2)}${'*'.repeat(idCard.length - 4)}${idCard.slice(-2)}`;
}

// Phone masking
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 4) return phone;
  return `${phone.slice(0, 4)}${'*'.repeat(phone.length - 7)}${phone.slice(-3)}`;
}

// Generate chart number
export function generateChartNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${year}${month}${day}${random}`;
}

// Age calculation
export function calculateAge(birthDate: string | Date | null | undefined): number {
  if (!birthDate) return 0;
  try {
    const birth = typeof birthDate === 'string' ? parseISO(birthDate) : birthDate;
    if (isNaN(birth.getTime())) return 0;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  } catch {
    return 0;
  }
}

// Gender display
export function getGenderDisplay(gender: string): string {
  const genderMap: Record<string, string> = {
    male: '男',
    female: '女',
    other: '其他',
  };
  return genderMap[gender] || gender;
}

// Visit type display
export function getVisitTypeDisplay(visitType: string): string {
  const visitTypeMap: Record<string, string> = {
    first_visit: '初診',
    follow_up: '覆診',
  };
  return visitTypeMap[visitType] || visitType;
}

// Registration status display
export function getRegistrationStatusDisplay(status: string): string {
  const statusMap: Record<string, string> = {
    waiting: '候診中',
    checked_in: '已報到',
    in_consultation: '診療中',
    completed: '已完成',
    cancelled: '已取消',
    no_show: '過號',
  };
  return statusMap[status] || status;
}

// Bill status display
export function getBillStatusDisplay(status: string): string {
  const statusMap: Record<string, string> = {
    pending: '待付款',
    partial: '部分付款',
    paid: '已付款',
    refunded: '已退款',
    cancelled: '已取消',
  };
  return statusMap[status] || status;
}

// Payment method display
export function getPaymentMethodDisplay(method: string): string {
  const methodMap: Record<string, string> = {
    cash: '現金',
    credit_card: '信用卡',
    debit_card: '金融卡',
    mobile_pay: '行動支付',
    bank_transfer: '銀行轉帳',
    patient_balance: '帳戶餘額',
    other: '其他',
  };
  return methodMap[method] || method;
}

// Dispensing method display
export function getDispensingMethodDisplay(method: string): string {
  const methodMap: Record<string, string> = {
    internal: '內部配藥',
    external_decoction: '外送煎藥',
    external_concentrate: '外送濃縮',
  };
  return methodMap[method] || method;
}

// Debounce function
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Local storage helpers
export const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') return defaultValue;
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    try {
      return JSON.parse(item) as T;
    } catch {
      return defaultValue;
    }
  },
  set: <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  },
  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  },
};
