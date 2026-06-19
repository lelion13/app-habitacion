# Proposal — Baseline MVP

**Change:** baseline-mvp  
**Status:** Completado (archivado 2026-06-18)  
**Origen:** [proyecto.md](../../../proyecto.md) + microprompt

## Intent

Entregar un MVP funcional de llamados hospitalarios: PWA habitación + dashboard staff, con persistencia MongoDB y notificaciones en tiempo real.

## Scope entregado

- Next.js 16 full-stack en `web/`
- MongoDB + docker-compose
- Auth JWT dashboard; roomKey para habitación
- CRUD de llamados (crear, aceptar, cancelar, completar)
- SSE staff + room; polling fallback dashboard
- Timbre Web Audio con unlock por gesto
- Tests Jest + Playwright + CI
- Fixes post-MVP: llamado activo habitación, cancel room, bell audio

## Out of scope (explicitamente pospuesto)

- WebRTC completo
- Admin CRUD
- Producción Docker/Traefik
- SSE multi-instancia

## Affected areas

- auth, rooms, calls, realtime, ui (ver specs en `openspec/specs/`)

## Rollback

N/A — baseline inicial. Rollback = revertir commit/tag del MVP.

## Riesgos aceptados

- SSE in-memory no escala horizontalmente
- roomKey en env es secreto compartido por dispositivo habitación
