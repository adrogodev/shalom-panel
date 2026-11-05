# SHALOM Panel — Frontend Administrativo y Automatización

Frontend web empresarial para la gestión integral de productos, pedidos, clientes, conversaciones de WhatsApp y flujos automatizados de **SHALOM**.

Construido con **Next.js 15 (App Router)**, **React 19**, **TypeScript Estricto**, **Tailwind CSS v4**, **shadcn/ui**, **TanStack Query**, **Zustand**, **React Flow**, **Vitest** y **Playwright**, bajo la metodología **Feature-Sliced Design (FSD)**.

---

## 1. Requisitos Previos

- **Node.js:** `v22.16.0` o superior (LTS).
- **pnpm:** `10.11.0` o superior.
- **Docker y Docker Compose:** Para despliegue local en contenedor (opcional para desarrollo local).

---

## 2. Puesta en Marcha Local

### 2.1. Instalación de dependencias
```bash
pnpm install
```

### 2.2. Variables de entorno
Copia el archivo de plantilla:
```bash
cp .env.example .env
```
Configura la URL del backend y assets:
- `NEXT_PUBLIC_API_URL`: URL del servidor API accesible desde el navegador.
- `NEXT_PUBLIC_WS_URL`: Gateway WebSocket para eventos en tiempo real.
- `NEXT_PUBLIC_ASSETS_URL`: Endpoint público de MinIO para imágenes.

### 2.3. Sincronización del Contrato API
Genera los tipos estáticos de TypeScript basados en la especificación OpenAPI:
```bash
pnpm contract:sync
```

### 2.4. Ejecutar en desarrollo
```bash
pnpm dev
```
La aplicación estará disponible en `http://localhost:3000`.

---

## 3. Scripts Disponibles

- `pnpm dev`: Inicia el servidor de desarrollo en modo hot-reload.
- `pnpm build`: Compila la aplicación con optimización para producción (`output: standalone`).
- `pnpm start`: Arranca el servidor de producción compilado.
- `pnpm test`: Ejecuta pruebas unitarias de componentes y hooks con Vitest.
- `pnpm test:e2e`: Ejecuta pruebas end-to-end con Playwright.
- `pnpm lint`: Verifica tipos y cumplimiento de fronteras FSD.
- `pnpm contract:sync`: Actualiza `contracts/openapi.json` y genera los tipos del cliente en `src/shared/api/generated.ts`.

---

## 4. Despliegue con Docker

El proyecto cuenta con un `Dockerfile` multi-stage ligero optimizado para Next.js Standalone:
```bash
docker compose up -d
```
El panel corre de forma aislada y no levanta bases de datos ni servicios de terceros.

---

## 5. Arquitectura y Documentación

- [`documentation/fsd-architecture.md`](file:///documentation/fsd-architecture.md): Capas de Feature-Sliced Design y reglas de acoplamiento.
- [`documentation/screens-flow.md`](file:///documentation/screens-flow.md): Especificación de vistas, experiencia de usuario y paleta de color.
- [`documentation/contracts-expected.md`](file:///documentation/contracts-expected.md): Contrato OpenAPI y eventos de WebSocket.
- [`documentation/adr/`](file:///documentation/adr/): Registros de Decisiones de Arquitectura (ADRs).
