# Quick map — App Habitación

Guía rápida para orientarse en el repo y en SDD.

## Documentación SDD (fuente de verdad)

| Qué | Dónde |
|-----|--------|
| Config SDD | [openspec/config.yaml](../openspec/config.yaml) |
| Comportamiento actual (specs) | [openspec/specs/](../openspec/specs/) |
| Cambios activos | [openspec/changes/](../openspec/changes/) |
| Cambios completados | [openspec/changes/archive/](../openspec/changes/archive/) |
| Diseño baseline MVP | [openspec/changes/archive/2026-06-18-baseline-mvp/design.md](../openspec/changes/archive/2026-06-18-baseline-mvp/design.md) |

## Código

| Área | Ruta |
|------|------|
| App Next.js | `web/` |
| Páginas habitación | `web/app/habitacion/` |
| Páginas dashboard | `web/app/dashboard/` |
| API | `web/app/api/` |
| Lógica compartida | `web/lib/` |
| Estado global | `web/context/AppContext.tsx` |
| Componentes UI | `web/components/` |

## Dominios de spec

| Dominio | Archivo | Responsabilidad |
|---------|---------|-----------------|
| auth | `openspec/specs/auth/spec.md` | Login staff, JWT, sesiones de escucha |
| rooms | `openspec/specs/rooms/spec.md` | Habitaciones, roomKey, seed |
| calls | `openspec/specs/calls/spec.md` | Ciclo de vida de llamados |
| realtime | `openspec/specs/realtime/spec.md` | SSE staff y habitación |
| ui | `openspec/specs/ui/spec.md` | Pantallas, PWA, timbre, UX |

## Cambio activo

**deploy-hostinger-ghcr** — prod en `habitacion.lionapp.cloud`  
→ [openspec/changes/deploy-hostinger-ghcr/](../openspec/changes/deploy-hostinger-ghcr/proposal.md)

## Flujo SDD para un cambio nuevo

1. **Explorar** — `openspec/changes/{nombre}/exploration.md` (opcional)
2. **Proponer** — `proposal.md` (alcance, riesgos, rollback)
3. **Especificar** — `specs/{dominio}/spec.md` (delta ADDED/MODIFIED/REMOVED)
4. **Diseñar** — `design.md` (si hay decisiones técnicas)
5. **Tareas** — `tasks.md`
6. **Implementar** — código + marcar tareas
7. **Verificar** — `verify-report.md` + tests/build
8. **Archivar** — mover a `archive/YYYY-MM-DD-{nombre}/` y fusionar specs

## Origen del producto

- Requerimiento inicial: [proyecto.md](../proyecto.md)
- Prompt microprompt: [MICRO-PROMPT.md](../MICRO-PROMPT.md)
- Operación local: [runbook.md](./runbook.md)
