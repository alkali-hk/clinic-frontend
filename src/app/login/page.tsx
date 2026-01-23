/**
 * Login Page
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Stethoscope, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore, useNotificationStore } from '@/store';
import api, { endpoints } from '@/lib/api';

const loginSchema = z.object({
  username: z.string().min(1, '請輸入使用者名稱'),
  password: z.string().min(1, '請輸入密碼'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setUser, setTokens } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      // Login request
      const response = await api.post(endpoints.auth.login, data);
      const { access, refresh, user } = response.data;

      // Store tokens and user
      setTokens(access, refresh);
      setUser(user);

      addNotification({
        type: 'success',
        title: '登入成功',
        message: `歡迎回來，${user.last_name}${user.first_name}`,
      });

      // Redirect based on role
      if (user.role === 'doctor') {
        router.push('/consultation');
      } else {
        router.push('/dashboard');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      addNotification({
        type: 'error',
        title: '登入失敗',
        message: err.response?.data?.detail || '使用者名稱或密碼錯誤',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <Stethoscope className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">診所管理系統</h1>
          <p className="text-gray-500 mt-1">請登入您的帳號</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="使用者名稱"
              placeholder="請輸入使用者名稱"
              error={errors.username?.message}
              {...register('username')}
            />

            <div className="relative">
              <Input
                label="密碼"
                type={showPassword ? 'text' : 'password'}
                placeholder="請輸入密碼"
                error={errors.password?.message}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                }
                {...register('password')}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={loading}
            >
              登入
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          © 2024 診所管理系統. All rights reserved.
        </p>
      </div>
    </div>
  );
}
