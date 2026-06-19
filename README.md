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
| `/habitacion` | PWA habitación (config: `NEXT_PUBLIC_ROOM_KEY`) |
| `/dashboard/login` | Login personal |
| `/dashboard` | Escucha y atención de llamados |

## PWA Android

1. Abrir `/habitacion` en Chrome Android
2. Menú → “Instalar aplicación” / “Añadir a pantalla de inicio”
3. Configurar `NEXT_PUBLIC_ROOM_KEY` en el build o entorno del dispositivo

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
| [docs/architecture.md](./docs/architecture.md) | Diagramas y ADRs |
| [docs/runbook.md](./docs/runbook.md) | Operación local y troubleshooting |
| [docs/deploy-hostinger.md](./docs/deploy-hostinger.md) | Deploy prod Hostinger + GHCR |
| [openspec/changes/deploy-hostinger-ghcr/](./openspec/changes/deploy-hostinger-ghcr/) | **Change activo** — deploy prod |
| [openspec/specs/](./openspec/specs/) | **Fuente de verdad** — comportamiento actual |
| [MICRO-PROMPT.md](./MICRO-PROMPT.md) | Origen microprompt |
| [proyecto.md](./proyecto.md) | Requerimiento inicial |
