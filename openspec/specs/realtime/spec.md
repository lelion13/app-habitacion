# Realtime — SSE

## Requirements

### REQ-RT-001: Stream staff
Authenticated staff MUST subscribe to calls for their listen config.

#### Scenario: Conexión staff
- **GIVEN** valid JWT (query param `token` or Bearer)
- **WHEN** GET `/api/calls/stream?floor&sector&role`
- **THEN** an SSE stream SHALL be opened on channel `{floor}:{sector}:{role}`

#### Scenario: Evento nuevo llamado
- **GIVEN** a staff subscriber on matching channel
- **WHEN** a call is created for that floor/sector/targetRole
- **THEN** event `call:new` SHALL be emitted with serialized call payload

#### Scenario: Actualización
- **WHEN** call status changes
- **THEN** event `call:updated` SHALL be emitted to staff channel

### REQ-RT-002: Stream habitación
Room clients MUST subscribe to room-specific events.

#### Scenario: Conexión room
- **WHEN** GET `/api/calls/room/stream?roomId={id}`
- **THEN** SSE channel `room:{roomId}` SHALL receive `call:new` and `call:updated`

### REQ-RT-003: Formato SSE
Events MUST follow format:
```
event: {name}
data: {json}

```

### REQ-RT-004: Resiliencia dashboard
The dashboard SHOULD poll `/api/calls` every 4 seconds as fallback when in-memory SSE bus is reset (dev hot reload).

Poll results MUST be used to synchronize **active call list** and **alert loop state**.

### REQ-RT-005: Evento webrtc:signal
The SSE bus MUST emit `webrtc:signal` to relay WebRTC signaling payloads.

#### Scenario: Relay a staff
- **GIVEN** staff subscribed on channel `{floor}:{sector}:{role}` matching the call
- **WHEN** room POSTs a signal for that call
- **THEN** event `webrtc:signal` SHALL be emitted on the staff channel

#### Scenario: Relay a room
- **GIVEN** room client subscribed on `room:{roomId}`
- **WHEN** staff POSTs a signal for that call
- **THEN** event `webrtc:signal` SHALL be emitted on the room channel

### REQ-RT-006: Orden y recovery
Signaling events SHOULD be processed in arrival order. Clients MUST poll GET `/api/calls/{id}/signal` every 2s until connected as fallback.

### REQ-RT-007: Disparadores de alerta cliente

Staff dashboard alert loop MUST react to SSE events without requiring new server events.

| Event | Client action |
|-------|---------------|
| `call:new` (pending) | Ensure alert loop running for matching listen config |
| `call:updated` (terminal) | Re-evaluate pending set; stop loop if empty |
| `call:updated` (accepted) | Re-evaluate; stop loop for that call (no longer pending) |

Poll fallback (`GET /api/calls` every 4s) MUST also drive alert state on reconnect.

#### Scenario: SSE call:new video
- **GIVEN** staff subscribed on matching channel
- **WHEN** `call:new` with `{ type: "video", status: "pending" }`
- **THEN** client SHALL start or continue video alert pattern

#### Scenario: Reconexión SSE
- **GIVEN** SSE disconnected briefly
- **WHEN** poll returns pending calls
- **THEN** alert loop MUST resume if audio unlocked

### REQ-RT-008: Consistencia SSE tras acción Telegram

Accept or complete performed via Telegram MUST publish the same SSE events as dashboard `PATCH /api/calls/{id}`.

#### Scenario: Atender desde Telegram actualiza dashboard
- **GIVEN** dashboard open with active SSE listen
- **WHEN** another client accepts via Telegram
- **THEN** dashboard SHALL receive `call:updated` with `accepted` status

#### Scenario: Finalizar desde Telegram
- **WHEN** complete via Telegram
- **THEN** `call:updated` terminal event SHALL reach room and staff subscribers

### REQ-RT-009: Edición mensajes Telegram

On call state transition triggered by Telegram or dashboard, system SHOULD attempt to edit all stored Telegram alert messages for that call.

#### Scenario: Aceptado desde dashboard
- **GIVEN** Telegram alerts sent with **Atender** buttons
- **WHEN** staff accepts from dashboard
- **THEN** Telegram messages SHOULD be edited to reflect accepted state (buttons removed or **Finalizar** for accepter only)

## Limitations (documented)

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| In-memory subscriber map | Single Node process only | Poll signaling buffer; future Redis |
| In-memory signal buffer | Lost on container restart mid-call | Re-negotiate; future persistence |
| Token in SSE query string | Visible in logs/proxies | Cookie-based SSE (backlog) |
| Traefik SSE | Requires flush interval 1s | Configured in prod compose |

## Out of scope

- Guaranteed delivery / persistence of events
- Cross-region replication
- WebSocket upgrade
