# Proposal — Enriquecimiento estadísticas de llamados

**Change:** `call-analytics-enrichment`  
**Status:** Propuesta + specs + design — pendiente implementación  
**Dominios:** `calls`, `ui`

## Intent

Complementar `/estadisticas` con **trazabilidad de canal** (Telegram vs web) y **gráficos analíticos**, sobre la base de timestamps y métricas que ya persisten en `calls`.

Hoy el hospital puede ver KPIs y tabla, pero no sabe si el staff respondió desde el celular (Telegram) o el dashboard, ni visualiza tendencias por zona/tipo.

## Comparación con baseline

| Necesidad | Hoy | Este change |
|-----------|-----|-------------|
| Inicio llamada (habitación) | `createdAt` ✅ | Sin cambio |
| Atención (quién / cuándo) | `acceptedBy`, `acceptedAt` ✅ | + nombre en UI; + `acceptedChannel` |
| Finalización (cuándo) | `completedAt` ✅ | + `completedChannel` |
| Quién finalizó | No | **Fuera de scope** (solo atendió) |
| Telegram vs web | No | `acceptedChannel` / `completedChannel` por acción |
| Gráficos | No | Extendido (ver abajo) |
| Históricos pre-deploy | N/A | Sin canal (`null` → UI "—") |

## Decisiones de producto (cerradas)

| # | Tema | Decisión |
|---|------|----------|
| 1 | Gráficos | **Extendido:** volumen/día, tiempo respuesta, % Telegram vs web, desglose piso/sector/rol, timbre vs video |
| 2 | Canal | **Por acción:** `acceptedChannel` y `completedChannel` (`web` \| `telegram`) |
| 3 | Usuarios | Solo **quién atendió** (`acceptedBy` + nombre); sin `completedBy` |
| 4 | Históricos | Solo llamados **nuevos** post-deploy tienen canal; anteriores sin dato |

### Reglas de canal (borrador design)

| Acción | `web` | `telegram` |
|--------|-------|------------|
| Accept | PATCH dashboard / video staff route | Webhook callback **Atender**; auto-accept en `/join/video` |
| Complete | PATCH dashboard / `VideoCallSession` staff | Webhook **Finalizar** timbre |

Cancel desde habitación: sin canal staff.

## Scope

### In scope

- Campos en `Call`: `acceptedChannel`, `completedChannel` (opcionales)
- Instrumentar `calls-service` + rutas Telegram + dashboard PATCH
- Extender `serializeCall` y `GET /api/calls/history` (summary + series para gráficos)
- UI `/estadisticas`: columnas canal + staff; sección gráficos responsive
- Tests unitarios: channel assignment, agregaciones
- Docs runbook + quick-map

### Out of scope

- `completedBy` / auditoría de notificados sin respuesta
- Export CSV/Excel
- Backfill o inferencia de canal en históricos
- Cambio de permisos (sigue supervisor+)
- Dashboard analítico en tiempo real

## Approach

1. Ampliar modelo y `acceptCall`/`completeCall` con parámetro `channel`
2. Nuevo endpoint o extensión de history: `GET /api/calls/history/analytics` o `includeCharts=true` con series agregadas
3. Librería de gráficos SVG (p. ej. Recharts) en cliente — sin imágenes bitmap
4. Gráficos respetan filtros activos de la página

## Affected areas

| Área | Impacto |
|------|---------|
| `web/lib/types.ts` | `CallChannel`, campos en `Call` |
| `web/lib/calls-service.ts` | Persistir channel en accept/complete |
| `web/lib/calls.ts` | `serializeCall` + join nombre staff |
| `web/app/api/calls/history/route.ts` | Summary extendido + series |
| `web/app/estadisticas/page.tsx` | Tabla + gráficos |
| `openspec/specs/calls/spec.md` | Métricas y canal |
| `openspec/specs/ui/spec.md` | REQ estadísticas |

## Risks

| Riesgo | Mitigación |
|--------|------------|
| Gráficos pesados en móvil | Lazy load; máx. puntos por serie |
| Recharts bundle size | Import dinámico en página estadísticas |
| Canal omitido en algún path | Tests + checklist en tasks |

## Rollback

Campos opcionales en Mongo — sin migración destructiva. Revertir UI gráficos y dejar de escribir `*Channel`.

## Success criteria

- [ ] Llamado atendido desde Telegram persiste `acceptedChannel: telegram`
- [ ] Llamado atendido desde dashboard persiste `acceptedChannel: web`
- [ ] `/estadisticas` muestra gráficos extendidos con filtros
- [ ] Históricos sin canal no rompen agregaciones
- [ ] `npm run test:unit` + `npm run build` OK
