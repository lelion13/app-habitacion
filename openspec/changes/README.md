# Cambios SDD

## Activos

### pwa-tablet-room-bind

PWA Android instalable por habitación: manifest dinámico + `localStorage`, nombre por room, sin reconfiguración por usuario.

| Artefacto | Ruta |
|-----------|------|
| Propuesta | [proposal.md](./pwa-tablet-room-bind/proposal.md) |
| Diseño | [design.md](./pwa-tablet-room-bind/design.md) |
| Tareas | [tasks.md](./pwa-tablet-room-bind/tasks.md) |
| Delta rooms | [specs/rooms/spec.md](./pwa-tablet-room-bind/specs/rooms/spec.md) |
| Delta ui | [specs/ui/spec.md](./pwa-tablet-room-bind/specs/ui/spec.md) |
| Verify | [verify-report.md](./pwa-tablet-room-bind/verify-report.md) |

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
| [2026-06-22-telegram-staff-alerts](./archive/2026-06-22-telegram-staff-alerts/) | 2026-06-22 | Push Telegram escucha activa + vinculado |

## Crear un change nuevo

Ver [docs/quick-map.md](../../docs/quick-map.md) — flujo SDD paso a paso.
