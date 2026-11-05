'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/features/authentication';
import { ShieldCheck } from 'lucide-react';

export function LoginPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-light p-4">
      <div className="w-full max-w-md bg-white border border-border-slate/20 rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-deep-olive/10 text-deep-olive rounded-xl mb-1">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-primary-base">
            SHALOM
          </h1>
          <p className="text-sm text-muted-dark">
            Ingrese sus credenciales para acceder a la consola administrativa
          </p>
        </div>

        <LoginForm onSuccess={() => router.push('/')} />

        <div className="text-center pt-2 border-t border-border-slate/10">
          <p className="text-xs text-muted-dark/80">
            SHALOM — Gestión Comercial, Pedidos y WhatsApp &copy; 2026
          </p>
        </div>
      </div>
    </div>
  );
}
