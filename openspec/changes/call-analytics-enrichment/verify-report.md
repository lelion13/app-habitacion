# Verify report — call-analytics-enrichment

**Fecha:** 2026-06-19  
**Entorno:** local (Windows)

## Automatizado

| Check | Resultado |
|-------|-----------|
| `npm run test:unit` | 47/47 passed |
| `npm run build` | OK (Next.js 16.2.9) |

## Cambios verificados en código

- `CallChannel` (`web` \| `telegram`) en modelo `Call` y serialización API.
- `acceptCall` / `completeCall` persisten `acceptedChannel` / `completedChannel` según origen.
- Instrumentación: PATCH dashboard (`web`), Telegram actions (`telegram`), video-join auto-accept (`telegram`).
- `GET /api/calls/history`: `includeCharts`, límite 90 días, `acceptedByName`, KPIs `telegramAcceptCount` / `webAcceptCount`.
- `/estadisticas`: 6 KPIs, 6 gráficos Recharts, columnas Atendió / Canal atención / Canal cierre.

## Pendiente manual (prod/staging)

- [ ] Atender desde dashboard → fila con canal **Web**.
- [ ] Atender desde Telegram → fila con canal **Telegram**.
- [ ] Filtros piso/sector actualizan gráficos coherentemente.
- [ ] Llamados históricos previos al deploy muestran `—` en canal.

## Notas

- Históricos sin `acceptedChannel`/`completedChannel` se agrupan como `unknown` en gráficos de canal.
- Rangos > 90 días: tabla y KPIs OK; gráficos omitidos con aviso en UI.
