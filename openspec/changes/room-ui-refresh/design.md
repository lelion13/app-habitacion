# Design — Room UI refresh

## Theme tokens (`web/lib/habitacion-theme.ts`)

| Token | Value | Usage |
|-------|-------|-------|
| `HABITACION_BG` | `#0d1b2a` | Page background, video shell |
| `HABITACION_FG` | `#f0f4f8` | Primary text |
| `HABITACION_MUTED` | `#7a9ab5` | Secondary text, date |
| Role colors | emerald / amber / sky | nurse / quality / doctor |

## Typography

- **Nunito** loaded in `app/habitacion/layout.tsx` only (dashboard keeps DM Sans)
- Weights 400–900 for hierarchy

## Layout — main screen

```
┌─────────────────────────────────────────────┐
│ [Logo]  Habitación 101              14:32   │
│         Piso 2 · Sector A                   │
│         viernes, 19 de junio                │
├─────────────────────────────────────────────┤
│ [PWA install banner — if applicable]        │
│ Presione un botón para llamar...            │
│ ┌ Enfermería ────────── Llamando... ─────┐ │
│ │  [Timbre]          [Video]              │ │
│ └─────────────────────────────────────────┘ │
│ ... quality, doctor rows ...                │
│              [Cancelar llamada] (floating)  │
└─────────────────────────────────────────────┘
```

## Component map

| Component | Role |
|-----------|------|
| `HabitacionHeader` | Logo, title, subtitle, date, clock |
| `HabitacionCallButton` | Timbre/Video with idle/calling/connected visuals |
| `HabitacionClient` | Orchestration (unchanged API contract) |
| `RoomUnconfiguredScreen` | Dark support screen |
| `InstallRoomBanner` | Dark PWA CTA |
| `VideoCallSession` | `shellVariant="habitacion"` for room |

## Active call states

| Backend status | UI |
|----------------|-----|
| `pending` | Sector row: "Llamando...", button pulse |
| `accepted` + bell | "En atención · MM:SS", green button state |
| `accepted` + video | Fullscreen `VideoCallSession` |

## PWA manifest

`buildRoomManifest`: `background_color` and `theme_color` → `#0d1b2a`

## Source reference

Figma Make: `https://www.figma.com/make/giMDBpLlJVeawzf0WMR6J1/Improve-clinic-call-screen`
