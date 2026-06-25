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

- Dashboard: `admin@hospital.com` / `admin123` (**rol admin**)
- Habitaciones: `room-101-key`, `room-102-key`, `room-201-key`

## Roles de sistema (dashboard)

| Rol | Acceso |
|-----|--------|
| `user` | Escucha / llamados + Telegram |
| `supervisor` | + `/estadisticas` |
| `admin` | + `/dashboard/admin` (ABM) |

La migración de roles y catálogos piso/sector corre automáticamente al **login** (`runAdminMigrations`). Tras deploy, el usuario seed `admin@hospital.com` queda como `admin`; el resto sin rol → `user`.

### ABM (solo admin)

1. Dashboard home → **Administración**
2. Pestañas: Usuarios, Pisos, Sectores, Habitaciones
3. Habitación nueva: `roomKey` se genera solo; copiarlo para la tablet `?key=`
4. Habitación inactiva: la tablet muestra aviso y no puede llamar

### Prod sin re-seed

Si ya hay datos en Mongo, basta con que un usuario haga login (migración idempotente). Si no hay ningún admin activo, el primer usuario de la colección se promueve a `admin`.

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

## Alta tablet Android (PWA)

1. Chrome → `https://habitacion.lionapp.cloud/habitacion?key=room-XXX-key`
2. Confirmar habitación correcta en pantalla (logo + label)
3. Banner **Instalar en esta tablet** o menú ⋮ → **Instalar aplicación**
4. Abrir ícono (nombre = label de habitación, ej. Habitación 101)
5. Debe cargar en **fullscreen** sin pedir key
6. El banner de instalación **no** debe verse dentro de la app ya instalada

## UI habitación (tablet / PWA)

Ver spec `REQ-UI-002` y change archivado `2026-06-19-room-ui-refresh`.

Checklist visual:

1. Tema oscuro `#0d1b2a`, tres sectores visibles sin scroll vertical
2. Reloj actualiza cada segundo; fecha bajo la hora (derecha)
3. Timbre o video → **modal** centrado (no footer que mueva sectores)
4. Cancelar/finalizar desde el modal
5. Videollamada aceptada → botón flotante **Finalizar videollamada** → modal de confirmación
6. Errores y confirmaciones como toast fijo inferior

Si muestra *Dispositivo no configurado*: reinstalar desde el link con `?key=` correcto o borrar datos de la app en Android.

Tras deploy de cambios PWA: eliminar ícono anterior y reinstalar desde URL con key.

## Dashboard — alerta persistente

1. En `/dashboard`, **Activar escucha** (desbloquea audio).
2. Llamado `pending` timbre o video en la zona/rol configurados → alerta **repite** cada ~6 s.
3. Video pending usa tono distinto (`playVideoAlert`).
4. La alerta **para** al aceptar, completar o cancelar (si no quedan otros `pending`).

## Estadísticas (`/estadisticas`)

Requiere login staff. Filtros por fechas, piso, sector, rol, habitación, tipo y estado. KPIs + tabla paginada con métricas (`responseTimeMs`, `totalDurationMs`, `sessionDurationMs`).

## Índices Mongo (historial)

Recomendados en colección `calls` (ejecutar una vez en prod si el volumen crece):

```javascript
db.calls.createIndex({ createdAt: -1 })
db.calls.createIndex({ floor: 1, sector: 1, targetRole: 1 })
db.calls.createIndex({ status: 1 })
```

## Problemas frecuentes

| Síntoma | Causa probable | Acción |
|---------|----------------|--------|
| Habitación no encontrada | Seed no ejecutado o `key` incorrecta | Seed dev; revisar `?key=` |
| PWA abre sin habitación | Instaló sin visitar URL con key | Reinstalar desde link `?key=room-XXX-key` |
| Cartel “Instalar…” en app instalada | Detección standalone (Android) | Cerrar app; actualizar a `388b000+`; reabrir desde ícono |
| Dispositivo no configurado | Sin key en URL ni storage | Flujo alta tablet arriba |
| Llamado activo bloqueado | Call `pending`/`accepted` en BD | Cancelar desde habitación |
| Dashboard sin sonido | Autoplay del navegador | **Probar timbre** / **Activar escucha** |
| Alerta no repite | Audio no desbloqueado | Activar escucha; revisar indicador en dashboard |
| `/estadisticas` vacío | Sin llamados en rango de fechas | Ampliar filtro de fechas (default 7 días) |
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
