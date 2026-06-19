# Proposal — Deploy Hostinger GHCR

**Change:** deploy-hostinger-ghcr  
**Status:** Planificado  
**Dominio prod:** https://habitacion.lionapp.cloud  
**Repositorio:** https://github.com/lelion13/app-habitacion.git

## Intent

Desplegar App Habitación en el VPS Hostinger (`srv1623377`) usando GHCR + Docker Compose + Traefik existente, con MongoDB dedicado en el stack y soporte multi-habitación vía query param en runtime.

## Alcance

### Incluido
- Imagen Docker Next.js standalone → `ghcr.io/lelion13/app-habitacion-web`
- Workflow GitHub Actions build/push GHCR
- `docker-compose.prod.yml` en `/docker/app-habitacion/` del VPS
- Traefik: `Host(habitacion.lionapp.cloud)` → puerto 3000
- MongoDB 7 con volumen persistente (solo `expose`, sin puerto público)
- `.env.prod.example` documentado
- Habitación en prod: `/habitacion?key={roomKey}` (sin rebuild por tablet)
- Healthcheck interval 60s, hardening compose (skill Hostinger)
- SSE: flush Traefik para streams
- Runbook deploy VPS
- Seed deshabilitado en prod (ya implementado)

### Fuera de alcance
- WebRTC completo
- Redis para SSE multi-instancia
- Admin CRUD habitaciones
- CI deploy automático al VPS (solo build GHCR; pull manual en VPS como otros apps)
- DNS automation (documentar registro A manual)

## Contexto VPS (verificado MCP Hostinger)

| Item | Valor |
|------|--------|
| VM ID | 1623377 |
| IPv4 | 177.7.37.78 |
| Traefik | `/docker/traefik-wpez/` — `network_mode: host`, `letsencrypt`, entrypoints `web`/`websecure` |
| Patrón apps | `/docker/{proyecto}/docker-compose.prod.yml` |
| app-habitacion | **No desplegado aún** |

## Decisión: habitaciones en prod

**Elegido:** una sola app/despliegue; cada tablet usa `/habitacion?key=room-XXX`.

## Affected areas

| Dominio | Cambio |
|---------|--------|
| deploy | Docker, GHCR, Traefik, env prod |
| rooms | roomKey vía query param en cliente |
| ui | habitacion page lee `?key=` |
| realtime | headers/Traefik SSE |

## Rollback

```bash
cd /docker/app-habitacion
docker compose --env-file .env.prod -f docker-compose.prod.yml down
# Restaurar IMAGE_TAG anterior en .env.prod y up -d
```

DNS puede permanecer; stack down = sitio caído sin afectar otras apps.

## Riesgos

| Riesgo | Mitigación |
|--------|------------|
| SSE buffered por Traefik | `responseforwarding.flushinterval=1s` |
| `NEXT_PUBLIC_*` en build | Solo URLs públicas; roomKey va por query |
| Mongo sin backup | Volumen nombrado + documentar backup en runbook |
| `:latest` en prod | Usar `IMAGE_TAG=sha` en `.env.prod` |

## Prerrequisitos externos

1. Repo `lelion13/app-habitacion` con código pusheado
2. DNS `habitacion.lionapp.cloud` → A `177.7.37.78`
3. Paquete GHCR público o login `ghcr.io` en VPS
4. `.env.prod` en VPS (secretos, no en git)

## Criterios de éxito

- [ ] `https://habitacion.lionapp.cloud` responde 200
- [ ] Login dashboard funciona
- [ ] `/habitacion?key=room-101-key` crea llamado visible en dashboard
- [ ] Certificado TLS válido (Let's Encrypt)
- [ ] Mongo persiste tras restart del stack
