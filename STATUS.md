# Bins — Estado del proyecto

## TL;DR

Fase 1 completa, Fase 2 en progreso (~30%), Fase 3 ~70%. El producto es funcional y desplegable — el sistema de runners está levantado con Markdown, faltan 4 runners más y los pulidos finales.

---

## Runners — estado actual

La infraestructura está en pie y el primer runner funciona:

| Archivo | Estado |
|---|---|
| `src/services/runners.js` | ✅ Completo — registro pluggable por lenguaje |
| `src/components/editor/runner-panel.jsx` | ✅ Completo — panel lateral desktop, scroll área |
| `src/components/runners/markdown-runner.jsx` | ✅ Completo — preview con GFM, tablas, código |
| `src/components/runners/html-runner.jsx` | ⬜ Pendiente |
| `src/components/runners/js-repl-runner.jsx` | ⬜ Pendiente |
| `src/components/runners/regex-runner.jsx` | ⬜ Pendiente |
| `src/components/runners/http-runner.jsx` | ⬜ Pendiente |

### Runners planeados

| Runner | Lenguajes | Descripción |
|---|---|---|
| **Markdown** | `markdown` | Preview con react-markdown + GFM — ✅ implementado |
| **HTML** | `html` | iframe sandboxed con import resolver para scripts externos |
| **JS / TS / JSX / TSX** | `javascript`, `typescript`, `jsx`, `tsx` | REPL con sucrase en el browser — transpila y ejecuta, muestra output de consola |
| **Regex** | `regex` | Railroad diagrams via regexper |
| **HTTP** | `http` | Cliente REST tipo Postman via `VITE_HTTP_PROXY_URL` |

---

## Qué falta

### Fase 2 — Runners pendientes

- `html-runner.jsx` — iframe sandboxed + resolvedor de imports
- `js-repl-runner.jsx` — sucrase REPL, captura de consola, display de errores
- `regex-runner.jsx` — railroad diagrams (regexper)
- `http-runner.jsx` — cliente HTTP con soporte de métodos, headers, body, proxy

### Fase 3 — Polish pendiente

| Feature | Archivo | Notas |
|---|---|---|
| Search widget drag+snap | `components/system/search-widget.jsx` | No existe aún |
| Paquetes npm modal | `components/system/packages-modal.jsx` | No existe aún |
| Favicon dinámico | `hooks/use-favicon.js` | Dot según estado de guardado |
| `document.title` dinámico | `hooks/use-document-title.js` | Prefijos ✏️/💡 según modo |
| Tips widget en editor | — | `tips-carousel.jsx` existe, falta icono 💡 en status bar + widget flotante |
| Lenguajes custom | — | Arduino, CSV, .env, logs, Minecraft |

---

## Próximos pasos recomendados

1. **HTML runner** — el más visible; cualquier `index.html` pasa a tener preview inmediato
2. **JS/TS REPL runner** — cierra el caso de uso playground/snippet
3. **Regex runner** — rápido de implementar, valor alto para usuarios técnicos
4. **HTTP runner** — el más complejo; depende del proxy
5. **Favicon + document.title** — pulido de calidad, se nota mucho en uso diario
