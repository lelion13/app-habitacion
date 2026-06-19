# Tasks — Deploy Hostinger GHCR

## Fase 1 — Código previo al deploy

- [ ] 1.1 `next.config.ts`: `output: 'standalone'`
- [ ] 1.2 Habitación: leer `?key=` con `useSearchParams`, pasar a `/api/room` y `/api/calls`
- [ ] 1.3 Calls POST: priorizar `roomKey` del body (ya soportado; verificar cliente)
- [ ] 1.4 `/api/calls/room` PATCH/GET: aceptar `?key=` además de env
- [ ] 1.5 Tests unitarios habitación con roomKey param
- [ ] 1.6 `npm run build` local OK

## Fase 2 — Contenedores y CI

- [ ] 2.1 Crear `web/Dockerfile` (multi-stage standalone)
- [ ] 2.2 Crear `.dockerignore` en `web/`
- [ ] 2.3 Crear `docker-compose.prod.yml` en raíz repo
- [ ] 2.4 Crear `.env.prod.example`
- [ ] 2.5 Crear `.github/workflows/web-ghcr.yml`
- [ ] 2.6 Push a `main` → verificar imagen en GHCR

## Fase 3 — Infra VPS

- [ ] 3.1 DNS A `habitacion.lionapp.cloud` → `177.7.37.78`
- [ ] 3.2 Crear `/docker/app-habitacion/` en VPS
- [ ] 3.3 Copiar `docker-compose.prod.yml`
- [ ] 3.4 Crear `.env.prod` (JWT_SECRET fuerte, MONGODB_*, NEXT_PUBLIC_APP_URL)
- [ ] 3.5 `docker login ghcr.io` en VPS si paquete privado
- [ ] 3.6 `docker compose pull && up -d`

## Fase 4 — Datos iniciales prod

- [ ] 4.1 Script seed prod (rooms + admin) vía `docker compose exec`
- [ ] 4.2 Rotar password admin default post-seed
- [ ] 4.3 Verificar `/api/seed` retorna 403

## Fase 5 — Verificación

- [ ] 5.1 HTTPS 200 en `/`
- [ ] 5.2 Login dashboard
- [ ] 5.3 `/habitacion?key=room-101-key` + timbre → dashboard
- [ ] 5.4 SSE funciona tras 30s+ (llamado realtime)
- [ ] 5.5 Restart stack → datos Mongo persisten
- [ ] 5.6 Completar `verify-report.md`

## Fase 6 — Documentación y cierre SDD

- [ ] 6.1 Actualizar `docs/runbook.md` sección prod
- [ ] 6.2 Fusionar deltas specs → `openspec/specs/deploy/spec.md`
- [ ] 6.3 Archivar change en `openspec/changes/archive/YYYY-MM-DD-deploy-hostinger-ghcr/`

## Dependencias entre fases

```
1 (código) → 2 (CI) → 3 (VPS) → 4 (seed) → 5 (verify) → 6 (archive)
     3.1 DNS puede hacerse en paralelo con 1-2
```

## Estimación

| Fase | Sesión |
|------|--------|
| 1 | 1 |
| 2 | 1 |
| 3-5 | 1 |
| 6 | 0.5 |
