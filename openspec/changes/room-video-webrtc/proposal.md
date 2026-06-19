# Proposal — Videollamada habitación ↔ dashboard

**Change:** room-video-webrtc  
**Status:** Planificado  
**Reportado:** 2026-06-19 (prod `habitacion.lionapp.cloud`)

## Intent

Completar el flujo de videollamada para que, cuando el personal atiende un llamado `video` desde el dashboard, la tablet de la habitación active cámara y micrófono y ambos extremos se vean y escuchen en tiempo real.

## Problema detectado

| Paso | Comportamiento actual | Esperado |
|------|----------------------|----------|
| Habitación solicita video | Crea call `pending` | OK |
| Staff pulsa **Atender** | Call pasa a `accepted` | OK |
| Staff abre **Abrir video** | Preview local con `getUserMedia` | OK parcial |
| Habitación tras aceptación | Solo banner "En atención" | Debe entrar en sesión de video con cámara/mic activos |

### Causa raíz (código actual)

1. **`web/app/habitacion/page.tsx`** — no existe ruta ni componente de video; no se llama a `navigator.mediaDevices.getUserMedia`.
2. **`web/app/dashboard/video/[callId]/page.tsx`** — preview local únicamente; mensaje explícito de señalización WebRTC pendiente.
3. **Specs MVP** — `REQ-UI-005` declara peer connection fuera de alcance; backlog lista WebRTC como pendiente.

## Alcance

### Incluido

- UI de videollamada en habitación cuando `activeCall.type === "video"` y `status === "accepted"`.
- Activación de cámara/micrófono en habitación (con manejo de permisos denegados).
- Señalización WebRTC (offer/answer/ICE) vía API + eventos SSE existentes.
- Conexión peer bidireccional habitación ↔ staff en `/dashboard/video/[callId]`.
- Componente/hook compartido (`lib/webrtc.ts`, `components/VideoCallSession.tsx`).
- Limpieza de tracks y cierre de peer al `complete` / `cancel` del llamado.
- Tests unitarios de helpers de señalización; prueba manual documentada en verify.
- Actualización de deltas en `calls`, `ui`, `realtime`.

### Fuera de alcance

- TURN server dedicado (STUN público de Google/Mozilla; documentar limitación NAT estricto).
- Grabación de llamadas.
- Múltiples staff en la misma videollamada.
- Cambio a WebSocket separado o servicio de signaling externo.
- Notificaciones push para invitar a abrir video.

## Affected areas

| Dominio | Cambio |
|---------|--------|
| ui | Vista video habitación; refactor dashboard video |
| calls | Endpoints señalización por `callId` |
| realtime | Eventos SSE `webrtc:signal` en canales room y staff |

## Alternativas consideradas

| Opción | Pros | Contras | Decisión |
|--------|------|---------|----------|
| A. Solo preview local en habitación | Rápido | No hay comunicación real | Descartada |
| B. WebRTC + signaling vía API/SSE | Reutiliza stack; sin infra nueva | NAT estricto sin TURN | **Elegida** |
| C. Servicio externo (Daily/Livekit) | Menos código | Costo, vendor lock-in | Descartada MVP |

## Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Permisos cámara/mic en tablet sin gesto usuario | Botón "Iniciar video" al aceptar; o solicitar media al pulsar Video (pre-warm) |
| Autoplay / políticas Safari iOS | `playsInline`, `muted` en preview local; documentar HTTPS obligatorio |
| NAT simétrico sin conexión | Documentar; backlog TURN si falla en campo |
| Signaling perdido (reload SSE) | Buffer corto en Mongo o re-fetch pending signals al reconectar |
| Una réplica web (SSE in-memory) | OK en prod actual; documentar en design |

## Rollback

- Revertir deploy de imagen anterior en VPS (`IMAGE_TAG` previo).
- Endpoints nuevos de signaling son aditivos; calls existentes de timbre no se afectan.
- Si falla WebRTC, staff puede seguir usando timbre; video vuelve a estado anterior tras rollback.

## Criterios de éxito

- [ ] Habitación con llamado video aceptado muestra UI de videollamada y solicita permisos A/V.
- [ ] Staff en `/dashboard/video/{callId}` ve stream remoto de la habitación.
- [ ] Habitación ve stream remoto del staff.
- [ ] Al **Finalizar** o **Cancelar**, tracks se detienen y UI vuelve a botones de llamado.
- [ ] Llamados `bell` siguen funcionando sin regresión.
- [ ] `npm run test:unit` y `npm run build` OK.

## Prerrequisitos

- Deploy baseline en prod (completado).
- Pruebas en HTTPS (localhost o `habitacion.lionapp.cloud`).
- Dos dispositivos o pestañas: una habitación (`?key=`), una dashboard autenticado.
