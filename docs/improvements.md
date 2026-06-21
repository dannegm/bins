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

## Resumen de prioridades

| Prioridad | Item | Esfuerzo |
|-----------|------|----------|
| 🟡 Perf | Monaco bundle optimizado (#6) | Medio |
| 🔵 UX | Badge en embed (#8) | Muy bajo |
| 🔵 UX | Historial de versiones (#9) | Alto |
| ⚪ Deuda | Docs en /docs vacíos (#10) | Medio |
