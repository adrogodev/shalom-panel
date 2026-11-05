'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../model/auth.store';
import { apiClient } from '@/shared/api';
import { Lock, Mail, Loader2, AlertCircle } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Ingrese un correo electrónico válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    setLoading(true);

    try {
      const response = await apiClient<{
        accessToken: string;
        refreshToken: string;
        user: {
          id: string;
          email: string;
          firstName: string;
          lastName: string;
          roles: string[];
          permissions: string[];
        };
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      setAuth(response.accessToken, response.refreshToken, response.user);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err?.message || 'Error al iniciar sesión. Verifique sus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-dark">
          Correo Electrónico
        </label>
        <div className="relative">
          <Mail className="w-4 h-4 text-border-slate absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            {...register('email')}
            type="email"
            placeholder="admin@shalom.local"
            className="w-full pl-9 pr-3 py-2 bg-white border border-border-slate/40 rounded-lg text-sm text-primary-base placeholder:text-muted-dark/50 focus:outline-none focus:ring-2 focus:ring-deep-olive/30 focus:border-deep-olive transition"
          />
        </div>
        {errors.email && (
          <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-dark">
          Contraseña
        </label>
        <div className="relative">
          <Lock className="w-4 h-4 text-border-slate absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            {...register('password')}
            type="password"
            placeholder="••••••••"
            className="w-full pl-9 pr-3 py-2 bg-white border border-border-slate/40 rounded-lg text-sm text-primary-base placeholder:text-muted-dark/50 focus:outline-none focus:ring-2 focus:ring-deep-olive/30 focus:border-deep-olive transition"
          />
        </div>
        {errors.password && (
          <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 px-4 bg-deep-olive hover:bg-deep-olive/90 text-white font-medium rounded-lg text-sm transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Iniciando sesión...</span>
          </>
        ) : (
          <span>Ingresar a SHALOM</span>
        )}
      </button>
    </form>
  );
}
