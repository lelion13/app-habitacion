# UI — Frontend

## Requirements

### REQ-UI-001: Landing
Route `/` MUST offer navigation to `/habitacion` and `/dashboard/login`.

### REQ-UI-002: PWA habitación
Route `/habitacion` MUST:
- Display room label, floor, sector
- Show large buttons for bell/video per target role
- Block new calls while an active call exists
- Show active call banner with cancel action
- Subscribe to room SSE for status updates
- Expose `manifest.json` for Android install

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

### REQ-UI-005: Video placeholder
Route `/dashboard/video/[callId]` MUST show local camera preview. Full peer connection is NOT required in MVP.

### REQ-UI-006: Diseño
The UI MUST follow microprompt guidelines:
- Light background, dark text
- Accent `#0d9488`
- No photographic images; CSS/SVG icons only
- Mobile-first responsive layout

### REQ-UI-007: Protección rutas dashboard
Dashboard routes (except login) MUST redirect unauthenticated users to `/dashboard/login` via layout guard (not Next.js middleware).

## Audio (bell)

- Implementation: Web Audio API via `lib/bell.ts`
- Browser autoplay policy: audio MUST be unlocked by user interaction before SSE-triggered playback

## Known gaps (backlog)

| Item | Priority | Spec domain |
|------|----------|-------------|
| WebRTC signaling habitación ↔ staff | High | calls + ui |
| Service worker offline | Medium | ui |
| Admin CRUD rooms/users | Medium | rooms + auth |
| Notificaciones push (FCM) | Low | realtime |

## Tests

| Type | Scope |
|------|-------|
| Jest | `lib/auth`, `lib/validation`, `lib/calls`, `lib/bell` |
| Playwright | Landing, login page, habitacion load |
| Manual | Bell audio, SSE end-to-end, PWA install |
