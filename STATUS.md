# Bins — Estado del proyecto

## TL;DR

Fase 1 completa, Fase 2 pendiente, Fase 3 ~70%. El producto es funcional y desplegable como está — falta el sistema de runners y algunos pulidos.

---

## Qué falta

### Fase 2 — Runners (pendiente completa)

El bloque más grande. Los keybindings y comandos de la palette ya están registrados (`editor:toggle-runner`) pero no hay implementación. Falta crear desde cero:

- `src/services/runners.js` — registro pluggable por lenguaje
- `src/components/editor/runner-panel.jsx` — ResizablePanel desktop / Drawer mobile, estado en URL `?runner`
- `src/components/runners/markdown-runner.jsx` — preview Markdown
- `src/components/runners/html-runner.jsx` — iframe sandboxed + import resolver
- `src/components/runners/js-repl-runner.jsx` — sucrase REPL con output de consola
- `src/components/runners/regex-runner.jsx` — railroad diagrams (regexper)
- `src/components/runners/http-runner.jsx` — cliente HTTP tipo Postman via proxy

### Fase 3 — Polish pendiente

| Feature | Notas |
|---|---|
| Search widget drag+snap | `components/system/search-widget.jsx` |
| Paquetes npm modal | `components/system/packages-modal.jsx` |
| Favicon dinámico | `hooks/use-favicon.js` — dot según estado |
| `document.title` dinámico | `hooks/use-document-title.js` — prefijos ✏️/💡 |
| Tips widget en editor | Tips en `constants/tips.js`, falta icono 💡 en status bar + widget flotante |
| Lenguajes custom | Arduino, CSV, .env, logs, Minecraft |

---

## Próximos pasos recomendados

**En orden de impacto:**

1. **Runners (Fase 2 completa)** — es la feature distintiva del producto, lo que lo diferencia de un Pastebin normal
2. **Favicon + document.title** — pulido de calidad que se nota mucho en uso diario
