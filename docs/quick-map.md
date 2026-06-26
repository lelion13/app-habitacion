# Quick map — App Habitación

Guía rápida para orientarse en el repo y en SDD.

**Estado actual (2026-06-19):** prod en https://habitacion.lionapp.cloud — timbre + videollamada WebRTC + layout 16:9 + alertas Telegram + PWA tablet + historial `/estadisticas` + UI oscura habitación + **dashboard staff (RBAC, ABM, shell oscuro, escucha persistente)**.

## Documentación SDD (fuente de verdad)

| Qué | Dónde |
|-----|--------|
| Config SDD | [openspec/config.yaml](../openspec/config.yaml) |
| Comportamiento actual (specs) | [openspec/specs/](../openspec/specs/) |
| Cambios activos | [openspec/changes/](../openspec/changes/) |
| Cambios completados | [openspec/changes/archive/](../openspec/changes/archive/) |

## Código

| Área | Ruta |
|------|------|
| App Next.js | `web/` |
| PWA habitación | `web/app/habitacion/`, `web/components/habitacion/` |
| Tema / UI habitación | `web/lib/habitacion-theme.ts`, `web/app/habitacion/habitacion.css` |
| Room bind / manifest PWA | `web/lib/room-bind.ts`, `web/lib/room-manifest.ts`, `web/app/api/manifest/` |
| Branding institución | `web/components/InstitutionBrand.tsx`, `web/public/branding/` |
| Dashboard | `web/app/dashboard/` |
| Shell / tema staff | `web/components/dashboard/`, `web/lib/staff-theme.ts` |
| Escucha global (SSE) | `web/context/StaffListenContext.tsx`, `web/components/StaffListenBridge.tsx` |
| ABM admin | `web/app/dashboard/admin/`, `web/app/api/admin/`, `web/components/admin/AdminPanel.tsx` |
| RBAC / migración | `web/lib/system-roles.ts`, `web/lib/admin-auth.ts`, `web/lib/admin-migrate.ts` |
| roomKey legible | `web/lib/room-key-gen.ts` |
| Catálogo staff | `web/app/api/staff/catalog/` |
| Estadísticas / historial | `web/app/estadisticas/`, `web/app/api/calls/history/` |
| Métricas llamados | `web/lib/call-metrics.ts`, `web/lib/call-history.ts` |
| Alerta persistente | `web/lib/bell.ts` (`startAlertLoop`, `playVideoAlert`) |
| Videollamada staff | `web/app/dashboard/video/[callId]/` |
| API | `web/app/api/` |
| Signaling WebRTC | `web/app/api/calls/[id]/signal/` |
| Lógica compartida | `web/lib/` |
| Telegram (notify + link) | `web/lib/telegram.ts`, `web/lib/telegram-link.ts`, `web/lib/telegram-recipients.ts` |
| API Telegram | `web/app/api/telegram/webhook/`, `web/app/api/staff/telegram/` |
| VideoCallSession | `web/components/VideoCallSession.tsx` |
| Estado global | `web/context/AppContext.tsx` |

## Dominios de spec

| Dominio | Archivo | Responsabilidad |
|---------|---------|-----------------|
| auth | `openspec/specs/auth/spec.md` | Login staff, JWT, sesiones |
| rooms | `openspec/specs/rooms/spec.md` | Habitaciones, `?key=`, seed |
| calls | `openspec/specs/calls/spec.md` | Llamados + signaling WebRTC |
| realtime | `openspec/specs/realtime/spec.md` | SSE + `webrtc:signal` |
| ui | `openspec/specs/ui/spec.md` | Pantallas, PWA, video, UX |
| deploy | `openspec/specs/deploy/spec.md` | Prod Hostinger, GHCR, Traefik |

## Changes archivados (historial)

| Change | Fecha | Resumen |
|--------|-------|---------|
| [baseline-mvp](../openspec/changes/archive/2026-06-18-baseline-mvp/) | 2026-06-18 | MVP timbre + dashboard |
| [deploy-hostinger-ghcr](../openspec/changes/archive/2026-06-19-deploy-hostinger-ghcr/) | 2026-06-19 | Prod GHCR + Traefik + `?key=` |
| [room-video-webrtc](../openspec/changes/archive/2026-06-19-room-video-webrtc/) | 2026-06-19 | Videollamada bidireccional |
| [video-ui-fixed-layout](../openspec/changes/archive/2026-06-19-video-ui-fixed-layout/) | 2026-06-19 | Marco 16:9 + footer finalizar (staff) |
| [room-ui-refresh](../openspec/changes/archive/2026-06-19-room-ui-refresh/) | 2026-06-19 | UI oscura Figma + modales/toasts llamada |
| [telegram-staff-alerts](../openspec/changes/archive/2026-06-22-telegram-staff-alerts/) | 2026-06-22 | Push Telegram si escucha activa + vinculado |
| [pwa-tablet-room-bind](../openspec/changes/archive/2026-06-22-pwa-tablet-room-bind/) | 2026-06-22 | PWA tablet habitación fija, manifest dinámico, fullscreen |
| [call-alerts-and-history](../openspec/changes/archive/2026-06-22-call-alerts-and-history/) | 2026-06-22 | Alerta persistente bell/video + historial `/estadisticas` |
| [admin-rbac-abm](../openspec/changes/archive/2026-06-19-admin-rbac-abm/) | 2026-06-19 | RBAC + ABM + shell staff oscuro + escucha persistente |

## Changes activos

_Ninguno._

## Docs operativos

| Doc | Contenido |
|-----|-----------|
| [architecture.md](./architecture.md) | Diagramas, ADRs, WebRTC |
| [runbook.md](./runbook.md) | Local, prod, troubleshooting |
| [deploy-hostinger.md](./deploy-hostinger.md) | VPS, GHCR, seed, rollback |

## Flujo SDD para un cambio nuevo

1. **Proponer** — `openspec/changes/{nombre}/proposal.md`
2. **Especificar** — deltas en `specs/{dominio}/spec.md`
3. **Diseñar** — `design.md` (si aplica)
4. **Tareas** — `tasks.md`
5. **Implementar** — código
6. **Verificar** — `verify-report.md` + tests
7. **Archivar** — mover a `archive/YYYY-MM-DD-{nombre}/` y fusionar specs

## Origen del producto

- [proyecto.md](../proyecto.md) — requerimiento inicial
- [MICRO-PROMPT.md](../MICRO-PROMPT.md) — stack microprompt
