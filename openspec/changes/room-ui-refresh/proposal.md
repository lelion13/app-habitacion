# Proposal — Room UI refresh (habitación)

## Intent

Refresh the `/habitacion` tablet experience to match the Figma Make prototype: dark theme, Nunito typography, horizontal sector rows with Timbre/Video actions, live clock, and consistent styling across loading, unconfigured, PWA install, and video overlay states.

## Scope

**In:**
- All UI under `/habitacion` (main call screen, loading, unconfigured, PWA banner, video session shell for room)
- Room PWA manifest `background_color` / `theme_color` aligned to `#0d1b2a`
- New habitacion-scoped components and theme tokens

**Out:**
- Dashboard, login, estadísticas styling
- Call logic, SSE, WebRTC behavior changes
- Staff `VideoCallSession` shell (default variant unchanged)

## Approach

1. Import design from Figma Make via MCP (`giMDBpLlJVeawzf0WMR6J1`) as reference
2. Add `habitacion-theme.ts` + `HabitacionHeader` + `HabitacionCallButton`
3. Refactor `HabitacionClient` preserving API/SSE/PWA flows
4. Add `shellVariant="habitacion"` to `VideoCallSession` for room overlay
5. Nunito font via `habitacion/layout.tsx`

## Decisions (confirmed)

| Topic | Decision |
|-------|----------|
| Header | `room.label` + piso/sector subtitle + date left; clock right |
| Date/time | Always visible |
| Targets | PWA + normal Chrome |
| Toast confirmación | Keep with dark styling |
| Video overlay | Match habitacion dark theme |
| Active call UX | Inline sector status + floating cancel (no amber banner) |

## Risks

- `lucide-react` new dependency (icons)
- Manifest color change affects splash on reinstall only

## Success criteria

- Visual parity with Figma Make for main call screen
- All existing habitacion e2e/manual flows unchanged functionally
