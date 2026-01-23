/**
 * Global State Management with Zustand
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// User types
interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'doctor' | 'nurse' | 'receptionist' | 'pharmacist';
  is_active: boolean;
}

// Auth store
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  setUser: (user: User | null) => void;
  setTokens: (access: string, refresh: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setTokens: (access, refresh) => {
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        set({ accessToken: access, refreshToken: refresh, isAuthenticated: true });
      },
      logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({ user: null, isAuthenticated: false, accessToken: null, refreshToken: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);

// Current patient in consultation
interface CurrentPatient {
  id: number;
  name: string;
  chart_number: string;
  gender: string;
  birth_date: string;
  registration_id: number;
}

// Consultation store
interface ConsultationState {
  currentPatient: CurrentPatient | null;
  currentRegistrationId: number | null;
  currentConsultationId: number | null;
  setCurrentPatient: (patient: CurrentPatient | null) => void;
  setCurrentRegistration: (id: number | null) => void;
  setCurrentConsultation: (id: number | null) => void;
  clearConsultation: () => void;
}

export const useConsultationStore = create<ConsultationState>()((set) => ({
  currentPatient: null,
  currentRegistrationId: null,
  currentConsultationId: null,
  setCurrentPatient: (patient) => set({ currentPatient: patient }),
  setCurrentRegistration: (id) => set({ currentRegistrationId: id }),
  setCurrentConsultation: (id) => set({ currentConsultationId: id }),
  clearConsultation: () =>
    set({
      currentPatient: null,
      currentRegistrationId: null,
      currentConsultationId: null,
    }),
}));

// Queue store for registration
interface QueueItem {
  id: number;
  queue_number: number;
  patient_name: string;
  patient_chart_number: string;
  visit_type: string;
  status: string;
  registration_time: string;
}

interface QueueState {
  queue: QueueItem[];
  currentNumber: number;
  setQueue: (queue: QueueItem[]) => void;
  setCurrentNumber: (num: number) => void;
  addToQueue: (item: QueueItem) => void;
  removeFromQueue: (id: number) => void;
  updateQueueItem: (id: number, updates: Partial<QueueItem>) => void;
}

export const useQueueStore = create<QueueState>()((set) => ({
  queue: [],
  currentNumber: 0,
  setQueue: (queue) => set({ queue }),
  setCurrentNumber: (num) => set({ currentNumber: num }),
  addToQueue: (item) => set((state) => ({ queue: [...state.queue, item] })),
  removeFromQueue: (id) =>
    set((state) => ({ queue: state.queue.filter((item) => item.id !== id) })),
  updateQueueItem: (id, updates) =>
    set((state) => ({
      queue: state.queue.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    })),
}));

// UI store
interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: 'light',
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'ui-storage',
    }
  )
);

// Notification store
interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>()((set) => ({
  notifications: [],
  addNotification: (notification) => {
    const id = Math.random().toString(36).substring(7);
    set((state) => ({
      notifications: [...state.notifications, { ...notification, id }],
    }));
    // Auto remove after duration
    const duration = notification.duration || 5000;
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }));
    }, duration);
  },
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
  clearNotifications: () => set({ notifications: [] }),
}));
