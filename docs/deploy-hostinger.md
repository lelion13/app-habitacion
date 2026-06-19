# Producción — App Habitación @ Hostinger

Dominio: **https://habitacion.lionapp.cloud**  
VPS: `srv1623377` (177.7.37.78)  
Stack: `/docker/app-habitacion/`

## Prerrequisitos

1. Imagen en GHCR: `ghcr.io/lelion13/app-habitacion-web:{sha}`
2. DNS A record: `habitacion.lionapp.cloud` → `177.7.37.78`
3. Traefik corriendo (`traefik-wpez`)

## Primer deploy

```bash
ssh root@177.7.37.78   # o usuario con acceso docker

mkdir -p /docker/app-habitacion
cd /docker/app-habitacion

# Copiar desde repo:
#   docker-compose.prod.yml
# Crear .env.prod desde .env.prod.example (secretos reales)

chmod 600 .env.prod

# Si GHCR es privado:
# echo $GITHUB_PAT | docker login ghcr.io -u lelion13 --password-stdin

docker compose --env-file .env.prod -f docker-compose.prod.yml pull
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d
docker compose --env-file .env.prod -f docker-compose.prod.yml ps
```

## Verificación

```bash
curl -sS -o /dev/null -w "%{http_code}\n" https://habitacion.lionapp.cloud/
curl -sS -o /dev/null -w "%{http_code}\n" https://habitacion.lionapp.cloud/dashboard/login
```

Tablet habitación 101:
```
https://habitacion.lionapp.cloud/habitacion?key=room-101-key
```

## Actualizar versión

1. Merge a `main` → GitHub Actions publica nuevo SHA tag
2. En VPS, editar `.env.prod`: `IMAGE_TAG=sha-abc1234`
3. `docker compose --env-file .env.prod -f docker-compose.prod.yml pull && up -d`

## Seed inicial (una vez)

Ver tarea 4.x en `openspec/changes/deploy-hostinger-ghcr/tasks.md`.

## Rollback

```bash
cd /docker/app-habitacion
# Restaurar IMAGE_TAG anterior en .env.prod
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d
```

## Backup Mongo

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml exec mongodb \
  mongodump --db=app_habitacion --out=/data/db/backup-$(date +%F)
```

## Troubleshooting

| Problema | Acción |
|----------|--------|
| 404 Traefik | Verificar labels y `docker ps`; Traefik debe ver contenedor |
| Cert no emitido | DNS propagado; puerto 80 accesible para HTTP challenge |
| SSE no llega | Confirmar flush label; una sola réplica web |
| 502 web | `docker logs app-habitacion-web`; revisar Mongo healthy |
