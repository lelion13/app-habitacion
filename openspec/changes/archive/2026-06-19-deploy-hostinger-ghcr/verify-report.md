# Verify Report — Deploy Hostinger GHCR

**Change:** deploy-hostinger-ghcr  
**Fecha:** 2026-06-19  
**Entorno:** prod `https://habitacion.lionapp.cloud`  
**Resultado:** PASS

## Infraestructura

| # | Verificación | Resultado |
|---|--------------|-----------|
| 1 | DNS A → 177.7.37.78 | ✅ |
| 2 | HTTPS landing 200 | ✅ |
| 3 | Traefik + Let's Encrypt | ✅ |
| 4 | Stack `/docker/app-habitacion/` running | ✅ |
| 5 | MongoDB healthy + volumen persistente | ✅ |
| 6 | GHCR `app-habitacion-web:latest` | ✅ |
| 7 | SSE realtime (timbre) | ✅ |

## Aplicación

| # | Verificación | Resultado |
|---|--------------|-----------|
| 1 | Login dashboard | ✅ |
| 2 | `/habitacion?key=room-101-key` | ✅ |
| 3 | Crear llamado timbre → dashboard | ✅ |
| 4 | Seed inicial + `BOOTSTRAP_ENABLED=false` | ✅ |
| 5 | `?key=` runtime sin rebuild por tablet | ✅ |

## Fix deploy Hostinger MCP

**Problema:** contenedores en estado `created` sin arrancar.

**Causa:** `env_file: .env.prod` — Hostinger MCP no crea ese archivo.

**Solución:** variables inline en `environment` del servicio `web` en `docker-compose.prod.yml`.

## Commits relevantes

- `4838066` — deploy inicial
- `ebf4e57` — WebRTC (incluye compose fix documentado)

## Sign-off

- [x] Criterios de proposal cumplidos
- [x] Runbook `docs/deploy-hostinger.md` actualizado
- [x] Specs fusionadas a `openspec/specs/deploy/spec.md`
