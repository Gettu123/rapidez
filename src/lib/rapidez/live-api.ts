import { createServerFn } from "@tanstack/react-start";
import { ConnectorType } from "@/lib/app-data";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { COMMISSION, OFFER_MS, SEARCH_RADIUS_M, fareFor, haversine, type LatLng } from "@/lib/rapidez/geo";

const REVIEW_KEY = "Carora2026";
const DEVELOPER_EMAIL = "beisander2@gmail.com";
const FRESH_MS = 20000;

type Role = "passenger" | "driver";

export interface Profile {
  userId: string;
  role: Role;
  fullName: string;
  phone: string;
  cedula: string;
  status: "pending" | "approved" | "rejected";
  elite: boolean;
  plate: string;
  model: string;
  bankPhone: string;
  rejectNote: string;
  hasCedulaPhoto: boolean;
  hasSelfie: boolean;
  saldoUsd: number;
  rating: number;
  ratingCount: number;
}

export interface NearbyMoto {
  id: string;
  name: string;
  lat: number;
  lng: number;
  plate: string;
  model: string;
  elite: boolean;
  meters: number;
}

export interface TripView {
  id: string;
  passengerId: string;
  driverId: string | null;
  preferredDriverId: string | null;
  status: string;
  pickupLat: number;
  pickupLng: number;
  pickupRef: string;
  destLat: number;
  destLng: number;
  destRef: string;
  fareUsd: number;
  distanceM: number;
  payMethod: string;
  payRef: string;
  payStatus: string;
  driverName: string;
  driverLat: number | null;
  driverLng: number | null;
  passengerName: string;
  shareToken: string;
  offerUntil: number | null;
  commissionUsd: number;
  panicked: boolean;
}

export interface PendingRate {
  tripId: string;
  otherName: string;
  asDriver: boolean;
}

export interface SyncResult {
  profile: Profile | null;
  locked: boolean;
  drivers: NearbyMoto[];
  trip: TripView | null;
  offer: TripView | null;
  pendingRate: PendingRate | null;
}

interface ProfileRow {
  user_id: string;
  role: string;
  full_name: string;
  phone: string;
  cedula: string;
  status: string;
  elite: boolean;
  plate: string | null;
  model: string | null;
  bank_phone: string | null;
  reject_note: string | null;
  cedula_photo: string | null;
  selfie: string | null;
  saldo_usd: number | null;
  rating_sum: number | null;
  rating_count: number | null;
}

function profileOf(row: ProfileRow): Profile {
  return {
    userId: row.user_id,
    role: row.role === "driver" ? "driver" : "passenger",
    fullName: row.full_name,
    phone: row.phone,
    cedula: row.cedula,
    status: row.status === "approved" || row.status === "rejected" ? row.status : "pending",
    elite: Boolean(row.elite),
    plate: row.plate ?? "",
    model: row.model ?? "",
    bankPhone: row.bank_phone ?? "",
    rejectNote: row.reject_note ?? "",
    hasCedulaPhoto: Boolean(row.cedula_photo),
    hasSelfie: Boolean(row.selfie),
    saldoUsd: Number(row.saldo_usd ?? 0),
    rating: Number(row.rating_count) > 0 ? Number(row.rating_sum) / Number(row.rating_count) : 0,
    ratingCount: Number(row.rating_count) || 0,
  };
}

function assertReview(key: string) {
  if (key !== REVIEW_KEY) throw new Error("Clave de revisión incorrecta.");
}

function photoOk(value: string, required: boolean) {
  if (!value) {
    if (required) throw new Error("Falta la foto.");
    return null;
  }
  if (!value.startsWith("data:image/")) throw new Error("La foto no es válida.");
  if (value.length > 180000) throw new Error("La foto es demasiado pesada. Acércala y vuelve a tomarla.");
  return value;
}

async function notifyDeveloper(body: string, subject = "Rapidez Carora — verificación de identidad") {
  try {
    const { callTool } = await import("@/lib/app-data/client.server");
    const result = await callTool(
      "gmail_send_message",
      {
        to: [DEVELOPER_EMAIL],
        subject,
        body,
      },
      { connectorType: ConnectorType.Gmail },
    );
    return result.ok;
  } catch {
    return false;
  }
}

export const submitProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: {
    role: Role;
    fullName: string;
    phone: string;
    cedula: string;
    plate: string;
    model: string;
    bankPhone: string;
    cedulaPhoto: string;
    selfie: string;
  }) => input)
  .handler(async ({ context, data }) => {
    const role: Role = data.role === "driver" ? "driver" : "passenger";
    const fullName = data.fullName.trim();
    const phone = data.phone.replace(/\D/g, "");
    const cedula = data.cedula.trim().toUpperCase();
    if (fullName.length < 3) throw new Error("Escribe tu nombre completo.");
    if (phone.length < 10) throw new Error("El teléfono no es válido.");
    if (!/^V-?\d{5,9}$/.test(cedula) && !/^\d{5,9}$/.test(cedula)) {
      throw new Error("La cédula debe verse como V-12345678.");
    }
    const cedulaPhoto = photoOk(data.cedulaPhoto, true);
    const selfie = photoOk(data.selfie, true);
    if (role === "driver" && data.plate.trim().length < 4) throw new Error("Falta la placa.");
    const sql = await getSql();
    const existing = await sql<{ status: string }>`select status from profiles where user_id = ${context.userId}`;
    if (existing[0]?.status === "approved") throw new Error("Esta cuenta ya está aprobada.");
    await sql`
      insert into profiles (
        user_id, role, full_name, phone, cedula, status, elite,
        cedula_photo, selfie, plate, model, bank_phone, reject_note
      ) values (
        ${context.userId}, ${role}, ${fullName}, ${phone}, ${cedula}, 'pending', false,
        ${cedulaPhoto}, ${selfie}, ${data.plate.trim().toUpperCase()}, ${data.model.trim()},
        ${data.bankPhone.replace(/\D/g, "")}, ''
      )
      on conflict (user_id) do update set
        role = excluded.role,
        full_name = excluded.full_name,
        phone = excluded.phone,
        cedula = excluded.cedula,
        status = 'pending',
        elite = false,
        cedula_photo = excluded.cedula_photo,
        selfie = excluded.selfie,
        plate = excluded.plate,
        model = excluded.model,
        bank_phone = excluded.bank_phone,
        reject_note = ''
    `;
    const emailed = await notifyDeveloper(
      [
        "Hay una verificación nueva en Rapidez Carora.",
        `Rol: ${role === "driver" ? "mototaxista" : "pasajero"}`,
        `Nombre: ${fullName}`,
        `Teléfono: ${phone}`,
        `Cédula: ${cedula}`,
        role === "driver" ? `Placa: ${data.plate.trim().toUpperCase()}` : "",
        "La cédula y la selfie están en la bandeja del desarrollador, dentro de la app.",
        "Aprueba o rechaza ahí. La clave de revisión es Carora2026.",
      ]
        .filter(Boolean)
        .join("\n"),
    );
    return { ok: true, emailed };
  });

export const syncLive = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { deviceId: string; lat: number | null; lng: number | null; online: boolean }) => input)
  .handler(async ({ context, data }): Promise<SyncResult> => {
    const sql = await getSql();
    const rows = await sql<ProfileRow>`select * from profiles where user_id = ${context.userId}`;
    const row = rows[0];
    if (!row) {
      return { profile: null, locked: false, drivers: [], trip: null, offer: null, pendingRate: null };
    }
    const profile = profileOf(row);
    if (profile.status !== "approved") {
      return { profile, locked: false, drivers: [], trip: null, offer: null, pendingRate: null };
    }
    const deviceId = data.deviceId.trim();
    if (deviceId.length < 8) throw new Error("Este teléfono no está identificado.");
    const bound = await sql<{ device_id: string }>`select device_id from devices where user_id = ${context.userId}`;
    if (!bound[0]) {
      await sql`insert into devices (user_id, device_id) values (${context.userId}, ${deviceId})`;
    } else if (bound[0].device_id !== deviceId) {
      return { profile, locked: true, drivers: [], trip: null, offer: null, pendingRate: null };
    } else {
      await sql`update devices set updated_at = now() where user_id = ${context.userId}`;
    }
    const lat = typeof data.lat === "number" ? data.lat : null;
    const lng = typeof data.lng === "number" ? data.lng : null;
    if (lat != null && lng != null && lat > 9 && lat < 12 && lng < -69 && lng > -72) {
      const online = profile.role === "driver" ? Boolean(data.online) : true;
      await sql`
        insert into positions (user_id, lat, lng, online, updated_at)
        values (${context.userId}, ${lat}, ${lng}, ${online}, now())
        on conflict (user_id) do update set
          lat = excluded.lat, lng = excluded.lng, online = excluded.online, updated_at = now()
      `;
    } else if (profile.role === "driver" && !data.online) {
      await sql`update positions set online = false, updated_at = now() where user_id = ${context.userId}`;
    }
    const here: LatLng | null = lat != null && lng != null ? { lat, lng } : null;
    await cascadeOffers();
    const drivers = await nearby(here);
    const trip = await activeTrip(context.userId);
    let offer: TripView | null = null;
    if (profile.role === "driver" && data.online && here) {
      offer = await openOffer(context.userId);
    }
    const pendingRate = trip ? null : await pendingRating(context.userId);
    return { profile, locked: false, drivers, trip, offer, pendingRate };
  });

async function nearby(origin: LatLng | null): Promise<NearbyMoto[]> {
  const sql = await getSql();
  const rows = await sql<{
    user_id: string;
    full_name: string;
    plate: string | null;
    model: string | null;
    elite: boolean;
    lat: number;
    lng: number;
    updated_at: string | Date;
  }>`
    select p.user_id, p.full_name, p.plate, p.model, p.elite, pos.lat, pos.lng, pos.updated_at
    from positions pos
    join profiles p on p.user_id = pos.user_id
    where p.role = 'driver' and p.status = 'approved' and pos.online = true
  `;
  const now = Date.now();
  return rows
    .filter((row) => now - new Date(row.updated_at).getTime() < FRESH_MS)
    .map((row) => {
      const point = { lat: Number(row.lat), lng: Number(row.lng) };
      return {
        id: row.user_id,
        name: row.full_name,
        lat: point.lat,
        lng: point.lng,
        plate: row.plate ?? "",
        model: row.model ?? "",
        elite: Boolean(row.elite),
        meters: origin ? Math.round(haversine(origin, point)) : 0,
      };
    })
    .filter((row) => !origin || row.meters <= SEARCH_RADIUS_M)
    .sort((a, b) => a.meters - b.meters);
}

interface TripRow {
  id: string;
  passenger_id: string;
  driver_id: string | null;
  preferred_driver_id: string | null;
  status: string;
  pickup_lat: number;
  pickup_lng: number;
  pickup_ref: string;
  dest_lat: number;
  dest_lng: number;
  dest_ref: string | null;
  fare_usd: number;
  distance_m: number;
  pay_method: string;
  pay_ref: string | null;
  pay_status: string;
  offer_driver_id: string | null;
  offer_until_ms: number | null;
  offer_skip: string | null;
  share_token: string | null;
  commission_usd: number | null;
  panic_at: string | Date | null;
}

async function tripView(row: TripRow): Promise<TripView> {
  const sql = await getSql();
  const people = await sql<{ user_id: string; full_name: string; lat: number | null; lng: number | null }>`
    select p.user_id, p.full_name, pos.lat, pos.lng
    from profiles p
    left join positions pos on pos.user_id = p.user_id
    where p.user_id = ${row.passenger_id} or p.user_id = ${row.driver_id ?? ""}
  `;
  const passenger = people.find((p) => p.user_id === row.passenger_id);
  const driver = people.find((p) => p.user_id === row.driver_id);
  return {
    id: row.id,
    passengerId: row.passenger_id,
    driverId: row.driver_id,
    preferredDriverId: row.preferred_driver_id,
    status: row.status,
    pickupLat: Number(row.pickup_lat),
    pickupLng: Number(row.pickup_lng),
    pickupRef: row.pickup_ref,
    destLat: Number(row.dest_lat),
    destLng: Number(row.dest_lng),
    destRef: row.dest_ref ?? "",
    fareUsd: Number(row.fare_usd),
    distanceM: Number(row.distance_m),
    payMethod: row.pay_method,
    payRef: row.pay_ref ?? "",
    payStatus: row.pay_status,
    driverName: driver?.full_name ?? "",
    driverLat: driver?.lat == null ? null : Number(driver.lat),
    driverLng: driver?.lng == null ? null : Number(driver.lng),
    passengerName: passenger?.full_name ?? "",
    shareToken: row.share_token ?? "",
    offerUntil: row.offer_until_ms == null ? null : Number(row.offer_until_ms),
    commissionUsd: Number(row.commission_usd ?? 0),
    panicked: Boolean(row.panic_at),
  };
}

async function activeTrip(userId: string): Promise<TripView | null> {
  const sql = await getSql();
  const rows = await sql<TripRow>`
    select * from trips
    where status not in ('done', 'cancelled')
      and (passenger_id = ${userId} or driver_id = ${userId})
    order by created_at desc
    limit 1
  `;
  return rows[0] ? tripView(rows[0]) : null;
}

async function openOffer(driverId: string): Promise<TripView | null> {
  const sql = await getSql();
  const now = Date.now();
  const rows = await sql<TripRow>`
    select * from trips
    where status = 'open' and offer_driver_id = ${driverId}
    limit 1
  `;
  const row = rows[0];
  if (!row || Number(row.offer_until_ms ?? 0) <= now) return null;
  return tripView(row);
}

async function candidates(pickup: LatLng, fare: number) {
  const sql = await getSql();
  const need = Math.max(0.4, Math.round(fare * COMMISSION * 100) / 100);
  const rows = await sql<{
    user_id: string;
    rating_sum: number;
    rating_count: number;
    saldo_usd: number;
    lat: number;
    lng: number;
    updated_at: string | Date;
  }>`
    select p.user_id, p.rating_sum, p.rating_count, p.saldo_usd, pos.lat, pos.lng, pos.updated_at
    from profiles p
    join positions pos on pos.user_id = p.user_id
    where p.role = 'driver' and p.status = 'approved' and pos.online = true
  `;
  const now = Date.now();
  return rows
    .filter((row) => now - new Date(row.updated_at).getTime() < FRESH_MS)
    .map((row) => {
      const count = Number(row.rating_count) || 0;
      return {
        id: row.user_id,
        meters: haversine(pickup, { lat: Number(row.lat), lng: Number(row.lng) }),
        rating: count > 0 ? Number(row.rating_sum) / count : 0,
        rated: count > 0,
        saldo: Number(row.saldo_usd),
      };
    })
    .filter((row) => row.meters <= SEARCH_RADIUS_M && row.saldo + 0.001 >= need)
    .sort((a, b) => {
      const ap = a.rated && a.rating >= 4.5 ? 0 : 1;
      const bp = b.rated && b.rating >= 4.5 ? 0 : 1;
      if (ap !== bp) return ap - bp;
      return a.meters - b.meters;
    });
}

async function cascadeOffers() {
  const sql = await getSql();
  const now = Date.now();
  const trips = await sql<TripRow>`select * from trips where status = 'open' order by created_at asc`;
  const people = await sql<{ user_id: string; rating_sum: number; rating_count: number }>`
    select user_id, rating_sum, rating_count from profiles where role = 'passenger'
  `;
  const score = (id: string) => {
    const row = people.find((person) => person.user_id === id);
    if (!row || !Number(row.rating_count)) return 0;
    return Number(row.rating_sum) / Number(row.rating_count);
  };
  trips.sort((a, b) => score(b.passenger_id) - score(a.passenger_id));
  for (const trip of trips) {
    const until = Number(trip.offer_until_ms ?? 0);
    const current = trip.offer_driver_id;
    if (current && until > now) continue;
    let skip = String(trip.offer_skip ?? "").split(",").filter(Boolean);
    if (current) skip = [...new Set([...skip, current])];
    const list = await candidates(
      { lat: Number(trip.pickup_lat), lng: Number(trip.pickup_lng) },
      Number(trip.fare_usd),
    );
    let next = list.find((driver) => !skip.includes(driver.id));
    if (!next && list.length) {
      skip = [];
      next = list[0];
    }
    await sql`
      update trips set
        offer_driver_id = ${next ? next.id : null},
        offer_until_ms = ${next ? now + OFFER_MS : null},
        offer_skip = ${skip.join(",")}
      where id = ${trip.id} and status = 'open'
        and (offer_driver_id is null or offer_until_ms is null or offer_until_ms <= ${now})
    `;
  }
}

async function pendingRating(userId: string): Promise<PendingRate | null> {
  const sql = await getSql();
  const rows = await sql<{ id: string; passenger_id: string; driver_id: string | null }>`
    select t.id, t.passenger_id, t.driver_id
    from trips t
    where t.status = 'done'
      and (t.passenger_id = ${userId} or t.driver_id = ${userId})
      and not exists (
        select 1 from ratings r where r.trip_id = t.id and r.from_user = ${userId}
      )
    order by t.updated_at desc
    limit 1
  `;
  const trip = rows[0];
  if (!trip) return null;
  const otherId = trip.passenger_id === userId ? trip.driver_id : trip.passenger_id;
  if (!otherId) return null;
  const names = await sql<{ full_name: string }>`select full_name from profiles where user_id = ${otherId}`;
  return {
    tripId: trip.id,
    otherName: names[0]?.full_name ?? "La otra persona",
    asDriver: trip.driver_id === userId,
  };
}

export const requestTrip = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: {
    pickupLat: number;
    pickupLng: number;
    pickupRef: string;
    destLat: number;
    destLng: number;
    destRef: string;
    payMethod: string;
    preferredDriverId: string | null;
  }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const me = await sql<{ role: string; status: string }>`select role, status from profiles where user_id = ${context.userId}`;
    if (me[0]?.role !== "passenger" || me[0]?.status !== "approved") throw new Error("Tu cuenta aún no puede pedir.");
    const busy = await sql<{ id: string }>`
      select id from trips where passenger_id = ${context.userId} and status not in ('done', 'cancelled') limit 1
    `;
    if (busy[0]) throw new Error("Ya tienes una carrera abierta.");
    const pickup = { lat: data.pickupLat, lng: data.pickupLng };
    const dest = { lat: data.destLat, lng: data.destLng };
    const distanceM = Math.round(haversine(pickup, dest));
    if (distanceM < 120) throw new Error("El destino está demasiado cerca.");
    const ref = data.pickupRef.trim() || "Donde estoy";
    const id = `t_${crypto.randomUUID()}`;
    const share = crypto.randomUUID().replace(/-/g, "");
    const pay = data.payMethod === "PAGO_MOVIL" ? "PAGO_MOVIL" : data.payMethod === "CASH_VES" ? "CASH_VES" : "CASH_USD";
    await sql`
      insert into trips (
        id, passenger_id, preferred_driver_id, status,
        pickup_lat, pickup_lng, pickup_ref, dest_lat, dest_lng, dest_ref,
        fare_usd, distance_m, pay_method, share_token
      ) values (
        ${id}, ${context.userId}, ${data.preferredDriverId}, 'open',
        ${pickup.lat}, ${pickup.lng}, ${ref}, ${dest.lat}, ${dest.lng}, ${data.destRef.trim() || "Destino"},
        ${fareFor(distanceM)}, ${distanceM}, ${pay}, ${share}
      )
    `;
    await cascadeOffers();
    return { id };
  });

export const acceptTrip = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { tripId: string }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const me = await sql<{ role: string; status: string }>`select role, status from profiles where user_id = ${context.userId}`;
    if (me[0]?.role !== "driver" || me[0]?.status !== "approved") throw new Error("Solo un mototaxista aprobado puede aceptar.");
    const now = Date.now();
    const taken = await sql<{ id: string }>`
      update trips set driver_id = ${context.userId}, status = 'accepted', updated_at = now()
      where id = ${data.tripId} and status = 'open'
        and offer_driver_id = ${context.userId}
        and offer_until_ms > ${now}
      returning id
    `;
    if (!taken[0]) throw new Error("Esa carrera ya la tomó otro mototaxista.");
    return { ok: true };
  });

export const setTripStatus = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { tripId: string; status: string; payRef?: string }) => input)
  .handler(async ({ context, data }) => {
    const allowed = ["arrived", "riding", "pay", "done", "cancelled"];
    if (!allowed.includes(data.status)) throw new Error("Estado inválido.");
    const sql = await getSql();
    const rows = await sql<{
      passenger_id: string;
      driver_id: string | null;
      status: string;
      fare_usd: number;
    }>`
      select passenger_id, driver_id, status, fare_usd from trips where id = ${data.tripId}
    `;
    const trip = rows[0];
    if (!trip) throw new Error("No existe esa carrera.");
    const mine = trip.passenger_id === context.userId || trip.driver_id === context.userId;
    if (!mine) throw new Error("No es tu carrera.");
    if (data.status === "cancelled") {
      if (trip.passenger_id !== context.userId) throw new Error("Solo el pasajero cancela.");
      if (!["open", "accepted"].includes(trip.status)) throw new Error("Ya no se puede cancelar.");
    }
    if (["arrived", "riding", "pay"].includes(data.status) && trip.driver_id !== context.userId) {
      throw new Error("Eso lo marca el mototaxista.");
    }
    if (data.status === "done" && trip.driver_id !== context.userId && trip.passenger_id !== context.userId) {
      throw new Error("No puedes cerrar esta carrera.");
    }
    const payRef = (data.payRef ?? "").replace(/\D/g, "").slice(0, 6);
    const commission =
      data.status === "done" ? Math.round(Number(trip.fare_usd) * COMMISSION * 100) / 100 : 0;
    if (data.status === "done" && trip.driver_id) {
      await sql`
        update profiles set saldo_usd = saldo_usd - ${commission} where user_id = ${trip.driver_id}
      `;
    }
    await sql`
      update trips set
        status = ${data.status},
        commission_usd = case when ${data.status} = 'done' then ${commission} else commission_usd end,
        pay_ref = case when ${payRef} = '' then pay_ref else ${payRef} end,
        pay_status = case
          when ${data.status} = 'done' then 'PAID'
          when ${payRef} <> '' then 'VERIFYING'
          else pay_status
        end,
        updated_at = now()
      where id = ${data.tripId}
    `;
    return { ok: true, commission };
  });

export interface ReviewItem {
  userId: string;
  role: Role;
  fullName: string;
  phone: string;
  cedula: string;
  plate: string;
  model: string;
  cedulaPhoto: string;
  selfie: string;
}

export const reviewList = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { key: string }) => input)
  .handler(async ({ data }): Promise<ReviewItem[]> => {
    assertReview(data.key);
    const sql = await getSql();
    const rows = await sql<ProfileRow>`
      select * from profiles where status = 'pending' order by created_at asc
    `;
    return rows.map((row) => ({
      userId: row.user_id,
      role: row.role === "driver" ? "driver" : "passenger",
      fullName: row.full_name,
      phone: row.phone,
      cedula: row.cedula,
      plate: row.plate ?? "",
      model: row.model ?? "",
      cedulaPhoto: row.cedula_photo ?? "",
      selfie: row.selfie ?? "",
    }));
  });

export const reviewDecide = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { key: string; userId: string; approve: boolean; elite: boolean; note: string }) => input)
  .handler(async ({ data }) => {
    assertReview(data.key);
    const sql = await getSql();
    if (data.approve) {
      await sql`
        update profiles set status = 'approved', elite = ${Boolean(data.elite)}, reject_note = ''
        where user_id = ${data.userId} and status = 'pending'
      `;
    } else {
      await sql`
        update profiles set status = 'rejected', elite = false, reject_note = ${data.note.trim().slice(0, 180)}
        where user_id = ${data.userId} and status = 'pending'
      `;
    }
    return { ok: true };
  });

export const declineTrip = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { tripId: string }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`
      update trips set offer_until_ms = 0
      where id = ${data.tripId} and status = 'open' and offer_driver_id = ${context.userId}
    `;
    await cascadeOffers();
    return { ok: true };
  });

export const raisePanic = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { tripId: string }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<{ id: string }>`
      update trips set panic_at = now()
      where id = ${data.tripId}
        and status in ('accepted', 'arrived', 'riding')
        and (passenger_id = ${context.userId} or driver_id = ${context.userId})
      returning id
    `;
    if (!rows[0]) throw new Error("No hay un viaje activo.");
    await notifyDeveloper(
      [
        "PÁNICO en un viaje de Rapidez Carora.",
        `Carrera: ${data.tripId}`,
        "Ábrelo en la bandeja del desarrollador. Emergencias: 171.",
      ].join("\n"),
      "Rapidez Carora — pánico",
    );
    return { ok: true };
  });

export const rateTrip = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { tripId: string; stars: number; note: string }) => input)
  .handler(async ({ context, data }) => {
    const stars = Math.max(1, Math.min(5, Math.round(data.stars)));
    const note = data.note.trim().slice(0, 180);
    const sql = await getSql();
    const rows = await sql<{ passenger_id: string; driver_id: string | null; status: string }>`
      select passenger_id, driver_id, status from trips where id = ${data.tripId}
    `;
    const trip = rows[0];
    if (!trip || trip.status !== "done") throw new Error("La carrera todavía no termina.");
    const mine = trip.passenger_id === context.userId || trip.driver_id === context.userId;
    if (!mine || !trip.driver_id) throw new Error("No puedes calificar esta carrera.");
    const other = trip.passenger_id === context.userId ? trip.driver_id : trip.passenger_id;
    const inserted = await sql<{ trip_id: string }>`
      insert into ratings (trip_id, from_user, to_user, stars, note)
      values (${data.tripId}, ${context.userId}, ${other}, ${stars}, ${note})
      on conflict (trip_id, from_user) do nothing
      returning trip_id
    `;
    if (inserted[0]) {
      await sql`
        update profiles set rating_sum = rating_sum + ${stars}, rating_count = rating_count + 1
        where user_id = ${other}
      `;
    }
    return { ok: true };
  });

export interface HistoryItem {
  id: string;
  dest: string;
  fareUsd: number;
  commissionUsd: number;
  distanceM: number;
  when: string;
}

export const tripHistory = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(() => ({}))
  .handler(async ({ context }): Promise<HistoryItem[]> => {
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      dest_ref: string | null;
      fare_usd: number;
      commission_usd: number | null;
      distance_m: number;
      updated_at: string | Date;
    }>`
      select id, dest_ref, fare_usd, commission_usd, distance_m, updated_at
      from trips
      where status = 'done' and (passenger_id = ${context.userId} or driver_id = ${context.userId})
      order by updated_at desc
      limit 12
    `;
    return rows.map((row) => ({
      id: row.id,
      dest: row.dest_ref || "Carora",
      fareUsd: Number(row.fare_usd),
      commissionUsd: Number(row.commission_usd ?? 0),
      distanceM: Number(row.distance_m),
      when: new Date(row.updated_at).toLocaleString("es-VE", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "short",
      }),
    }));
  });

export interface PanicItem {
  id: string;
  who: string;
  phone: string;
  pickup: string;
  dest: string;
}

export interface WeekItem {
  name: string;
  cedula: string;
  saldo: number;
  commission: number;
}

export const opsBoard = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { key: string }) => input)
  .handler(async ({ data }): Promise<{ panics: PanicItem[]; week: WeekItem[] }> => {
    assertReview(data.key);
    const sql = await getSql();
    const panics = await sql<{ id: string; full_name: string; phone: string; pickup_ref: string; dest_ref: string | null }>`
      select t.id, p.full_name, p.phone, t.pickup_ref, t.dest_ref
      from trips t
      join profiles p on p.user_id = t.passenger_id
      where t.panic_at is not null and t.status in ('accepted', 'arrived', 'riding')
      order by t.panic_at desc
      limit 8
    `;
    const week = await sql<{ full_name: string; cedula: string; saldo_usd: number; week_usd: number }>`
      select p.full_name, p.cedula, p.saldo_usd,
        (select coalesce(sum(t.commission_usd), 0) from trips t
          where t.driver_id = p.user_id and t.status = 'done'
            and t.updated_at > now() - interval '7 days') as week_usd
      from profiles p
      where p.role = 'driver' and p.status = 'approved'
      order by p.full_name
    `;
    return {
      panics: panics.map((row) => ({
        id: row.id,
        who: row.full_name,
        phone: row.phone,
        pickup: row.pickup_ref,
        dest: row.dest_ref ?? "",
      })),
      week: week.map((row) => ({
        name: row.full_name,
        cedula: row.cedula,
        saldo: Number(row.saldo_usd),
        commission: Number(row.week_usd),
      })),
    };
  });

export const topUp = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { key: string; cedula: string }) => input)
  .handler(async ({ data }) => {
    assertReview(data.key);
    const cedula = data.cedula.trim().toUpperCase();
    const sql = await getSql();
    const rows = await sql<{ user_id: string }>`
      update profiles set saldo_usd = saldo_usd + 5
      where replace(upper(cedula), ' ', '') = replace(${cedula}, ' ', '')
        and role = 'driver' and status = 'approved'
      returning user_id
    `;
    if (!rows[0]) throw new Error("No hay un mototaxista aprobado con esa cédula.");
    return { ok: true };
  });

export interface SharedView {
  status: string;
  dest: string;
  pickup: string;
  driverName: string;
  lat: number | null;
  lng: number | null;
}

export const sharedTrip = createServerFn({ method: "GET" })
  .validator((token: string) => token.trim())
  .handler(async ({ data }): Promise<SharedView | null> => {
    if (data.length < 8) return null;
    const sql = await getSql();
    const rows = await sql<TripRow>`select * from trips where share_token = ${data} limit 1`;
    const trip = rows[0];
    if (!trip) return null;
    const view = await tripView(trip);
    return {
      status: view.status,
      dest: view.destRef,
      pickup: view.pickupRef,
      driverName: view.driverName.split(" ")[0] ?? "",
      lat: view.driverLat,
      lng: view.driverLng,
    };
  });
