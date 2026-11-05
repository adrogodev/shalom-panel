import type { Metadata } from 'next';
import '@/app/globals.css';
import { Providers } from '@/app/providers';

export const metadata: Metadata = {
  title: 'SHALOM — Plataforma de Gestión Comercial y WhatsApp',
  description: 'Gestión integral de productos, inventario, pedidos y automatización de WhatsApp.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased bg-surface-light text-primary-base font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
