# Cambios SDD

## Activos

### telegram-staff-alerts

Notificaciones Telegram a staff con escucha activa y cuenta vinculada.

| Artefacto | Ruta |
|-----------|------|
| Propuesta | [proposal.md](./telegram-staff-alerts/proposal.md) |
| Diseño | [design.md](./telegram-staff-alerts/design.md) |
| Tareas | [tasks.md](./telegram-staff-alerts/tasks.md) |
| Delta auth | [specs/auth/spec.md](./telegram-staff-alerts/specs/auth/spec.md) |
| Delta calls | [specs/calls/spec.md](./telegram-staff-alerts/specs/calls/spec.md) |
| Delta ui | [specs/ui/spec.md](./telegram-staff-alerts/specs/ui/spec.md) |
| Delta deploy | [specs/deploy/spec.md](./telegram-staff-alerts/specs/deploy/spec.md) |
| Verify | [verify-report.md](./telegram-staff-alerts/verify-report.md) |

Estado: **specs listas** — listo para implementar.

### call-alerts-and-history

Alerta sonora persistente (timbre + video) hasta atención; historial de llamadas con métricas en Mongo.

| Artefacto | Ruta |
|-----------|------|
| Propuesta | [proposal.md](./call-alerts-and-history/proposal.md) |
| Diseño | [design.md](./call-alerts-and-history/design.md) |
| Tareas | [tasks.md](./call-alerts-and-history/tasks.md) |
| Delta calls | [specs/calls/spec.md](./call-alerts-and-history/specs/calls/spec.md) |
| Delta ui | [specs/ui/spec.md](./call-alerts-and-history/specs/ui/spec.md) |
| Delta realtime | [specs/realtime/spec.md](./call-alerts-and-history/specs/realtime/spec.md) |
| Verify | [verify-report.md](./call-alerts-and-history/verify-report.md) |

Estado: **implementado** — pendiente archivar SDD.

---

## Archivados

| Change | Fecha | Resumen |
|--------|-------|---------|
| [2026-06-18-baseline-mvp](./archive/2026-06-18-baseline-mvp/) | 2026-06-18 | MVP timbre + dashboard |
| [2026-06-19-deploy-hostinger-ghcr](./archive/2026-06-19-deploy-hostinger-ghcr/) | 2026-06-19 | Prod GHCR + Traefik |
| [2026-06-19-room-video-webrtc](./archive/2026-06-19-room-video-webrtc/) | 2026-06-19 | WebRTC bidireccional |
| [2026-06-19-video-ui-fixed-layout](./archive/2026-06-19-video-ui-fixed-layout/) | 2026-06-19 | Layout 16:9 + footer finalizar |

## Crear un change nuevo

Ver [docs/quick-map.md](../../docs/quick-map.md) — flujo SDD paso a paso.
