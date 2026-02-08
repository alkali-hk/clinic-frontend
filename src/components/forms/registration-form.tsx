/**
 * Registration Form Component
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, User } from 'lucide-react';
import { useNotificationStore } from '@/store';
import api, { endpoints } from '@/lib/api';
import { cn, formatDate, calculateAge, getGenderDisplay } from '@/lib/utils';

const registrationSchema = z.object({
  patient_id: z.number({ required_error: '請選擇病患' }),
  doctor_id: z.number({ required_error: '請選擇醫師' }),
  room_id: z.number().optional(),
  visit_type: z.enum(['first_visit', 'follow_up']),
  notes: z.string().optional(),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

interface Patient {
  id: number;
  name: string;
  chart_number: string;
  gender: string;
  birth_date: string;
  phone: string;
}

interface Doctor {
  id: number;
  first_name: string;
  last_name: string;
}

interface RegistrationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function RegistrationForm({ onSuccess, onCancel }: RegistrationFormProps) {
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [searching, setSearching] = useState(false);
  const { addNotification } = useNotificationStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      visit_type: 'follow_up',
    },
  });

  const visitType = watch('visit_type');

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await api.get('/core/users/', {
        params: { role: 'doctor' },
      });
      const doctorList = response.data?.results || response.data || [];
      const doctors = Array.isArray(doctorList) ? doctorList : [];
      setDoctors(doctors);
      if (doctors.length > 0) {
        setValue('doctor_id', doctors[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    }
  };

  const searchPatients = async (query: string) => {
    setPatientSearch(query);
    if (query.length < 1) {
      setPatientResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await api.get(endpoints.patients.search, {
        params: { q: query },
      });
      const patients = response.data?.results || response.data || [];
      setPatientResults(Array.isArray(patients) ? patients : []);
    } catch (error) {
      console.error('Failed to search patients:', error);
    } finally {
      setSearching(false);
    }
  };

  const selectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setValue('patient_id', patient.id);
    setPatientSearch('');
    setPatientResults([]);

    // Check if first visit (no previous records)
    // For simplicity, we'll let the user choose
  };

  const clearPatient = () => {
    setSelectedPatient(null);
    setValue('patient_id', undefined as unknown as number);
  };

  const onSubmit = async (data: RegistrationFormData) => {
    try {
      await api.post(endpoints.registrations.list, {
        patient: data.patient_id,
        doctor: data.doctor_id,
        room: data.room_id,
        visit_type: data.visit_type,
        notes: data.notes,
      });
      addNotification({
        type: 'success',
        title: '掛號成功',
      });
      onSuccess?.();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      addNotification({
        type: 'error',
        title: '掛號失敗',
        message: err.response?.data?.detail || '請稍後再試',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Patient Search */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          病患 *
        </label>
        {selectedPatient ? (
          <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">{selectedPatient.name}</p>
              <p className="text-sm text-gray-500">
                {selectedPatient.chart_number} | {getGenderDisplay(selectedPatient.gender)} |{' '}
                {calculateAge(selectedPatient.birth_date)}歲 | {selectedPatient.phone}
              </p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={clearPatient}>
              更換
            </Button>
          </div>
        ) : (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="搜尋病患 (姓名、病歷號、電話)..."
              className="pl-10"
              value={patientSearch}
              onChange={(e) => searchPatients(e.target.value)}
            />
            {patientResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-auto">
                {patientResults.map((patient) => (
                  <button
                    key={patient.id}
                    type="button"
                    onClick={() => selectPatient(patient)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b last:border-b-0"
                  >
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{patient.name}</p>
                      <p className="text-sm text-gray-500">
                        {patient.chart_number} | {getGenderDisplay(patient.gender)} |{' '}
                        {calculateAge(patient.birth_date)}歲
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {searching && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-4 text-center text-gray-500">
                搜尋中...
              </div>
            )}
          </div>
        )}
        {errors.patient_id && (
          <p className="mt-1 text-sm text-red-600">{errors.patient_id.message}</p>
        )}
      </div>

      {/* Visit Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          就診類型 *
        </label>
        <div className="flex gap-4">
          <label
            className={cn(
              'flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors',
              visitType === 'first_visit'
                ? 'border-purple-500 bg-purple-50 text-purple-700'
                : 'border-gray-200 hover:border-gray-300'
            )}
          >
            <input
              type="radio"
              value="first_visit"
              className="sr-only"
              {...register('visit_type')}
            />
            <span className="font-medium">初診</span>
          </label>
          <label
            className={cn(
              'flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors',
              visitType === 'follow_up'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300'
            )}
          >
            <input
              type="radio"
              value="follow_up"
              className="sr-only"
              {...register('visit_type')}
            />
            <span className="font-medium">覆診</span>
          </label>
        </div>
      </div>

      {/* Doctor */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          看診醫師 *
        </label>
        <select
          className="block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          {...register('doctor_id', { valueAsNumber: true })}
        >
          {doctors.map((doctor) => (
            <option key={doctor.id} value={doctor.id}>
              {doctor.last_name}
              {doctor.first_name} 醫師
            </option>
          ))}
        </select>
        {errors.doctor_id && (
          <p className="mt-1 text-sm text-red-600">{errors.doctor_id.message}</p>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          備註
        </label>
        <textarea
          className="block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={2}
          placeholder="掛號備註..."
          {...register('notes')}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            取消
          </Button>
        )}
        <Button type="submit" loading={isSubmitting}>
          確認掛號
        </Button>
      </div>
    </form>
  );
}
