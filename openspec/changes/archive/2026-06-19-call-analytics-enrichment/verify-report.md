# Verify report — call-analytics-enrichment

**Fecha:** 2026-06-19  
**Entorno:** local + prod (`habitacion.lionapp.cloud`)

## Automatizado

| Check | Resultado |
|-------|-----------|
| `npm run test:unit` | 47/47 passed |
| `npm run build` | OK (Next.js 16.2.9) |

## Manual (prod)

| # | Caso | Resultado |
|---|------|-----------|
| 1 | Atender desde dashboard → canal **Web** | ✅ |
| 2 | Atender desde Telegram → canal **Telegram** | ✅ |
| 3 | Filtros piso/sector reflejados en gráficos | ✅ |
| 4 | Históricos pre-deploy muestran `—` en canal | ✅ |

## Cambios verificados

- `CallChannel` (`web` \| `telegram`) en modelo `Call` y serialización API.
- `acceptCall` / `completeCall` persisten `acceptedChannel` / `completedChannel` según origen.
- Instrumentación: PATCH dashboard (`web`), Telegram actions (`telegram`), video-join auto-accept (`telegram`).
- `GET /api/calls/history`: `includeCharts`, límite 90 días, `acceptedByName`, KPIs `telegramAcceptCount` / `webAcceptCount`.
- `/estadisticas`: 6 KPIs, 6 gráficos Recharts, columnas Atendió / Canal atención / Canal cierre.

## Notas

- Históricos sin `acceptedChannel`/`completedChannel` se agrupan como `unknown` en gráficos de canal.
- Rangos > 90 días: tabla y KPIs OK; gráficos omitidos con aviso en UI.

## Sign-off

- [x] Criterios proposal cumplidos
- [x] Listo para archivar
