# Bins — Mejoras propuestas

---

## 🟡 Performance

### 6. Bundle de Monaco no optimizado

`vite-plugin-monaco-editor` incluye workers para todos los lenguajes por default.

**Acción:** Configurar el plugin para incluir solo los workers necesarios (TypeScript, JSON, CSS, HTML).

---

## 🔵 UX y Producto

### 8. El embed no tiene link de regreso al bin original

La vista `/embed/:id` no tiene forma de llegar al editor original, reduciendo la viralidad.

**Mejora:** Badge "Open in Bins ↗" en la esquina, ocultable con `?badge=0`.

---

### 9. Sin historial de versiones navegable

Yjs guarda la historia en `Y.Doc` pero no hay UI para navegarla.

**MVP:** Panel con los últimos N eventos del `Y.UndoManager` con timestamp y autor, con opción de rollback.

---

## ⚪ Deuda técnica

### 10. `/docs` está vacío

`CLAUDE.md` y `PLAN.md` prometen 10 archivos en `/docs/`. Ninguno tiene contenido.

**Prioridad:** `docs/architecture.md`, `docs/runners.md`, `docs/sync.md`.

---

## 🌐 Internacionalización

### 11. Monaco i18n no sigue el idioma de la app

Si el usuario cambia el idioma en Settings, Monaco sigue en el idioma del bundle hasta el siguiente reload.

---

---

## 🔵 Compartir

### 12. Embed avanzado

El embed actual es estático. No permite seleccionar qué archivo mostrar, qué tema usar, ni activar el runner.

**Mejora:** Soporte para query params: `?file=index.js&theme=dracula&lines=10-30&runner=1`. Permite embeds quirúrgicos en blogs, documentación y artículos técnicos.

---

### 13. Badge "Open in Bins" en el embed

La vista `/embed/:id` no referencia el origen, eliminando toda viralidad.

**Mejora:** Badge fijo en la esquina con link al editor original. Ocultable con `?badge=0` para casos donde el autor no lo quiera.

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
| 🔵 UX     | Badge en embed (#8, #13)      | Muy bajo |
| 🔵 UX     | Historial de versiones (#9)   | Alto     |
| ⚪ Deuda  | Docs en /docs vacíos (#10)    | Medio    |
| 🔵 UX     | Embed avanzado (#12)          | Medio    |
| 🤖 AI     | Explain this (#14)            | Bajo     |
| 🤖 AI     | AI rename (#16)               | Muy bajo |
| 🤖 AI     | Generar bin desde prompt (#15)| Alto     |
