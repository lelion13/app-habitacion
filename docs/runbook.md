# Runbook — App Habitación

## Requisitos

- Node.js 20+
- Docker (MongoDB)
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

## Variables de entorno

| Variable | Uso |
|----------|-----|
| `MONGODB_URI` | Conexión MongoDB |
| `MONGODB_DB` | Nombre de BD (`app_habitacion`) |
| `JWT_SECRET` | Firma JWT y header seed |
| `NEXT_PUBLIC_ROOM_KEY` | Clave de habitación en build/dispositivo |
| `NEXT_PUBLIC_APP_URL` | URL pública (prod) |

## Credenciales demo

- Dashboard: `admin@hospital.com` / `admin123`
- Habitaciones: `room-101-key`, `room-102-key`, `room-201-key`

## Verificación

```bash
cd web
npm run test:unit
npm run build
npm run test:e2e   # requiere MongoDB + dev server
```

## Problemas frecuentes

| Síntoma | Causa probable | Acción |
|---------|----------------|--------|
| Habitación no encontrada | Seed no ejecutado o `ROOM_KEY` incorrecta | Ejecutar seed; revisar `.env.local` |
| Llamado activo bloqueado | Call `pending`/`accepted` en BD | Cancelar desde `/habitacion` o PATCH `/api/calls/room` |
| Dashboard sin sonido | Autoplay del navegador | Clic en **Probar timbre** o **Activar escucha** |
| SSE sin eventos (dev) | Hot reload reinicia bus in-memory | Recargar dashboard y reactivar escucha |
| Docker error pipe | Docker Desktop apagado | Iniciar Docker Desktop |

## Cancelar llamado colgado (API)

```bash
curl -X PATCH http://localhost:3000/api/calls/room \
  -H "Content-Type: application/json" \
  -d '{"action":"cancel"}'
```

Requiere `NEXT_PUBLIC_ROOM_KEY` configurada en el servidor.

## Producción (pendiente de spec)

- Cambiar `JWT_SECRET` y deshabilitar `/api/seed`
- MongoDB gestionado o réplica
- SSE multi-instancia requiere Redis/pub-sub (ver `openspec/specs/realtime/spec.md`)
