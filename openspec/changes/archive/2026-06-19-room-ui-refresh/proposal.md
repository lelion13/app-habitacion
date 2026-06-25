# Proposal — Room UI refresh (habitación)

## Intent

Refresh the `/habitacion` tablet experience to match the Figma prototype: dark theme, Nunito typography, horizontal sector rows with Timbre/Video actions, live clock, and consistent styling across loading, unconfigured, PWA install, and video overlay states.

## Scope

**In:**
- All UI under `/habitacion` (main call screen, loading, unconfigured, PWA banner, video session shell for room)
- Room PWA manifest `background_color` / `theme_color` aligned to `#0d1b2a`
- Habitacion-scoped components, theme tokens, modal overlays for call UX

**Out:**
- Dashboard, login, estadísticas styling
- Call logic, SSE, WebRTC behavior changes
- Staff `VideoCallSession` shell (default variant unchanged)

## Approach

1. Figma Make (`giMDBpLlJVeawzf0WMR6J1`) → Design file (`0S2BGDsyMvuF24YFo3bkqj`, frame `3:2`)
2. Add `habitacion-theme.ts` + habitacion components
3. Refactor `HabitacionClient` preserving API/SSE/PWA flows
4. Add `shellVariant="habitacion"` to `VideoCallSession` for room overlay
5. Nunito font via `habitacion/layout.tsx`
6. Modal/toast overlays so active calls do not shift layout

## Decisions (confirmed)

| Topic | Decision |
|-------|----------|
| Header | `room.label` + piso/sector; clock right; date under clock (right) |
| Date/time | Always visible |
| Targets | PWA + normal Chrome |
| Toast confirmación | Fixed toast (dark styling), not header banner |
| Video overlay | Dark theme; floating end button + confirmation modal |
| Active call UX | Modal overlay (cancel/finalize); no inline footer or sector badges |

## Risks

- `lucide-react` new dependency (icons)
- Manifest color change affects splash on reinstall only

## Success criteria

- Visual parity with Figma Design for main call screen
- No layout shift during calls (modals/toasts)
- All existing habitacion e2e/manual flows unchanged functionally
