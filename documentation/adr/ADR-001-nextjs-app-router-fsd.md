# ADR-001: Integración de Feature-Sliced Design (FSD) con Next.js App Router

- **Estado:** Aprobado
- **Fecha:** 2026-11-04
- **Contexto:** Next.js impone una estructura de enrutamiento basada en el sistema de archivos (`app/`), mientras que Feature-Sliced Design (FSD) organiza el código por capas de abstracción y slices de negocio (`app`, `pages`, `widgets`, `features`, `entities`, `shared`). Mezclar lógica de negocio directamente dentro de los layouts y pages de Next.js genera acoplamiento y dificulta la reutilización.
- **Decisión:** Mantener la carpeta `app/` en la raíz de `panel/` únicamente para Server Components delgados que definen el árbol de rutas y delegan el renderizado a páginas completas en `src/pages/*`. Todo el código de la aplicación se encapsula dentro de `src/` bajo la estricta jerarquía FSD.
- **Consecuencias:**
  - *Positivas:* Código frontend altamente testeable, componentes desacoplados del framework de enrutamiento, arquitectura predecible y escalable.
  - *Trade-offs:* Requiere un paso adicional de re-exportación en `app/` y la inclusión de una carpeta vacía `pages/` en la raíz con un README para evitar que Next.js asuma Pages Router.
