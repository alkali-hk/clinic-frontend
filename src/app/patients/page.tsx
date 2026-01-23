/**
 * Patients Management Page
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
import { Plus, Search, User, Phone, Calendar, FileText } from 'lucide-react';
import { PatientForm } from '@/components/forms/patient-form';
import { formatDate, calculateAge, getGenderDisplay, formatPhone } from '@/lib/utils';
import { useNotificationStore } from '@/store';
import api, { endpoints } from '@/lib/api';

interface Patient {
  id: number;
  chart_number: string;
  name: string;
  gender: string;
  birth_date: string;
  phone: string;
  address: string;
  allergies: string;
  created_at: string;
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await api.get(endpoints.patients.list);
      setPatients(response.data?.results || response.data || []);
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchPatients = async () => {
    if (!searchQuery.trim()) {
      fetchPatients();
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(endpoints.patients.search, {
        params: { q: searchQuery },
      });
      setPatients(response.data?.results || response.data || []);
    } catch (error) {
      console.error('Failed to search patients:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">病患管理</h1>
            <p className="text-gray-500">管理診所病患資料</p>
          </div>
          <Button
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setShowNewPatientModal(true)}
          >
            新增病患
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="py-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜尋病患 (姓名、病歷號、電話)..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchPatients()}
                />
              </div>
              <Button onClick={searchPatients}>搜尋</Button>
            </div>
          </CardContent>
        </Card>

        {/* Patients Table */}
        <Card>
          <CardHeader>
            <CardTitle>病患列表</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>病歷號</TableHead>
                  <TableHead>姓名</TableHead>
                  <TableHead>性別</TableHead>
                  <TableHead>年齡</TableHead>
                  <TableHead>電話</TableHead>
                  <TableHead>過敏史</TableHead>
                  <TableHead>建檔日期</TableHead>
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
                ) : patients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      <User className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>目前沒有病患資料</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  patients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-mono font-medium">
                        {patient.chart_number}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <span className="font-medium">{patient.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getGenderDisplay(patient.gender)}</TableCell>
                      <TableCell>{calculateAge(patient.birth_date)}歲</TableCell>
                      <TableCell>{formatPhone(patient.phone)}</TableCell>
                      <TableCell>
                        {patient.allergies ? (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                            {patient.allergies.length > 20
                              ? patient.allergies.substring(0, 20) + '...'
                              : patient.allergies}
                          </span>
                        ) : (
                          <span className="text-gray-400">無</span>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(patient.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            icon={<FileText className="h-3 w-3" />}
                            onClick={() => setSelectedPatient(patient)}
                          >
                            詳情
                          </Button>
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
            fetchPatients();
          }}
          onCancel={() => setShowNewPatientModal(false)}
        />
      </Modal>

      {/* Patient Detail Modal */}
      <Modal
        isOpen={!!selectedPatient}
        onClose={() => setSelectedPatient(null)}
        title="病患詳情"
        size="lg"
      >
        {selectedPatient && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedPatient.name}
                </h3>
                <p className="text-gray-500">
                  病歷號: {selectedPatient.chart_number}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">性別</p>
                <p className="font-medium">{getGenderDisplay(selectedPatient.gender)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">年齡</p>
                <p className="font-medium">
                  {calculateAge(selectedPatient.birth_date)}歲 ({formatDate(selectedPatient.birth_date)})
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">電話</p>
                <p className="font-medium">{formatPhone(selectedPatient.phone)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">地址</p>
                <p className="font-medium">{selectedPatient.address || '-'}</p>
              </div>
            </div>

            {selectedPatient.allergies && (
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm font-medium text-red-800 mb-1">藥物過敏史</p>
                <p className="text-red-700">{selectedPatient.allergies}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setSelectedPatient(null)}>
                關閉
              </Button>
              <Button>編輯資料</Button>
            </div>
          </div>
        )}
      </Modal>
    </MainLayout>
  );
}
