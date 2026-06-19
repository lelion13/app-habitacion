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

## Limitations (documented)

| Limitation | Impact | Future change |
|------------|--------|---------------|
| In-memory subscriber map | Single Node process only | Redis pub/sub change |
| No reconnect backoff spec | Client must reload on disconnect | Client retry policy |
| Token in SSE query string | Visible in logs/proxies | Cookie-based SSE or WS |

## Out of scope (MVP)

- Guaranteed delivery / persistence of events
- Cross-region replication
