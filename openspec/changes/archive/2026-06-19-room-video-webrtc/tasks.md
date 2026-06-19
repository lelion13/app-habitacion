# Tasks — Videollamada habitación ↔ dashboard

## Fase 1 — Specs y contratos

- [ ] 1.1 Revisar deltas en `specs/calls`, `specs/ui`, `specs/realtime`
- [ ] 1.2 Acordar ADR-V01..V04 con stakeholder (STUN sin TURN en v1)

## Fase 2 — Backend signaling

- [ ] 2.1 Crear `web/lib/webrtc-signal.ts` (tipos, validación Zod de offer/answer/ice)
- [ ] 2.2 Crear `POST /api/calls/[id]/signal` (auth roomKey o JWT, call accepted+video)
- [ ] 2.3 Publicar evento SSE `webrtc:signal` en canal room y staff (`lib/sse.ts`)
- [ ] 2.4 (Opcional) `GET /api/calls/[id]/signal` para recovery al reconectar
- [ ] 2.5 Tests unitarios validación signaling

## Fase 3 — Cliente WebRTC compartido

- [ ] 3.1 Crear `web/lib/webrtc.ts` (PeerConnection, STUN, cleanup)
- [ ] 3.2 Crear `components/VideoCallSession.tsx` (local + remote video, estados, errores permisos)
- [ ] 3.3 Integrar envío/recepción de signals (POST + listener SSE)
- [ ] 3.4 Manejar ICE candidates en ambos sentidos

## Fase 4 — UI habitación

- [ ] 4.1 Detectar `activeCall` video + `accepted` (SSE existente)
- [ ] 4.2 Mostrar overlay fullscreen con `VideoCallSession role="room"`
- [ ] 4.3 Botón **Iniciar videollamada** (gesto usuario → getUserMedia)
- [ ] 4.4 Mensajes claros si permisos denegados o dispositivo sin cámara
- [ ] 4.5 Cleanup al `completed` / `cancelled` / desmontar componente

## Fase 5 — UI dashboard video

- [ ] 5.1 Refactor `dashboard/video/[callId]/page.tsx` → usar `VideoCallSession role="staff"`
- [ ] 5.2 Suscribirse a `webrtc:signal` (SSE staff con token o hook compartido)
- [ ] 5.3 Responder offer con answer; mostrar stream remoto
- [ ] 5.4 Eliminar mensaje placeholder "señalización pendiente"

## Fase 6 — Tests y verificación

- [ ] 6.1 `npm run test:unit` OK
- [ ] 6.2 `npm run build` OK
- [ ] 6.3 Prueba manual local HTTPS o prod (checklist design.md)
- [ ] 6.4 Regresión: timbre bell sin cambios
- [ ] 6.5 Completar `verify-report.md`

## Fase 7 — Documentación y cierre SDD

- [ ] 7.1 Fusionar deltas → `openspec/specs/{calls,ui,realtime}/spec.md`
- [ ] 7.2 Actualizar `docs/runbook.md` sección video (permisos tablet, STUN/TURN)
- [ ] 7.3 Archivar change en `openspec/changes/archive/YYYY-MM-DD-room-video-webrtc/`
- [ ] 7.4 Deploy prod (push main → GHCR → update VPS)

## Dependencias

```
1 (specs) → 2 (API) → 3 (webrtc lib) → 4 (habitación) + 5 (dashboard) → 6 → 7
     4 y 5 pueden paralelizarse tras 3
```

## Estimación

| Fase | Esfuerzo |
|------|----------|
| 1 | 0.5 sesión |
| 2-3 | 1 sesión |
| 4-5 | 1 sesión |
| 6-7 | 0.5 sesión |

## Notas de implementación

- Probar primero en dos pestañas Chrome (room + dashboard) antes de tablet física.
- Si ICE falla en red hospitalaria, abrir change follow-up `webrtc-turn` (fuera de alcance).
