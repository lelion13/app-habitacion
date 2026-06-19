# Verify Report — video-ui-fixed-layout

**Change:** video-ui-fixed-layout  
**Fecha:** 2026-06-19  
**Entorno:** local (build + unit tests)

## Layout visual

| # | Caso | 375px | 768px | 1280px |
|---|------|-------|-------|--------|
| 1 | Marco 16:9 visible, centrado | ☐ | ☐ | ☐ |
| 2 | Remoto sin deformación (4:3 vs 16:9) | ☐ | ☐ | ☐ |
| 3 | PiP local visible, no tapa footer | ☐ | ☐ | ☐ |
| 4 | Footer fijo siempre visible | ☐ | ☐ | ☐ |
| 5 | Sin scroll vertical en pantalla video | ☐ | ☐ | ☐ |

## Funcional

| # | Caso | Dashboard | Habitación |
|---|------|-----------|------------|
| 1 | Finalizar desde footer | ☐ | ☐ |
| 2 | WebRTC cleanup tras finalizar | ☐ | ☐ |
| 3 | Vuelve a UI pre-llamada | ☐ | ☐ |
| 4 | Finalizar en estado "Conectando…" | ☐ | ☐ |
| 5 | Videollamada sigue conectando tras fix layout | ☐ | ☐ |

## Técnico

| # | Check | Resultado |
|---|-------|-----------|
| 1 | `npm run build` | ✅ OK |
| 2 | `npm run test:unit` | ✅ 16/16 |
| 3 | Sin regresión signaling WebRTC | ☐ manual |

## Implementación

- `VideoCallSession`: shell `100dvh`, header estado, stage `aspect-video` + `object-contain`, PiP local, footer fijo con **Finalizar llamada** y `safe-area-inset-bottom`.
- Staff: `PATCH /api/calls/{id}` `{ action: "complete" }` → `onEnded` → dashboard.
- Room: `PATCH /api/calls/room` `{ action: "cancel" }` → `onEnded` → overlay off.
- Dashboard `/dashboard/video/[callId]`: solo `VideoCallSession` fullscreen.
- Habitación: overlay fullscreen con misma shell.

## Sign-off

- [x] Criterios proposal cumplidos (código)
- [ ] Listo para archivar (pendiente verificación manual + deploy prod)
