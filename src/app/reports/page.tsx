/**
 * Reports Page
 */

'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FileText,
  Download,
  Calendar,
  DollarSign,
  Users,
  Pill,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { useNotificationStore } from '@/store';
import api from '@/lib/api';

interface ReportType {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const reportTypes: ReportType[] = [
  {
    id: 'daily_summary',
    name: '每日營業報表',
    description: '當日掛號、診療、收款統計',
    icon: Calendar,
    color: 'bg-blue-100 text-blue-600',
  },
  {
    id: 'monthly_revenue',
    name: '月營收報表',
    description: '月度收入、支出、利潤分析',
    icon: DollarSign,
    color: 'bg-green-100 text-green-600',
  },
  {
    id: 'patient_stats',
    name: '病患統計報表',
    description: '初診/覆診人數、年齡分布',
    icon: Users,
    color: 'bg-purple-100 text-purple-600',
  },
  {
    id: 'medicine_usage',
    name: '用藥統計報表',
    description: '藥品使用量、庫存消耗',
    icon: Pill,
    color: 'bg-orange-100 text-orange-600',
  },
  {
    id: 'doctor_performance',
    name: '醫師績效報表',
    description: '各醫師診療人次、收入統計',
    icon: TrendingUp,
    color: 'bg-indigo-100 text-indigo-600',
  },
  {
    id: 'inventory_report',
    name: '庫存報表',
    description: '庫存狀態、進出貨記錄',
    icon: BarChart3,
    color: 'bg-cyan-100 text-cyan-600',
  },
  {
    id: 'dispensing_report',
    name: '派藥報表',
    description: '內部配藥、外送訂單統計',
    icon: PieChart,
    color: 'bg-pink-100 text-pink-600',
  },
  {
    id: 'debt_report',
    name: '欠款報表',
    description: '未結清帳單、欠款追蹤',
    icon: Activity,
    color: 'bg-red-100 text-red-600',
  },
];

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [generating, setGenerating] = useState(false);
  const { addNotification } = useNotificationStore();

  const generateReport = async () => {
    if (!selectedReport) {
      addNotification({
        type: 'warning',
        title: '請選擇報表類型',
      });
      return;
    }

    if (!dateFrom || !dateTo) {
      addNotification({
        type: 'warning',
        title: '請選擇日期範圍',
      });
      return;
    }

    setGenerating(true);
    try {
      const response = await api.post('/reports/generate/', {
        report_type: selectedReport,
        date_from: dateFrom,
        date_to: dateTo,
      });
      addNotification({
        type: 'success',
        title: '報表生成成功',
        message: '報表已準備好下載',
      });
      // Handle download
      if (response.data.file_url) {
        window.open(response.data.file_url, '_blank');
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: '報表生成失敗',
        message: '請稍後再試',
      });
    } finally {
      setGenerating(false);
    }
  };

  // Set default dates
  const today = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split('T')[0];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">報表作業</h1>
          <p className="text-gray-500">生成各類營運報表</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Report Types */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>選擇報表類型</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reportTypes.map((report) => (
                    <button
                      key={report.id}
                      onClick={() => setSelectedReport(report.id)}
                      className={cn(
                        'flex items-start gap-4 p-4 rounded-lg border-2 text-left transition-all',
                        selectedReport === report.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      )}
                    >
                      <div
                        className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center',
                          report.color
                        )}
                      >
                        <report.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{report.name}</p>
                        <p className="text-sm text-gray-500">{report.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Report Options */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>報表設定</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="開始日期"
                  type="date"
                  value={dateFrom || firstDayOfMonth}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
                <Input
                  label="結束日期"
                  type="date"
                  value={dateTo || today}
                  onChange={(e) => setDateTo(e.target.value)}
                />

                <div className="pt-4 space-y-3">
                  <Button
                    className="w-full"
                    icon={<FileText className="h-4 w-4" />}
                    onClick={generateReport}
                    loading={generating}
                    disabled={!selectedReport}
                  >
                    生成報表
                  </Button>
                  <Button
                    className="w-full"
                    variant="outline"
                    icon={<Download className="h-4 w-4" />}
                    disabled={!selectedReport}
                  >
                    匯出 Excel
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Reports */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>快速報表</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="ghost" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  今日營業報表
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  本週營業報表
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  本月營業報表
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <CardTitle>最近生成的報表</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>尚未生成任何報表</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
