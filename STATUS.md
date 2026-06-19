# Bins — Estado del proyecto

## TL;DR

Fase 1 completa, Fase 2 pendiente, Fase 3 ~60%. El producto es funcional y desplegable como está — falta el sistema de runners y algunos pulidos.

---

## Qué está hecho

### Fase 1 — MVP ✅ Completo

Todo lo planificado más extras:

- Scaffold completo (Vite + React + Tailwind v4 + Base UI + TanStack Router/Query)
- 6 temas UI (Dark, Light, Dracula, Rosé Pine Dawn, Tlapalli Quartz, Tlapalli Fire Opal) + temas Monaco
- Identidad anónima — UUID en localStorage, upsert silencioso a Supabase en cada visita
- Editor colaborativo — Monaco + Yjs CRDT + Supabase Realtime, cursores remotos con decoraciones
- Tabs — drag & drop, rename, confirmación al borrar, dot en cambios no vistos, undo/redo
- Home — hero, tus bins, compartidos contigo, búsqueda, paginación, filtros
- Settings completo — Identidad, Apariencia, Editor, Keybindings, Prettier, AI Completions, Import/Export, Danger Zone; headers sticky
- AI Completions — Claude, OpenAI, Gemini, OpenRouter, Ollama, Custom (JSON y JS)
- Command palette — navegación numérica, páginas anidadas, admin auth con prefijo `$%&:`
- Fork con página de animación (`/fork/:binId`)
- Share con visibilidad (public / unlisted / private)
- Perfil público `/user/:uuid`
- Modo admin `/admin/bins` y `/admin/users` — edición override, sticky headers
- Embed `/embed/:id` (readonly, sin UI)
- Expiración de bins — `expires_at` + cron job de limpieza
- Descarga individual y ZIP (fflate)
- Right to be forgotten — elimina perfil + bins + redirige a `/forgotten`
- Nudge MSN — sonido + shake + vibración en móvil
- Global dropzone — arrastrar archivo desde fuera del editor crea un bin nuevo
- Toasts headless personalizados con tokens del tema
- Import/Export de settings via URL

### Fase 3 — Polish (parcial)

- ✅ Embed
- ✅ Modo admin
- ✅ Expiración de bins
- ✅ Descarga individual y ZIP
- ✅ Mobile nav y layout responsivo (pulido continuo)

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

| Feature | Estado | Notas |
|---|---|---|
| Session export/import JWT | Botón deshabilitado, `/login` es stub | Requiere `jose` + `VITE_SESSION_SECRET` |
| Admin auth funcional | UI lista en command palette | Solo hace `console.log` del password |
| Error boundary BSOD | No existe | `components/system/error-boundary.jsx` |
| Search widget drag+snap | No existe | `components/system/search-widget.jsx` |
| Paquetes npm modal | No existe | `components/system/packages-modal.jsx` |
| Favicon dinámico | No existe | `hooks/use-favicon.js` — dot según estado |
| `document.title` dinámico | No existe | `hooks/use-document-title.js` — prefijos ✏️/💡 |
| Tips widget en editor | Tips existen en `constants/tips.js` | Falta icono 💡 en status bar + widget flotante |
| Lenguajes custom | No implementados | Arduino, CSV, .env, logs, Minecraft |

### Supabase pendiente

- [ ] Índice `idx_profiles_is_bot`
- [ ] Cron job de borrado de bots (lunes 3am, cascada a bins)

---

## Próximos pasos recomendados

**En orden de impacto:**

1. **Runners (Fase 2 completa)** — es la feature distintiva del producto, lo que lo diferencia de un Pastebin normal
2. **Session export JWT** — login page + botón en settings + generación del JWT
3. **Admin auth funcional** — pequeño, solo conectar el password del command palette a lógica real
4. **Favicon + document.title** — pulido de calidad que se nota mucho en uso diario
5. **Error boundary BSOD** — safety net antes de producción seria
