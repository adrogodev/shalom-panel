'use client';

import React from 'react';
import { Sidebar } from '@/widgets/sidebar';
import { Header } from '@/widgets/header';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-surface-light">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
