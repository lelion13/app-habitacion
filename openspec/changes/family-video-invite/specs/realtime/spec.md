# Realtime — Delta family-video-invite

## ADDED Requirements

### REQ-RT-010: Eventos Familiar en canal habitación

Family call lifecycle events (`call:created`, `call:updated`) MUST be published on the room SSE channel for the owning room so the tablet can show pending/accepted/terminal states without polling.

Family call events MUST NOT be published to staff listen channels (`floor:sector:role`).

#### Scenario: Tablet recibe pending Familiar
- **GIVEN** room subscribed to room SSE
- **WHEN** family invite is created
- **THEN** room SHALL receive call event with `targetRole: family` and `status: pending`

#### Scenario: Staff no recibe Familiar en Llamador
- **GIVEN** staff listening on matching floor/sector as nurse
- **WHEN** family invite is created for that room
- **THEN** staff SSE MUST NOT receive that call as a dashboard pending call

### REQ-RT-011: Señalización WebRTC Familiar

Accepted family video calls MUST use the same signaling relay (`POST/GET /api/calls/{id}/signal`) as staff video.

- Room side: authorize with `roomKey`
- Family guest side: authorize with family-join JWT scoped to that `callId`

#### Scenario: Guest señaliza
- **GIVEN** accepted family call
- **WHEN** guest POSTs signal with valid family-join JWT for that call
- **THEN** room SHALL receive `webrtc:signal` via room SSE

#### Scenario: JWT de otro call rechazado
- **GIVEN** family-join JWT for call A
- **WHEN** guest POSTs signal for call B
- **THEN** response MUST be 401/403
