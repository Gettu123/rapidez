import { i as TSS_SERVER_FUNCTION, r as createServerFn } from "./ssr.mjs";
import { o as getSql, r as ConnectorType } from "./db-DQz_WXj7.mjs";
import { a as fareFor, l as haversine, n as authMiddleware, t as SEARCH_RADIUS_M } from "./geo-BWat2l_n.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/live-api-BBGh3cnv.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var REVIEW_KEY = "Carora2026";
var DEVELOPER_EMAIL = "beisander2@gmail.com";
var FRESH_MS = 2e4;
function profileOf(row) {
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
		hasSelfie: Boolean(row.selfie)
	};
}
function assertReview(key) {
	if (key !== REVIEW_KEY) throw new Error("Clave de revisión incorrecta.");
}
function photoOk(value, required) {
	if (!value) {
		if (required) throw new Error("Falta la foto.");
		return null;
	}
	if (!value.startsWith("data:image/")) throw new Error("La foto no es válida.");
	if (value.length > 18e4) throw new Error("La foto es demasiado pesada. Acércala y vuelve a tomarla.");
	return value;
}
async function notifyDeveloper(body) {
	try {
		const { callTool } = await import("./client.server-DZ4DCnR2.mjs");
		return (await callTool("gmail_send_message", {
			to: [DEVELOPER_EMAIL],
			subject: "Rapidez Carora — verificación de identidad",
			body
		}, { connectorType: ConnectorType.Gmail })).ok;
	} catch {
		return false;
	}
}
var submitProfile_createServerFn_handler = createServerRpc({
	id: "795d2dfd88be129cbc21363762908a6d2522ce6e140aeea7d395dad416a09288",
	name: "submitProfile",
	filename: "src/lib/rapidez/live-api.ts"
}, (opts) => submitProfile.__executeServer(opts));
var submitProfile = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(submitProfile_createServerFn_handler, async ({ context, data }) => {
	const role = data.role === "driver" ? "driver" : "passenger";
	const fullName = data.fullName.trim();
	const phone = data.phone.replace(/\D/g, "");
	const cedula = data.cedula.trim().toUpperCase();
	if (fullName.length < 3) throw new Error("Escribe tu nombre completo.");
	if (phone.length < 10) throw new Error("El teléfono no es válido.");
	if (!/^V-?\d{5,9}$/.test(cedula) && !/^\d{5,9}$/.test(cedula)) throw new Error("La cédula debe verse como V-12345678.");
	const cedulaPhoto = photoOk(data.cedulaPhoto, role === "driver");
	const selfie = photoOk(data.selfie, role === "driver");
	if (role === "driver" && data.plate.trim().length < 4) throw new Error("Falta la placa.");
	const sql = await getSql();
	if ((await sql`select status from profiles where user_id = ${context.userId}`)[0]?.status === "approved") throw new Error("Esta cuenta ya está aprobada.");
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
	return {
		ok: true,
		emailed: await notifyDeveloper([
			"Hay una verificación nueva en Rapidez Carora.",
			`Rol: ${role === "driver" ? "mototaxista" : "pasajero"}`,
			`Nombre: ${fullName}`,
			`Teléfono: ${phone}`,
			`Cédula: ${cedula}`,
			role === "driver" ? `Placa: ${data.plate.trim().toUpperCase()}` : "",
			"La cédula y la selfie están en la bandeja del desarrollador, dentro de la app.",
			"Aprueba o rechaza ahí. La clave de revisión es Carora2026."
		].filter(Boolean).join("\n"))
	};
});
var syncLive_createServerFn_handler = createServerRpc({
	id: "9f92a4d03eaad67fcfe0608bdf4fd72c9e035b9e1a5eedde5ef6b631a0e18b06",
	name: "syncLive",
	filename: "src/lib/rapidez/live-api.ts"
}, (opts) => syncLive.__executeServer(opts));
var syncLive = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(syncLive_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	const row = (await sql`select * from profiles where user_id = ${context.userId}`)[0];
	if (!row) return {
		profile: null,
		locked: false,
		drivers: [],
		trip: null,
		offer: null
	};
	const profile = profileOf(row);
	if (profile.status !== "approved") return {
		profile,
		locked: false,
		drivers: [],
		trip: null,
		offer: null
	};
	const deviceId = data.deviceId.trim();
	if (deviceId.length < 8) throw new Error("Este teléfono no está identificado.");
	const bound = await sql`select device_id from devices where user_id = ${context.userId}`;
	if (!bound[0]) await sql`insert into devices (user_id, device_id) values (${context.userId}, ${deviceId})`;
	else if (bound[0].device_id !== deviceId) return {
		profile,
		locked: true,
		drivers: [],
		trip: null,
		offer: null
	};
	else await sql`update devices set updated_at = now() where user_id = ${context.userId}`;
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
	} else if (profile.role === "driver" && !data.online) await sql`update positions set online = false, updated_at = now() where user_id = ${context.userId}`;
	const here = lat != null && lng != null ? {
		lat,
		lng
	} : null;
	const drivers = await nearby(here);
	const trip = await activeTrip(context.userId);
	let offer = null;
	if (profile.role === "driver" && data.online && here) offer = await openOffer(context.userId, here);
	return {
		profile,
		locked: false,
		drivers,
		trip,
		offer
	};
});
async function nearby(origin) {
	const rows = await (await getSql())`
    select p.user_id, p.full_name, p.plate, p.model, p.elite, pos.lat, pos.lng, pos.updated_at
    from positions pos
    join profiles p on p.user_id = pos.user_id
    where p.role = 'driver' and p.status = 'approved' and pos.online = true
  `;
	const now = Date.now();
	return rows.filter((row) => now - new Date(row.updated_at).getTime() < FRESH_MS).map((row) => {
		const point = {
			lat: Number(row.lat),
			lng: Number(row.lng)
		};
		return {
			id: row.user_id,
			name: row.full_name,
			lat: point.lat,
			lng: point.lng,
			plate: row.plate ?? "",
			model: row.model ?? "",
			elite: Boolean(row.elite),
			meters: origin ? Math.round(haversine(origin, point)) : 0
		};
	}).filter((row) => !origin || row.meters <= 3200).sort((a, b) => a.meters - b.meters);
}
async function tripView(row) {
	const people = await (await getSql())`
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
		passengerName: passenger?.full_name ?? ""
	};
}
async function activeTrip(userId) {
	const rows = await (await getSql())`
    select * from trips
    where status not in ('done', 'cancelled')
      and (passenger_id = ${userId} or driver_id = ${userId})
    order by created_at desc
    limit 1
  `;
	return rows[0] ? tripView(rows[0]) : null;
}
async function openOffer(driverId, here) {
	const visible = (await (await getSql())`
    select * from trips where status = 'open' order by created_at asc limit 20
  `).filter((row) => {
		return haversine(here, {
			lat: Number(row.pickup_lat),
			lng: Number(row.pickup_lng)
		}) <= SEARCH_RADIUS_M;
	});
	visible.sort((a, b) => {
		return (a.preferred_driver_id === driverId ? 0 : 1) - (b.preferred_driver_id === driverId ? 0 : 1);
	});
	return visible[0] ? tripView(visible[0]) : null;
}
var requestTrip_createServerFn_handler = createServerRpc({
	id: "e51757db75e422e949ee0e31bd83b1b3ffb42649453b2087e31c0f5cf885387c",
	name: "requestTrip",
	filename: "src/lib/rapidez/live-api.ts"
}, (opts) => requestTrip.__executeServer(opts));
var requestTrip = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(requestTrip_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	const me = await sql`select role, status from profiles where user_id = ${context.userId}`;
	if (me[0]?.role !== "passenger" || me[0]?.status !== "approved") throw new Error("Tu cuenta aún no puede pedir.");
	if ((await sql`
      select id from trips where passenger_id = ${context.userId} and status not in ('done', 'cancelled') limit 1
    `)[0]) throw new Error("Ya tienes una carrera abierta.");
	const pickup = {
		lat: data.pickupLat,
		lng: data.pickupLng
	};
	const dest = {
		lat: data.destLat,
		lng: data.destLng
	};
	const distanceM = Math.round(haversine(pickup, dest));
	if (distanceM < 120) throw new Error("El destino está demasiado cerca.");
	const ref = data.pickupRef.trim();
	if (ref.length < 4) throw new Error("La referencia es obligatoria.");
	const id = `t_${crypto.randomUUID()}`;
	const pay = [
		"CASH_USD",
		"CASH_VES",
		"PAGO_MOVIL"
	].includes(data.payMethod) ? data.payMethod : "CASH_USD";
	await sql`
      insert into trips (
        id, passenger_id, preferred_driver_id, status,
        pickup_lat, pickup_lng, pickup_ref, dest_lat, dest_lng, dest_ref,
        fare_usd, distance_m, pay_method
      ) values (
        ${id}, ${context.userId}, ${data.preferredDriverId}, 'open',
        ${pickup.lat}, ${pickup.lng}, ${ref}, ${dest.lat}, ${dest.lng}, ${data.destRef.trim()},
        ${fareFor(distanceM)}, ${distanceM}, ${pay}
      )
    `;
	return { id };
});
var acceptTrip_createServerFn_handler = createServerRpc({
	id: "84038b8fe5e09ebe23acf7a4f3d08c8a6edc71bede65677cd31190bbf5b0965d",
	name: "acceptTrip",
	filename: "src/lib/rapidez/live-api.ts"
}, (opts) => acceptTrip.__executeServer(opts));
var acceptTrip = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(acceptTrip_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	const me = await sql`select role, status from profiles where user_id = ${context.userId}`;
	if (me[0]?.role !== "driver" || me[0]?.status !== "approved") throw new Error("Solo un mototaxista aprobado puede aceptar.");
	if (!(await sql`
      update trips set driver_id = ${context.userId}, status = 'accepted', updated_at = now()
      where id = ${data.tripId} and status = 'open'
      returning id
    `)[0]) throw new Error("Esa carrera ya la tomó otro mototaxista.");
	return { ok: true };
});
var setTripStatus_createServerFn_handler = createServerRpc({
	id: "9e06b043a53f2f14fff17ba04319d6e689c366aa06bbaab435b300b61c7dcd74",
	name: "setTripStatus",
	filename: "src/lib/rapidez/live-api.ts"
}, (opts) => setTripStatus.__executeServer(opts));
var setTripStatus = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(setTripStatus_createServerFn_handler, async ({ context, data }) => {
	if (![
		"arrived",
		"riding",
		"pay",
		"done",
		"cancelled"
	].includes(data.status)) throw new Error("Estado inválido.");
	const sql = await getSql();
	const trip = (await sql`
      select passenger_id, driver_id, status from trips where id = ${data.tripId}
    `)[0];
	if (!trip) throw new Error("No existe esa carrera.");
	if (!(trip.passenger_id === context.userId || trip.driver_id === context.userId)) throw new Error("No es tu carrera.");
	if (data.status === "cancelled") {
		if (trip.passenger_id !== context.userId) throw new Error("Solo el pasajero cancela.");
		if (!["open", "accepted"].includes(trip.status)) throw new Error("Ya no se puede cancelar.");
	}
	if ([
		"arrived",
		"riding",
		"pay"
	].includes(data.status) && trip.driver_id !== context.userId) throw new Error("Eso lo marca el mototaxista.");
	if (data.status === "done" && trip.driver_id !== context.userId && trip.passenger_id !== context.userId) throw new Error("No puedes cerrar esta carrera.");
	const payRef = (data.payRef ?? "").replace(/\D/g, "").slice(0, 6);
	await sql`
      update trips set
        status = ${data.status},
        pay_ref = case when ${payRef} = '' then pay_ref else ${payRef} end,
        pay_status = case
          when ${data.status} = 'done' then 'PAID'
          when ${payRef} <> '' then 'VERIFYING'
          else pay_status
        end,
        updated_at = now()
      where id = ${data.tripId}
    `;
	return { ok: true };
});
var reviewList_createServerFn_handler = createServerRpc({
	id: "cbb75616bdaa9a4a21b5c2958c01c9affc0541a677013764d70e2e07355b88df",
	name: "reviewList",
	filename: "src/lib/rapidez/live-api.ts"
}, (opts) => reviewList.__executeServer(opts));
var reviewList = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(reviewList_createServerFn_handler, async ({ data }) => {
	assertReview(data.key);
	return (await (await getSql())`
      select * from profiles where status = 'pending' order by created_at asc
    `).map((row) => ({
		userId: row.user_id,
		role: row.role === "driver" ? "driver" : "passenger",
		fullName: row.full_name,
		phone: row.phone,
		cedula: row.cedula,
		plate: row.plate ?? "",
		model: row.model ?? "",
		cedulaPhoto: row.cedula_photo ?? "",
		selfie: row.selfie ?? ""
	}));
});
var reviewDecide_createServerFn_handler = createServerRpc({
	id: "327c2b15651ac192c904a6fb119d7db2bb7a4027b2de920e10320782fa8d6df1",
	name: "reviewDecide",
	filename: "src/lib/rapidez/live-api.ts"
}, (opts) => reviewDecide.__executeServer(opts));
var reviewDecide = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(reviewDecide_createServerFn_handler, async ({ data }) => {
	assertReview(data.key);
	const sql = await getSql();
	if (data.approve) await sql`
        update profiles set status = 'approved', elite = ${Boolean(data.elite)}, reject_note = ''
        where user_id = ${data.userId} and status = 'pending'
      `;
	else await sql`
        update profiles set status = 'rejected', elite = false, reject_note = ${data.note.trim().slice(0, 180)}
        where user_id = ${data.userId} and status = 'pending'
      `;
	return { ok: true };
});
//#endregion
export { acceptTrip_createServerFn_handler, requestTrip_createServerFn_handler, reviewDecide_createServerFn_handler, reviewList_createServerFn_handler, setTripStatus_createServerFn_handler, submitProfile_createServerFn_handler, syncLive_createServerFn_handler };
