# Runbook — App Habitación

Estado: **local + prod** documentado (2026-06-19).

## Requisitos

- Node.js 20+
- Docker (MongoDB local)
- Puerto 3000 libre (dev)

## Arranque local

```bash
docker compose up -d
cd web
cp .env.example .env.local   # si no existe
npm install
npm run dev
```

Sembrar datos demo (solo desarrollo):

```bash
curl -X POST http://localhost:3000/api/seed \
  -H "x-seed-secret: change-me-in-production"
```

Habitación local con key:

```
http://localhost:3000/habitacion?key=room-101-key
```

## Variables de entorno

| Variable | Uso |
|----------|-----|
| `MONGODB_URI` | Conexión MongoDB |
| `MONGODB_DB` | Nombre de BD (`app_habitacion`) |
| `JWT_SECRET` | Firma JWT y header seed |
| `NEXT_PUBLIC_ROOM_KEY` | Fallback dev si no hay `?key=` |
| `NEXT_PUBLIC_APP_URL` | URL pública (prod: `https://habitacion.lionapp.cloud`) |
| `BOOTSTRAP_ENABLED` | `true` solo para seed inicial prod (luego `false`) |

## Credenciales demo

- Dashboard: `admin@hospital.com` / `admin123`
- Habitaciones: `room-101-key`, `room-102-key`, `room-201-key`

## Verificación local

```bash
cd web
npm run test:unit    # 16 tests
npm run build
npm run test:e2e     # requiere MongoDB + dev server
```

## Producción

**URL:** https://habitacion.lionapp.cloud

Deploy y operación VPS: [deploy-hostinger.md](./deploy-hostinger.md).

Actualizar prod tras push a `main`:

1. GitHub Actions publica imagen GHCR (~1–2 min)
2. Hostinger MCP `VPS_updateProject` en `app-habitacion`, o pull manual en VPS

## Flujo videollamada (manual)

1. Dashboard: login → **Activar escucha** (piso/sector/rol correctos)
2. Habitación: `/habitacion?key=room-101-key` → **Video** → rol
3. Dashboard: **Atender** → **Abrir video**
4. Habitación: **Iniciar videollamada** → aceptar permisos
5. Esperar **"Videollamada conectada"**
6. **Finalizar** desde dashboard

Orden recomendado: staff abre video **antes** o **después** de habitación — el polling de señales cubre ambos casos.

## Problemas frecuentes

| Síntoma | Causa probable | Acción |
|---------|----------------|--------|
| Habitación no encontrada | Seed no ejecutado o `key` incorrecta | Seed dev; revisar `?key=` |
| Llamado activo bloqueado | Call `pending`/`accepted` en BD | Cancelar desde habitación |
| Dashboard sin sonido | Autoplay del navegador | **Probar timbre** / **Activar escucha** |
| SSE sin eventos (dev) | Hot reload reinicia bus | Recargar dashboard |
| Solo cámara local, "Conectando…" | Bug SSE signaling (pre `32d5a69`) | Hard refresh; verificar imagen GHCR actual |
| Video no conecta tras 15s | NAT/firewall hospital | Backlog TURN; probar misma red WiFi |
| Permisos cámara denegados | Browser/tablet | HTTPS obligatorio; revisar permisos sitio |
| Contenedores VPS `created` | `env_file: .env.prod` con MCP | Usar variables inline (ver deploy-hostinger.md) |
| Docker error pipe | Docker Desktop apagado | Iniciar Docker Desktop |

## Cancelar llamado colgado (API)

```bash
curl -X PATCH "http://localhost:3000/api/calls/room?key=room-101-key" \
  -H "Content-Type: application/json" \
  -d '{"action":"cancel","roomKey":"room-101-key"}'
```

## Seguridad prod

- [x] `BOOTSTRAP_ENABLED=false` tras seed inicial
- [ ] Rotar password admin default
- [ ] Rotar `JWT_SECRET` periódicamente (requiere re-login)
