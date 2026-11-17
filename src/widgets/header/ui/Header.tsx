'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { logout, useHydratedSession } from '@/features/authentication';
import {
  Bell,
  LogOut,
  User,
  CheckCheck,
  AlertTriangle,
  ShoppingBag,
  MessageCircle,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  actionUrl?: string;
  actionText?: string;
}

const initialNotifications: NotificationItem[] = [
  {
    id: '1',
    title: 'Stock Bajo de Seguridad',
    description: 'Tienes 3 variantes de productos con stock igual o inferior al umbral mínimo.',
    time: 'Hace 5 min',
    icon: AlertTriangle,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    actionUrl: '/inventory',
    actionText: 'Revisar Kardex',
  },
  {
    id: '2',
    title: 'Pedidos por Confirmar',
    description: '2 pedidos recibidos por WhatsApp requieren validación de comprobante.',
    time: 'Hace 20 min',
    icon: ShoppingBag,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    actionUrl: '/orders',
    actionText: 'Ver Pedidos',
  },
  {
    id: '3',
    title: 'WhatsApp Conectado',
    description: 'Instancia activa con Evolution API sincronizada en tiempo real.',
    time: 'Hace 1 hora',
    icon: MessageCircle,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    actionUrl: '/whatsapp',
    actionText: 'Abrir Bandeja',
  },
];

export function Header() {
  const router = useRouter();
  const { user } = useHydratedSession();
  const [isOpen, setIsOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const panelRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      router.replace('/login');
    }
  };

  const handleMarkAllAsRead = () => {
    setNotifications([]);
  };

  // Cerrar panel al hacer clic afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <header className="h-16 bg-white border-b border-border-slate/20 px-6 flex items-center justify-end shrink-0 relative z-30">
      <div className="flex items-center gap-5">
        {/* Notificaciones */}
        <div className="relative" ref={panelRef}>
          <button
            type="button"
            aria-label="Notificaciones"
            onClick={() => setIsOpen((prev) => !prev)}
            className={cn(
              'p-2 text-muted-dark hover:text-primary-base rounded-lg transition relative',
              isOpen ? 'bg-surface-light text-primary-base' : 'hover:bg-surface-light',
            )}
          >
            <Bell className="w-4 h-4" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white animate-pulse" />
            )}
          </button>

          {/* Panel Flotante Desplegable de Notificaciones */}
          {isOpen && (
            <div className="absolute right-0 mt-3 w-96 bg-white rounded-2xl shadow-2xl border border-border-slate/20 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Encabezado */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border-slate/10 bg-white">
                <h3 className="font-bold text-base text-primary-base">Notificaciones</h3>
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-deep-olive hover:text-deep-olive/80 transition"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span>Marcar como leído</span>
                  </button>
                )}
              </div>

              {/* Lista o Estado Vacío */}
              {notifications.length === 0 ? (
                <div className="py-20 text-center text-muted-dark/70 text-sm font-medium">
                  No tienes notificaciones
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto divide-y divide-border-slate/10">
                  {notifications.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.id}
                        className="p-4 hover:bg-surface-light/60 transition flex items-start gap-3.5"
                      >
                        <div className={cn('p-2 rounded-xl shrink-0 mt-0.5', item.iconBg)}>
                          <Icon className={cn('w-4 h-4', item.iconColor)} />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold text-primary-base truncate">{item.title}</p>
                            <span className="text-[10px] text-muted-dark/70 shrink-0">{item.time}</span>
                          </div>
                          <p className="text-xs text-muted-dark leading-relaxed">{item.description}</p>
                          {item.actionUrl && (
                            <Link
                              href={item.actionUrl}
                              onClick={() => setIsOpen(false)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-deep-olive hover:underline pt-1"
                            >
                              <span>{item.actionText}</span>
                              <span>&rarr;</span>
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

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
            disabled={loggingOut}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            className="p-1.5 text-muted-dark hover:text-red-600 hover:bg-red-50 rounded-lg transition ml-1 disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
