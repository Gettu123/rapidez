# Rapidez Carora

Dos APK independientes, un solo backend.

```text
rapidez-monorepo/
├── backend/                 # este paso: Node.js, Socket.io, Supabase
├── apps/
│   ├── passenger_app/       # siguiente: Rapidez-Cliente.apk
│   └── driver_app/          # siguiente: Rapidez-Conductor.apk
```

Los dos teléfonos hablan con el mismo servidor y la misma base PostGIS. El GPS en segundo plano vive solo en la app del motorizado.

## Paso 1 — Mapa

Sin Google Maps y sin clave de Carto. Mosaicos públicos:

```text
https://tile.openstreetmap.org/{z}/{x}/{y}.png
```

## Paso 2 — Subir y desplegar el backend

La clave de Supabase no va en este repositorio. Solo en Render, variable `DATABASE_URL`.

1. GitHub → repositorio nuevo `rapidez-monorepo` (sin README automático).
2. Sube esta carpeta tal cual: `backend/`, `apps/` y este `README.md`.
3. Render → New → Web Service → elige el repo.
4. **Root Directory: `backend`**. Si lo dejas en la raíz, Render no encuentra `package.json`.
5. Build: `npm install`. Start: `npm start`. Plan: Free.
6. Health Check Path: `/health`.
7. Variables:

| Key | Valor |
|---|---|
| `DATABASE_URL` | URI **Session pooler** de Supabase (`*.pooler.supabase.com`, puerto 5432), sin corchetes en la clave |
| `ADMIN_TOKEN` | una frase larga tuya |
| `ADMIN_WHATSAPP` | tu número, solo dígitos, con 58 |
| `EXCHANGE_RATE_VES` | bolívares por 1 dólar |

La URL `db.*.supabase.co` (conexión directa) suele fallar en el plan gratis de Render. En Supabase elige Session pooler. El usuario es `postgres.` más el id del proyecto.

Comprueba `https://TU-SERVICIO.onrender.com/health` → `"db": true` y `/api/schema-check` → `"schemaOk": true`.

Antes del primer arranque, pega `backend/schema.sql` en el SQL Editor de Supabase.

El detalle de eventos, Pago Móvil y activación de motorizados está en `backend/README.md`.
