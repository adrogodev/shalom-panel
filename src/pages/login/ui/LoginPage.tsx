'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm, useRedirectIfAuthenticated } from '@/features/authentication';
import { SESSION_EXPIRED_MESSAGE } from '@/shared/api';
import { ShieldCheck, Clock } from 'lucide-react';

export function LoginPage() {
  const router = useRouter();
  const [sessionExpired, setSessionExpired] = useState(false);
  useRedirectIfAuthenticated('/');

  // Read the query string after mount to keep server and client markup identical.
  useEffect(() => {
    setSessionExpired(new URLSearchParams(window.location.search).get('expired') === '1');
  }, []);

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

        {sessionExpired && (
          <div
            role="status"
            className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-800 text-sm"
          >
            <Clock className="w-4 h-4 shrink-0" />
            <span>{SESSION_EXPIRED_MESSAGE}</span>
          </div>
        )}

        <LoginForm onSuccess={() => router.replace('/')} />

        <div className="text-center pt-2 border-t border-border-slate/10">
          <p className="text-xs text-muted-dark/80">
            SHALOM — Gestión Comercial, Pedidos y WhatsApp &copy; 2026
          </p>
        </div>
      </div>
    </div>
  );
}
