# Rooms — Habitaciones

## Requirements

### REQ-ROOM-001: Identidad por roomKey
Each room MUST be uniquely identified by `roomKey` stored in MongoDB.

In production, room identity MUST be configurable at runtime via URL query parameter `key` on `/habitacion`.

#### Scenario: Resolver habitación
- **GIVEN** a valid `roomKey`
- **WHEN** GET `/api/room?key={roomKey}`
- **THEN** the response SHALL include `{ id, number, floor, sector, label }`

#### Scenario: Tablet con query param
- **GIVEN** room `room-101-key` exists in MongoDB
- **WHEN** client opens `/habitacion?key=room-101-key`
- **THEN** the room UI SHALL load that room without requiring `NEXT_PUBLIC_ROOM_KEY` at build time

#### Scenario: Clave inválida
- **GIVEN** an unknown `roomKey`
- **WHEN** GET `/api/room`
- **THEN** the response MUST be 404

### REQ-ROOM-002: Modelo de datos
Each room document MUST contain:
- `number` (string)
- `floor` (string)
- `sector` (string)
- `roomKey` (string, unique)
- `label` (string, display name)

### REQ-ROOM-003: Sin autenticación en habitación
The room client MUST NOT require user login. Authorization for call actions SHALL be implicit via possession of the correct `roomKey`.

### REQ-ROOM-004: Seed de desarrollo
In non-production (or when `BOOTSTRAP_ENABLED=true`), POST `/api/seed` with header `x-seed-secret` matching `JWT_SECRET` MUST create demo rooms and admin user.

Demo rooms:
| label | floor | sector | roomKey |
|-------|-------|--------|---------|
| Habitación 101 | 1 | A | room-101-key |
| Habitación 102 | 1 | A | room-102-key |
| Habitación 201 | 2 | B | room-201-key |

### REQ-ROOM-005: Calls con roomKey explícito
POST `/api/calls` and PATCH `/api/calls/room` MUST accept `roomKey` in body or query when env fallback is empty.

### REQ-ROOM-006: Prod sin env roomKey
In production build, `NEXT_PUBLIC_ROOM_KEY` MAY be empty; tablets MUST use `?key=` URLs.

## URLs prod (tablets)

```
https://habitacion.lionapp.cloud/habitacion?key=room-101-key
https://habitacion.lionapp.cloud/habitacion?key=room-102-key
https://habitacion.lionapp.cloud/habitacion?key=room-201-key
```

## Out of scope

- UI admin para CRUD de habitaciones
- Rotación de roomKey
- Vinculación roomKey a hardware (MAC, serial)
