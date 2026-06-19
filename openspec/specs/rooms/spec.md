# Rooms — Habitaciones

## Requirements

### REQ-ROOM-001: Identidad por roomKey
Each room MUST be uniquely identified by `roomKey` stored in MongoDB and configured on the device via `NEXT_PUBLIC_ROOM_KEY`.

#### Scenario: Resolver habitación
- **GIVEN** a valid `roomKey`
- **WHEN** GET `/api/room`
- **THEN** the response SHALL include `{ id, number, floor, sector, label }`

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
In non-production environments, POST `/api/seed` with header `x-seed-secret` matching `JWT_SECRET` MUST create demo rooms and admin user.

Demo rooms (baseline):
| label | floor | sector | roomKey |
|-------|-------|--------|---------|
| Habitación 101 | 1 | A | room-101-key |
| Habitación 102 | 1 | A | room-102-key |
| Habitación 201 | 2 | B | room-201-key |

## Out of scope (MVP)

- UI admin para CRUD de habitaciones
- Rotación de roomKey
- Vinculación roomKey a hardware (MAC, serial)
