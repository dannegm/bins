# Bins — Estado del proyecto

## TL;DR

Fase 2 ~95% completa (solo falta regex runner). Fase 3 ~70%.

---

## Runner pendiente

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

1. **Regex runner** — cierra la Fase 2. Usa regexper embebido o su API; Railroad diagrams para patrones regex
2. **Favicon + document.title** — se nota mucho en uso diario, bajo esfuerzo
3. **Search widget** — drag+snap, mejora navegación entre bins
4. **Paquetes npm modal** — permite que el JS runner cargue dependencias externas
