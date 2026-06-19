# Realtime — Delta room-video-webrtc

## ADDED Requirements

### REQ-RT-005: Evento webrtc:signal

The SSE bus MUST emit `webrtc:signal` to relay WebRTC signaling payloads.

#### Scenario: Relay a staff
- **GIVEN** staff subscribed on channel `{floor}:{sector}:{role}` matching the call
- **WHEN** room POSTs a signal for that call
- **THEN** event `webrtc:signal` SHALL be emitted on the staff channel with payload `{ callId, from, type, payload }`

#### Scenario: Relay a room
- **GIVEN** room client subscribed on `room:{roomId}`
- **WHEN** staff POSTs a signal for that call
- **THEN** event `webrtc:signal` SHALL be emitted on the room channel

#### Scenario: Formato
```
event: webrtc:signal
data: {"callId":"...","from":"room|staff","type":"offer|answer|ice","payload":"..."}

```

### REQ-RT-006: Orden de eventos

Signaling events SHOULD be processed in arrival order by clients. The server MUST NOT guarantee ordering across reconnects; clients MAY re-negotiate on reconnect.

## MODIFIED Limitations

| Limitation | Impact | Mitigation in this change |
|------------|--------|---------------------------|
| In-memory subscriber map | Signaling lost if subscriber disconnected | Re-offer on reconnect; optional GET pending signals |
| Token in SSE query string | Unchanged | Staff video page reuses existing pattern |

## Out of scope (unchanged)

- Redis pub/sub for multi-replica
- WebSocket upgrade
