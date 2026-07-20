# UI — Frontend

## Requirements

### REQ-UI-001: Landing
Route `/` MUST offer navigation to `/habitacion` and `/dashboard/login`.

### REQ-UI-002: PWA habitación
Route `/habitacion` MUST:
- Read `key` from URL search params (`?key={roomKey}`) in production
- Fall back to persisted `roomKey` in `localStorage` when launch URL has no query (installed PWA)
- Use a **dark habitacion theme** (`#0d1b2a` background, Nunito typography) scoped to the habitacion route
- Display room label, floor, sector in header with institution logo and live clock (time top-right; localized date below time, right-aligned)
- Show helper text at bottom of main content: «Presione un botón para llamar al sector que necesita»
- Render three horizontal sector rows (Enfermería, Asistente de calidad, Médico) with role-colored accents
- Use Timbre/Video buttons (300×100px, dark bordered style, lucide icons)
- Block new calls while an active call exists
- Show **modal overlay** for active call management (pending bell/video, accepted bell) — MUST NOT use inline footer or banners that shift layout
- Show fixed-position toasts for errors and post-call confirmations (MUST NOT expand header flex area)
- Subscribe to room SSE for status updates
- Expose dynamic manifest for Android install when room is validated
- MUST NOT provide UI for end user to type or change `roomKey`
- Register a minimal service worker (`/sw.js`) for Chrome installability
- Serve room-specific manifest link in initial HTML when `?key=` is present (`generateMetadata`)

Loading and unconfigured states MUST use the same dark theme and institution logo.

The main call UI MUST fit within `100dvh` without horizontal or vertical scrolling: header, three sector rows, and helper text SHALL be visible together; sector rows MUST share remaining height equally (`flex-1` / `min-h-0`).

#### Scenario: Reloj visible
- **GIVEN** room loaded successfully
- **WHEN** user views `/habitacion`
- **THEN** current time MUST update every second in the header

#### Scenario: Llamada activa sin desplazar layout
- **GIVEN** an active call (pending or accepted bell, or pending video before overlay)
- **WHEN** user views `/habitacion`
- **THEN** sector rows and header MUST retain fixed proportions
- **AND** cancel/finalize action MUST appear in a modal overlay (not a document footer)

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

### REQ-UI-004: Dashboard escucha (Llamador)
Route `/dashboard` MUST:
- Allow configuring floor, sector (from `GET /api/staff/catalog`), and role; saving via PUT `/api/staff/session`
- Deactivate listen via DELETE `/api/staff/session` (toggle button **Desactivar escucha** when SSE connected)
- List active calls with accept, cancel, complete actions
- Subscribe to staff SSE via global `StaffListenProvider` (persists across staff shell tabs)
- **Play repeating alert** while at least one `pending` call matches listen config
- Provide stacked full-width buttons: **Probar sonido** and **Activar escucha** / **Desactivar escucha**
- Unlock audio on **Activar escucha** (user gesture)
- Link **Abrir video** for accepted video calls

Shell navigation (not body links) MUST expose **Estadísticas** for supervisor+ and **Administración** for admin.

#### Scenario: Video pending alerta
- **GIVEN** listen config matches a pending video call
- **WHEN** dashboard is open with audio unlocked
- **THEN** video alert pattern SHALL repeat until call is terminal

#### Scenario: Múltiples pending
- **GIVEN** two pending calls (one bell, one video) for same listen config
- **WHEN** alert loop runs
- **THEN** both types MUST be represented (priority: video pattern if any video pending, else bell)

#### Scenario: Atender detiene alerta
- **GIVEN** pending call alerting
- **WHEN** staff accepts (`call:updated` → `accepted`)
- **THEN** alert loop MUST stop if no other matching pending calls

#### Scenario: Terminal detiene alerta
- **GIVEN** pending call alerting
- **WHEN** `call:updated` with status `cancelled` or `completed`
- **THEN** alert loop MUST stop if no other matching pending calls

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
4. **Viewport fit** — the 16:9 container MUST NOT exceed available viewport height so the full UI fits without page scroll

**Habitación (`shellVariant="habitacion"`):** end-call control MUST use a **fixed floating trigger** + confirmation modal overlay. MUST NOT use a flex footer bar that reduces video stage height.

#### Scenario: Resolución remota distinta
- **GIVEN** remote device sends 4:3 video and local container is 16:9
- **WHEN** video is displayed
- **THEN** remote video SHALL show letterboxing (no aspect distortion)
- **AND** container size SHALL remain defined by layout CSS, not by stream dimensions

#### Scenario: Footer siempre visible (dashboard)
- **GIVEN** an active video session on **staff** dashboard (`shellVariant` default)
- **WHEN** user views `/dashboard/video/[callId]`
- **THEN** a fixed bottom bar MUST remain visible with at least one primary action to end the call
- **AND** the bar MUST respect `safe-area-inset-bottom` on mobile/PWA

#### Scenario: Modal finalizar (habitación)
- **GIVEN** an active video session on room client (`shellVariant="habitacion"`)
- **WHEN** user views room video overlay
- **THEN** a fixed floating control MUST open a confirmation modal to end the call
- **AND** the video stage MUST NOT shrink when the control is shown

### REQ-UI-006: Diseño
Staff dashboard routes (`/dashboard`, `/dashboard/login`, `/dashboard/admin`, `/estadisticas`) MUST use **dark staff theme** (`#0d1b2a`, accent `#00bc7d`) via `staff-theme.ts`, aligned with habitacion palette.

Staff video overlay (`/dashboard/video/[callId]`) MAY use dark fullscreen shell.

**`/habitacion` only** (dark habitacion theme):
- Background `#0d1b2a`, foreground `#f0f4f8`, muted `#7a9ab5`
- Role accents: nurse `#5ee9b5`, quality `#ffd230`, doctor `#74d4ff`
- Nunito typography via `app/habitacion/layout.tsx`

Microprompt on staff routes: mobile-first, institution logo in shell header, CSS/SVG icons.

### REQ-UI-007: Protección rutas dashboard
Dashboard routes (except login) MUST redirect unauthenticated users to `/dashboard/login` via layout guard (not Next.js middleware).

### REQ-UI-008: PWA manifest prod
Production tablets MUST install via Chrome Android from the room-specific URL.

The dynamic manifest `GET /api/manifest?key={roomKey}` MUST include:
- `start_url` with `?key={roomKey}`
- `name` / `short_name` from room `label`
- `display: fullscreen` (with `display_override`)
- `background_color` and `theme_color` `#0d1b2a`
- PNG icons 192×192 and 512×512

`web/public/manifest.json` MAY remain as generic fallback for non-room routes.

Server-rendered `/habitacion?key=` MUST link the dynamic manifest in initial HTML (not only client-side).

### REQ-UI-009: URL pública prod
`NEXT_PUBLIC_APP_URL` in production MUST be `https://habitacion.lionapp.cloud`.

### REQ-UI-010: Componente video compartido
`components/VideoCallSession.tsx` MUST encapsulate WebRTC lifecycle for room and staff roles.
`VideoCallSession` MUST expose call termination without navigating away first.

`VideoCallSession` MUST accept optional `shellVariant="habitacion"` for room overlay styling aligned with habitacion theme (dark shell, floating end-call trigger + modal). Staff dashboard MUST keep default shell with footer bar.

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
- **WHEN** user confirms end on room video overlay (`shellVariant="habitacion"`)
- **THEN** client MUST PATCH `/api/calls/room` with `{ action: "cancel", roomKey }`
- **AND** MUST release media tracks and close peer connection
- **AND** MUST return to room call buttons UI

#### Scenario: Botón durante conexión
- **GIVEN** session in `connecting` state
- **WHEN** user taps finalizar
- **THEN** call termination MUST still be allowed (same PATCH + cleanup)

### REQ-UI-013: Consistencia cross-client

Room and staff video screens MUST use the same layout component/shell so behavior and proportions match across devices.

### REQ-UI-014: Pantalla estadísticas

Route `/estadisticas` MUST require `systemRole` of `supervisor` or `admin` (redirect `user` to `/dashboard`).

The page MUST use the shared staff shell and:
- Show KPI summary cards driven by active filters (totals, avg response time, avg session duration, bell vs video counts, optional % Telegram accepts)
- Show paginated table of calls with: room, floor, sector, type, target role, status, **Atendió** (staff name), **Canal atención**, **Canal cierre**, timestamps, `responseTimeMs`, `totalDurationMs`, `sessionDurationMs`
- Display channel as `Web`, `Telegram`, or `—` when unknown
- Render an **analytics charts section** below KPIs when `includeCharts=true` (date range ≤ 90 days):
  1. Calls per day (bell vs video)
  2. Average response time per day
  3. Accepted-channel split (web vs telegram vs unknown)
  4. Breakdown bars by floor, sector, and target role
- Provide filters: date range, floor, sector, target role, room number, type, status
- Default date range SHOULD be last 7 days
- Be mobile-first responsive; charts MUST stack vertically on viewports &lt; 768px without horizontal page scroll
- Charts MUST use staff dark theme (SVG via Recharts, no bitmap chart images) and show Spanish empty state when filters match zero calls

#### Scenario: Acceso sin permiso
- **GIVEN** authenticated `systemRole: user`
- **WHEN** user opens `/estadisticas`
- **THEN** redirect to `/dashboard`

#### Scenario: Acceso sin sesión
- **WHEN** unauthenticated user opens `/estadisticas`
- **THEN** redirect to `/dashboard/login`

#### Scenario: KPIs reflejan filtros
- **GIVEN** user filters `type=video`
- **WHEN** summary loads
- **THEN** KPIs MUST recalculate for filtered subset only

#### Scenario: Llamado sin canal histórico
- **GIVEN** call without `acceptedChannel`
- **WHEN** row renders
- **THEN** channel column SHALL show `—`

#### Scenario: Gráficos en móvil
- **GIVEN** viewport &lt; 768px
- **THEN** charts SHALL stack vertically without horizontal page scroll

#### Scenario: Sin datos en rango
- **GIVEN** filters match zero calls
- **THEN** charts SHALL show empty state message in Spanish

#### Scenario: Rango mayor a 90 días
- **GIVEN** user selects a date range exceeding 90 days
- **WHEN** page loads history
- **THEN** table and KPIs MUST still load
- **AND** charts section MUST be omitted with a visible notice in Spanish

### REQ-UI-015: Patrones de alerta sonora

The client MUST expose distinct audio patterns:
- **Bell pending:** existing `playBell` pattern (880/660 Hz chimes)
- **Video pending:** distinct urgent pattern (`playVideoAlert`) — higher pitch or faster cadence

Alert loop interval SHOULD be 5–8 seconds. Only one loop instance MUST run at a time.

#### Scenario: Audio no desbloqueado
- **GIVEN** pending calls but audio not unlocked
- **WHEN** alert would play
- **THEN** UI SHOULD show visible indicator that alert is blocked until user gesture

### REQ-UI-016: Vinculación Telegram en dashboard

Telegram link/unlink MUST be available from the **user menu dropdown** in the staff shell header (not as a standalone card on the Llamador page).

#### Scenario: No vinculado
- **GIVEN** user without `telegramChatId`
- **WHEN** user opens the user menu
- **THEN** UI SHALL show **Conectar Telegram** that requests link and opens `t.me` URL

#### Scenario: Vinculado
- **GIVEN** linked user
- **WHEN** user opens the user menu
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

Room tablet UI (habitacion header) and unconfigured screen MUST show institution logo on dark background. Dashboard login MAY use `InstitutionBrand` on light background.

Default logo: `public/branding/clinicamg-logo.png`; overridable via `NEXT_PUBLIC_INSTITUTION_LOGO_URL`.

### REQ-UI-020: Componentes habitación (UI kit)

Route `/habitacion` SHOULD implement UI via scoped components:

| Component | Responsibility |
|-----------|----------------|
| `habitacion-theme.ts` | Color tokens per role |
| `HabitacionHeader` | Logo, title, subtitle, clock, date |
| `HabitacionCallButton` | Timbre/Video idle/active visuals |
| `HabitacionCallModal` | Active call overlay (cancel/finalize) |
| `HabitacionVideoEndModal` | Video end confirmation |
| `HabitacionToast` | Fixed errors/success messages |
| `HabitacionClient` | Room SSE, API orchestration |
| `InstallRoomBanner` | PWA install CTA (sky tint) |
| `RoomUnconfiguredScreen` | Dark support screen |

### REQ-UI-021: Shell dashboard staff

Authenticated staff routes (`/dashboard`, `/dashboard/admin`, `/estadisticas`) MUST use `DashboardShell` with:

1. Header: institution logo, listen status (En línea / Fuera de línea), user menu
2. Tab navigation: **Llamador**, **Administración** (admin only), **Estadísticas** (supervisor+)

ABM MUST NOT be linked from habitación routes.

#### Scenario: admin ve pestaña ABM
- **GIVEN** `systemRole: admin`
- **WHEN** viewing any staff shell page
- **THEN** Administración tab MUST be visible

#### Scenario: user no ve admin
- **GIVEN** `systemRole: user`
- **WHEN** viewing staff shell
- **THEN** Administración tab MUST NOT appear

### REQ-UI-022: Pantalla admin con pestañas

Route `/dashboard/admin` MUST present tabbed ABM: Usuarios, Pisos, Sectores, Habitaciones.

Habitación form MUST show `roomKey` read-only after creation.

### REQ-UI-023: Estadísticas por rol

`/estadisticas` tab MUST be visible only for `supervisor` and `admin`.

### REQ-UI-024: Habitación inactiva — mensaje UI

When room is inactive, `/habitacion` MUST display a prominent inactive message; call buttons MUST be disabled.

### REQ-UI-025: Escucha persistente entre pestañas

#### Scenario: escucha persiste entre pestañas
- **GIVEN** user activated listen on Llamador
- **WHEN** navigating to Administración or Estadísticas without deactivating
- **THEN** header MUST still show **En línea** (SSE via `StaffListenProvider` in root layout)

### REQ-UI-026: Página join video mobile (Telegram)

Route `/join/video` MUST be mobile-first and usable without prior dashboard navigation (magic link from Telegram).

#### Scenario: Layout móvil
- **GIVEN** valid token exchanged to JWT via `POST /api/staff/telegram/video-join`
- **WHEN** page loads on phone viewport
- **THEN** video UI SHALL be fullscreen-friendly with clear end-call control
- **AND** MUST request camera/microphone permission via existing `VideoCallSession`

#### Scenario: Error de token
- **GIVEN** invalid or expired token
- **WHEN** page loads
- **THEN** user SHALL see concise Spanish error and guidance to use dashboard

## Audio (bell)

- Implementation: Web Audio API via `lib/bell.ts` (`playBell`, `playVideoAlert`, `startAlertLoop`, `stopAlertLoop`, `syncAlertLoop`)
- Browser autoplay policy: audio MUST be unlocked by user interaction before SSE-triggered playback

## Known gaps (backlog)

| Item | Priority | Spec domain |
|------|----------|-------------|
| Modo kiosko — salir solo con PIN soporte | Medium | ui |
| TURN server (NAT estricto) | High | calls + deploy |
| Service worker offline / cache | Medium | ui |
| Notificaciones push (FCM) | Low | realtime |
| Auto-desactivar escucha en logout | Low | auth |

## Tests

| Type | Scope |
|------|-------|
| Jest | `lib/auth`, `lib/validation`, `lib/calls`, `lib/bell`, `lib/webrtc-signal`, `lib/telegram`, `lib/room-bind`, `lib/room-manifest`, `lib/call-metrics`, `lib/call-history`, `lib/call-analytics`, `lib/room-key-gen`, `lib/system-roles` |
| Playwright | Landing, login page, habitacion load |
| Manual | Bell/video alert loop, SSE, PWA install, video bidireccional prod, `/estadisticas` |
