/**
 * Registration Page
 */

'use client';

import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Search,
  Phone,
  CheckCircle,
  XCircle,
  Clock,
  UserPlus,
} from 'lucide-react';
import { PatientForm } from '@/components/forms/patient-form';
import { RegistrationForm } from '@/components/forms/registration-form';
import { cn, formatTime, getVisitTypeDisplay, getRegistrationStatusDisplay } from '@/lib/utils';
import { useQueueStore, useNotificationStore } from '@/store';
import api, { endpoints } from '@/lib/api';

interface Registration {
  id: number;
  registration_number: string;
  queue_number: number;
  patient: {
    id: number;
    name: string;
    chart_number: string;
    phone: string;
  };
  doctor: {
    id: number;
    first_name: string;
    last_name: string;
  };
  visit_type: string;
  status: string;
  registration_time: string;
  notes: string;
}

export default function RegistrationPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const { addNotification } = useNotificationStore();
  const { setCurrentNumber } = useQueueStore();

  useEffect(() => {
    fetchTodayRegistrations();
  }, []);

  const fetchTodayRegistrations = async () => {
    try {
      const response = await api.get(endpoints.registrations.today);
      // API returns { waiting: [], in_consultation: [], completed: [], summary: {} }
      const allRegistrations = [
        ...(response.data?.waiting || []),
        ...(response.data?.in_consultation || []),
        ...(response.data?.completed || []),
      ];
      setRegistrations(allRegistrations);
      
      // Update current queue number
      const waiting = allRegistrations.filter(
        (r: Registration) => r.status === 'waiting' || r.status === 'checked_in'
      );
      if (waiting.length > 0) {
        const maxQueue = Math.max(...waiting.map((r: Registration) => r.queue_number));
        setCurrentNumber(maxQueue);
      }
    } catch (error) {
      console.error('Failed to fetch registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (id: number) => {
    try {
      await api.post(endpoints.registrations.checkIn(id));
      addNotification({
        type: 'success',
        title: '報到成功',
      });
      fetchTodayRegistrations();
    } catch (error) {
      addNotification({
        type: 'error',
        title: '報到失敗',
      });
    }
  };

  const handleCall = async (id: number) => {
    try {
      await api.post(endpoints.registrations.call(id));
      addNotification({
        type: 'info',
        title: '已叫號',
      });
      fetchTodayRegistrations();
    } catch (error) {
      addNotification({
        type: 'error',
        title: '叫號失敗',
      });
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await api.post(endpoints.registrations.cancel(id));
      addNotification({
        type: 'success',
        title: '已取消掛號',
      });
      fetchTodayRegistrations();
    } catch (error) {
      addNotification({
        type: 'error',
        title: '取消失敗',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800';
      case 'checked_in':
        return 'bg-blue-100 text-blue-800';
      case 'in_consultation':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRegistrations = registrations.filter(
    (r) =>
      r.patient?.name?.includes(searchQuery) ||
      r.patient?.chart_number?.includes(searchQuery) ||
      r.registration_number?.includes(searchQuery)
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">掛號作業</h1>
            <p className="text-gray-500">管理今日掛號與候診名單</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              icon={<UserPlus className="h-4 w-4" />}
              onClick={() => setShowNewPatientModal(true)}
            >
              新增病患
            </Button>
            <Button
              icon={<Plus className="h-4 w-4" />}
              onClick={() => setShowRegistrationModal(true)}
            >
              新增掛號
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">候診中</p>
                  <p className="text-xl font-bold">
                    {registrations.filter((r) => r.status === 'waiting' || r.status === 'checked_in').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">已完成</p>
                  <p className="text-xl font-bold">
                    {registrations.filter((r) => r.status === 'completed').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">已取消</p>
                  <p className="text-xl font-bold">
                    {registrations.filter((r) => r.status === 'cancelled').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <UserPlus className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">今日總掛號</p>
                  <p className="text-xl font-bold">{registrations.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Registration List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>今日掛號名單</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜尋病患姓名或病歷號..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">號碼</TableHead>
                  <TableHead>病歷號</TableHead>
                  <TableHead>姓名</TableHead>
                  <TableHead>類型</TableHead>
                  <TableHead>醫師</TableHead>
                  <TableHead>掛號時間</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      載入中...
                    </TableCell>
                  </TableRow>
                ) : filteredRegistrations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      目前沒有掛號記錄
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRegistrations.map((reg) => (
                    <TableRow key={reg.id}>
                      <TableCell>
                        <span className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-600 font-bold rounded-lg">
                          {reg.queue_number}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono">
                        {reg.patient.chart_number}
                      </TableCell>
                      <TableCell className="font-medium">
                        {reg.patient.name}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'px-2 py-1 rounded text-xs font-medium',
                            reg.visit_type === 'first_visit'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100 text-gray-800'
                          )}
                        >
                          {getVisitTypeDisplay(reg.visit_type)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {reg.doctor?.last_name}
                        {reg.doctor?.first_name}
                      </TableCell>
                      <TableCell>{formatTime(reg.registration_time)}</TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'px-2 py-1 rounded text-xs font-medium',
                            getStatusColor(reg.status)
                          )}
                        >
                          {getRegistrationStatusDisplay(reg.status)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {reg.status === 'waiting' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCheckIn(reg.id)}
                            >
                              報到
                            </Button>
                          )}
                          {(reg.status === 'waiting' || reg.status === 'checked_in') && (
                            <>
                              <Button
                                size="sm"
                                variant="primary"
                                icon={<Phone className="h-3 w-3" />}
                                onClick={() => handleCall(reg.id)}
                              >
                                叫號
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleCancel(reg.id)}
                              >
                                取消
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* New Patient Modal */}
      <Modal
        isOpen={showNewPatientModal}
        onClose={() => setShowNewPatientModal(false)}
        title="新增病患"
        size="xl"
      >
        <PatientForm
          onSuccess={() => {
            setShowNewPatientModal(false);
            addNotification({
              type: 'success',
              title: '病患已新增',
              message: '您可以繼續為此病患掛號',
            });
          }}
          onCancel={() => setShowNewPatientModal(false)}
        />
      </Modal>

      {/* Registration Modal */}
      <Modal
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        title="新增掛號"
        size="lg"
      >
        <RegistrationForm
          onSuccess={() => {
            setShowRegistrationModal(false);
            fetchTodayRegistrations();
          }}
          onCancel={() => setShowRegistrationModal(false)}
        />
      </Modal>
    </MainLayout>
  );
}
