# UI — Delta call-analytics-enrichment

## MODIFIED Requirements

### REQ-UI-014: Pantalla estadísticas (MODIFIED)

Route `/estadisticas` MUST additionally:

- Display **Atendió** (staff name), **Canal atención**, **Canal cierre** in the history table
- Show channel as `Web`, `Telegram`, or `—` when unknown
- Render an **analytics charts section** below KPIs when `includeCharts=true`:
  1. Calls per day (bell vs video)
  2. Average response time per day
  3. Accepted-channel split (web vs telegram vs unknown)
  4. Breakdown bars by floor, sector, and target role

Charts MUST respect active page filters and use staff dark theme (SVG, no bitmap chart images).

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
