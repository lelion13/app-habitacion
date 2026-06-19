# Verify Report — room-video-webrtc

**Change:** room-video-webrtc  
**Fecha:** 2026-06-19  
**Entorno:** prod `https://habitacion.lionapp.cloud`  
**Resultado:** PASS (con fix post-deploy `32d5a69`)

## Checklist funcional

| # | Caso | Resultado | Notas |
|---|------|-----------|-------|
| 1 | Habitación solicita video | ✅ | |
| 2 | Dashboard atiende llamado | ✅ | |
| 3 | Habitación muestra UI video (overlay) | ✅ | Botón **Iniciar videollamada** |
| 4 | Permisos cámara/mic en habitación | ✅ | |
| 5 | Staff abre `/dashboard/video/{id}` | ✅ | Auto-start cámara |
| 6 | Stream remoto visible en dashboard | ✅ | Tras fix SSE signaling |
| 7 | Stream remoto visible en habitación | ✅ | |
| 8 | Audio bidireccional | ✅ | Verificado por usuario |
| 9 | Finalizar call → tracks detenidos | ✅ | |
| 10 | Timbre (bell) sin regresión | ✅ | |
| 11 | Estado pasa a "Videollamada conectada" | ✅ | |

## Checklist técnico

| # | Verificación | Resultado |
|---|--------------|-----------|
| 1 | `npm run test:unit` (16 tests) | ✅ |
| 2 | `npm run build` | ✅ |
| 3 | `/api/calls/{id}/signal` POST/GET | ✅ |
| 4 | SSE `webrtc:signal` + poll fallback | ✅ |
| 5 | Commits `ebf4e57`, `32d5a69` en prod | ✅ |

## Bug corregido en prod

**Síntoma:** ambos lados solo veían cámara local, estado "Conectando…".

**Causa:** SSE de signaling no se conectaba (`sessionActiveRef` bloqueaba el efecto).

**Fix:** `32d5a69` — SSE al iniciar sesión + polling buffer cada 2s.

## Limitaciones conocidas

- Sin TURN: redes con NAT estricto pueden fallar (backlog `webrtc-turn`)
- Buffer signaling in-memory: se pierde al restart del contenedor mid-call

## Sign-off

- [x] Criterios de éxito cumplidos
- [x] Verificado en prod por usuario
- [x] Specs fusionadas a `openspec/specs/`
