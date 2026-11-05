# Estado del Repositorio Panel — SHALOM

## Información General

- **Fase Actual:** FASE 7 — Constructor Visual de Automatizaciones (COMPLETADA)
- **Última Actualización:** 2026-11-04
- **Branch Activo:** `main`

---

## Tareas Realizadas (Fase 7)

- [x] Sincronización del contrato OpenAPI con `pnpm contract:sync` (nuevos endpoints y esquemas de `Automations`).
- [x] Vista del Listado de Automatizaciones (`/automations`):
  - Tarjetas de flujos activos e inactivos con métricas de ejecuciones y versiones publicadas.
  - Sección de plantillas recomendadas para comercio por WhatsApp.
  - Modal para creación de nuevos flujos con selección de evento disparador (`ORDER_CREATED`, `ORDER_STATUS_CHANGED`, `CUSTOMER_CREATED`, `MESSAGE_RECEIVED`).
- [x] Constructor Visual Interactivo con React Flow (`@xyflow/react`) (`/automations/[id]`):
  - Lienzo interactivo con minimapa, controles de zoom y cuadrícula.
  - Paleta flotante de nodos: Disparador (Trigger), Enviar WhatsApp, Condición (Si/No Branching), Esperar Retardo.
  - Acciones de Guardado de Borrador y Publicación de Versión.
- [x] Pruebas unitarias en Vitest y compilación Next.js generando 13 rutas limpias.

---

## Tareas Pendientes (Próxima: Fase 8)

- [ ] Suite de pruebas E2E con Playwright.
- [ ] Hardening y auditoría de seguridad para producción.
- [ ] Scripts de despliegue y documentación de entrega.

---

## Bloqueos Activos

- Ninguno.
