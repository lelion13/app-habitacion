# IMPLEMENTATION — call-analytics-enrichment

## Backend

| Archivo | Cambio |
|---------|--------|
| `web/lib/types.ts` | `CallChannel`, `acceptedChannel`, `completedChannel` en `Call` |
| `web/lib/calls-service.ts` | `acceptCall`/`completeCall` con `options.channel` |
| `web/lib/calls.ts` | Serializa canales; `formatCallChannel()` |
| `web/lib/call-analytics.ts` | Tipos charts, `bucketChannel`, `chartRangeExceeded` |
| `web/lib/call-analytics-db.ts` | `fetchCallCharts()` agregaciones Mongo |
| `web/app/api/calls/[id]/route.ts` | PATCH pasa `channel: "web"` |
| `web/lib/telegram-call-actions.ts` | `channel: "telegram"` en accept/complete |
| `web/app/api/staff/telegram/video-join/route.ts` | accept con `channel: "telegram"` |
| `web/app/api/calls/history/route.ts` | `includeCharts`, `acceptedByName`, summary canal |

## Frontend

| Archivo | Cambio |
|---------|--------|
| `web/components/estadisticas/EstadisticasCharts.tsx` | 6 gráficos Recharts tema oscuro |
| `web/app/estadisticas/page.tsx` | KPIs, columnas canal, fetch charts |
| `web/package.json` | dependencia `recharts` |

## Tests

- `web/lib/__tests__/call-analytics.test.ts` — `bucketChannel`, `chartRangeExceeded`
- `web/lib/__tests__/calls.test.ts` — `formatCallChannel`

## Verificación

- 47/47 unit tests
- Build OK
- Prod manual OK (verify-report)
