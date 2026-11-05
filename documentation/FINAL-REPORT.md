# SHALOM Panel — Reporte Final de Arquitectura, Frontend y Entrega

**Fecha de Entrega:** 2026-11-04  
**Versión:** 1.0.0 (Producción Ready)  
**Autor:** Equipo de Frontend & UX/UI SHALOM  

---

## 1. Resumen Ejecutivo

El frontend administrativo de **SHALOM** ha sido desarrollado bajo los estándares de **Feature-Sliced Design (FSD)** sobre **Next.js 15 (App Router)** y **React 19**, estilizado con **Tailwind CSS v4** mediante directivas `@theme` y una paleta sobria corporativa pensada para uso intensivo en operaciones comerciales.

El proyecto es totalmente autónomo y no requiere el código fuente del backend para compilar o desplegarse. Se integra exclusivamente mediante el contrato OpenAPI generado en `src/shared/api/generated.ts` y eventos de WebSocket en tiempo real.

---

## 2. Estructura de Rutas y Módulos FSD

| Ruta URL | Capa FSD | Módulo / Funcionalidad | Estado |
| :--- | :--- | :--- | :--- |
| `/login` | `pages/login` | Autenticación con JWT, persistencia Zustand y validación Zod | ✅ Verificado |
| `/` | `pages/home` | Dashboard ejecutivo con Recharts, deltas % y alertas de stock | ✅ Verificado |
| `/products` | `pages/products` | Catálogo, variantes con JSONB, SKU único y cálculo de márgenes | ✅ Verificado |
| `/inventory` | `pages/inventory` | Control de stock físico/reservado/disponible, Kardex y valorización | ✅ Verificado |
| `/customers` | `pages/customers` | Directorio CRM con teléfonos normalizados E.164 (+57) y tags | ✅ Verificado |
| `/orders` | `pages/orders` | Máquina de estados, snapshots inmutables de costo y pagos | ✅ Verificado |
| `/finances` | `pages/finances` | Tablero P&L (Ventas, COGS, Bruta, OPEX, Neta, ROI) y Libro Mayor | ✅ Verificado |
| `/reports` | `pages/reports` | Centro de exportación en streaming CSV (RFC 4180) y JSON | ✅ Verificado |
| `/whatsapp` | `pages/whatsapp` | Bandeja en 3 columnas, mensajes en tiempo real y pedido rápido | ✅ Verificado |
| `/automations` | `pages/automations` | Galería de automatizaciones, triggers y plantillas recomendadas | ✅ Verificado |
| `/automations/[id]` | `pages/automations` | Constructor visual de flujos con React Flow y validación DAG | ✅ Verificado |

---

## 3. Identidad Visual y Design Tokens (Tailwind v4)

La paleta se encuentra configurada en `panel/src/app/globals.css`:
- **Base Principal (`--color-primary-base`):** `#1A292C` (Gris petróleo oscuro para alta legibilidad).
- **Oliva Profundo (`--color-deep-olive`):** `#2B4C3F` (Énfasis en acciones principales y navegación activa).
- **Acento Salvia (`--color-accent-sage`):** `#B3C9BF` (Bordes sutiles y etiquetas secundarias).
- **Verde Operativo (`--color-active-green`):** `#1B5E20` (Indicadores de estado conectado y WhatsApp activo).
- **Superficie Clara (`--color-surface-light`):** `#F4F7F5` (Fondo descansado para reducir fatiga visual).
- **Muted Oscuro (`--color-muted-dark`):** `#717E80` (Textos secundarios y metadatos).

---

## 4. Instrucciones de Arranque y Acceso

1. **Instalación de dependencias:**
   ```bash
   pnpm install
   ```
2. **Sincronización del Contrato:**
   ```bash
   pnpm contract:sync
   ```
3. **Compilación de Producción:**
   ```bash
   pnpm build
   ```
4. **Ejecutar Pruebas Unitarias:**
   ```bash
   pnpm test
   ```
5. **Iniciar Servidor de Desarrollo:**
   ```bash
   pnpm dev
   ```
   *Acceso en navegador:* `http://localhost:3000`

---

## 5. Credenciales de Acceso Administrador (Seed)

- **Email:** `admin@shalom.local`
- **Contraseña:** `ShalomAdmin2026!`
- **Rol:** `ADMIN` (acceso a todos los módulos y permisos)
