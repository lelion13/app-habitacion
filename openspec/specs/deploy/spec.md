# Deploy — Producción

Estado: **desplegado** en `https://habitacion.lionapp.cloud` (2026-06-19).

## Requirements

### REQ-DEPLOY-001: Hosting
The production deployment MUST run on VPS Hostinger `srv1623377` (VM ID `1623377`) at path `/docker/app-habitacion/`.

### REQ-DEPLOY-002: Dominio y TLS
The application MUST be served at `https://habitacion.lionapp.cloud` with TLS certificates via Traefik `letsencrypt` resolver.

#### Scenario: HTTPS landing
- **WHEN** GET `https://habitacion.lionapp.cloud/`
- **THEN** response SHALL be 200 over valid TLS

### REQ-DEPLOY-003: Imagen GHCR
The web application MUST be published as `ghcr.io/lelion13/app-habitacion-web` via GitHub Actions (`.github/workflows/web-ghcr.yml`) on push to `main` affecting `web/**`.

Tags: `latest` + `sha-{commit}`.

### REQ-DEPLOY-004: Traefik routing
Traefik project `traefik-wpez` MUST route `Host(habitacion.lionapp.cloud)` to web container port 3000 with `entrypoints=websecure` and `tls.certresolver=letsencrypt`.

### REQ-DEPLOY-005: SSE Traefik
The Traefik service MUST set `loadbalancer.responseforwarding.flushinterval=1s` for SSE endpoints.

### REQ-DEPLOY-006: MongoDB prod
MongoDB 7 MUST run in the prod stack with:
- Persistent named volume `mongodb_data`
- `expose` only (no public host port)
- Healthcheck interval 60s minimum

### REQ-DEPLOY-007: Variables de entorno
Production environment variables MUST be injected via Hostinger project `environment` or VPS `.env` (compose interpolation).

**No usar `env_file: .env.prod` con Hostinger MCP** — el panel no crea ese archivo.

Required: `JWT_SECRET`, `MONGODB_DB`, `MONGO_INITDB_ROOT_*`, `IMAGE_TAG`, `WEB_HOST`, `NEXT_PUBLIC_APP_URL`, `GHCR_OWNER`, `BOOTSTRAP_ENABLED`, `NODE_ENV`.

Web service receives inline `environment` block in `docker-compose.prod.yml`.

### REQ-DEPLOY-008: Hardening
Prod compose services MUST include `security_opt: no-new-privileges:true` and `cap_drop: ALL` on web where compatible.

### REQ-DEPLOY-009: Seed prod
POST `/api/seed` MUST return 403 when `BOOTSTRAP_ENABLED=false`.

Initial seed completed 2026-06-19; bootstrap disabled after.

### REQ-DEPLOY-010: DNS
`habitacion.lionapp.cloud` A record MUST point to `177.7.37.78`.

### REQ-DEPLOY-011: Secrets Telegram

Production stack MUST provide:
- `TELEGRAM_BOT_TOKEN` — BotFather token (required for notify + webhook)
- `TELEGRAM_BOT_USERNAME` — bot username without `@` (for deep links; prod: `habitacionesBot`)
- `TELEGRAM_WEBHOOK_SECRET` — optional header validation

Values MUST NOT be committed to git; set via Hostinger project environment.

#### Scenario: Token ausente
- **GIVEN** `TELEGRAM_BOT_TOKEN` unset
- **WHEN** call is created
- **THEN** call creation MUST succeed; Telegram send MAY be skipped with server log (no user-facing error)

### REQ-DEPLOY-012: Webhook Telegram

After deploy, webhook MUST point to:
`https://habitacion.lionapp.cloud/api/telegram/webhook`

Document setup steps in `docs/deploy-hostinger.md`.

## Operación

| Acción | Método |
|--------|--------|
| Deploy código | Push `main` → GHCR → `VPS_updateProject` o pull en VPS |
| Rollback | Restaurar `IMAGE_TAG` anterior y `docker compose up -d` |
| Backup Mongo | `mongodump` via `docker compose exec mongodb` |

Runbook detallado: [docs/deploy-hostinger.md](../../docs/deploy-hostinger.md).

## Historial de changes

| Change | Archivado | Fecha |
|--------|-----------|-------|
| deploy-hostinger-ghcr | `openspec/changes/archive/2026-06-19-deploy-hostinger-ghcr/` | 2026-06-19 |
| room-video-webrtc | `openspec/changes/archive/2026-06-19-room-video-webrtc/` | 2026-06-19 |
| telegram-staff-alerts | `openspec/changes/archive/2026-06-22-telegram-staff-alerts/` | 2026-06-22 |
