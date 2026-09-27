# Rapidez Carora — API

Backend de mototaxi para Carora (Lara, Venezuela).

- Node.js + Express + Socket.io
- PostgreSQL + PostGIS en Supabase
- Un solo servicio web en Render (plan gratis)
- Mapas y rutas gratis: OpenStreetMap + OSRM (sin Google Maps)
- Push gratis: Firebase Cloud Messaging, solo cuando pegas la clave en Render
- Sin Redis: una instancia gratis no lo necesita

La clave de la base **no va en este repositorio**. Solo existe como variable `DATABASE_URL` en Render.

## Qué hace

- Registra motorizados en estado inactivo hasta que tú los actives (después de ver cédula, carnet y selfie por WhatsApp).
- Devuelve el enlace `wa.me` con la plantilla ya escrita.
- Guarda la posición del motorizado en PostGIS (`ST_MakePoint` / `ST_DWithin`, radio 3 km).
- Ofrece la carrera por WebSocket a los motorizados en línea (15 segundos).
- Busca motorizados activos en un radio de 3,5 km con PostGIS (`ST_DWithin`).
- Avisa al pasajero a menos de 100 m: por Socket.io y, si configuraste Firebase, con notificación push.
- Tarifa en USD y bolívares según la ruta de calle (OSRM). Si OSRM no responde, usa línea recta.
- Pago Móvil o efectivo. Referencia obligatoria en Carora. Alta del motorizado por WhatsApp y activación manual.

## Paso 0 — Rotar la clave

Si la URI de Supabase se pegó en un chat, correo o captura:

1. Supabase → **Project Settings** → **Database** → **Reset database password**.
2. Copia la URI nueva. No la subas a GitHub.

## Paso 1 — Esquema en Supabase

1. Abre el proyecto → **SQL Editor** → **New query**.
2. Pega todo el archivo `schema.sql` y pulsa **Run**.
3. Puedes ejecutarlo otra vez: no borra filas.

Si ya habías creado `drivers` y `trips`, este script solo agrega lo que falte (`access_token_hash`, `last_seen_at`, `passengers`, `app_settings`).

## Paso 2 — La URI que sí funciona en Render

La conexión **directa** (`db.xxxx.supabase.co`, puerto 5432) en el plan gratis de Supabase es IPv6. Render gratis es IPv4 y casi siempre falla con timeout.

Usa el **Session pooler**:

1. Supabase → **Project Settings** → **Database** → **Connection string**.
2. Tipo: **URI**.
3. Método: **Session pooler** (no “Direct connection”).
4. El host se ve así: `aws-0-REGION.pooler.supabase.com` y el puerto es **5432**.
5. El usuario es `postgres.bvqnatzwjcpqnlqtqzdm` (con punto y el id del proyecto), no solo `postgres`.
6. Quita los corchetes `[ ]` alrededor de la clave. Esos corchetes son un marcador, no forman parte de la clave.
7. Si la clave tiene `@`, `#`, `%` o espacios, codifícalos (`@` → `%40`, `#` → `%23`). Un guion no se codifica.

Ejemplo de forma (con datos falsos):

```text
postgresql://postgres.bvqnatzwjcpqnlqtqzdm:CLAVE@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
```

La región (`sa-east-1` u otra) la ves solo en el panel. No la inventes.

## Paso 3 — Subir el repo a GitHub (desde el navegador)

1. Entra a [github.com/new](https://github.com/new).
2. Repository name: `rapidez-carora-api`.
3. Público o privado, como prefieras.
4. No marques “Add a README” (estos archivos ya traen el suyo).
5. **Create repository**.
6. En el repo vacío: **Add file** → **Upload files**.
7. Sube estos archivos (no subas `node_modules` ni un `.env`):
   - `package.json`
   - `server.js`
   - `schema.sql`
   - `render.yaml`
   - `.gitignore`
   - `README.md`
8. **Commit changes**.

## Paso 4 — Conectar Render

1. [dashboard.render.com](https://dashboard.render.com) → **New** → **Web Service**.
2. Conecta GitHub si aún no está y elige `rapidez-carora-api`.
3. Datos del servicio:
   - Name: `rapidez-carora-api`
   - Region: la más cercana (Oregon está bien en el plan gratis)
   - Branch: `main`
   - Runtime: **Node**
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance type: **Free**
4. **Environment** → añade:

| Key | Valor |
|---|---|
| `DATABASE_URL` | URI del Session pooler, sin corchetes |
| `ADMIN_TOKEN` | una frase larga que inventes (32+ caracteres). Es la llave para activar motorizados |
| `ADMIN_WHATSAPP` | tu WhatsApp con código de país, solo números. Ejemplo: `58412XXXXXXX` |
| `EXCHANGE_RATE_VES` | tasa del día, bolívares por 1 dólar. Ejemplo: `50` |
| `FIREBASE_SERVICE_ACCOUNT` | JSON de la cuenta de servicio de Firebase, en una sola línea. Sin esto el push no sale; el socket sí |

No subas `serviceAccountKey.json` a GitHub. En Firebase: engranaje del proyecto → Cuentas de servicio → Generar nueva clave privada → pega el JSON en esa variable de Render.

Si ya habías corrido un `schema.sql` viejo, deja el radio en 3,5 km:

```sql
UPDATE app_settings SET value = '3500' WHERE key = 'search_radius_m';
```

5. **Advanced** → Health Check Path: `/health`
6. **Create Web Service** y espera el deploy (la primera vez tarda varios minutos).

La URL pública queda así:

```text
https://rapidez-carora-api.onrender.com
```

El nombre exacto lo ves arriba en Render. WebSocket es la misma URL con `https` (Socket.io pasa solo a `wss`). No uses `http://10.0.2.2:3000`: eso era solo el emulador de Android del PDF.

## Paso 5 — Comprobar

Abre en el navegador:

```text
https://TU-SERVICIO.onrender.com/health
```

Tiene que decir `"ok": true, "db": true`.

Luego:

```text
https://TU-SERVICIO.onrender.com/api/schema-check
```

Tiene que decir `"schemaOk": true`. Si `missing` lista columnas, vuelve a correr `schema.sql`.

Y la tasa / bancos:

```text
https://TU-SERVICIO.onrender.com/api/meta
```

## Activar un motorizado

Cuando te lleguen las fotos por WhatsApp:

```bash
curl -X POST https://TU-SERVICIO.onrender.com/api/admin/drivers/UUID-DEL-MOTORIZADO/active \
  -H "Content-Type: application/json" \
  -H "x-admin-token: TU_ADMIN_TOKEN" \
  -d "{\"active\": true}"
```

O en el SQL Editor de Supabase:

```sql
UPDATE drivers SET is_active = true WHERE phone_number = '04141234567';
```

Listar pendientes:

```bash
curl https://TU-SERVICIO.onrender.com/api/admin/drivers?pending=1 \
  -H "x-admin-token: TU_ADMIN_TOKEN"
```

Cambiar la tasa sin volver a desplegar:

```bash
curl -X POST https://TU-SERVICIO.onrender.com/api/admin/settings \
  -H "Content-Type: application/json" \
  -H "x-admin-token: TU_ADMIN_TOKEN" \
  -d "{\"exchangeRateVes\": 52}"
```

## Contrato para la app (siguiente paso)

Registro del motorizado: `POST /api/drivers`

```json
{
  "fullName": "José Pérez",
  "phoneNumber": "04141234567",
  "nationalId": "V12345678",
  "vehiclePlate": "AB123CD",
  "vehicleModel": "Bera SBR",
  "pagoMovilBankCode": "0102",
  "pagoMovilPhone": "04141234567",
  "pagoMovilHolderId": "V12345678"
}
```

La respuesta trae `accessToken` (se guarda en el teléfono y no se vuelve a mostrar) y `whatsapp.url` para abrir el chat con la plantilla.

Todas las llamadas siguientes llevan:

```text
Authorization: Bearer ACCESS_TOKEN
```

Socket.io (mismo host):

1. Conectar a `https://TU-SERVICIO.onrender.com`
2. Emitir `join_room` con `{ userId, role: "driver", token }`
3. Cada punto GPS emite `driver_location_update` con `{ latitude, longitude, tripId }`
4. El servidor guarda el punto en PostGIS y, si hay carrera, emite `driver_position_changed` al pasajero.
5. Ofertas: evento `trip_offer`. Aceptar: `POST /api/trips/:id/accept`.

El plan gratis de Render se duerme a los ~15 minutos sin tráfico. La app debe reconectar Socket.io sola. Un ping externo a `/health` cada 10 minutos lo mantiene despierto (UptimeRobot, gratis).

## Límites de esta versión

- Una sola instancia en el plan gratis. El aviso de “ya avisé los 100 m” vive en memoria de ese proceso.
- El servidor público de OSRM (`router.project-osrm.org`) es gratis y no pide tarjeta, pero es un demo: si se cae, la tarifa sigue en línea recta. Para mucho tráfico se puede auto-hospedar OSRM, también gratis.
- Los mosaicos de OpenStreetMap son gratis. La app manda un User-Agent. Si el uso crece, cambia el servidor de teselas.
- Render gratis se duerme ~15 minutos sin visitas. Un ping a `/health` cada 10 minutos (UptimeRobot) lo mantiene despierto.
