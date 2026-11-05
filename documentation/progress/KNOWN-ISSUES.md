# Problemas Conocidos y Limitaciones — SHALOM Panel

## 1. Resolución de Rutas FSD con Next.js App Router
- **Detalle:** Next.js detecta carpetas `pages/` como rutas legacy si no se indica lo contrario.
- **Solución:** Se mantiene un `pages/README.md` vacío en la raíz para explicitar el uso exclusivo de `app/` como router fino hacia `src/pages/`.

## 2. Dependencia de Imagen del Servidor para E2E Reales
- **Detalle:** Para correr pruebas E2E contra el backend real en CI, se requiere que la imagen Docker del `server` esté construida o disponible.
- **Solución:** Se proporciona un modo de mock basado en el contrato OpenAPI para ejecutar CI completamente aislado sin dependencias externas de red.
