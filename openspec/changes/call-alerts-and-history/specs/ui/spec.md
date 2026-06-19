# UI — Delta call-alerts-and-history

## MODIFIED Requirements

### REQ-UI-004: Dashboard escucha (MODIFIED)

Route `/dashboard` MUST:
- Allow configuring floor, sector, role and saving listen session
- List active calls with accept, cancel, complete actions
- Subscribe to staff SSE
- **Play repeating alert** while at least one `pending` call matches listen config (`floor`, `sector`, `targetRole`)
- Alert MUST apply to both `bell` and `video` types
- Alert MUST stop when no matching `pending` calls remain (all terminal or accepted-only)
- Provide **Probar timbre** to unlock browser audio
- Unlock audio on **Activar escucha** (user gesture)
- Link **Abrir video** for accepted video calls
- Link to **`/estadisticas`**

(Previously: single bell ding on new `bell` calls only.)

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

## ADDED Requirements

### REQ-UI-014: Pantalla estadísticas

Route `/estadisticas` MUST require staff authentication (same JWT session as dashboard).

The page MUST:
- Show KPI summary cards driven by active filters (totals, avg response time, avg session duration, bell vs video counts)
- Show paginated table of calls with: room, floor, sector, type, target role, status, timestamps, `responseTimeMs`, `totalDurationMs`, `sessionDurationMs`
- Provide filters: date range, floor, sector, target role, room number, type, status
- Default date range SHOULD be last 7 days
- Be mobile-first responsive

#### Scenario: Acceso sin sesión
- **WHEN** unauthenticated user opens `/estadisticas`
- **THEN** redirect to `/dashboard/login`

#### Scenario: KPIs reflejan filtros
- **GIVEN** user filters `type=video`
- **WHEN** summary loads
- **THEN** KPIs MUST recalculate for filtered subset only

### REQ-UI-015: Patrones de alerta sonora

The client MUST expose distinct audio patterns:
- **Bell pending:** existing `playBell` pattern (880/660 Hz chimes)
- **Video pending:** distinct urgent pattern (`playVideoAlert`) — higher pitch or faster cadence

Alert loop interval SHOULD be 5–8 seconds. Only one loop instance MUST run at a time.

#### Scenario: Audio no desbloqueado
- **GIVEN** pending calls but audio not unlocked
- **WHEN** alert would play
- **THEN** UI SHOULD show visible indicator that alert is blocked until user gesture
