# Design — PWA tablet vinculada a habitación

## Problema raíz

`web/public/manifest.json`:

```json
"start_url": "/habitacion"
```

Chrome Android usa `start_url` al lanzar desde el launcher. La página solo lee `searchParams.get("key")` — sin query, error.

## Resolución de roomKey (cliente)

Nuevo módulo `web/lib/room-bind.ts`:

```typescript
const STORAGE_KEY = "app_habitacion_room_key";

export function readStoredRoomKey(): string | null;
export function writeStoredRoomKey(key: string): void;
export function clearStoredRoomKey(): void;

/** URL param wins; if present and non-empty, overwrites storage after validation */
export function resolveRoomKeyFromClient(
  urlKey: string | null,
  storedKey: string | null,
): string;

export function isStandalonePwa(): boolean;
```

**Algoritmo en `habitacion/page.tsx`:**

1. `urlKey = searchParams.get("key")?.trim()`
2. Si `urlKey` → validar con API; si OK → `writeStoredRoomKey(urlKey)` y usar
3. Si no `urlKey` → `readStoredRoomKey()`; si existe → validar API
4. Si ninguno válido → estado `unconfigured` → UI soporte

**Sobrescritura:** paso 2 siempre persiste cuando URL trae key distinta (decisión producto).

## Manifest dinámico

**Ruta:** `GET /api/manifest?key={roomKey}`

- Valida que `roomKey` exista en Mongo (misma lógica que `/api/room`)
- Responde `application/manifest+json`
- Campos:

```json
{
  "id": "/habitacion?key=room-101-key",
  "name": "Habitación 101",
  "short_name": "Hab. 101",
  "description": "Llamados hospitalarios — Habitación 101",
  "start_url": "/habitacion?key=room-101-key",
  "scope": "/",
  "display": "standalone",
  "background_color": "#f8fafc",
  "theme_color": "#0d9488",
  "orientation": "portrait",
  "icons": [ ... mismo SVG ... ]
}
```

**`short_name`:** truncar a 12 caracteres si label largo; preferir `Hab. {number}` si label no cabe.

**`scope`:** `/` para que standalone pueda cargar API routes; navegación fuera de habitación se controla por redirect en cliente (decisión producto).

**Cache:** `Cache-Control: no-cache` en respuesta manifest.

**Layout habitación:** inyectar manifest link solo cuando hay key resuelta:

```tsx
// habitacion/layout.tsx — metadata o client head
<link rel="manifest" href={`/api/manifest?key=${encodeURIComponent(roomKey)}`} />
```

Nota: layout server puede no conocer key; opciones:
- **A)** Client component `HabitacionManifestLink` en page
- **B)** Middleware no — preferir client head update en page tras validar room

Elegido: **client** actualiza `document.querySelector('link[rel=manifest]')` o usa `next/head` pattern en page tras load.

`web/public/manifest.json` se mantiene para dev/landing sin key (genérico).

## Banner instalar

`web/components/InstallRoomBanner.tsx`:

- Escucha `beforeinstallprompt` (solo Chrome)
- Muestra si: habitación válida cargada, no `isStandalonePwa()`, evento capturado
- Botón “Instalar en esta tablet” → `prompt.prompt()` / guardar outcome
- Dismiss local (`sessionStorage` o `localStorage` `install_banner_dismissed`) — opcional 7 días
- No mostrar si ya standalone

## Redirect en modo standalone

`web/components/StandaloneRoomGuard.tsx` en root layout o habitacion-only:

```typescript
if (isStandalonePwa() && pathname not /habitacion) {
  const key = readStoredRoomKey();
  if (key) router.replace(`/habitacion?key=${key}`);
  else router.replace("/habitacion"); // page shows support screen
}
```

Aplicar en rutas `/`, `/dashboard/*`, `/estadisticas` — **no** en `/api/*`.

Alternativa descartada: `scope: /habitacion` solo — limita demasiado y no evita navegación manual a `/` dentro del mismo origin en todos los casos.

## Pantalla sin configuración

Reemplazar bloque error actual:

```
Título: "Dispositivo no configurado"
Cuerpo: "Contacte a soporte técnico para activar esta tablet."
```

Sin ejemplo de URL, sin input, sin link a landing.

## Flujo alta tablet (operación)

Documentar en runbook:

1. Soporte abre en Chrome: `https://habitacion.lionapp.cloud/habitacion?key=room-XXX-key`
2. Verifica que carga habitación correcta
3. Toca banner “Instalar” o menú → Instalar aplicación
4. Abre ícono — debe entrar directo a la habitación
5. Opcional: fijar app en pantalla / desactivar otras apps (fuera de scope)

## Alternativas descartadas

| Alternativa | Motivo descarte |
|-------------|-----------------|
| Solo localStorage | Install sin visitar URL con key antes falla en algunos flujos |
| Solo manifest estático por habitación en build | N habitaciones → N builds |
| Service worker con redirect | Complejidad; v1 innecesario |
| `NEXT_PUBLIC_ROOM_KEY` por tablet | Rebuild por dispositivo |
| Campo password en tablet para cambiar room | Usuario final no debe reconfigurar |

## Tests

| Tipo | Caso |
|------|------|
| Jest | `room-bind.ts` — resolve URL vs storage, overwrite |
| Jest | manifest route — 404 key inválida, JSON válido key OK |
| Playwright | `/habitacion?key=` carga; mock storage sin URL (si viable) |
| Manual | Chrome Android install E2E |

## ADR propuesto

| ID | Decisión |
|----|----------|
| ADR-P01 | Manifest dinámico + localStorage dual persist |
| ADR-P02 | Sobrescribir storage cuando URL trae nueva key |
| ADR-P03 | Redirect standalone en cliente, no kiosk OS lock |
| ADR-P04 | Chrome Android only v1 |
