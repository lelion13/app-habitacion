# UI — Delta: room-ui-refresh

## MODIFIED Requirements

### REQ-UI-002: PWA habitación

Route `/habitacion` MUST use a **dark habitacion theme** (`#0d1b2a` background, Nunito typography) scoped to the habitacion route.

The main call UI MUST:
- Show header with institution logo, `room.label`, floor/sector subtitle, localized date, and live clock (time top-right)
- Display helper text: «Presione un botón para llamar al sector que necesita»
- Render three horizontal sector rows (Enfermería, Asistente de calidad, Médico) with role-colored accents
- Use Timbre/Video buttons with dark bordered style and lucide icons
- Show inline call status on the active sector row (`Llamando…` / `En atención · elapsed`)
- Show floating **Cancelar llamada** when a call is active (non-video overlay)
- Show confirmation toast after call dispatch with dark styling when no active call

Loading and unconfigured states MUST use the same dark theme and institution logo.

#### Scenario: Reloj visible
- **GIVEN** room loaded successfully
- **WHEN** user views `/habitacion`
- **THEN** current time MUST update every second in the header

### REQ-UI-006: Diseño

For `/habitacion` only:
- Background `#0d1b2a`, foreground `#f0f4f8`, muted `#7a9ab5`
- Role accents: emerald (nurse), amber (quality), sky (doctor)
- Dashboard and login retain existing light theme

### REQ-UI-008: PWA manifest prod

Dynamic manifest `background_color` and `theme_color` MUST be `#0d1b2a` for room installs.

The main call UI MUST fit within the device viewport (`100dvh`) without horizontal or vertical scrolling: header, helper text, three sector rows, and cancel action (when visible) SHALL be visible together; sector rows MUST share remaining height equally (`flex-1` / `min-h-0`).

### REQ-UI-010: Componente video compartido

`VideoCallSession` MUST accept optional `shellVariant="habitacion"` for room overlay styling aligned with habitacion theme. Staff dashboard MUST keep default shell.

### REQ-UI-019: Branding institucional

Room tablet UI and unconfigured screen MUST show institution logo on dark background (habitacion header and support screen).
