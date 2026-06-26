# Producción — App Habitación @ Hostinger

Dominio: **https://habitacion.lionapp.cloud**  
VPS: `srv1623377` (177.7.37.78)  
Stack: `/docker/app-habitacion/`

## Prerrequisitos

1. Imagen en GHCR: `ghcr.io/lelion13/app-habitacion-web:{sha}`
2. DNS A record: `habitacion.lionapp.cloud` → `177.7.37.78`
3. Traefik corriendo (`traefik-wpez`)

## Primer deploy

**Hostinger MCP:** pasar variables en `environment` del proyecto (no usar `env_file: .env.prod` en el compose — el panel no crea ese archivo). Las variables se interpolan vía `.env` del stack.

**SSH manual:**

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

1. Merge/push a `main` → GitHub Actions publica imagen GHCR (~1–2 min)
2. Hostinger MCP `VPS_updateProject` en proyecto `app-habitacion`, o en VPS:
   ```bash
   cd /docker/app-habitacion
   docker compose pull && docker compose up -d
   ```

Commits recientes en prod: `4838066` (deploy), `ebf4e57` (WebRTC), `32d5a69` (fix signaling).

## Videollamada (verificación manual)

1. Dashboard login → Activar escucha (piso 1, sector A, enfermería)
2. Habitación: `?key=room-101-key` → Video
3. Dashboard: Atender → Abrir video
4. Habitación: Iniciar videollamada
5. Confirmar "Videollamada conectada" y video remoto

Ver [runbook.md](./runbook.md) troubleshooting si queda en "Conectando…".

## Telegram (alertas staff)

Variables en el stack Hostinger (`app-habitacion` web):

| Variable | Descripción |
|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | Token de BotFather (secreto) |
| `TELEGRAM_BOT_USERNAME` | `habitacionesBot` (sin @) |
| `TELEGRAM_WEBHOOK_SECRET` | Opcional; string aleatorio para validar webhook |

Tras deploy, registrar webhook (una vez):

```bash
curl -sS "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"https://habitacion.lionapp.cloud/api/telegram/webhook\",\"secret_token\":\"$TELEGRAM_WEBHOOK_SECRET\",\"allowed_updates\":[\"message\",\"callback_query\"]}"
```

Verificar (sin exponer el token en logs compartidos):

```bash
curl -sS "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getWebhookInfo"
```

Debe mostrar `url` correcta, `allowed_updates` con `callback_query`, y `last_error_message` vacío.

**Flujo:** Dashboard → Conectar Telegram → abrir `@habitacionesBot` en chat **privado** → `/start link_…` → **Activar escucha** (mismo piso/sector/rol que el llamado) → llamado desde habitación.

**Destinatarios:** mensaje **directo** a cada usuario vinculado con escucha activa que coincida; no es un canal grupal ni broadcast al piso.

**Logs:** tras crear llamado, el contenedor web puede registrar `[telegram] no recipients` o `[telegram] sending call alert` (sin secretos).

**Seguridad:** nunca commitear el token; rotar en BotFather si se expone.

## Seed inicial (una vez)

Con `BOOTSTRAP_ENABLED=true` en el stack:

```bash
curl -X POST https://habitacion.lionapp.cloud/api/seed \
  -H "x-seed-secret: $JWT_SECRET"
```

Luego poner `BOOTSTRAP_ENABLED=false` y redeploy. **Completado en prod (2026-06-19).**

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
| Video "Conectando…" sin remoto | Hard refresh; verificar imagen ≥ `32d5a69`; posible NAT sin TURN |
| 502 web | `docker logs app-habitacion-web`; revisar Mongo healthy |
