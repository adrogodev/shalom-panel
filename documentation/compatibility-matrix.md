# Matriz de Compatibilidad de Versiones — Panel

## Decisiones de Versiones Fijas (Sin `latest`)

| Tecnología / Paquete | Versión Fijada | Justificación y Compatibilidad |
| :--- | :--- | :--- |
| **Node.js** | `v22.16.0` (LTS Iron) | Entorno de ejecución estándar y unificado. |
| **pnpm** | `10.11.0` | Gestor de paquetes unificado y estricto. |
| **Next.js** | `^15.2.0` (App Router) | Soporte de React 19, Server Components y optimización de assets con salida standalone para Docker. |
| **React** | `^19.0.0` | Versión estándar moderna con Actions, hooks de formularios y soporte de streaming. |
| **Tailwind CSS** | `^4.0.0` | Configuración moderna con `@theme` CSS-first sin archivo `tailwind.config.js` innecesario. |
| **shadcn/ui** | Componentes base | Sistema de componentes accesible, headless sobre Radix UI / Lucide React. |
| **TanStack Query** | `^5.66.0` | Manejo de estado asíncrono en cliente, invalidación reactiva de caché y reintentos. |
| **Zustand** | `^5.0.3` | Estado global liviano para navegación, filtros de UI y sesión local. |
| **React Hook Form + Zod** | `^7.54.0` / `^3.24.0` | Validación estricta en el borde del cliente con inferencia de tipos estáticos. |
| **React Flow (@xyflow/react)** | `^12.4.0` | Constructor interactivo y drag-and-drop de grafos para automatizaciones. |
| **Recharts** | `^2.15.0` | Gráficas declarativas para métricas de ventas, rentabilidad y pedidos. |
| **openapi-typescript** | `^7.6.0` | Generación de contratos TypeScript a partir del spec `openapi.json`. |
| **Vitest** | `^3.0.0` | Suite de pruebas unitarias ultrarrápida compatible con ESM. |
| **Playwright** | `^1.50.0` | Pruebas end-to-end de flujos de negocio completos. |
