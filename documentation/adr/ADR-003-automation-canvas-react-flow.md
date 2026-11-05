# ADR-003: Construcción Visual de Automatizaciones con React Flow

- **Estado:** Aprobado
- **Fecha:** 2026-11-04
- **Contexto:** Se requiere una interfaz intuitiva para que los operadores o administradores diseñen flujos automatizados de mensajería y acciones comerciales (ej. bienvenida, confirmación de pedido, recordatorio de pago) sin escribir código.
- **Decisión:** Integrar **React Flow** (`@xyflow/react`) en el slice `widgets/automation-canvas`. El canvas manipula únicamente nodos visuales y aristas dirigidas, serializándolos en un esquema JSON estándar que se envía al backend. El backend es el único responsable de validar ciclos y ejecutar los flujos.
- **Consecuencias:**
  - *Positivas:* Interfaz moderna con zoom, paneo, mini-mapa, drag-and-drop de nodos y validaciones interactivas; total independencia entre la representación visual y el motor de ejecución en el servidor.
  - *Trade-offs:* Curva de aprendizaje para la personalización de Custom Nodes y Custom Edges en React Flow.
