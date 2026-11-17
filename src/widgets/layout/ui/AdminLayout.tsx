'use client';

import React from 'react';
import { Sidebar } from '@/widgets/sidebar';
import { Header } from '@/widgets/header';

/**
 * Sidebar and header stay fixed; only the page content scrolls vertically.
 * The scrollbar is hidden but scrolling (wheel, touch, keyboard) still works.
 */
export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-surface-light">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <Header />
        <div
          data-testid="admin-content"
          tabIndex={-1}
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-hidden focus:outline-none"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
