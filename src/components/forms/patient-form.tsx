/**
 * Patient Form Component
 */

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNotificationStore } from '@/store';
import api, { endpoints } from '@/lib/api';

const patientSchema = z.object({
  name: z.string().min(1, '請輸入姓名'),
  gender: z.enum(['male', 'female', 'other'], { required_error: '請選擇性別' }),
  birth_date: z.string().min(1, '請輸入出生日期'),
  id_number: z.string().optional(),
  phone: z.string().min(1, '請輸入電話號碼'),
  emergency_contact: z.string().optional(),
  emergency_phone: z.string().optional(),
  address: z.string().optional(),
  allergies: z.string().optional(),
  medical_history: z.string().optional(),
  notes: z.string().optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

interface PatientFormProps {
  onSuccess?: (patient: { id: number; name: string; chart_number: string }) => void;
  onCancel?: () => void;
}

export function PatientForm({ onSuccess, onCancel }: PatientFormProps) {
  const { addNotification } = useNotificationStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      gender: 'male',
    },
  });

  const onSubmit = async (data: PatientFormData) => {
    try {
      const response = await api.post(endpoints.patients.list, data);
      addNotification({
        type: 'success',
        title: '新增病患成功',
        message: `病歷號: ${response.data.chart_number}`,
      });
      reset();
      onSuccess?.(response.data);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      addNotification({
        type: 'error',
        title: '新增病患失敗',
        message: err.response?.data?.detail || '請稍後再試',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {/* Basic Info */}
        <Input
          label="姓名 *"
          placeholder="請輸入姓名"
          error={errors.name?.message}
          {...register('name')}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            性別 *
          </label>
          <select
            className="block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            {...register('gender')}
          >
            <option value="male">男</option>
            <option value="female">女</option>
            <option value="other">其他</option>
          </select>
          {errors.gender && (
            <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
          )}
        </div>

        <Input
          label="出生日期 *"
          type="date"
          error={errors.birth_date?.message}
          {...register('birth_date')}
        />

        <Input
          label="身分證號碼"
          placeholder="請輸入身分證號碼"
          error={errors.id_number?.message}
          {...register('id_number')}
        />

        <Input
          label="電話 *"
          placeholder="請輸入電話號碼"
          error={errors.phone?.message}
          {...register('phone')}
        />

        <Input
          label="緊急聯絡人"
          placeholder="請輸入緊急聯絡人姓名"
          error={errors.emergency_contact?.message}
          {...register('emergency_contact')}
        />

        <Input
          label="緊急聯絡電話"
          placeholder="請輸入緊急聯絡電話"
          error={errors.emergency_phone?.message}
          {...register('emergency_phone')}
        />
      </div>

      <Input
        label="地址"
        placeholder="請輸入地址"
        error={errors.address?.message}
        {...register('address')}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          藥物過敏史
        </label>
        <textarea
          className="block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={2}
          placeholder="請輸入藥物過敏史"
          {...register('allergies')}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          過往病史
        </label>
        <textarea
          className="block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={2}
          placeholder="請輸入過往病史"
          {...register('medical_history')}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          備註
        </label>
        <textarea
          className="block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={2}
          placeholder="其他備註事項"
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
          新增病患
        </Button>
      </div>
    </form>
  );
}
