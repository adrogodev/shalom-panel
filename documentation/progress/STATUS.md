# Estado del Repositorio Panel — SHALOM

## Información General

- **Fase Actual:** FASE 5 — Dashboard y Finanzas (COMPLETADA)
- **Última Actualización:** 2026-11-04
- **Branch Activo:** `main`

---

## Tareas Realizadas (Fase 5)

- [x] Sincronización del contrato OpenAPI con `pnpm contract:sync` (nuevos endpoints y esquemas de `expenses`, `finance`, `dashboard` y `reports`).
- [x] Dashboard interactivo (`/`):
  - KPIs con deltas porcentuales y comparativa respecto al período anterior (Hoy, Semana, Mes).
  - Alerta de seguridad para variantes con stock crítico.
  - Gráficos interactivos con Recharts: Área temporal de ventas vs egresos y dona de distribución de estados de pedidos.
  - Tabla de ranking de productos más vendidos por facturación.
- [x] Vista de Finanzas y Control de Gastos (`/finances`):
  - Tablero de control de P&L con cálculo de Ganancia Bruta, OPEX, Ganancia Neta, Margen Neto %, ROI y Valorización de Inventario.
  - Formulario modal para registrar egresos operativos en COP con categorización y método de pago.
  - Tabla de egresos con eliminación y pestaña para el Libro Mayor de Transacciones Financieras.
- [x] Centro de Reportes y Exportación (`/reports`):
  - Tarjetas de exportación para Ventas, Inventario, Clientes CRM y Gastos Operativos.
  - Selector de rangos de fecha y formatos (CSV y JSON).
  - Descarga directa en navegador con formateo UTF-8 y compatibilidad RFC 4180.
- [x] Pruebas unitarias en Vitest pasando al 100% y build de Next.js generando 11 rutas estáticas sin errores.

---

## Tareas Pendientes (Próxima: Fase 6)

- [ ] Bandeja de entrada en tiempo real de WhatsApp (`/whatsapp`) en 3 columnas.
- [ ] Conexión y escaneo de código QR para Evolution API.
- [ ] Creación rápida de pedidos directamente desde el chat.

---

## Bloqueos Activos

- Ninguno.
