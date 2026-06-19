# Proposal — Layout fijo de videollamada

**Change:** video-ui-fixed-layout  
**Status:** Planificado  
**Tipo:** Mejora de aplicación (post WebRTC prod)  
**Decisión UX (2026-06-19):** Remoto en marco fijo 16:9 con `object-fit: contain`, PiP local, barra fija inferior con botones.

## Intent

Mejorar la experiencia de videollamada en **dashboard** y **habitación** para que:

1. El video remoto se muestre en un **marco de tamaño fijo** (relación 16:9), independiente de la resolución o aspect ratio del dispositivo del otro extremo.
2. La imagen **no se deforme** (sin estiramiento); usar `object-fit: contain` con letterboxing si hace falta.
3. El conjunto **entre en la pantalla** disponible (mobile-first, tablets, desktop) sin overflow ni recorte involuntario del marco.
4. Los **botones para finalizar la llamada** estén **siempre visibles abajo**, fuera del área de video (barra fija / sticky footer).

Hoy `VideoCallSession` usa `object-cover` en el remoto y no expone acciones de cierre en la UI de video; el staff debe volver al dashboard para finalizar.

## Scope

### In scope

- Refactor layout de `VideoCallSession` (o subcomponente `VideoCallLayout`):
  - Área video: contenedor `aspect-video` + `max-h` acotado al viewport menos footer
  - Remoto: `object-contain`, fondo neutro (letterbox)
  - Local: PiP fijo (esquina inferior derecha del marco, sin tapar footer)
  - Footer: barra fija con botón(es) de finalizar + estado de conexión
- Dashboard `/dashboard/video/[callId]`: mismo layout fullscreen coherente con habitación
- Habitación overlay: mismo layout; botón finalizar accesible sin salir del overlay
- Finalizar llamada desde la barra:
  - **Staff:** `PATCH /api/calls/{id}` `{ action: "complete" }` (JWT)
  - **Habitación:** `PATCH /api/calls/room` `{ action: "cancel", roomKey }` (equiv. terminar desde cuarto)
- Cleanup WebRTC al finalizar (tracks + peer, ya existente vía unmount / `call:updated`)
- Deltas spec `ui` (+ nota en `calls` si aplica)
- Verificación manual en prod/local (tablet + desktop)
- Responsive: `100dvh`, `safe-area-inset-bottom` en footer (iOS PWA)

### Out of scope

- Cambios en signaling WebRTC o API nuevas
- Controles extra (mute, cambiar cámara, pantalla completa nativa)
- Grabación de llamada
- TURN / conectividad
- Rediseño del dashboard fuera de la pantalla de video

## Approach

Layout en columna (`flex flex-col`, altura viewport):

```
┌─────────────────────────────┐
│  header opcional (estado)   │
├─────────────────────────────┤
│  ┌───────────────────────┐  │
│  │   remoto (16:9 box)   │  │  ← flex-1, centered, object-contain
│  │      [ PiP local ]    │  │
│  └───────────────────────┘  │
├─────────────────────────────┤
│  [ Finalizar llamada ]      │  ← footer fijo, min-height táctil
└─────────────────────────────┘
```

El tamaño del marco remoto se calcula con CSS (`aspect-video`, `w-full`, `max-h-[calc(100dvh-{footer+header}px)]`) para que **no dependa** del stream entrante.

## Affected areas

| Área | Impacto | Descripción |
|------|---------|-------------|
| `web/components/VideoCallSession.tsx` | Modified | Layout, footer, end-call |
| `web/app/dashboard/video/[callId]/page.tsx` | Modified | Quitar chrome redundante; fullscreen |
| `web/app/habitacion/page.tsx` | Minor | Props callback post-finalizar |
| `openspec/specs/ui/spec.md` | Delta | REQ-UI-012 layout video |
| `openspec/specs/calls/spec.md` | Nota | Finalizar desde UI video (sin cambio API) |

## Risks

| Riesgo | Mitigación |
|--------|------------|
| Letterboxing molesta en tablet | Fondo `bg-slate-950` uniforme; marco centrado |
| Footer tapado por teclado virtual | Poco probable en video; `safe-area-inset` |
| Doble finalizar (dashboard + video) | Idempotente: call ya terminal → UI vuelve |
| Room "cancel" vs staff "complete" | Documentar semántica; mismo resultado UX |

## Rollback

- Revertir commit de UI; sin cambios backend ni contratos API.
- Deploy imagen GHCR anterior si ya en prod.

## Success criteria

- [ ] Remoto nunca estirado (sin deformación visible con cámaras 4:3 y 16:9)
- [ ] Marco video ocupa espacio predecible en 375px, 768px y 1280px de ancho
- [ ] Footer con botón finalizar siempre visible durante llamada activa (dashboard + habitación)
- [ ] Al finalizar, media se libera y UI vuelve al estado pre-llamada
- [ ] `npm run build` OK

## Dependencies

- Change `room-video-webrtc` archivado (WebRTC operativo en prod)
- Sin dependencias infra nuevas
