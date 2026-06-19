# UI — Frontend

## Requirements

### REQ-UI-001: Landing
Route `/` MUST offer navigation to `/habitacion` and `/dashboard/login`.

### REQ-UI-002: PWA habitación
Route `/habitacion` MUST:
- Read `key` from URL search params (`?key={roomKey}`) in production
- Display room label, floor, sector
- Show large buttons for bell/video per target role
- Block new calls while an active call exists
- Show active call banner with cancel action
- Subscribe to room SSE for status updates
- Expose `manifest.json` for Android install

#### Scenario: Sin key en URL
- **GIVEN** no `key` param and no server env fallback
- **WHEN** page loads
- **THEN** UI SHALL show clear error instructing to open `/habitacion?key={roomKey}`

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

### REQ-UI-006: Diseño
The UI MUST follow microprompt guidelines:
- Light background, dark text (video overlay: dark fullscreen)
- Accent `#0d9488`
- No photographic images; CSS/SVG icons only
- Mobile-first responsive layout

### REQ-UI-007: Protección rutas dashboard
Dashboard routes (except login) MUST redirect unauthenticated users to `/dashboard/login` via layout guard (not Next.js middleware).

### REQ-UI-008: PWA manifest prod
`start_url` in manifest MAY remain `/habitacion`; deployed tablets SHOULD use pinned shortcut with full `?key=` URL per device.

### REQ-UI-009: URL pública prod
`NEXT_PUBLIC_APP_URL` in production MUST be `https://habitacion.lionapp.cloud`.

### REQ-UI-010: Componente video compartido
`components/VideoCallSession.tsx` MUST encapsulate WebRTC lifecycle for room and staff roles.

#### Scenario: Cleanup
- **WHEN** call status becomes `completed` or `cancelled`
- **THEN** all MediaStream tracks MUST stop and RTCPeerConnection MUST close

## Audio (bell)

- Implementation: Web Audio API via `lib/bell.ts`
- Browser autoplay policy: audio MUST be unlocked by user interaction before SSE-triggered playback

## Known gaps (backlog)

| Item | Priority | Spec domain |
|------|----------|-------------|
| TURN server (NAT estricto) | High | calls + deploy |
| Service worker offline | Medium | ui |
| Admin CRUD rooms/users | Medium | rooms + auth |
| Notificaciones push (FCM) | Low | realtime |

## Tests

| Type | Scope |
|------|-------|
| Jest | `lib/auth`, `lib/validation`, `lib/calls`, `lib/bell`, `lib/webrtc-signal` |
| Playwright | Landing, login page, habitacion load |
| Manual | Bell audio, SSE, PWA install, video bidireccional prod |
