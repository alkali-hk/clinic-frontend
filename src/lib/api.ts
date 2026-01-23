/**
 * API Client Configuration
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Create axios instance
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If 401 and not already retrying, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem('access_token', access);

          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// API endpoints
export const endpoints = {
  // Auth
  auth: {
    login: '/auth/login/',
    logout: '/auth/logout/',
    refresh: '/auth/token/refresh/',
    me: '/auth/me/',
    changePassword: '/auth/change-password/',
  },
  // Patients
  patients: {
    list: '/patients/',
    detail: (id: number) => `/patients/${id}/`,
    search: '/patients/search/',
    images: (id: number) => `/patients/${id}/images/`,
  },
  // Registration
  registrations: {
    list: '/registration/registrations/',
    detail: (id: number) => `/registration/registrations/${id}/`,
    today: '/registration/today/',
    queue: '/registration/queue/',
    checkIn: (id: number) => `/registration/registrations/${id}/check_in/`,
    call: (id: number) => `/registration/registrations/${id}/start_consultation/`,
    complete: (id: number) => `/registration/registrations/${id}/end_consultation/`,
    cancel: (id: number) => `/registration/registrations/${id}/cancel/`,
  },
  appointments: {
    list: '/registration/appointments/',
    detail: (id: number) => `/registration/appointments/${id}/`,
    byDate: '/registration/appointments/by_date/',
    confirm: (id: number) => `/registration/appointments/${id}/confirm/`,
    cancel: (id: number) => `/registration/appointments/${id}/cancel/`,
  },
  // Consultation
  consultations: {
    list: '/consultation/consultations/',
    detail: (id: number) => `/consultation/consultations/${id}/`,
    byPatient: '/consultation/consultations/by_patient/',
  },
  prescriptions: {
    list: '/consultation/prescriptions/',
    detail: (id: number) => `/consultation/prescriptions/${id}/`,
    dispense: (id: number) => `/consultation/prescriptions/${id}/dispense/`,
    applyFormula: (id: number) => `/consultation/prescriptions/${id}/apply_experience_formula/`,
    checkStock: '/consultation/prescriptions/check_stock/',
  },
  experienceFormulas: {
    list: '/consultation/experience-formulas/',
    detail: (id: number) => `/consultation/experience-formulas/${id}/`,
  },
  certificates: {
    list: '/consultation/certificates/',
    detail: (id: number) => `/consultation/certificates/${id}/`,
    print: (id: number) => `/consultation/certificates/${id}/print/`,
  },
  diagnosticTerms: {
    list: '/consultation/diagnostic-terms/',
    byCategory: '/consultation/diagnostic-terms/by_category/',
  },
  // Inventory
  medicines: {
    list: '/inventory/medicines/',
    detail: (id: number) => `/inventory/medicines/${id}/`,
    search: '/inventory/medicines/search/',
    transactions: (id: number) => `/inventory/medicines/${id}/transactions/`,
  },
  inventory: {
    list: '/inventory/inventory/',
    detail: (id: number) => `/inventory/inventory/${id}/`,
    adjust: (id: number) => `/inventory/inventory/${id}/adjust/`,
    lowStock: '/inventory/low-stock/',
  },
  purchaseOrders: {
    list: '/inventory/purchase-orders/',
    detail: (id: number) => `/inventory/purchase-orders/${id}/`,
    submit: (id: number) => `/inventory/purchase-orders/${id}/submit/`,
    receive: (id: number) => `/inventory/purchase-orders/${id}/receive/`,
    cancel: (id: number) => `/inventory/purchase-orders/${id}/cancel/`,
  },
  // Billing
  bills: {
    list: '/billing/bills/',
    detail: (id: number) => `/billing/bills/${id}/`,
    pay: (id: number) => `/billing/bills/${id}/pay/`,
    refund: (id: number) => `/billing/bills/${id}/refund/`,
    cancel: (id: number) => `/billing/bills/${id}/cancel/`,
    creditToAccount: (id: number) => `/billing/bills/${id}/credit-to-account/`,
  },
  debts: {
    list: '/billing/debts/',
    detail: (id: number) => `/billing/debts/${id}/`,
    byPatient: '/billing/debts/by_patient/',
    pay: (id: number) => `/billing/debts/${id}/pay/`,
  },
  dispensingOrders: {
    list: '/billing/dispensing-orders/',
    detail: (id: number) => `/billing/dispensing-orders/${id}/`,
    send: (id: number) => `/billing/dispensing-orders/${id}/send/`,
    cancel: (id: number) => `/billing/dispensing-orders/${id}/cancel/`,
  },
  externalPharmacies: {
    list: '/billing/external-pharmacies/',
    detail: (id: number) => `/billing/external-pharmacies/${id}/`,
  },
  // Reports
  reports: {
    dailySummary: '/reports/daily-summary/',
    monthlySummary: '/reports/monthly-summary/',
    doctorWorkload: '/reports/doctor-workload/',
    medicineUsage: '/reports/medicine-usage/',
    externalPharmacyReconciliation: '/reports/external-pharmacy-reconciliation/',
  },
  // Settings
  settings: {
    clinic: '/settings/clinic/',
    rooms: '/settings/rooms/',
    schedules: '/settings/schedules/',
    chargeItems: '/charge-items/',
    categories: '/categories/',
    suppliers: '/suppliers/',
  },
};

export default api;
