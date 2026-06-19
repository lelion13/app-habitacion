# Deploy — Infraestructura producción

> Delta spec for change `deploy-hostinger-ghcr`.  
> After archive, merge into `openspec/specs/deploy/spec.md`.

## ADDED Requirements

### REQ-DEPLOY-001: Hosting
The production deployment MUST run on VPS Hostinger `srv1623377` at path `/docker/app-habitacion/`.

### REQ-DEPLOY-002: Dominio y TLS
The application MUST be served at `https://habitacion.lionapp.cloud` with TLS certificates via Traefik `letsencrypt` resolver.

#### Scenario: HTTPS landing
- **WHEN** GET `https://habitacion.lionapp.cloud/`
- **THEN** response SHALL be 200 over valid TLS

### REQ-DEPLOY-003: Imagen GHCR
The web application MUST be published as `ghcr.io/lelion13/app-habitacion-web` via GitHub Actions on push to `main`.

Production VPS MUST pin image by tag (SHA), not floating `latest` only.

### REQ-DEPLOY-004: Traefik routing
Traefik MUST route `Host(habitacion.lionapp.cloud)` to the web container port 3000 with `entrypoints=websecure` and `tls.certresolver=letsencrypt`.

### REQ-DEPLOY-005: SSE Traefik
The Traefik service MUST set `loadbalancer.responseforwarding.flushinterval=1s` for SSE endpoints.

### REQ-DEPLOY-006: MongoDB prod
MongoDB MUST run as a dedicated container in the prod stack with:
- Persistent named volume
- `expose` only (no public host port)
- Healthcheck interval 60s minimum

### REQ-DEPLOY-007: Secretos
Secrets MUST live in `/docker/app-habitacion/.env.prod` on VPS, never committed to git.

Required variables: `JWT_SECRET`, `MONGODB_URI`, `MONGODB_DB`, `IMAGE_TAG`, `WEB_HOST`.

### REQ-DEPLOY-008: Hardening
Prod compose services MUST include `security_opt: no-new-privileges:true` and `cap_drop: ALL` where compatible.

### REQ-DEPLOY-009: Seed prod
POST `/api/seed` MUST return 403 in production.

## MODIFIED Requirements

_None — new domain._

## REMOVED Requirements

_None._
