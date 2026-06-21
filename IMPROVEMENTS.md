# Bins — Mejoras propuestas

---

## 🔴 Seguridad

### 2. `x-client-id` es spoofeable — la identidad anónima no es un modelo de seguridad
Cualquier request puede enviar cualquier UUID como `x-client-id`. Las políticas RLS confían completamente en este header. Un usuario malicioso puede eliminar bins de otra persona si conoce su UUID, o impersonar a cualquier usuario cuyo UUID haya obtenido (aparece en `/user/:uuid`, en awareness, etc.).

**Corto plazo:** Documentar que este es un modelo de "buena fe" — la app no pretende ser un sistema de autenticación real.

**Largo plazo:** Migrar a Supabase Auth con usuarios anónimos (nativo desde 2024) — mantiene la UX sin registro pero con tokens firmados no falsificables.

---

### 3. `new Function` en el proveedor AI Custom Nivel 2
El adapter JS personalizado ejecuta código arbitrario con `new Function`. Es un vector de XSS/data exfiltration si alguien comparte settings maliciosos via URL.

**Solución:** Ejecutar el adapter en un Web Worker aislado, o mostrar advertencia explícita al importar settings con adapter JS personalizado.

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
| 🔴 Crítico | x-client-id spoofeable (#2) | Alto |
| 🔴 Crítico | `new Function` en AI Custom (#3) | Medio |
| 🟡 Perf | Monaco bundle optimizado (#6) | Medio |
| 🔵 UX | Badge en embed (#8) | Muy bajo |
| 🔵 UX | Historial de versiones (#9) | Alto |
| ⚪ Deuda | Docs en /docs vacíos (#10) | Medio |
