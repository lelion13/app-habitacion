# UI — Delta room-video-webrtc

## MODIFIED Requirements

### REQ-UI-002: PWA habitación (MODIFIED)

When the room has an active call with `type === "video"` and `status === "accepted"`, the habitación UI MUST present a video session interface (not only a text banner).

#### Scenario: Video aceptado en habitación
- **GIVEN** active call `{ type: "video", status: "accepted" }`
- **WHEN** room client receives `call:updated` via SSE or loads active call
- **THEN** UI SHALL show video call UI with action to start camera/microphone
- **AND** after user gesture, local preview MUST be visible

#### Scenario: Permisos denegados
- **GIVEN** user denies camera/microphone
- **WHEN** getUserMedia fails
- **THEN** UI SHALL show actionable error (retry / cancel call guidance)

#### Scenario: Llamado no-video sin cambios
- **GIVEN** active call `{ type: "bell" }`
- **WHEN** accepted
- **THEN** UI SHALL NOT show video session (banner only, unchanged)

### REQ-UI-005: Video (MODIFIED — was placeholder)

#### Room
Route `/habitacion` (overlay or dedicated view) MUST:
- Activate camera and microphone on user gesture when video call is accepted
- Display local and remote video streams when WebRTC connects
- Release media tracks when call ends

#### Dashboard
Route `/dashboard/video/[callId]` MUST:
- Activate camera and microphone
- Establish WebRTC peer connection with the room
- Display remote stream from room (not local preview only)

## ADDED Requirements

### REQ-UI-010: Componente video compartido

A shared client component MUST encapsulate WebRTC session lifecycle for both room and staff roles.

#### Scenario: Cleanup
- **WHEN** call status becomes `completed` or `cancelled`
- **THEN** all MediaStream tracks MUST stop and RTCPeerConnection MUST close

### REQ-UI-011: UX videollamada mobile-first

Video UI MUST:
- Use fullscreen or near-fullscreen layout on tablets
- Use `playsInline` on video elements
- Show connection state (connecting / connected / error)
- Follow accent `#0d9488` and existing typography

## REMOVED from backlog (ui spec)

| Item | Status |
|------|--------|
| WebRTC signaling habitación ↔ staff | Addressed by this change |
