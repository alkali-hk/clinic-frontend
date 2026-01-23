/**
 * System Settings Page
 */

'use client';

import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Settings,
  Building,
  Users,
  Clock,
  Pill,
  FileText,
  Database,
  Shield,
  Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotificationStore } from '@/store';
import api, { endpoints } from '@/lib/api';

type SettingsTab = 'clinic' | 'users' | 'schedule' | 'medicines' | 'templates' | 'backup' | 'security';

interface ClinicSettings {
  clinic_name: string;
  clinic_address: string;
  clinic_phone: string;
  consultation_fee: number;
  appointment_duration: number;
  auto_queue_mode: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('clinic');
  const [settings, setSettings] = useState<ClinicSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/core/settings/');
      if (response.data.length > 0) {
        setSettings(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      await api.patch(`/core/settings/${settings.clinic_name}/`, settings);
      addNotification({
        type: 'success',
        title: '設定已儲存',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '儲存失敗',
      });
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'clinic', label: '診所資訊', icon: Building },
    { id: 'users', label: '使用者管理', icon: Users },
    { id: 'schedule', label: '排班設定', icon: Clock },
    { id: 'medicines', label: '藥品設定', icon: Pill },
    { id: 'templates', label: '範本管理', icon: FileText },
    { id: 'backup', label: '資料備份', icon: Database },
    { id: 'security', label: '安全設定', icon: Shield },
  ] as const;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">系統設定</h1>
          <p className="text-gray-500">管理診所系統設定</p>
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <Card className="w-64 h-fit">
            <CardContent className="p-2">
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>

          {/* Content */}
          <div className="flex-1">
            {activeTab === 'clinic' && (
              <Card>
                <CardHeader>
                  <CardTitle>診所資訊</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {loading ? (
                    <p className="text-gray-500">載入中...</p>
                  ) : (
                    <>
                      <Input
                        label="診所名稱"
                        value={settings?.clinic_name || ''}
                        onChange={(e) =>
                          setSettings((s) => s && { ...s, clinic_name: e.target.value })
                        }
                      />
                      <Input
                        label="診所地址"
                        value={settings?.clinic_address || ''}
                        onChange={(e) =>
                          setSettings((s) => s && { ...s, clinic_address: e.target.value })
                        }
                      />
                      <Input
                        label="診所電話"
                        value={settings?.clinic_phone || ''}
                        onChange={(e) =>
                          setSettings((s) => s && { ...s, clinic_phone: e.target.value })
                        }
                      />
                      <Input
                        label="診金 (HKD)"
                        type="number"
                        value={settings?.consultation_fee || 0}
                        onChange={(e) =>
                          setSettings((s) =>
                            s && { ...s, consultation_fee: parseFloat(e.target.value) }
                          )
                        }
                      />
                      <Input
                        label="預約時段長度 (分鐘)"
                        type="number"
                        value={settings?.appointment_duration || 15}
                        onChange={(e) =>
                          setSettings((s) =>
                            s && { ...s, appointment_duration: parseInt(e.target.value) }
                          )
                        }
                      />
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          過號處理模式
                        </label>
                        <select
                          className="block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={settings?.auto_queue_mode || 'manual'}
                          onChange={(e) =>
                            setSettings((s) => s && { ...s, auto_queue_mode: e.target.value })
                          }
                        >
                          <option value="auto_front">自動排前</option>
                          <option value="manual">助理手動調整</option>
                          <option value="doctor_choice">醫師自由選擇</option>
                        </select>
                      </div>
                      <div className="flex justify-end pt-4 border-t">
                        <Button
                          icon={<Save className="h-4 w-4" />}
                          onClick={saveSettings}
                          loading={saving}
                        >
                          儲存設定
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === 'users' && (
              <Card>
                <CardHeader>
                  <CardTitle>使用者管理</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500">使用者管理功能將在此顯示</p>
                </CardContent>
              </Card>
            )}

            {activeTab === 'schedule' && (
              <Card>
                <CardHeader>
                  <CardTitle>排班設定</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500">排班設定功能將在此顯示</p>
                </CardContent>
              </Card>
            )}

            {activeTab === 'medicines' && (
              <Card>
                <CardHeader>
                  <CardTitle>藥品設定</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500">藥品設定功能將在此顯示</p>
                </CardContent>
              </Card>
            )}

            {activeTab === 'templates' && (
              <Card>
                <CardHeader>
                  <CardTitle>範本管理</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500">範本管理功能將在此顯示</p>
                </CardContent>
              </Card>
            )}

            {activeTab === 'backup' && (
              <Card>
                <CardHeader>
                  <CardTitle>資料備份</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">
                    定期備份您的資料以確保資料安全。建議每日進行備份。
                  </p>
                  <div className="flex gap-4">
                    <Button icon={<Database className="h-4 w-4" />}>
                      立即備份
                    </Button>
                    <Button variant="outline">還原備份</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'security' && (
              <Card>
                <CardHeader>
                  <CardTitle>安全設定</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500">安全設定功能將在此顯示</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
