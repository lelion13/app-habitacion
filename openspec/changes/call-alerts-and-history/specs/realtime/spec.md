# Realtime — Delta call-alerts-and-history

## ADDED Requirements

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

## MODIFIED Requirements

### REQ-RT-004: Resiliencia dashboard (MODIFIED)

The dashboard SHOULD poll `/api/calls` every 4 seconds as fallback when in-memory SSE bus is reset (dev hot reload).

Poll results MUST be used to synchronize **active call list** and **alert loop state**.
