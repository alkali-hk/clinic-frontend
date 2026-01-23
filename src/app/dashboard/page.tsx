/**
 * Dashboard Page
 */

'use client';

import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  Calendar,
  CreditCard,
  TrendingUp,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import api, { endpoints } from '@/lib/api';

interface DashboardStats {
  todayRegistrations: number;
  waitingPatients: number;
  completedConsultations: number;
  todayRevenue: number;
  pendingBills: number;
  lowStockItems: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    todayRegistrations: 0,
    waitingPatients: 0,
    completedConsultations: 0,
    todayRevenue: 0,
    pendingBills: 0,
    lowStockItems: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch daily summary
      const summaryRes = await api.get(endpoints.reports.dailySummary);
      const summary = summaryRes.data;

      // Fetch low stock
      const lowStockRes = await api.get(endpoints.inventory.lowStock);
      const lowStock = lowStockRes.data;

      setStats({
        todayRegistrations: summary.registrations?.total || 0,
        waitingPatients: summary.registrations?.total - summary.registrations?.completed || 0,
        completedConsultations: summary.registrations?.completed || 0,
        todayRevenue: summary.revenue?.total || 0,
        pendingBills: summary.bills?.pending || 0,
        lowStockItems: lowStock.count || 0,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: '今日掛號',
      value: stats.todayRegistrations,
      icon: <Calendar className="h-6 w-6" />,
      color: 'bg-blue-500',
    },
    {
      title: '候診人數',
      value: stats.waitingPatients,
      icon: <Clock className="h-6 w-6" />,
      color: 'bg-amber-500',
    },
    {
      title: '已完成診療',
      value: stats.completedConsultations,
      icon: <Users className="h-6 w-6" />,
      color: 'bg-green-500',
    },
    {
      title: '今日營收',
      value: formatCurrency(stats.todayRevenue),
      icon: <TrendingUp className="h-6 w-6" />,
      color: 'bg-indigo-500',
    },
    {
      title: '待付款帳單',
      value: stats.pendingBills,
      icon: <CreditCard className="h-6 w-6" />,
      color: 'bg-orange-500',
    },
    {
      title: '低庫存警報',
      value: stats.lowStockItems,
      icon: <AlertTriangle className="h-6 w-6" />,
      color: stats.lowStockItems > 0 ? 'bg-red-500' : 'bg-gray-400',
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">儀表板</h1>
          <p className="text-gray-500">診所營運概覽</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((card, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      {card.title}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {loading ? '-' : card.value}
                    </p>
                  </div>
                  <div
                    className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center text-white`}
                  >
                    {card.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Queue */}
          <Card>
            <CardHeader>
              <CardTitle>今日候診名單</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>目前沒有候診病患</p>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle>最近活動</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>暫無活動記錄</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
