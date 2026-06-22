# App Habitación

Sistema de llamados hospitalarios: PWA para habitaciones (timbre/videollamada) y dashboard web para personal (enfermería, calidad, médico).

## Stack

- Next.js 16 + TypeScript + Tailwind CSS
- MongoDB (driver nativo)
- JWT + bcrypt para dashboard
- SSE para notificaciones en tiempo real

## Inicio rápido

```bash
# MongoDB
docker compose up -d

# App
cd web
cp .env.example .env.local
npm install
npm run dev
```

Sembrar datos de prueba (solo desarrollo):

```bash
curl -X POST http://localhost:3000/api/seed -H "x-seed-secret: change-me-in-production"
```

Credenciales demo: `admin@hospital.com` / `admin123`  
Claves habitación demo: `room-101-key`, `room-102-key`, `room-201-key`

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/` | Landing |
| `/habitacion?key={roomKey}` | PWA habitación (prod: una URL por tablet) |
| `/dashboard/login` | Login personal |
| `/dashboard` | Escucha y atención de llamados |
| `/dashboard/video/[callId]` | Videollamada staff (WebRTC) |

## Producción

**URL:** https://habitacion.lionapp.cloud

Tablets (ejemplo habitación 101):
```
https://habitacion.lionapp.cloud/habitacion?key=room-101-key
```

Deploy: ver [docs/deploy-hostinger.md](./docs/deploy-hostinger.md).

## PWA Android (tablet por habitación)

1. En Chrome Android, abrir la URL de la habitación, por ejemplo:
   `https://habitacion.lionapp.cloud/habitacion?key=room-101-key`
2. Verificar que carga la habitación correcta.
3. Usar el banner **Instalar en esta tablet** o menú → Instalar aplicación.
4. Al abrir el ícono, la app recuerda la habitación (manifest dinámico + almacenamiento local).
5. Si la tablet no está configurada, muestra *Contacte a soporte técnico* (sin campo editable).

Una URL por tablet; la key no es modificable por el usuario final.

## Tests

```bash
cd web
npm run test:unit
npm run test:e2e
npm run build
```

## Documentación

| Doc | Descripción |
|-----|-------------|
| [docs/quick-map.md](./docs/quick-map.md) | Mapa del repo y flujo SDD |
| [docs/architecture.md](./docs/architecture.md) | Diagramas, WebRTC, ADRs |
| [docs/runbook.md](./docs/runbook.md) | Operación local/prod y troubleshooting |
| [docs/deploy-hostinger.md](./docs/deploy-hostinger.md) | Deploy prod Hostinger + GHCR |
| [openspec/specs/](./openspec/specs/) | **Fuente de verdad** — comportamiento actual |
| [openspec/changes/archive/](./openspec/changes/archive/) | Historial de changes SDD |
| [MICRO-PROMPT.md](./MICRO-PROMPT.md) | Origen microprompt |
| [proyecto.md](./proyecto.md) | Requerimiento inicial |
