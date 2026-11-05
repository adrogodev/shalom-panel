'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/authentication';
import { Search, Bell, LogOut, MessageCircle, User } from 'lucide-react';

export function Header() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-border-slate/20 px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-border-slate absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar pedidos, clientes, productos (SKU / Teléfono)..."
            className="w-full pl-9 pr-4 py-1.5 bg-surface-light border border-border-slate/30 rounded-lg text-xs text-primary-base placeholder:text-muted-dark/50 focus:outline-none focus:ring-2 focus:ring-deep-olive/20 focus:border-deep-olive transition"
          />
        </div>
      </div>

      <div className="flex items-center gap-5">
        {/* Indicador de WhatsApp en tiempo real */}
        <div className="flex items-center gap-2 px-3 py-1 bg-active-green/10 text-active-green border border-active-green/20 rounded-full text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-active-green animate-pulse" />
          <MessageCircle className="w-3.5 h-3.5" />
          <span>WhatsApp Conectado</span>
        </div>

        {/* Notificaciones */}
        <button
          type="button"
          aria-label="Notificaciones"
          className="p-2 text-muted-dark hover:text-primary-base hover:bg-surface-light rounded-lg transition relative"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-deep-olive rounded-full" />
        </button>

        {/* Perfil y Logout */}
        <div className="flex items-center gap-3 pl-4 border-l border-border-slate/20">
          <div className="w-8 h-8 rounded-full bg-deep-olive/15 text-deep-olive flex items-center justify-center font-bold text-xs uppercase">
            {user?.firstName?.charAt(0) || <User className="w-4 h-4" />}
          </div>
          <div className="text-left hidden sm:block">
            <span className="block text-xs font-semibold text-primary-base leading-tight">
              {user ? `${user.firstName} ${user.lastName}` : 'Administrador'}
            </span>
            <span className="block text-[10px] text-muted-dark leading-tight">
              {user?.roles?.[0] || 'Superadmin'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            title="Cerrar sesión"
            className="p-1.5 text-muted-dark hover:text-red-600 hover:bg-red-50 rounded-lg transition ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
