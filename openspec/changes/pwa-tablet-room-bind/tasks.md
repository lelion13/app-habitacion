# Tasks — PWA tablet vinculada a habitación

## Fase 1 — Specs

- [x] 1.1 Delta `rooms`, `ui`
- [x] 1.2 `proposal.md` + `design.md`
- [x] 1.3 Decisiones producto cerradas

## Fase 2 — Backend / manifest

- [x] 2.1 `GET /api/manifest?key=` — JSON manifest con `start_url`, `name` desde Mongo
- [x] 2.2 Tests: key válida/inválida, campos requeridos

## Fase 3 — Cliente room bind

- [x] 3.1 `lib/room-bind.ts` — storage, resolve, `isStandalonePwa()`
- [x] 3.2 Refactor `habitacion/page.tsx` — resolver key, persistir tras validar API
- [x] 3.3 Pantalla soporte (sin URL técnica)
- [x] 3.4 Actualizar link manifest dinámico tras cargar room
- [x] 3.5 Tests unitarios `room-bind`

## Fase 4 — Install + navegación

- [x] 4.1 `InstallRoomBanner.tsx` — `beforeinstallprompt`
- [x] 4.2 `StandaloneRoomGuard.tsx` — redirect `/` y `/dashboard` en standalone
- [x] 4.3 Integrar en layouts/pages afectados

## Fase 5 — Docs

- [x] 5.1 `README.md` — flujo instalar tablet
- [x] 5.2 `docs/runbook.md` — alta tablet + troubleshooting
- [x] 5.3 `docs/quick-map.md` — mencionar change activo

## Fase 6 — Verificación

- [x] 6.1 `npm run test:unit` + `npm run build`
- [x] 6.2 Playwright: habitacion con key sigue OK
- [ ] 6.3 Manual Chrome Android: instalar → abrir ícono → habitación correcta
- [ ] 6.4 Manual: standalone redirect desde `/`
- [ ] 6.5 `verify-report.md`

## Fase 7 — Cierre SDD

- [ ] 7.1 Fusionar deltas → `openspec/specs/`
- [ ] 7.2 Archivar change

## Dependencias

```
1 → 2 → 3 → 4 → 5 → 6 → 7
```

Estimación: **1 sesión** implementación + **1 verificación manual** en tablet.
