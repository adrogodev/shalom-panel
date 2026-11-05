# ADR-004: Sistema de Diseño con Tailwind CSS v4 y Componentes shadcn/ui

- **Estado:** Aprobado
- **Fecha:** 2026-11-04
- **Contexto:** La interfaz del panel debe ser responsiva, accesible (WCAG AA), rápida de renderizar y visualmente coherente con la paleta de marca comercial de SHALOM.
- **Decisión:** Adoptar **Tailwind CSS v4** mediante su directiva `@theme` en CSS global, integrando componentes headless de **shadcn/ui** adaptados a los tokens de la marca (`#0E0E0E`, `#FBFBFB`, `#4C4C4C`, `#B3C9BF`, `#717E80`, `#3F472F`, `#3A9D24`).
- **Consecuencias:**
  - *Positivas:* Cero configuración en JavaScript (`tailwind.config.js` obsoleto en v4), máximo rendimiento de compilación mediante el motor nativo de Tailwind, componentes accesibles con teclado y soporte nativo de ARIA por Radix UI.
  - *Trade-offs:* Requiere adaptar manualmente clases y tokens al formato CSS-first de Tailwind v4.
