# UI — Delta video-ui-fixed-layout

## MODIFIED Requirements

### REQ-UI-005: Videollamada bidireccional (MODIFIED)

#### Layout video (dashboard y habitación)
During an active video session, both room and staff clients MUST use the same layout structure:

1. **Video stage** — centered, maximum width constrained (`max-w-5xl`), fixed **16:9 aspect ratio** container
2. **Remote stream** — MUST render with `object-fit: contain` inside the 16:9 container (no stretching distortion)
3. **Local stream** — MUST render as PiP overlay inside the video stage (corner), MAY use `object-fit: cover`
4. **Viewport fit** — the 16:9 container MUST NOT exceed `calc(100dvh - footer - header)` so the full UI fits without page scroll

#### Scenario: Resolución remota distinta
- **GIVEN** remote device sends 4:3 video and local container is 16:9
- **WHEN** video is displayed
- **THEN** remote video SHALL show letterboxing (no aspect distortion)
- **AND** container size SHALL remain defined by layout CSS, not by stream dimensions

#### Scenario: Footer siempre visible
- **GIVEN** an active video session (`started === true`)
- **WHEN** user views dashboard or room overlay
- **THEN** a fixed bottom bar MUST remain visible with at least one primary action to end the call
- **AND** the bar MUST respect `safe-area-inset-bottom` on mobile/PWA

### REQ-UI-010: Componente video compartido (MODIFIED)

`VideoCallSession` MUST expose call termination from the footer without navigating away first.

## ADDED Requirements

### REQ-UI-012: Finalizar desde pantalla de video

#### Staff
- **WHEN** user taps **Finalizar llamada** on `/dashboard/video/[callId]`
- **THEN** client MUST PATCH `/api/calls/{id}` with `{ action: "complete" }`
- **AND** MUST release media tracks and close peer connection
- **AND** SHOULD return user to dashboard or idle video UI

#### Room
- **WHEN** user taps **Finalizar llamada** on room video overlay
- **THEN** client MUST PATCH `/api/calls/room` with `{ action: "cancel", roomKey }`
- **AND** MUST release media tracks and close peer connection
- **AND** MUST return to room call buttons UI

#### Scenario: Botón durante conexión
- **GIVEN** session in `connecting` state
- **WHEN** user taps finalizar
- **THEN** call termination MUST still be allowed (same PATCH + cleanup)

### REQ-UI-013: Consistencia cross-client

Room and staff video screens MUST use the same layout component/shell so behavior and proportions match across devices.
