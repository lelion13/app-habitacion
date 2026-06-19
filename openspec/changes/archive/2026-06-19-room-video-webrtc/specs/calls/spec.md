# Calls — Delta room-video-webrtc

## MODIFIED Requirements

### REQ-CALL-003: Atender desde dashboard (MODIFIED)

When staff accepts a call with `type === "video"`, the system MUST allow WebRTC signaling for that call while status is `accepted`.

#### Scenario: Aceptar video habilita signaling
- **GIVEN** a pending call with `type: "video"`
- **WHEN** PATCH `/api/calls/{id}` with `{ action: "accept" }`
- **THEN** status SHALL become `accepted`
- **AND** POST `/api/calls/{id}/signal` SHALL be permitted for room and staff until terminal status

#### Scenario: Signaling rechazado si no es video
- **GIVEN** an accepted call with `type: "bell"`
- **WHEN** POST `/api/calls/{id}/signal`
- **THEN** response MUST be 400

#### Scenario: Signaling rechazado si no accepted
- **GIVEN** a call in status `pending`
- **WHEN** POST `/api/calls/{id}/signal`
- **THEN** response MUST be 409

## ADDED Requirements

### REQ-CALL-009: Señalización WebRTC

The system MUST relay WebRTC signaling messages between room and staff for an accepted video call.

#### Scenario: Room envía offer
- **GIVEN** accepted video call for room R
- **WHEN** POST `/api/calls/{id}/signal` with `{ from: "room", type: "offer", payload }` and valid roomKey
- **THEN** staff subscribed to the call's floor/sector/targetRole SHALL receive SSE `webrtc:signal`

#### Scenario: Staff envía answer
- **GIVEN** accepted video call
- **WHEN** POST with JWT and `{ from: "staff", type: "answer", payload }`
- **THEN** room subscribed to `room:{roomId}` SHALL receive SSE `webrtc:signal`

#### Scenario: ICE candidate
- **WHEN** either party POST `{ type: "ice", payload }`
- **THEN** the opposite party SHALL receive the event via SSE

### REQ-CALL-010: Autorización signaling

| `from` | Auth required |
|--------|---------------|
| `room` | Valid `roomKey` matching the call's room |
| `staff` | Valid JWT (any authenticated staff; call must match listen target) |

Unauthorized attempts MUST return 401 without leaking call existence beyond generic errors where applicable.

## REMOVED from out of scope

- ~~WebRTC signaling completo~~ → moved to in-scope for this change
