# Proposal — Alertas persistentes + historial de llamadas

**Change:** call-alerts-and-history  
**Status:** Specs + design listos — pendiente implementación  
**Dominios:** `calls`, `realtime`, `ui`

## Intent

1. **Alerta sonora:** Cuando una habitación inicia timbre o videollamada, el dashboard que escucha (piso + sector + rol destino) debe **seguir alertando** hasta que el llamado deje de requerir atención — no un solo ding como hoy.
2. **Historial y métricas:** Persistir y consultar el registro completo de llamadas en Mongo (colección existente), con tiempos medibles: respuesta, finalización y duración de videollamada cuando aplique.

## Estado actual (baseline)

| Área | Hoy |
|------|-----|
| Sonido dashboard | Una vez, solo `type: "bell"`, en `call:new` / poll (`notifyIfNewBell`) |
| Video | Sin alerta sonora |
| Mongo `calls` | Persiste con `createdAt`, `acceptedAt`, `completedAt`; spec marca historial fuera de alcance |
| Dashboard lista | Solo activos (`pending`, `accepted`); terminales desaparecen de UI |
| Métricas | No calculadas ni expuestas |

## Scope

### In scope

**Mejora 1 — Alerta persistente**
- Repetir alerta mientras exista al menos un llamado `pending` dirigido al listen config activo (`bell` **y** `video`)
- Detener cuando el llamado deja de estar `pending` (atendido, completado o cancelado)
- Respetar unlock de audio (gesto usuario en Activar escucha / Probar timbre)
- Intervalo configurable en cliente (ej. cada 4–8 s) sin saturar SSE
- Re-sincronizar al reconectar SSE o recargar (poll inicial de pendientes)
- Patrones sonoros **distintos**: timbre clásico (`playBell`) vs tono videollamada más urgente (`playVideoAlert`)

**Mejora 2 — Historial y métricas**
- Mantener documentos en colección `calls` (no borrar al completar)
- Campos / derivados explícitos:
  - `responseTimeMs` = `acceptedAt − createdAt` (si atendido)
  - `totalDurationMs` = `completedAt − createdAt` (si terminal)
  - `sessionDurationMs` = `completedAt − acceptedAt` (si terminal; para video = duración sesión)
- Setear métricas en backend al transicionar estado (fuente de verdad)
- `cancelledAt` alias o usar `completedAt` para cancel (hoy ambos usan `completedAt`)
- API staff autenticada: listar historial con filtros (fecha, piso, sector, rol, habitación, tipo, estado) — **sin restricción por escucha activa**
- Paginación (cursor o skip/limit)
- UI staff: ruta **`/estadisticas`** — KPIs agregados (según filtros) + tabla historial con métricas por fila
- Índices Mongo para consultas por `createdAt`, `floor`, `sector`, `targetRole`, `status`

### Out of scope

- Notificaciones push / FCM
- Export CSV / BI externo
- Cola de prioridad entre habitaciones
- TURN / WebRTC
- Roles admin nuevos (usar staff JWT existente)
- Retención **indefinida** — sin job de purge en v1

## Approach

### Alerta (frontend + sin cambio API obligatorio)

```
pending calls for listen config > 0  →  start alert loop (playBell)
call:updated → pending cleared       →  stop loop
SSE call:new (video|bell pending)    →  ensure loop running
```

- Refactor `dashboard/page.tsx`: estado `alertingCallIds` o derivar de `calls.filter(pending)`
- `useEffect` + `setInterval` / scheduler en `lib/bell.ts` (`startAlertLoop` / `stopAlertLoop`)
- Polling 4s existente como fallback si SSE cae

### Historial (backend + API + UI)

- Ampliar `Call` en `lib/types.ts` con campos métrica opcionales
- En PATCH accept / complete / cancel (`[id]/route.ts`, `room/route.ts`): calcular y `$set` métricas
- Nuevo `GET /api/calls/history` con agregados opcionales (`summary` en misma respuesta o query `includeSummary=true`)
- Dashboard: enlace desde dashboard principal hacia `/estadisticas`
- Nuevo `web/app/estadisticas/page.tsx` (guard JWT staff, coherente con dashboard)
- Actualizar `serializeCall` para incluir métricas en historial (no necesariamente en SSE activo)

## Affected areas

| Área | Impacto | Descripción |
|------|---------|-------------|
| `web/app/dashboard/page.tsx` | Modified | Loop alerta, video incluido |
| `web/lib/bell.ts` | Modified | Loop start/stop, posible tono video |
| `web/lib/types.ts`, `web/lib/calls.ts` | Modified | Campos métrica |
| `web/app/api/calls/[id]/route.ts` | Modified | Persistir métricas en transiciones |
| `web/app/api/calls/room/route.ts` | Modified | Métricas en cancel room |
| `web/app/api/calls/history/route.ts` | New | Listado historial staff |
| `web/app/estadisticas/page.tsx` | New | UI historial y métricas |
| `openspec/specs/calls/spec.md` | Delta | REQ historial + métricas |
| `openspec/specs/ui/spec.md` | Delta | Alerta persistente + pantalla historial |
| `openspec/specs/realtime/spec.md` | Delta | Nota alerta cliente |

## Decisiones abiertas (requieren confirmación)

| # | Tema | Decisión |
|---|------|----------|
| **1** | ¿Cuándo deja de sonar? | ✅ **B** — Deja de sonar cuando el llamado **ya no está pending**: al **atender** (`accepted`), **completar**, o **cancelar** (incl. cancelación desde habitación) |
| **2** | ¿Mismo sonido bell y video? | ✅ **B** — Patrones distintos (timbre clásico vs tono videollamada más urgente) |
| **3** | ¿UI historial en v1? | ✅ **C** — Pantalla dedicada en **`/estadisticas`** (staff autenticado): historial + columnas de métricas |
| **4** | ¿Retención? | ✅ **A** — Indefinida (sin TTL; todo el historial permanece en Mongo) |

Todas las decisiones de producto cerradas.

| **5** | ¿Alcance en `/estadisticas`? | ✅ **B** — Todo el hospital; filtros libres (piso, sector, rol, habitación, fechas) |
| **6** | ¿KPIs agregados? | ✅ **B** — Tabla + resumen (promedio tiempo respuesta, totales, % por tipo, etc. según filtros activos) |

## Risks

| Riesgo | Mitigación |
|--------|------------|
| Autoplay bloquea loop | Requerir unlock previo; indicador visual “alerta activa” |
| Múltiples pendientes | Un loop global; no apilar osciladores |
| Crecimiento colección `calls` | Índices; retención en fase 2 |
| Métricas sin `acceptedAt` (cancel directo) | `responseTimeMs` null; documentar |

## Rollback

- Frontend: revert loop alerta → comportamiento actual (ding único, solo bell)
- Backend: métricas opcionales; API history desactivable; sin migración destructiva
- Deploy imagen GHCR anterior

## Success criteria

- [ ] Timbre **y** video pending reproducen alerta repetida en dashboard correcto
- [ ] Alerta cesa según regla acordada (§1)
- [ ] Toda llamada terminal queda consultable con timestamps y métricas
- [ ] `responseTimeMs`, `totalDurationMs`, `sessionDurationMs` correctos en casos: atendido+completado, cancel pending, video completo
- [ ] `npm run test:unit` + `npm run build` OK
- [ ] `/estadisticas` muestra KPIs + tabla filtrable (todo el hospital)

## Dependencies

- Baseline MVP + WebRTC + layout video archivados
- Sin infra nueva (Mongo existente)
