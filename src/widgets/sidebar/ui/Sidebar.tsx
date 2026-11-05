'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingCart,
  Users,
  MessageSquare,
  Workflow,
  DollarSign,
  FileSpreadsheet,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';

const navigationItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Productos', href: '/products', icon: Package },
  { name: 'Inventario', href: '/inventory', icon: Layers },
  { name: 'Pedidos', href: '/orders', icon: ShoppingCart },
  { name: 'Clientes CRM', href: '/customers', icon: Users },
  { name: 'WhatsApp', href: '/whatsapp', icon: MessageSquare },
  { name: 'Automatizaciones', href: '/automations', icon: Workflow },
  { name: 'Finanzas', href: '/finances', icon: DollarSign },
  { name: 'Reportes', href: '/reports', icon: FileSpreadsheet },
  { name: 'Configuración', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const currentPath = pathname || '/';

  return (
    <aside className="w-64 bg-primary-base text-surface-light flex flex-col shrink-0 border-r border-border-slate/30 min-h-screen">
      <div className="p-5 flex items-center gap-3 border-b border-border-slate/20">
        <div className="p-2 bg-deep-olive/60 rounded-lg text-accent-sage">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold tracking-wider text-base text-white">SHALOM</span>
          <span className="block text-[10px] text-accent-sage uppercase tracking-widest font-semibold">
            Comercial & WhatsApp
          </span>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => {
          const isActive = currentPath === item.href || (item.href !== '/' && currentPath.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition group',
                isActive
                  ? 'bg-deep-olive text-white shadow-sm'
                  : 'text-surface-light/70 hover:bg-surface-light/5 hover:text-white',
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 transition',
                  isActive ? 'text-accent-sage' : 'text-border-slate group-hover:text-white',
                )}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border-slate/20 text-xs text-border-slate text-center">
        v1.0.0 &bull; Producción
      </div>
    </aside>
  );
}
