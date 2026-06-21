# Bins — Estado del proyecto

## TL;DR

Fase 2 ~90% completa (falta regex runner). Fase 3 ~70%. El producto es funcional y desplegable.

---

## Runners pendientes

| Runner | Lenguajes | Descripción |
|---|---|---|
| **Regex** | `regex` | Railroad diagrams via regexper |

---

## Polish pendiente (Fase 3)

| Feature | Archivo | Notas |
|---|---|---|
| Search widget drag+snap | `components/system/search-widget.jsx` | No existe aún |
| Paquetes npm modal | `components/system/packages-modal.jsx` | No existe aún |
| Favicon dinámico | `hooks/use-favicon.js` | Dot según estado de guardado |
| `document.title` dinámico | `hooks/use-document-title.js` | Prefijos ✏️/💡 según modo |
| Tips widget en editor | — | `tips-carousel.jsx` existe; falta icono 💡 en status bar + widget flotante |
| Lenguajes custom | — | Arduino, `.env`, logs, Minecraft |

---

## Próximos pasos recomendados

1. **Regex runner** — rápido de implementar (regexper), valor alto para usuarios técnicos
2. **HTTP runner** — el más complejo; depende del proxy `VITE_PROXY_URL`
3. **Favicon + document.title** — pulido de calidad, se nota mucho en uso diario
4. **Search widget** — mejora la UX de navegación entre bins
