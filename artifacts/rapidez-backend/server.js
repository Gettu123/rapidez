'use strict';

const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const { Pool } = require('pg');

const PORT = Number(process.env.PORT) || 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const ADMIN_WHATSAPP = (process.env.ADMIN_WHATSAPP || '').replace(/\D/g, '');
const OFFER_SECONDS = 15;
const OSRM_URL = (process.env.OSRM_URL || 'https://router.project-osrm.org').replace(/\/$/, '');

const BANKS = [
  { code: '0102', name: 'Banco de Venezuela' },
  { code: '0105', name: 'Banco Mercantil' },
  { code: '0108', name: 'BBVA Provincial' },
  { code: '0114', name: 'Bancaribe' },
  { code: '0134', name: 'Banesco' },
  { code: '0137', name: 'Sofitasa' },
  { code: '0163', name: 'Banco del Tesoro' },
  { code: '0172', name: 'Bancamiga' },
  { code: '0175', name: 'Banco Bicentenario' },
  { code: '0191', name: 'Banco Nacional de Crédito' },
];

function warnDatabaseUrl() {
  const url = process.env.DATABASE_URL || '';
  if (!url) {
    console.error('Falta DATABASE_URL. En Render: Environment → DATABASE_URL.');
    process.exit(1);
  }
  if (url.includes(':[') || url.includes(']:@') || url.includes('YOUR-PASSWORD')) {
    console.warn('DATABASE_URL parece traer corchetes o un marcador. La clave va sin [ ].');
  }
  if (/@db\.[a-z0-9]+\.supabase\.co/i.test(url)) {
    console.warn(
      'Host directo db.*.supabase.co: en Render gratis suele fallar (IPv6). ' +
        'Usa el Session pooler: host *.pooler.supabase.com puerto 5432.'
    );
  }
}

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  const local = /localhost|127\.0\.0\.1/.test(connectionString);
  return new Pool({
    connectionString,
    ssl: local ? false : { rejectUnauthorized: false },
    max: 4,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 10_000,
  });
}

warnDatabaseUrl();
const db = createPool();
let messaging = null;

function initFirebase() {
  try {
    let raw = process.env.FIREBASE_SERVICE_ACCOUNT || '';
    if (!raw.trim()) {
      const file = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '';
      if (file && fs.existsSync(file)) raw = fs.readFileSync(file, 'utf8');
    }
    if (!raw.trim()) {
      console.warn('FCM apagado: define FIREBASE_SERVICE_ACCOUNT en Render. El aviso de 100 m sigue saliendo por Socket.io.');
      return;
    }
    const cred = JSON.parse(raw);
    const admin = require('firebase-admin');
    if (!admin.apps.length) {
      admin.initializeApp({ credential: admin.credential.cert(cred) });
    }
    messaging = admin.messaging();
    console.log('FCM activo');
  } catch (error) {
    console.error('FCM no inició. El socket sigue funcionando.', error.message);
  }
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CORS_ORIGIN || '*', methods: ['GET', 'POST'] },
  transports: ['websocket', 'polling'],
});

app.set('trust proxy', 1);
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '100kb' }));

const socketsByUser = new Map();
const proximitySent = new Map();

function newToken() {
  return crypto.randomBytes(24).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

function timingEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function cleanPhone(value) {
  return String(value || '').replace(/[^\d+]/g, '').slice(0, 20);
}

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function validCoord(lat, lng) {
  return lat !== null && lng !== null && lat >= 0 && lat <= 15 && lng >= -74 && lng <= -59;
}

function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dp / 2) ** 2 +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function bearer(req) {
  const header = req.get('authorization') || '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : '';
}

function requireAdmin(req, res, next) {
  if (!ADMIN_TOKEN) {
    return res.status(503).json({ error: 'ADMIN_TOKEN no está configurado en el servidor.' });
  }
  const sent = req.get('x-admin-token') || '';
  if (!timingEqual(sent, ADMIN_TOKEN)) {
    return res.status(401).json({ error: 'Token de administrador inválido.' });
  }
  next();
}

async function setting(key, fallback) {
  try {
    const row = await db.query('SELECT value FROM app_settings WHERE key = $1', [key]);
    if (row.rows[0]) return row.rows[0].value;
  } catch (error) {
    console.error('app_settings:', error.message);
  }
  return process.env[key.toUpperCase()] || fallback;
}

async function rates() {
  const exchange = Number(await setting('exchange_rate_ves', process.env.EXCHANGE_RATE_VES || '50'));
  const base = Number(await setting('base_fare_usd', process.env.BASE_FARE_USD || '1'));
  const perKm = Number(await setting('per_km_usd', process.env.PER_KM_USD || '0.40'));
  const min = Number(await setting('min_fare_usd', process.env.MIN_FARE_USD || '1'));
  const radius = Number(await setting('search_radius_m', '3500'));
  return {
    exchangeRateVes: Number.isFinite(exchange) && exchange > 0 ? exchange : 50,
    baseFareUsd: Number.isFinite(base) ? base : 1,
    perKmUsd: Number.isFinite(perKm) ? perKm : 0.4,
    minFareUsd: Number.isFinite(min) ? min : 1,
    searchRadiusM: Number.isFinite(radius) ? Math.min(Math.max(radius, 500), 8000) : 3500,
  };
}

async function roadRoute(originLng, originLat, destLng, destLat) {
  const straight = haversineMeters(originLat, originLng, destLat, destLng);
  const fallback = {
    meters: straight,
    durationSec: Math.round(straight / 8),
    coordinates: [
      { latitude: originLat, longitude: originLng },
      { latitude: destLat, longitude: destLng },
    ],
    source: 'haversine',
  };
  try {
    const url = `${OSRM_URL}/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'RapidezCarora/1.0 (mototaxi Carora)' },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return fallback;
    const data = await response.json();
    const route = data.routes && data.routes[0];
    if (!route || !route.geometry || !Array.isArray(route.geometry.coordinates)) return fallback;
    return {
      meters: Number(route.distance) || straight,
      durationSec: Math.round(Number(route.duration) || straight / 8),
      coordinates: route.geometry.coordinates.map(([lng, lat]) => ({ latitude: lat, longitude: lng })),
      source: 'osrm',
    };
  } catch (error) {
    console.error('osrm:', error.message);
    return fallback;
  }
}

async function notifyProximity(passengerId, distanceMeters, tripId) {
  const body = `El motorizado está a menos de ${Math.round(distanceMeters)} metros de tu punto de encuentro.`;
  const payload = {
    tripId,
    distanceMeters: Math.round(distanceMeters),
    title: 'Tu moto está cerca',
    body,
  };
  emitToUser(passengerId, 'driver_nearby', payload);
  if (!messaging) return;
  try {
    const row = await db.query('SELECT fcm_token FROM passengers WHERE id = $1', [passengerId]);
    const token = row.rows[0] && row.rows[0].fcm_token;
    if (!token) return;
    await messaging.send({
      token,
      notification: { title: 'Tu moto está cerca', body },
      android: {
        priority: 'high',
        notification: { channelId: 'rapidez_alerts', sound: 'default' },
      },
      data: {
        type: 'DRIVER_PROXIMITY',
        tripId: String(tripId),
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
    });
  } catch (error) {
    console.error('fcm:', error.message);
  }
}

function quoteFare(meters, fare) {
  const km = Math.max(0, meters) / 1000;
  const usd = Math.max(fare.minFareUsd, Math.round((fare.baseFareUsd + km * fare.perKmUsd) * 100) / 100);
  const ves = Math.round(usd * fare.exchangeRateVes * 100) / 100;
  return { usd, ves, km: Math.round(km * 100) / 100 };
}

function whatsappLink(driver) {
  const lines = [
    'Hola, quiero registrarme como motorizado en Rapidez Carora.',
    '',
    `Nombre: ${driver.full_name}`,
    `Cédula: ${driver.national_id}`,
    `Teléfono: ${driver.phone_number}`,
    `Placa: ${driver.vehicle_plate}`,
    `Moto: ${driver.vehicle_model || 'Bera'}`,
    `Banco Pago Móvil: ${driver.pago_movil_bank_code || ''}`,
    `Teléfono Pago Móvil: ${driver.pago_movil_phone || ''}`,
    `ID de registro: ${driver.id}`,
    '',
    'Adjunto fotos de:',
    '1. Cédula',
    '2. Carnet de circulación',
    '3. Selfie con la moto',
  ];
  const text = lines.join('\n');
  if (!ADMIN_WHATSAPP) return { text, url: null };
  return { text, url: `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(text)}` };
}

async function findUserByToken(role, token) {
  if (!token) return null;
  const hash = hashToken(token);
  if (role === 'driver') {
    const q = await db.query(
      `SELECT id, full_name, phone_number, national_id, vehicle_plate, vehicle_model,
              is_active, is_available, pago_movil_bank_code, pago_movil_phone,
              pago_movil_holder_id, rating
       FROM drivers WHERE access_token_hash = $1`,
      [hash]
    );
    return q.rows[0] ? { ...q.rows[0], role: 'driver' } : null;
  }
  const q = await db.query(
    `SELECT id, full_name, phone_number FROM passengers WHERE access_token_hash = $1`,
    [hash]
  );
  return q.rows[0] ? { ...q.rows[0], role: 'passenger' } : null;
}

async function requirePassenger(req, res, next) {
  try {
    const user = await findUserByToken('passenger', bearer(req));
    if (!user) return res.status(401).json({ error: 'Sesión de pasajero inválida.' });
    req.user = user;
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'No se pudo validar la sesión.' });
  }
}

async function requireDriver(req, res, next) {
  try {
    const user = await findUserByToken('driver', bearer(req));
    if (!user) return res.status(401).json({ error: 'Sesión de motorizado inválida.' });
    req.user = user;
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'No se pudo validar la sesión.' });
  }
}

function publicDriver(row, distanceMeters) {
  const bank = BANKS.find((item) => item.code === row.pago_movil_bank_code);
  return {
    id: row.id,
    fullName: row.full_name,
    phoneNumber: row.phone_number,
    vehiclePlate: row.vehicle_plate,
    vehicleModel: row.vehicle_model,
    rating: row.rating !== undefined && row.rating !== null ? Number(row.rating) : null,
    latitude: row.latitude !== undefined && row.latitude !== null ? Number(row.latitude) : null,
    longitude: row.longitude !== undefined && row.longitude !== null ? Number(row.longitude) : null,
    distanceMeters: distanceMeters !== undefined ? Math.round(Number(distanceMeters)) : null,
    pagoMovil: row.pago_movil_phone
      ? {
          bankCode: row.pago_movil_bank_code,
          bankName: bank ? bank.name : row.pago_movil_bank_code,
          phone: row.pago_movil_phone,
          holderId: row.pago_movil_holder_id || row.national_id,
        }
      : null,
  };
}

function publicTrip(row) {
  return {
    id: row.id,
    status: row.status,
    passengerId: row.passenger_id,
    driverId: row.driver_id,
    origin: {
      latitude: Number(row.origin_lat),
      longitude: Number(row.origin_lng),
      address: row.origin_address,
      reference: row.origin_reference,
    },
    destination: {
      latitude: Number(row.destination_lat),
      longitude: Number(row.destination_lng),
      address: row.destination_address,
      reference: row.destination_reference,
    },
    fareUsd: Number(row.fare_usd),
    fareVes: Math.round(Number(row.fare_usd) * Number(row.exchange_rate_ves) * 100) / 100,
    exchangeRateVes: Number(row.exchange_rate_ves),
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    paymentReferenceCode: row.payment_reference_code,
    createdAt: row.created_at,
  };
}

const TRIP_SELECT = `
  SELECT t.*,
         ST_Y(t.origin_location::geometry) AS origin_lat,
         ST_X(t.origin_location::geometry) AS origin_lng,
         ST_Y(t.destination_location::geometry) AS destination_lat,
         ST_X(t.destination_location::geometry) AS destination_lng
  FROM trips t
`;

async function loadTrip(id) {
  const q = await db.query(`${TRIP_SELECT} WHERE t.id = $1`, [id]);
  return q.rows[0] || null;
}

async function nearbyDrivers(lng, lat, radius) {
  const q = await db.query(
    `SELECT id, full_name, phone_number, vehicle_plate, vehicle_model, rating,
            pago_movil_bank_code, pago_movil_phone, pago_movil_holder_id, national_id,
            ST_Y(current_location::geometry) AS latitude,
            ST_X(current_location::geometry) AS longitude,
            ST_Distance(
              current_location::geography,
              ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
            ) AS distance_meters
     FROM drivers
     WHERE is_active = true
       AND is_available = true
       AND current_location IS NOT NULL
       AND last_seen_at > NOW() - INTERVAL '90 seconds'
       AND ST_DWithin(
         current_location::geography,
         ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
         $3
       )
     ORDER BY distance_meters ASC
     LIMIT 15`,
    [lng, lat, radius]
  );
  return q.rows;
}

function emitToUser(userId, event, payload) {
  io.to(`user_${userId}`).emit(event, payload);
}

app.get('/', (_req, res) => {
  res.json({
    service: 'Rapidez Carora API',
    ok: true,
    health: '/health',
    docs: 'Socket.io en este mismo host (wss). No abras la clave de la base en el navegador.',
  });
});

app.get('/health', async (_req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ ok: true, db: true, service: 'rapidez-carora' });
  } catch (error) {
    console.error('health:', error.message);
    res.status(500).json({ ok: false, db: false });
  }
});

app.get('/api/schema-check', async (_req, res) => {
  try {
    const postgis = await db.query(`SELECT PostGIS_Version() AS version`);
    const columns = await db.query(
      `SELECT table_name, column_name
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name IN ('drivers', 'trips', 'passengers', 'app_settings')`
    );
    const need = {
      drivers: ['id', 'is_active', 'is_available', 'current_location', 'access_token_hash'],
      trips: ['id', 'passenger_id', 'status', 'origin_location', 'destination_location', 'fare_usd'],
      passengers: ['id', 'phone_number', 'access_token_hash'],
      app_settings: ['key', 'value'],
    };
    const have = {};
    for (const row of columns.rows) {
      have[row.table_name] = have[row.table_name] || new Set();
      have[row.table_name].add(row.column_name);
    }
    const missing = {};
    for (const [table, cols] of Object.entries(need)) {
      missing[table] = cols.filter((col) => !have[table] || !have[table].has(col));
    }
    const schemaOk = Object.values(missing).every((list) => list.length === 0);
    res.json({
      schemaOk,
      postgis: postgis.rows[0]?.version || null,
      missing,
    });
  } catch (error) {
    console.error('schema-check:', error.message);
    res.status(500).json({ schemaOk: false, error: 'No se pudo leer el esquema. ¿Ejecutaste schema.sql?' });
  }
});

app.get('/api/meta', async (_req, res) => {
  const fare = await rates();
  res.json({
    city: 'Carora',
    center: { latitude: 10.1755, longitude: -70.0827 },
    banks: BANKS,
    currency: { base: 'USD', local: 'VES', exchangeRateVes: fare.exchangeRateVes },
    fare: {
      baseFareUsd: fare.baseFareUsd,
      perKmUsd: fare.perKmUsd,
      minFareUsd: fare.minFareUsd,
      searchRadiusM: fare.searchRadiusM,
    },
    adminWhatsappConfigured: Boolean(ADMIN_WHATSAPP),
    paymentMethods: ['CASH_USD', 'CASH_VES', 'PAGO_MOVIL'],
    maps: {
      tiles: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      routing: OSRM_URL,
      googleMaps: false,
    },
    push: { fcm: Boolean(messaging) },
    offerSeconds: OFFER_SECONDS,
  });
});

app.post('/api/fare-quote', async (req, res) => {
  const originLat = num(req.body.originLat);
  const originLng = num(req.body.originLng);
  const destLat = num(req.body.destinationLat);
  const destLng = num(req.body.destinationLng);
  if (!validCoord(originLat, originLng) || !validCoord(destLat, destLng)) {
    return res.status(400).json({ error: 'Coordenadas fuera de Venezuela o incompletas.' });
  }
  const fare = await rates();
  const road = await roadRoute(originLng, originLat, destLng, destLat);
  const quote = quoteFare(road.meters, fare);
  res.json({
    distanceMeters: Math.round(road.meters),
    durationSec: road.durationSec,
    source: road.source,
    coordinates: road.coordinates,
    ...quote,
    exchangeRateVes: fare.exchangeRateVes,
  });
});

app.get('/api/route', async (req, res) => {
  const originLat = num(req.query.originLat);
  const originLng = num(req.query.originLng);
  const destLat = num(req.query.destinationLat);
  const destLng = num(req.query.destinationLng);
  if (!validCoord(originLat, originLng) || !validCoord(destLat, destLng)) {
    return res.status(400).json({ error: 'Coordenadas fuera de Venezuela o incompletas.' });
  }
  res.json(await roadRoute(originLng, originLat, destLng, destLat));
});

app.post('/api/drivers', async (req, res) => {
  const fullName = String(req.body.fullName || '').trim().slice(0, 100);
  const phone = cleanPhone(req.body.phoneNumber);
  const nationalId = String(req.body.nationalId || '').trim().slice(0, 20);
  const plate = String(req.body.vehiclePlate || '').trim().toUpperCase().slice(0, 10);
  const model = String(req.body.vehicleModel || 'Bera').trim().slice(0, 50);
  const bank = String(req.body.pagoMovilBankCode || '').replace(/\D/g, '').slice(0, 10);
  const pagoPhone = cleanPhone(req.body.pagoMovilPhone);
  const holder = String(req.body.pagoMovilHolderId || nationalId).trim().slice(0, 20);
  if (!fullName || !phone || !nationalId || !plate) {
    return res.status(400).json({ error: 'Nombre, teléfono, cédula y placa son obligatorios.' });
  }
  const token = newToken();
  try {
    const inserted = await db.query(
      `INSERT INTO drivers (
         full_name, phone_number, national_id, vehicle_plate, vehicle_model,
         pago_movil_bank_code, pago_movil_phone, pago_movil_holder_id,
         access_token_hash, is_active, is_available
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,false,false)
       RETURNING id, full_name, phone_number, national_id, vehicle_plate, vehicle_model,
                 pago_movil_bank_code, pago_movil_phone, is_active`,
      [fullName, phone, nationalId, plate, model, bank || null, pagoPhone || null, holder || null, hashToken(token)]
    );
    const driver = inserted.rows[0];
    const wa = whatsappLink(driver);
    res.status(201).json({
      id: driver.id,
      accessToken: token,
      isActive: false,
      verification: 'pending',
      message: 'Guarda el accessToken en el teléfono. Un administrador debe activarte después de ver los documentos.',
      whatsapp: wa,
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Ese teléfono, cédula o placa ya está registrado.' });
    }
    console.error('register driver:', error.message);
    res.status(500).json({ error: 'No se pudo registrar. Revisa que schema.sql esté aplicado.' });
  }
});

app.get('/api/drivers/me', requireDriver, (req, res) => {
  res.json({
    id: req.user.id,
    fullName: req.user.full_name,
    phoneNumber: req.user.phone_number,
    nationalId: req.user.national_id,
    vehiclePlate: req.user.vehicle_plate,
    vehicleModel: req.user.vehicle_model,
    isActive: req.user.is_active,
    isAvailable: req.user.is_available,
    pagoMovil: publicDriver(req.user).pagoMovil,
    rating: Number(req.user.rating),
  });
});

app.patch('/api/drivers/me', requireDriver, async (req, res) => {
  const bank = req.body.pagoMovilBankCode !== undefined
    ? String(req.body.pagoMovilBankCode || '').replace(/\D/g, '').slice(0, 10)
    : null;
  const pagoPhone = req.body.pagoMovilPhone !== undefined ? cleanPhone(req.body.pagoMovilPhone) : null;
  const holder = req.body.pagoMovilHolderId !== undefined
    ? String(req.body.pagoMovilHolderId || '').trim().slice(0, 20)
    : null;
  const fcm = req.body.fcmToken !== undefined ? String(req.body.fcmToken || '').slice(0, 4096) : null;
  try {
    await db.query(
      `UPDATE drivers SET
         pago_movil_bank_code = COALESCE($2, pago_movil_bank_code),
         pago_movil_phone = COALESCE($3, pago_movil_phone),
         pago_movil_holder_id = COALESCE($4, pago_movil_holder_id),
         fcm_token = COALESCE($5, fcm_token)
       WHERE id = $1`,
      [req.user.id, bank, pagoPhone, holder, fcm]
    );
    res.json({ ok: true });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'No se pudo actualizar el perfil.' });
  }
});

app.post('/api/drivers/me/availability', requireDriver, async (req, res) => {
  if (!req.user.is_active) {
    return res.status(403).json({
      error: 'Tu cuenta aún no está activa. Envía cédula, carnet y selfie por WhatsApp y espera la activación.',
    });
  }
  const available = Boolean(req.body.available);
  try {
    await db.query('UPDATE drivers SET is_available = $2 WHERE id = $1', [req.user.id, available]);
    res.json({ ok: true, isAvailable: available });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'No se pudo cambiar la disponibilidad.' });
  }
});

app.get('/api/admin/drivers', requireAdmin, async (req, res) => {
  const onlyPending = req.query.pending === '1';
  const q = await db.query(
    `SELECT id, full_name, phone_number, national_id, vehicle_plate, vehicle_model,
            is_active, is_available, pago_movil_bank_code, pago_movil_phone,
            created_at, last_seen_at
     FROM drivers
     ${onlyPending ? 'WHERE is_active = false' : ''}
     ORDER BY created_at DESC
     LIMIT 100`
  );
  res.json({ drivers: q.rows });
});

app.post('/api/admin/drivers/:id/active', requireAdmin, async (req, res) => {
  const active = req.body.active !== false;
  const q = await db.query(
    `UPDATE drivers SET is_active = $2, is_available = CASE WHEN $2 THEN is_available ELSE false END
     WHERE id = $1
     RETURNING id, full_name, phone_number, is_active`,
    [req.params.id, active]
  );
  if (!q.rows[0]) return res.status(404).json({ error: 'Motorizado no encontrado.' });
  emitToUser(q.rows[0].id, 'account_status', { isActive: q.rows[0].is_active });
  res.json(q.rows[0]);
});

app.post('/api/passengers', async (req, res) => {
  const fullName = String(req.body.fullName || '').trim().slice(0, 100);
  const phone = cleanPhone(req.body.phoneNumber);
  if (!fullName || !phone) {
    return res.status(400).json({ error: 'Nombre y teléfono son obligatorios.' });
  }
  const token = newToken();
  try {
    const inserted = await db.query(
      `INSERT INTO passengers (full_name, phone_number, access_token_hash)
       VALUES ($1, $2, $3)
       RETURNING id, full_name, phone_number`,
      [fullName, phone, hashToken(token)]
    );
    res.status(201).json({
      id: inserted.rows[0].id,
      accessToken: token,
      fullName: inserted.rows[0].full_name,
      message: 'Guarda el accessToken en el teléfono. No se vuelve a mostrar.',
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        error: 'Ese teléfono ya está registrado. Si perdiste el token, pide al administrador que reinicie la cuenta.',
      });
    }
    console.error(error.message);
    res.status(500).json({ error: 'No se pudo registrar el pasajero.' });
  }
});

app.get('/api/passengers/me', requirePassenger, (req, res) => {
  res.json({ id: req.user.id, fullName: req.user.full_name, phoneNumber: req.user.phone_number });
});

app.patch('/api/passengers/me', requirePassenger, async (req, res) => {
  const fcm = String(req.body.fcmToken || '').slice(0, 4096);
  if (!fcm) return res.status(400).json({ error: 'Falta fcmToken.' });
  try {
    await db.query('UPDATE passengers SET fcm_token = $2 WHERE id = $1', [req.user.id, fcm]);
    res.json({ ok: true });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'No se pudo guardar el token de notificaciones.' });
  }
});

app.post('/api/trips', requirePassenger, async (req, res) => {
  const originLat = num(req.body.originLat);
  const originLng = num(req.body.originLng);
  const destLat = num(req.body.destinationLat);
  const destLng = num(req.body.destinationLng);
  const originAddress = String(req.body.originAddress || 'Carora').trim().slice(0, 300);
  const originReference = String(req.body.originReference || '').trim().slice(0, 300);
  const destinationAddress = String(req.body.destinationAddress || 'Carora').trim().slice(0, 300);
  const destinationReference = String(req.body.destinationReference || '').trim().slice(0, 300);
  const paymentMethod = String(req.body.paymentMethod || '').toUpperCase();
  if (!['CASH_USD', 'CASH_VES', 'PAGO_MOVIL'].includes(paymentMethod)) {
    return res.status(400).json({ error: 'Método de pago inválido.' });
  }
  if (!originReference) {
    return res.status(400).json({ error: 'El punto de referencia en Carora es obligatorio.' });
  }
  if (!validCoord(originLat, originLng) || !validCoord(destLat, destLng)) {
    return res.status(400).json({ error: 'Marca origen y destino dentro de Venezuela.' });
  }
  try {
    const fare = await rates();
    const road = await roadRoute(originLng, originLat, destLng, destLat);
    const quote = quoteFare(road.meters, fare);
    const inserted = await db.query(
      `INSERT INTO trips (
         passenger_id, status, origin_location, origin_address, origin_reference,
         destination_location, destination_address, destination_reference,
         fare_usd, exchange_rate_ves, payment_method
       ) VALUES (
         $1, 'REQUESTED',
         ST_SetSRID(ST_MakePoint($2, $3), 4326), $4, $5,
         ST_SetSRID(ST_MakePoint($6, $7), 4326), $8, $9,
         $10, $11, $12
       )
       RETURNING id`,
      [
        req.user.id,
        originLng, originLat, originAddress, originReference,
        destLng, destLat, destinationAddress, destinationReference || null,
        quote.usd, fare.exchangeRateVes, paymentMethod,
      ]
    );
    const trip = await loadTrip(inserted.rows[0].id);
    const drivers = await nearbyDrivers(originLng, originLat, fare.searchRadiusM);
    const offer = {
      ...publicTrip(trip),
      distanceMeters: Math.round(road.meters),
      durationSec: road.durationSec,
      passengerName: req.user.full_name,
      expiresInSec: OFFER_SECONDS,
    };
    for (const driver of drivers) {
      emitToUser(driver.id, 'trip_offer', {
        ...offer,
        driverDistanceMeters: Math.round(Number(driver.distance_meters)),
      });
    }
    res.status(201).json({
      trip: publicTrip(trip),
      driversNotified: drivers.length,
      route: road,
    });
  } catch (error) {
    console.error('create trip:', error.message);
    res.status(500).json({ error: 'No se pudo crear la carrera.' });
  }
});

app.get('/api/trips/:id', async (req, res) => {
  const token = bearer(req);
  const passenger = await findUserByToken('passenger', token);
  const driver = passenger ? null : await findUserByToken('driver', token);
  const user = passenger || driver;
  if (!user) return res.status(401).json({ error: 'Sesión inválida.' });
  const trip = await loadTrip(req.params.id);
  if (!trip) return res.status(404).json({ error: 'Carrera no encontrada.' });
  const allowed = trip.passenger_id === user.id || trip.driver_id === user.id;
  if (!allowed) return res.status(403).json({ error: 'Esta carrera no es tuya.' });
  let driverProfile = null;
  if (trip.driver_id) {
    const d = await db.query(
      `SELECT id, full_name, phone_number, vehicle_plate, vehicle_model, rating,
              national_id, pago_movil_bank_code, pago_movil_phone, pago_movil_holder_id,
              ST_Y(current_location::geometry) AS latitude,
              ST_X(current_location::geometry) AS longitude
       FROM drivers WHERE id = $1`,
      [trip.driver_id]
    );
    if (d.rows[0]) driverProfile = publicDriver(d.rows[0]);
  }
  res.json({ trip: publicTrip(trip), driver: driverProfile });
});

app.post('/api/trips/:id/accept', requireDriver, async (req, res) => {
  if (!req.user.is_active) return res.status(403).json({ error: 'Cuenta no activa.' });
  try {
    const updated = await db.query(
      `UPDATE trips
       SET driver_id = $1, status = 'ACCEPTED', updated_at = NOW()
       WHERE id = $2 AND status = 'REQUESTED' AND driver_id IS NULL
       RETURNING id`,
      [req.user.id, req.params.id]
    );
    if (!updated.rows[0]) {
      return res.status(409).json({ error: 'Esa carrera ya fue tomada o cancelada.' });
    }
    await db.query('UPDATE drivers SET is_available = false WHERE id = $1', [req.user.id]);
    const trip = await loadTrip(req.params.id);
    const payload = { trip: publicTrip(trip), driver: publicDriver(req.user) };
    emitToUser(trip.passenger_id, 'trip_accepted', payload);
    io.to('drivers_online').emit('trip_closed', { tripId: trip.id, takenBy: req.user.id });
    res.json(payload);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'No se pudo aceptar la carrera.' });
  }
});

const DRIVER_TRANSITIONS = {
  ACCEPTED: ['DRIVER_ARRIVED', 'CANCELLED'],
  DRIVER_ARRIVED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
};

app.post('/api/trips/:id/status', requireDriver, async (req, res) => {
  const next = String(req.body.status || '').toUpperCase();
  const trip = await loadTrip(req.params.id);
  if (!trip || trip.driver_id !== req.user.id) {
    return res.status(404).json({ error: 'Carrera no encontrada.' });
  }
  const allowed = DRIVER_TRANSITIONS[trip.status] || [];
  if (!allowed.includes(next)) {
    return res.status(400).json({ error: `No se puede pasar de ${trip.status} a ${next}.` });
  }
  if (next === 'COMPLETED' && trip.payment_method === 'PAGO_MOVIL' && trip.payment_status !== 'PAID') {
    return res.status(400).json({ error: 'Confirma el Pago Móvil antes de cerrar la carrera.' });
  }
  await db.query('UPDATE trips SET status = $2, updated_at = NOW() WHERE id = $1', [trip.id, next]);
  if (next === 'COMPLETED' || next === 'CANCELLED') {
    await db.query('UPDATE drivers SET is_available = true WHERE id = $1 AND is_active = true', [req.user.id]);
  }
  const fresh = await loadTrip(trip.id);
  const payload = { trip: publicTrip(fresh) };
  emitToUser(fresh.passenger_id, 'trip_status_changed', payload);
  emitToUser(req.user.id, 'trip_status_changed', payload);
  res.json(payload);
});

app.post('/api/trips/:id/cancel', requirePassenger, async (req, res) => {
  const trip = await loadTrip(req.params.id);
  if (!trip || trip.passenger_id !== req.user.id) {
    return res.status(404).json({ error: 'Carrera no encontrada.' });
  }
  if (!['REQUESTED', 'ACCEPTED', 'DRIVER_ARRIVED'].includes(trip.status)) {
    return res.status(400).json({ error: 'Esta carrera ya no se puede cancelar.' });
  }
  await db.query(
    `UPDATE trips SET status = 'CANCELLED', updated_at = NOW() WHERE id = $1`,
    [trip.id]
  );
  if (trip.driver_id) {
    await db.query('UPDATE drivers SET is_available = true WHERE id = $1 AND is_active = true', [trip.driver_id]);
    emitToUser(trip.driver_id, 'trip_status_changed', { tripId: trip.id, status: 'CANCELLED' });
  } else {
    io.to('drivers_online').emit('trip_closed', { tripId: trip.id, takenBy: null });
  }
  res.json({ ok: true, status: 'CANCELLED' });
});

app.post('/api/trips/:id/payment', requirePassenger, async (req, res) => {
  const reference = String(req.body.referenceCode || '').replace(/\D/g, '').slice(-6);
  if (reference.length < 4) {
    return res.status(400).json({ error: 'Escribe los últimos 4 a 6 dígitos de la referencia.' });
  }
  const trip = await loadTrip(req.params.id);
  if (!trip || trip.passenger_id !== req.user.id) {
    return res.status(404).json({ error: 'Carrera no encontrada.' });
  }
  if (trip.payment_method !== 'PAGO_MOVIL') {
    return res.status(400).json({ error: 'Esta carrera no es Pago Móvil.' });
  }
  await db.query(
    `UPDATE trips
     SET payment_reference_code = $2, payment_status = 'VERIFYING', updated_at = NOW()
     WHERE id = $1`,
    [trip.id, reference]
  );
  if (trip.driver_id) {
    emitToUser(trip.driver_id, 'payment_reported', {
      tripId: trip.id,
      referenceCode: reference,
      fareVes: Math.round(Number(trip.fare_usd) * Number(trip.exchange_rate_ves) * 100) / 100,
    });
  }
  res.json({ ok: true, paymentStatus: 'VERIFYING', referenceCode: reference });
});

app.post('/api/trips/:id/payment/confirm', requireDriver, async (req, res) => {
  const paid = req.body.paid !== false;
  const trip = await loadTrip(req.params.id);
  if (!trip || trip.driver_id !== req.user.id) {
    return res.status(404).json({ error: 'Carrera no encontrada.' });
  }
  const status = paid ? 'PAID' : 'FAILED';
  await db.query(
    `UPDATE trips SET payment_status = $2, updated_at = NOW() WHERE id = $1`,
    [trip.id, status]
  );
  emitToUser(trip.passenger_id, 'payment_status_changed', { tripId: trip.id, paymentStatus: status });
  res.json({ ok: true, paymentStatus: status });
});

app.post('/api/admin/settings', requireAdmin, async (req, res) => {
  const entries = [];
  if (req.body.exchangeRateVes !== undefined) entries.push(['exchange_rate_ves', String(req.body.exchangeRateVes)]);
  if (req.body.baseFareUsd !== undefined) entries.push(['base_fare_usd', String(req.body.baseFareUsd)]);
  if (req.body.perKmUsd !== undefined) entries.push(['per_km_usd', String(req.body.perKmUsd)]);
  if (req.body.minFareUsd !== undefined) entries.push(['min_fare_usd', String(req.body.minFareUsd)]);
  if (!entries.length) return res.status(400).json({ error: 'Nada que actualizar.' });
  for (const [key, value] of entries) {
    if (!Number.isFinite(Number(value)) || Number(value) <= 0) {
      return res.status(400).json({ error: `${key} debe ser un número mayor que 0.` });
    }
    await db.query(
      `INSERT INTO app_settings (key, value, updated_at) VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [key, value]
    );
  }
  res.json({ ok: true, rates: await rates() });
});

io.on('connection', (socket) => {
  socket.on('join_room', async ({ userId, role, token }) => {
    try {
      const expected = role === 'driver' ? 'driver' : 'passenger';
      const user = await findUserByToken(expected, token);
      if (!user || user.id !== userId) {
        socket.emit('auth_error', { error: 'Token inválido.' });
        return;
      }
      socket.data.user = user;
      socket.join(`user_${user.id}`);
      socketsByUser.set(user.id, socket.id);
      if (user.role === 'driver') {
        socket.join('drivers_online');
        if (user.is_active) {
          await db.query('UPDATE drivers SET last_seen_at = NOW() WHERE id = $1', [user.id]);
        }
      }
      socket.emit('joined', { userId: user.id, role: user.role, isActive: user.is_active !== false });
    } catch (error) {
      console.error('join_room:', error.message);
      socket.emit('auth_error', { error: 'No se pudo unir a la sala.' });
    }
  });

  socket.on('driver_location_update', async (data) => {
    const user = socket.data.user;
    if (!user || user.role !== 'driver') return;
    const latitude = num(data?.latitude);
    const longitude = num(data?.longitude);
    if (!validCoord(latitude, longitude)) return;
    try {
      const saved = await db.query(
        `UPDATE drivers
         SET current_location = ST_SetSRID(ST_MakePoint($1, $2), 4326),
             last_seen_at = NOW()
         WHERE id = $3 AND is_active = true
         RETURNING id`,
        [longitude, latitude, user.id]
      );
      if (!saved.rows[0]) return;
      user.is_active = true;
      const tripId = data?.tripId || null;
      if (!tripId) {
        socket.emit('location_saved', { latitude, longitude });
        return;
      }
      const trip = await loadTrip(tripId);
      if (!trip || trip.driver_id !== user.id) return;
      if (!['ACCEPTED', 'DRIVER_ARRIVED', 'IN_PROGRESS'].includes(trip.status)) return;
      emitToUser(trip.passenger_id, 'driver_position_changed', {
        driverId: user.id,
        tripId: trip.id,
        latitude,
        longitude,
      });
      const distance = haversineMeters(latitude, longitude, Number(trip.origin_lat), Number(trip.origin_lng));
      if (distance <= 100 && !proximitySent.has(trip.id) && trip.status !== 'IN_PROGRESS') {
        proximitySent.set(trip.id, Date.now());
        await notifyProximity(trip.passenger_id, distance, trip.id);
      }
      socket.emit('location_saved', { latitude, longitude, distanceToPickup: Math.round(distance) });
    } catch (error) {
      console.error('location:', error.message);
    }
  });

  socket.on('disconnect', () => {
    const user = socket.data.user;
    if (!user) return;
    if (socketsByUser.get(user.id) === socket.id) socketsByUser.delete(user.id);
  });
});

setInterval(() => {
  const cutoff = Date.now() - 30 * 60 * 1000;
  for (const [tripId, at] of proximitySent) {
    if (at < cutoff) proximitySent.delete(tripId);
  }
}, 10 * 60 * 1000).unref();

initFirebase();
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Rapidez Carora API escuchando en el puerto ${PORT}`);
});
