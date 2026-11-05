# ADR-002: Estrategia de Sincronización del Contrato OpenAPI y Generación de Tipos

- **Estado:** Aprobado
- **Fecha:** 2026-11-04
- **Contexto:** Al ser `panel` un repositorio independiente de `server`, el frontend no debe depender de imports relativos hacia el backend ni de workspaces compartidos de TypeScript. Sin embargo, se requiere tipado estricto de endpoints, DTOs y parámetros de consulta.
- **Decisión:** Versionar una copia estática del archivo `openapi.json` dentro de `panel/contracts/`. Proporcionar el script `pnpm contract:sync` que obtiene el spec desde una URL o archivo configurable y ejecuta `openapi-typescript` para generar `src/shared/api/generated.ts`. El pipeline de CI de `panel` compila y prueba contra dicha copia versionada sin requerir el backend en ejecución.
- **Consecuencias:**
  - *Positivas:* Desacoplamiento total en tiempo de compilación y CI; detección temprana de breaking changes en las interfaces del backend; autocompletado y tipado estricto en el cliente HTTP.
  - *Trade-offs:* Requiere ejecutar manualmente o vía script de sincronización `pnpm contract:sync` cada vez que el backend modifique un DTO o endpoint.
