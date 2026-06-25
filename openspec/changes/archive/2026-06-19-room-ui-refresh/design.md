# Design — Room UI refresh

## Theme tokens (`web/lib/habitacion-theme.ts`)

| Token | Value | Usage |
|-------|-------|-------|
| `HABITACION_BG` | `#0d1b2a` | Page background, video shell |
| `HABITACION_FG` | `#f0f4f8` | Primary text |
| `HABITACION_MUTED` | `#7a9ab5` | Secondary text, date |
| Nurse | `#5ee9b5` / `rgba(0,188,125,*)` | Enfermería section |
| Quality | `#ffd230` / `rgba(254,154,0,*)` | Asistente de calidad |
| Doctor | `#74d4ff` / `rgba(0,166,244,*)` | Médico |

## Typography

- **Nunito** in `app/habitacion/layout.tsx` only (dashboard keeps DM Sans)
- Title 30px Black; sector titles 24px; buttons 16px

## Layout — main screen (`100dvh`, no scroll)

```
┌─────────────────────────────────────────────┐  ~31% habitacion-top
│ [Logo]  Habitación 101              14:32   │
│         Piso 1 · Sector A                   │
│                              miércoles…     │
├─────────────────────────────────────────────┤
│ [PWA install banner — if applicable]        │
├─────────────────────────────────────────────┤  ~69% habitacion-body
│ ┌ Enfermería ─────────────────────────────┐ │
│ │     [Timbre 300×100]  [Video 300×100]   │ │
│ └─────────────────────────────────────────┘ │
│ ... Calidad, Médico ...                     │
│ Presione un botón para llamar...            │
└─────────────────────────────────────────────┘
```

## Component map

| Component | Role |
|-----------|------|
| `HabitacionHeader` | Logo, title, subtitle, clock, date |
| `HabitacionCallButton` | Timbre/Video idle/active (color only, no extra labels) |
| `HabitacionCallModal` | Pending/accepted bell — cancel or finalize |
| `HabitacionVideoEndModal` | Confirm end video call |
| `HabitacionToast` | Fixed errors / success messages |
| `HabitacionModal` | Shared overlay shell |
| `HabitacionClient` | Orchestration (unchanged API contract) |
| `RoomUnconfiguredScreen` | Dark support screen |
| `InstallRoomBanner` | Sky-tint PWA CTA |
| `VideoCallSession` | `shellVariant="habitacion"` — floating end + modal |

## Active call states

| Backend status | UI |
|----------------|-----|
| `pending` | `HabitacionCallModal` + active button highlight on sector |
| `accepted` + bell | Modal «en atención» + finalize |
| `accepted` + video | Fullscreen `VideoCallSession` + floating «Finalizar» → modal |

## PWA manifest

`buildRoomManifest`: `background_color` and `theme_color` → `#0d1b2a`

## Source reference

- Figma Make: `https://www.figma.com/make/giMDBpLlJVeawzf0WMR6J1/Improve-clinic-call-screen`
- Figma Design (source of truth): `https://www.figma.com/design/0S2BGDsyMvuF24YFo3bkqj` — frame `Container (Habitación 101)` node `3:2`
