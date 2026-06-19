# Tasks — Layout fijo de videollamada

## Fase 1 — Specs

- [x] 1.1 Revisar delta `specs/ui/spec.md`
- [x] 1.2 Validar semántica finalizar room (`cancel`) vs staff (`complete`)

## Fase 2 — Componente video

- [x] 2.1 Refactor `VideoCallSession` layout: header / stage / footer
- [x] 2.2 Marco remoto 16:9 + `object-contain` + `max-h` viewport
- [x] 2.3 PiP local reposicionado (no overlap footer)
- [x] 2.4 Footer fijo con `safe-area-inset-bottom`
- [x] 2.5 Implementar `endCall()` staff → PATCH complete
- [x] 2.6 Implementar `endCall()` room → PATCH cancel room
- [x] 2.7 Prop `onEnded` + cleanup WebRTC
- [x] 2.8 Estado loading/disabled en botón finalizar

## Fase 3 — Integración pantallas

- [x] 3.1 Dashboard video: fullscreen, sin link "Volver" durante llamada
- [x] 3.2 Habitación overlay: `onEnded` optimista + SSE
- [x] 3.3 Unificar `fullscreen` dashboard con habitación (misma shell)

## Fase 4 — Verificación

- [x] 4.1 Manual: tablet habitación + PC dashboard — sin deformación
- [x] 4.2 Manual: finalizar desde ambos lados
- [x] 4.3 Manual: prod `habitacion.lionapp.cloud` tras deploy
- [x] 4.4 `npm run build`
- [x] 4.5 Completar `verify-report.md`

## Fase 5 — Cierre SDD

- [x] 5.1 Fusionar delta → `openspec/specs/ui/spec.md`
- [x] 5.2 Archivar en `openspec/changes/archive/2026-06-19-video-ui-fixed-layout/`

## Dependencias

```
1 → 2 → 3 → 4 → 5
```

Estimación: **1 sesión** (solo frontend).
