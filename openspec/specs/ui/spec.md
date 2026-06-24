# UI — Frontend

## Requirements

### REQ-UI-001: Landing
Route `/` MUST offer navigation to `/habitacion` and `/dashboard/login`.

### REQ-UI-002: PWA habitación
Route `/habitacion` MUST:
- Read `key` from URL search params (`?key={roomKey}`) in production
- Fall back to persisted `roomKey` in `localStorage` when launch URL has no query (installed PWA)
- Display room label, floor, sector
- Show large buttons for bell/video per target role
- Block new calls while an active call exists
- Show active call banner with cancel action
- Subscribe to room SSE for status updates
- Expose dynamic manifest for Android install when room is validated
- MUST NOT provide UI for end user to type or change `roomKey`
- Register a minimal service worker (`/sw.js`) for Chrome installability
- Serve room-specific manifest link in initial HTML when `?key=` is present (`generateMetadata`)

#### Scenario: Sin key en URL
- **GIVEN** no `key` param and no valid stored `roomKey`
- **WHEN** page loads
- **THEN** UI SHALL show fixed support screen (contact technical support)
- **AND** MUST NOT show `/habitacion?key=` example to end user

#### Scenario: PWA instalada abre habitación correcta
- **GIVEN** tablet installed from `/habitacion?key=room-101-key`
- **WHEN** user opens app from home screen
- **THEN** room 101 UI SHALL load without user entering a key

#### Scenario: Video aceptado en habitación
- **GIVEN** active call `{ type: "video", status: "accepted" }`
- **WHEN** room client receives `call:updated` via SSE or loads active call
- **THEN** UI SHALL show fullscreen video session with action to start camera/microphone
- **AND** after user gesture, local preview MUST be visible in PiP

#### Scenario: Permisos denegados
- **GIVEN** user denies camera/microphone
- **WHEN** getUserMedia fails
- **THEN** UI SHALL show actionable error

### REQ-UI-003: Dashboard login
Route `/dashboard/login` MUST authenticate staff. Redirect to `/dashboard` when session exists MUST occur in `useEffect` (not during render).

### REQ-UI-004: Dashboard escucha
Route `/dashboard` MUST:
- Allow configuring floor, sector, role and saving listen session
- List active calls with accept, cancel, complete actions
- Subscribe to staff SSE
- Play bell sound on new `bell` pending calls
- Provide **Probar timbre** to unlock browser audio
- Unlock audio on **Activar escucha** (user gesture)
- Link **Abrir video** for accepted video calls

### REQ-UI-005: Videollamada bidireccional

#### Room
Route `/habitacion` (overlay when video accepted) MUST:
- Activate camera and microphone on **Iniciar videollamada** (user gesture)
- Display local (PiP) and remote video streams when WebRTC connects
- Release media tracks when call ends

#### Dashboard
Route `/dashboard/video/[callId]` MUST:
- Activate camera and microphone on page open (user gesture via link click)
- Establish WebRTC peer connection with the room
- Display remote stream from room (main) and local preview (PiP)
- Render fullscreen `VideoCallSession` only (no separate nav during active call)

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

### REQ-UI-006: Diseño
The UI MUST follow microprompt guidelines:
- Light background, dark text (video overlay: dark fullscreen)
- Accent `#0d9488`
- No decorative photographic images; CSS/SVG icons for actions; institution logo MAY appear in header (`InstitutionBrand`)
- Mobile-first responsive layout

### REQ-UI-007: Protección rutas dashboard
Dashboard routes (except login) MUST redirect unauthenticated users to `/dashboard/login` via layout guard (not Next.js middleware).

### REQ-UI-008: PWA manifest prod
Production tablets MUST install via Chrome Android from the room-specific URL.

The dynamic manifest `GET /api/manifest?key={roomKey}` MUST include:
- `start_url` with `?key={roomKey}`
- `name` / `short_name` from room `label`
- `display: fullscreen` (with `display_override`)
- PNG icons 192×192 and 512×512

`web/public/manifest.json` MAY remain as generic fallback for non-room routes.

Server-rendered `/habitacion?key=` MUST link the dynamic manifest in initial HTML (not only client-side).

### REQ-UI-009: URL pública prod
`NEXT_PUBLIC_APP_URL` in production MUST be `https://habitacion.lionapp.cloud`.

### REQ-UI-010: Componente video compartido
`components/VideoCallSession.tsx` MUST encapsulate WebRTC lifecycle for room and staff roles.
`VideoCallSession` MUST expose call termination from the footer without navigating away first.

#### Scenario: Cleanup
- **WHEN** call status becomes `completed` or `cancelled`
- **THEN** all MediaStream tracks MUST stop and RTCPeerConnection MUST close

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

### REQ-UI-016: Vinculación Telegram en dashboard

The dashboard MUST expose Telegram notification settings for authenticated staff.

#### Scenario: No vinculado
- **GIVEN** user without `telegramChatId`
- **WHEN** viewing dashboard
- **THEN** UI SHALL show instructions and button **Conectar Telegram** that requests link and opens `t.me` URL

#### Scenario: Vinculado
- **GIVEN** linked user
- **WHEN** viewing settings
- **THEN** UI SHALL show connected state and option to **Desvincular**

#### Scenario: Mobile-friendly
- Link open MUST work on phone (primary use case for Telegram)

### REQ-UI-017: Banner instalar PWA

When room is loaded and browser supports install:

#### Scenario: Banner en Chrome Android
- **GIVEN** valid room loaded, not installed/standalone, `beforeinstallprompt` fired
- **WHEN** user views `/habitacion`
- **THEN** UI SHALL show discrete banner **Instalar en esta tablet**
- **AND** tapping it SHALL trigger native install prompt
- **AND** UI MAY show Chrome menu instructions when native prompt is unavailable

#### Scenario: Ya instalada
- **GIVEN** PWA launched from home screen (standalone/fullscreen detection)
- **WHEN** user views `/habitacion`
- **THEN** install banner MUST NOT show

### REQ-UI-018: Navegación restringida en PWA standalone

#### Scenario: Redirect desde landing
- **GIVEN** PWA launched in standalone/fullscreen mode with stored `roomKey`
- **WHEN** user navigates to `/`, `/dashboard`, or `/estadisticas`
- **THEN** client MUST redirect to `/habitacion` with resolved room

#### Scenario: Nombre del ícono
- **GIVEN** room label `Habitación 101`
- **WHEN** manifest is generated for that room
- **THEN** `name` SHALL reflect room label (`short_name` MAY truncate)

### REQ-UI-019: Branding institucional

Room tablet UI, dashboard login, and unconfigured screen MUST show institution logo via `InstitutionBrand` (default `public/branding/clinicamg-logo.png`; overridable via `NEXT_PUBLIC_INSTITUTION_LOGO_URL`).

## Audio (bell)

- Implementation: Web Audio API via `lib/bell.ts`
- Browser autoplay policy: audio MUST be unlocked by user interaction before SSE-triggered playback

## Known gaps (backlog)

| Item | Priority | Spec domain |
|------|----------|-------------|
| Modo kiosko — salir solo con PIN soporte | Medium | ui |
| TURN server (NAT estricto) | High | calls + deploy |
| Service worker offline / cache | Medium | ui |
| Admin CRUD rooms/users | Medium | rooms + auth |
| Notificaciones push (FCM) | Low | realtime |
| Notificaciones Telegram inline buttons | Low | calls + ui |

## Tests

| Type | Scope |
|------|-------|
| Jest | `lib/auth`, `lib/validation`, `lib/calls`, `lib/bell`, `lib/webrtc-signal`, `lib/telegram`, `lib/room-bind`, `lib/room-manifest` |
| Playwright | Landing, login page, habitacion load |
| Manual | Bell audio, SSE, PWA install, video bidireccional prod |
