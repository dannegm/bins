# Bins — Mejoras propuestas

---

## 🟡 Performance

### 6. Bundle de Monaco no optimizado

`vite-plugin-monaco-editor` incluye workers para todos los lenguajes por default.

**Acción:** Configurar el plugin para incluir solo los workers necesarios (TypeScript, JSON, CSS, HTML).

---

## 🔵 UX y Producto

### 9. Sin historial de versiones navegable

Yjs guarda la historia en `Y.Doc` pero no hay UI para navegarla.

**MVP:** Panel con los últimos N eventos del `Y.UndoManager` con timestamp y autor, con opción de rollback.

---

## ⚪ Deuda técnica

### 10. `/docs` está vacío

`CLAUDE.md` y `PLAN.md` prometen 10 archivos en `/docs/`. Ninguno tiene contenido.

**Prioridad:** `docs/architecture.md`, `docs/runners.md`, `docs/sync.md`.

---

## 🤖 AI

### 14. "Explain this"

No hay forma de entender un bin ajeno rápidamente sin leer el código.

**Mejora:** Botón en el status bar que manda el archivo activo al LLM configurado (reutilizando el sistema de AI Completions) y abre un panel con la explicación en lenguaje natural.

---

### 15. Generar bin desde prompt

No hay forma de crear contenido desde cero sin escribir manualmente.

**Mejora:** Input en la home — "crea un servidor Express con 3 rutas REST" — que genera el bin con los archivos sugeridos por el LLM. Usa el proveedor de AI Completions configurado por el usuario.

---

### 16. AI rename

Titular un bin o nombrar archivos es fricción innecesaria cuando el contenido ya existe.

**Mejora:** Botón en el bin header que sugiere un título para el bin o nombre para el archivo activo basándose en su contenido. Un solo click, usa el LLM configurado.

---

## Resumen de prioridades

| Prioridad | Item                          | Esfuerzo |
| --------- | ----------------------------- | -------- |
| 🟡 Perf   | Monaco bundle optimizado (#6) | Medio    |
| 🔵 UX     | Historial de versiones (#9)   | Alto     |
| ⚪ Deuda  | Docs en /docs vacíos (#10)    | Medio    |
| 🤖 AI     | Explain this (#14)            | Bajo     |
| 🤖 AI     | AI rename (#16)               | Muy bajo |
| 🤖 AI     | Generar bin desde prompt (#15)| Alto     |
