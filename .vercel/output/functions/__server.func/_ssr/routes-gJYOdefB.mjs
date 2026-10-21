import { o as __toESM } from "../_runtime.mjs";
import { J as require_react, x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as getServerFnById, i as TSS_SERVER_FUNCTION, r as createServerFn } from "./ssr.mjs";
import { i as signOut, t as authClient } from "./client-1vAx-gM_.mjs";
import { a as fareFor, c as formatVes, i as buildRoute, l as haversine, n as authMiddleware, o as formatKm, r as bearing, s as formatUsd, u as vesOf } from "./geo-BWat2l_n.mjs";
import { a as hasGateSessionMarker } from "./server-DxaAbL3o.mjs";
import { t as AuthPanel } from "./AuthPanel-CSfpLJhi.mjs";
import { i as MapPin, n as Plus, r as Minus } from "../_libs/lucide-react.mjs";
import { t as create } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-gJYOdefB.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
/**
* Current user + loading state. Same behavior in live preview and when deployed:
*   - Auth enabled -> the real signed-in user; `user` is `null` while
*                            the session resolves (`isPending: true`) and when
*                            signed out (`isPending: false`). Session comes from
*                            Better Auth `useSession()` → `/api/auth/get-session`
*                            (cookie when deployed; bearer in live preview).
*   - Auth disabled (`VITE_AUTH_ENABLED=false`) -> `DEV_USER`, never pending.
*
* Protect a route by waiting out `isPending` before acting on `user` —
* redirecting on `user: null` alone bounces signed-in visitors to sign-in on
* every hard reload:
*
*   import { RedirectToSignIn } from "@/lib/auth/gates";
*   const { user, isPending } = useCurrentUserState();
*   if (isPending) return null;              // still resolving — don't redirect yet
*   if (!user) return <RedirectToSignIn />;  // definitely signed out
*
* `authEnabled` is a module-level constant fixed at load, so the guarded hook
* call keeps a stable hook order across every render of a given component.
*/
function useCurrentUserState() {
	const { data, isPending } = authClient.useSession();
	const user = data?.user;
	return {
		user: user ? {
			id: user.id,
			displayName: user.name ?? null,
			primaryEmail: user.email ?? null,
			profileImageUrl: user.image ?? null,
			isDevFallback: false
		} : null,
		isPending
	};
}
/**
* Convenience view of `useCurrentUserState().user` for display (e.g.
* `user?.displayName ?? "Guest"`). NOTE: `null` means *loading OR signed out* —
* for redirects/guards use `useCurrentUserState()` and check `isPending`.
*/
function useCurrentUser() {
	return useCurrentUserState().user;
}
var subscribeToNothing = () => () => {};
var noGateSessionOnServer = () => false;
/**
* Minimal signed-in identity chip + sign-out. Restyle freely (see the
* `design-ui` skill). Sign-out is only shown when auth is enabled (the
* disabled-auth dev user has nothing to sign out of) and the session is not
* gate-materialized — behind the gate the next request signs the viewer
* straight back in, so a sign-out control there is a broken loop.
*/
function UserButton() {
	const user = useCurrentUser();
	const [signingOut, setSigningOut] = (0, import_react.useState)(false);
	const gateSession = (0, import_react.useSyncExternalStore)(subscribeToNothing, hasGateSessionMarker, noGateSessionOnServer);
	if (!user) return null;
	const label = user.displayName ?? user.primaryEmail ?? "Account";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-2",
		children: [
			user.profileImageUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: user.profileImageUrl,
				alt: "",
				className: "h-8 w-8 rounded-full object-cover"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "grid h-8 w-8 place-items-center rounded-full bg-black/10 text-sm font-medium dark:bg-white/20",
				children: label.charAt(0).toUpperCase()
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-sm font-medium",
				children: label
			}),
			!gateSession && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				disabled: signingOut,
				onClick: () => {
					setSigningOut(true);
					signOut().catch(() => setSigningOut(false));
				},
				className: "cursor-pointer text-sm underline-offset-4 opacity-70 hover:underline disabled:cursor-wait disabled:no-underline",
				children: signingOut ? "Signing out…" : "Sign out"
			})
		]
	});
}
var BANKS = [
	{
		code: "0102",
		name: "Banco de Venezuela"
	},
	{
		code: "0108",
		name: "Banco Provincial"
	},
	{
		code: "0105",
		name: "Banco Mercantil"
	},
	{
		code: "0134",
		name: "Banesco"
	},
	{
		code: "0114",
		name: "Banco del Tesoro"
	}
];
var PLACES = [
	{
		id: "catedral",
		name: "Catedral San Juan Bautista",
		hint: "frente a la plaza",
		lat: 10.18073,
		lng: -70.08813
	},
	{
		id: "plaza",
		name: "Plaza Bolívar",
		hint: "lado de la catedral",
		lat: 10.1804,
		lng: -70.08755
	},
	{
		id: "centro",
		name: "Centro histórico",
		hint: "casco de Carora",
		lat: 10.1789,
		lng: -70.0854
	},
	{
		id: "hospital",
		name: "Hospital de Carora",
		hint: "frente a emergencias",
		lat: 10.1766,
		lng: -70.0832
	},
	{
		id: "miranda",
		name: "Av. Francisco de Miranda",
		hint: "sobre la avenida",
		lat: 10.1736,
		lng: -70.0796
	},
	{
		id: "terminal",
		name: "Terminal de Pasajeros",
		hint: "entrada principal",
		lat: 10.1702,
		lng: -70.0746
	},
	{
		id: "industrial",
		name: "Zona Industrial",
		hint: "portón de la zona",
		lat: 10.1654,
		lng: -70.0678
	}
];
var HOME = {
	lat: PLACES[1].lat,
	lng: PLACES[1].lng
};
var NPCS = [
	{
		id: "jose",
		name: "José Rivas",
		plate: "AB12CD",
		model: "Bera X1000",
		rating: 4.92,
		bank: "0102",
		bankName: "Banco de Venezuela",
		phone: "04145551020",
		cedula: "V-18422109",
		pos: {
			lat: 10.1782,
			lng: -70.0848
		},
		registered: true,
		elite: false
	},
	{
		id: "maria",
		name: "María Torres",
		plate: "KT09LM",
		model: "Keeway Arsen",
		rating: 4.86,
		bank: "0134",
		bankName: "Banesco",
		phone: "04245559876",
		cedula: "V-20114555",
		pos: {
			lat: 10.1714,
			lng: -70.0768
		},
		registered: true,
		elite: false
	},
	{
		id: "luis",
		name: "Luis Peña",
		plate: "CR44PQ",
		model: "Bera Socialista",
		rating: 4.78,
		bank: "0105",
		bankName: "Banco Mercantil",
		phone: "04165551200",
		cedula: "V-15900321",
		pos: {
			lat: 10.1691,
			lng: -70.0894
		},
		registered: true,
		elite: false
	},
	{
		id: "rosa",
		name: "Rosa Méndez",
		plate: "MC18RS",
		model: "Empire Keeway",
		rating: 4.9,
		bank: "0108",
		bankName: "Banco Provincial",
		phone: "04245550111",
		cedula: "V-16881200",
		pos: {
			lat: 10.1769,
			lng: -70.0811
		},
		registered: true,
		elite: false
	},
	{
		id: "pedro",
		name: "Pedro Alvarado",
		plate: "TR07PD",
		model: "Bera BRZ",
		rating: 4.81,
		bank: "0114",
		bankName: "Banco del Tesoro",
		phone: "04165550990",
		cedula: "V-14220018",
		pos: {
			lat: 10.1708,
			lng: -70.0759
		},
		registered: true,
		elite: false
	},
	{
		id: "ana",
		name: "Ana Gil",
		plate: "GL33AN",
		model: "Bera SBR",
		rating: 4.95,
		bank: "0134",
		bankName: "Banesco",
		phone: "04125557890",
		cedula: "V-22334001",
		pos: {
			lat: 10.1742,
			lng: -70.0866
		},
		registered: true,
		elite: false
	},
	{
		id: "hector",
		name: "Héctor Suárez",
		plate: "HS02CR",
		model: "Keeway Arsen",
		rating: 4.74,
		bank: "0102",
		bankName: "Banco de Venezuela",
		phone: "04265554421",
		cedula: "V-13009876",
		pos: {
			lat: 10.1816,
			lng: -70.0902
		},
		registered: true,
		elite: false
	}
];
var YOU_BASE = {
	id: "you",
	name: "Carlos Mendoza",
	plate: "RP21EZ",
	model: "Bera SBR",
	rating: 4.97,
	bank: "0102",
	bankName: "Banco de Venezuela",
	phone: "04125551234",
	cedula: "V-18999888",
	pos: {
		lat: 10.1831,
		lng: -70.0824
	},
	registered: true,
	elite: true
};
function nearestPlace(point) {
	let place = PLACES[0];
	let meters = Infinity;
	for (const candidate of PLACES) {
		const d = haversine(point, candidate);
		if (d < meters) {
			place = candidate;
			meters = d;
		}
	}
	return {
		place,
		meters
	};
}
function placeLabel(point) {
	const { place, meters } = nearestPlace(point);
	if (meters < 180) return place.name;
	return `Cerca de ${place.name}`;
}
var ctx = null;
function beepOffer() {
	if (!ctx) return;
	const now = ctx.currentTime;
	[
		880,
		660,
		880
	].forEach((freq, i) => {
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = "square";
		osc.frequency.value = freq;
		gain.gain.setValueAtTime(1e-4, now);
		gain.gain.exponentialRampToValueAtTime(.045, now + i * .16 + .01);
		gain.gain.exponentialRampToValueAtTime(1e-4, now + i * .16 + .14);
		osc.connect(gain);
		gain.connect(ctx.destination);
		osc.start(now + i * .16);
		osc.stop(now + i * .16 + .16);
	});
}
var tripDefaults = {
	phase: "pickup",
	pickup: null,
	dest: null,
	destRef: "",
	destLabel: "",
	method: "PAGO_MOVIL",
	fareUsd: 0,
	distanceM: 0,
	assigned: null,
	driverPos: null,
	route: [],
	routeIndex: 0,
	proximity: false,
	payStatus: "PENDING",
	payRef: "",
	searchStartedAt: 0,
	offerOpen: false,
	offerDeadline: null,
	verifyAt: null,
	arrivedAt: null,
	rating: 0,
	formError: ""
};
function youProfile(payout) {
	return {
		...YOU_BASE,
		bank: payout.bank,
		bankName: payout.bankName,
		phone: payout.phone,
		cedula: payout.cedula
	};
}
var useRapidez = create((set, get) => ({
	role: "passenger",
	online: false,
	actingId: "you",
	offerCooldown: 0,
	useLive: false,
	fleet: [],
	center: HOME,
	pickupRef: "",
	pickupLabel: "",
	payout: {
		bank: YOU_BASE.bank,
		bankName: YOU_BASE.bankName,
		phone: YOU_BASE.phone,
		cedula: YOU_BASE.cedula
	},
	mapSeq: 0,
	mapCmd: null,
	ping: 0,
	...tripDefaults,
	setRole: (role) => set({ role }),
	setOnline: (online) => set({ online }),
	setCenter: (center) => set({
		center,
		formError: ""
	}),
	setPickupRef: (pickupRef) => set({
		pickupRef,
		formError: ""
	}),
	setDestRef: (destRef) => set({ destRef }),
	setMethod: (method) => set({ method }),
	setPayout: (patch) => set((s) => {
		const payout = {
			...s.payout,
			...patch
		};
		if (patch.bank) {
			const bank = BANKS.find((b) => b.code === patch.bank);
			if (bank) payout.bankName = bank.name;
		}
		return { payout };
	}),
	setActing: (actingId) => set({
		actingId,
		formError: ""
	}),
	setRating: (rating) => set({ rating }),
	confirmPickup: () => {
		const s = get();
		const ref = s.pickupRef.trim();
		if (ref.length < 4) {
			set({ formError: "Escribe un punto de referencia de Carora." });
			return;
		}
		set({
			pickup: s.center,
			pickupLabel: ref,
			phase: "destination",
			formError: ""
		});
	},
	confirmDest: () => {
		const s = get();
		if (!s.pickup) return;
		const distanceM = haversine(s.pickup, s.center);
		if (distanceM < 120) {
			set({ formError: "El destino está demasiado cerca. Mueve el mapa." });
			return;
		}
		set({
			dest: s.center,
			destLabel: s.destRef.trim(),
			distanceM,
			fareUsd: fareFor(distanceM),
			phase: "confirm",
			formError: ""
		});
	},
	requestTrip: () => {
		set({
			phase: "searching",
			searchStartedAt: Date.now(),
			offerOpen: false,
			offerDeadline: null,
			offerCooldown: 0,
			assigned: null,
			proximity: false,
			payStatus: "PENDING",
			payRef: "",
			verifyAt: null,
			formError: ""
		});
	},
	openOffer: (deadline) => set({
		offerOpen: true,
		offerDeadline: deadline
	}),
	assignDriver: (driver, pickup) => {
		const route = buildRoute(driver.pos, pickup);
		set((s) => ({
			assigned: driver,
			driverPos: driver.pos,
			route,
			routeIndex: 0,
			phase: "enroute",
			offerOpen: false,
			offerDeadline: null,
			proximity: false,
			ping: s.ping + 1,
			arrivedAt: null
		}));
	},
	acceptOffer: () => {
		const s = get();
		if (!s.pickup || !s.online) return;
		const driver = actingDriver(s.actingId, s.payout);
		if (!driver.registered) return;
		get().assignDriver(driver, s.pickup);
	},
	rejectOffer: () => {
		set({
			offerOpen: false,
			offerDeadline: null,
			offerCooldown: Date.now() + 8e3
		});
	},
	markArrived: () => set({
		phase: "arrived",
		proximity: true,
		arrivedAt: Date.now()
	}),
	startRide: () => {
		const s = get();
		if (!s.pickup || !s.dest) return;
		const from = s.driverPos ?? s.pickup;
		set((prev) => ({
			phase: "riding",
			route: buildRoute(from, s.dest),
			routeIndex: 0,
			proximity: false,
			ping: prev.ping + 1,
			arrivedAt: null
		}));
	},
	finishRide: () => set({ phase: "pay" }),
	advance: () => {
		const s = get();
		if (s.phase !== "enroute" && s.phase !== "riding" || s.route.length < 2) return;
		const next = Math.min(s.routeIndex + 1, s.route.length - 1);
		const pos = s.route[next];
		const target = s.phase === "enroute" ? s.pickup : s.dest;
		if (!target) return;
		const dist = haversine(pos, target);
		const done = next >= s.route.length - 1 || dist <= 48;
		if (s.phase === "enroute" && done) {
			set({
				routeIndex: next,
				driverPos: s.pickup,
				proximity: true,
				phase: "arrived",
				arrivedAt: Date.now(),
				ping: s.ping + 1
			});
			return;
		}
		if (s.phase === "riding" && done) {
			set({
				routeIndex: next,
				driverPos: s.dest,
				phase: "pay",
				ping: s.ping + 1
			});
			return;
		}
		set({
			routeIndex: next,
			driverPos: pos,
			proximity: s.phase === "enroute" && dist <= 100 ? true : s.proximity,
			ping: s.ping + 1
		});
	},
	autoStartIfWaiting: (now) => {
		const s = get();
		if (s.phase !== "arrived" || !s.arrivedAt) return;
		if (s.assigned?.id === "you") return;
		if (now - s.arrivedAt > 2800) get().startRide();
	},
	submitPayRef: (ref) => {
		const clean = ref.replace(/\D/g, "").slice(0, 6);
		if (clean.length < 4) return;
		set({
			payRef: clean,
			payStatus: "VERIFYING",
			verifyAt: null
		});
	},
	confirmCash: (by) => {
		const s = get();
		if (s.method === "PAGO_MOVIL") return;
		if (by === "driver" || s.assigned?.id !== "you") {
			set({
				payStatus: "PAID",
				phase: "done",
				verifyAt: null
			});
			return;
		}
		set({
			payStatus: "VERIFYING",
			verifyAt: null
		});
	},
	validatePay: () => set({
		payStatus: "PAID",
		phase: "done",
		verifyAt: null
	}),
	autoValidateIfWaiting: (now) => {
		const s = get();
		if (s.phase !== "pay" || s.payStatus !== "VERIFYING") return;
		if (s.assigned?.id === "you") return;
		if (!s.verifyAt) {
			set({ verifyAt: now + 1800 });
			return;
		}
		if (now >= s.verifyAt) set({
			payStatus: "PAID",
			phase: "done",
			verifyAt: null
		});
	},
	back: () => set((s) => {
		if (s.phase === "destination") return {
			phase: "pickup",
			formError: ""
		};
		if (s.phase === "confirm") return {
			phase: "destination",
			formError: ""
		};
		return {};
	}),
	cancelTrip: () => set({
		...tripDefaults,
		ping: get().ping + 1
	}),
	resetTrip: () => set({
		...tripDefaults,
		pickupRef: "",
		ping: get().ping + 1
	}),
	focusPlace: (place) => set((s) => ({
		mapSeq: s.mapSeq + 1,
		mapCmd: {
			seq: s.mapSeq + 1,
			type: "fly",
			lat: place.lat,
			lng: place.lng
		}
	})),
	zoomBy: (dir) => set((s) => ({
		mapSeq: s.mapSeq + 1,
		mapCmd: {
			seq: s.mapSeq + 1,
			type: dir > 0 ? "zoom-in" : "zoom-out"
		}
	}))
}));
function actingDriver(actingId, payout) {
	if (actingId === "you") return youProfile(payout);
	return NPCS.find((driver) => driver.id === actingId) ?? youProfile(payout);
}
function roster(payout) {
	return [youProfile(payout), ...NPCS];
}
function listNearby(origin) {
	const { payout } = useRapidez.getState();
	return roster(payout).map((driver) => ({
		...driver,
		meters: haversine(driver.pos, origin)
	})).filter((driver) => driver.registered && driver.meters <= 3200).sort((a, b) => a.meters - b.meters);
}
var MOTO_HTML = `<div class="moto-pin"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6.2" cy="16.5" r="2.4"/><circle cx="17.8" cy="16.5" r="2.4"/><path d="M6.2 16.5h2.2l1.8-4.6h4.6l1.7 2.8h1.3"/><path d="M10.2 11.9 8.4 8.2H6.4"/></svg></div>`;
function token(name, fallback) {
	if (typeof document === "undefined") return fallback;
	return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}
function MapCanvas() {
	const hostRef = (0, import_react.useRef)(null);
	const mapRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (!hostRef.current) return;
		let dead = false;
		let unsub = () => {};
		let resize = null;
		(async () => {
			const mod = await import("../_libs/leaflet.mjs").then((n) => /* @__PURE__ */ __toESM(n.t()));
			const L = typeof mod.map === "function" ? mod : mod.default ?? mod;
			if (dead || !hostRef.current || mapRef.current) return;
			const map = L.map(hostRef.current, {
				zoomControl: false,
				attributionControl: true,
				scrollWheelZoom: true
			});
			mapRef.current = map;
			L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
				maxZoom: 19,
				attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a>"
			}).addTo(map);
			const ink = token("--color-ink", "#1a1c14");
			const brand = token("--color-brand", "#e6a100");
			const signal = token("--color-signal", "#c4392c");
			const paper = token("--color-paper", "#f4efe4");
			const dots = L.layerGroup().addTo(map);
			let lineA = null;
			let lineB = null;
			let pickupMark = null;
			let destMark = null;
			let driver = null;
			let anim = 0;
			let lastCmd = 0;
			const icon = L.divIcon({
				className: "moto-icon",
				html: MOTO_HTML,
				iconSize: [44, 44],
				iconAnchor: [22, 22]
			});
			const pinLatLng = () => {
				const pin = document.querySelector(".center-pin");
				const rect = map.getContainer().getBoundingClientRect();
				if (!pin) {
					const c = map.getCenter();
					return {
						lat: c.lat,
						lng: c.lng
					};
				}
				const pr = pin.getBoundingClientRect();
				const ll = map.containerPointToLatLng([pr.left + pr.width / 2 - rect.left, pr.bottom - rect.top]);
				return {
					lat: ll.lat,
					lng: ll.lng
				};
			};
			const publishPin = () => {
				const { phase, setCenter } = useRapidez.getState();
				if (phase === "pickup" || phase === "destination") setCenter(pinLatLng());
			};
			const viewFor = (lat, lng, zoom) => {
				const pin = document.querySelector(".center-pin");
				const size = map.getSize();
				const target = map.project([lat, lng], zoom);
				if (!pin || !size.y) return L.latLng(lat, lng);
				const pr = pin.getBoundingClientRect();
				const mr = map.getContainer().getBoundingClientRect();
				const offset = pr.bottom - mr.top - size.y / 2;
				return map.unproject(target.subtract([0, offset]), zoom);
			};
			const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
			const moveDriver = (lat, lng, heading) => {
				if (!driver) driver = L.marker([lat, lng], {
					icon,
					interactive: false,
					zIndexOffset: 600
				}).addTo(map);
				const el = driver.getElement()?.querySelector(".moto-pin");
				if (el && heading != null) el.style.setProperty("--rot", `${heading - 90}deg`);
				if (reduced) {
					driver.setLatLng([lat, lng]);
					return;
				}
				const from = driver.getLatLng();
				const start = performance.now();
				cancelAnimationFrame(anim);
				const frame = (t) => {
					const k = Math.min(1, (t - start) / 320);
					driver?.setLatLng([from.lat + (lat - from.lat) * k, from.lng + (lng - from.lng) * k]);
					if (k < 1) anim = requestAnimationFrame(frame);
				};
				anim = requestAnimationFrame(frame);
				if (!map.getBounds().pad(-.15).contains([lat, lng])) map.panTo([lat, lng], {
					animate: true,
					duration: .4
				});
			};
			const drawRoute = (pts) => {
				const latlngs = pts.map((p) => [p.lat, p.lng]);
				if (!latlngs.length) {
					lineA?.remove();
					lineB?.remove();
					lineA = null;
					lineB = null;
					return;
				}
				if (!lineA || !lineB) {
					lineA = L.polyline(latlngs, {
						color: ink,
						weight: 7,
						opacity: .88
					}).addTo(map);
					lineB = L.polyline(latlngs, {
						color: brand,
						weight: 3,
						opacity: 1
					}).addTo(map);
				} else {
					lineA.setLatLngs(latlngs);
					lineB.setLatLngs(latlngs);
				}
			};
			const sync = () => {
				const s = useRapidez.getState();
				const selecting = s.phase === "pickup" || s.phase === "destination";
				const showFleet = selecting || s.phase === "confirm" || s.phase === "searching";
				dots.clearLayers();
				if (showFleet) {
					const origin = s.pickup ?? s.center;
					const marks = s.useLive ? s.fleet.map((d) => ({
						id: d.id,
						name: d.name,
						elite: d.elite,
						pos: {
							lat: d.lat,
							lng: d.lng
						}
					})) : listNearby(origin);
					for (const d of marks) {
						if (s.assigned && d.id === s.assigned.id) continue;
						L.circleMarker([d.pos.lat, d.pos.lng], {
							radius: d.elite ? 8 : 6,
							color: ink,
							weight: 2,
							fillColor: d.elite ? brand : paper,
							fillOpacity: 1
						}).addTo(dots).bindTooltip(`${d.name} · Catastrado${d.elite ? " · Élite" : ""}`, { direction: "top" });
					}
				}
				if (s.pickup && !selecting && s.pickup) {
					if (!pickupMark) pickupMark = L.circleMarker([s.pickup.lat, s.pickup.lng], {
						radius: 7,
						color: paper,
						weight: 2,
						fillColor: signal,
						fillOpacity: 1
					}).addTo(map);
					else pickupMark.setLatLng([s.pickup.lat, s.pickup.lng]);
				} else if (s.phase === "destination" && s.pickup) {
					if (!pickupMark) pickupMark = L.circleMarker([s.pickup.lat, s.pickup.lng], {
						radius: 7,
						color: paper,
						weight: 2,
						fillColor: signal,
						fillOpacity: 1
					}).addTo(map);
					else pickupMark.setLatLng([s.pickup.lat, s.pickup.lng]);
				} else {
					pickupMark?.remove();
					pickupMark = null;
				}
				if (s.dest && (s.phase === "confirm" || s.phase === "riding" || s.phase === "pay" || s.phase === "done" || s.phase === "enroute" || s.phase === "arrived" || s.phase === "searching")) {
					if (!destMark) destMark = L.circleMarker([s.dest.lat, s.dest.lng], {
						radius: 7,
						color: brand,
						weight: 2,
						fillColor: ink,
						fillOpacity: 1
					}).addTo(map);
					else destMark.setLatLng([s.dest.lat, s.dest.lng]);
				} else {
					destMark?.remove();
					destMark = null;
				}
				if (s.driverPos && (s.phase === "enroute" || s.phase === "arrived" || s.phase === "riding" || s.phase === "pay")) {
					const prev = s.route[Math.max(0, s.routeIndex - 1)];
					const heading = prev ? bearing(prev, s.driverPos) : null;
					moveDriver(s.driverPos.lat, s.driverPos.lng, heading);
				} else if (driver) {
					driver.remove();
					driver = null;
				}
				if (s.phase === "enroute" || s.phase === "riding") drawRoute(s.route);
				else drawRoute([]);
				if (s.mapCmd && s.mapCmd.seq !== lastCmd) {
					lastCmd = s.mapCmd.seq;
					if (s.mapCmd.type === "fly" && s.mapCmd.lat != null && s.mapCmd.lng != null) {
						const zoom = 16;
						const center = viewFor(s.mapCmd.lat, s.mapCmd.lng, zoom);
						map.flyTo(center, zoom, { duration: reduced ? 0 : .65 });
					} else if (s.mapCmd.type === "zoom-in" || s.mapCmd.type === "zoom-out") {
						const pin = document.querySelector(".center-pin");
						const mr = map.getContainer().getBoundingClientRect();
						const next = map.getZoom() + (s.mapCmd.type === "zoom-in" ? 1 : -1);
						if (pin) {
							const pr = pin.getBoundingClientRect();
							map.setZoomAround([pr.left + pr.width / 2 - mr.left, pr.bottom - mr.top], next);
						} else map.setZoom(next);
					}
				}
			};
			map.on("moveend", publishPin);
			map.invalidateSize();
			map.setView([HOME.lat, HOME.lng], 16);
			const shifted = viewFor(HOME.lat, HOME.lng, 16);
			map.setView(shifted, 16, { animate: false });
			publishPin();
			sync();
			unsub = useRapidez.subscribe(() => sync());
			const sheet = document.querySelector("[data-sheet]");
			if (sheet) {
				resize = new ResizeObserver(() => {
					map.invalidateSize({ pan: false });
					publishPin();
				});
				resize.observe(sheet);
			}
		})();
		return () => {
			dead = true;
			unsub();
			resize?.disconnect();
			mapRef.current?.remove();
			mapRef.current = null;
		};
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref: hostRef,
		className: "absolute inset-0 z-0"
	});
}
var submitProfile = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("795d2dfd88be129cbc21363762908a6d2522ce6e140aeea7d395dad416a09288"));
var syncLive = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("9f92a4d03eaad67fcfe0608bdf4fd72c9e035b9e1a5eedde5ef6b631a0e18b06"));
var requestTrip = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("e51757db75e422e949ee0e31bd83b1b3ffb42649453b2087e31c0f5cf885387c"));
var acceptTrip = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("84038b8fe5e09ebe23acf7a4f3d08c8a6edc71bede65677cd31190bbf5b0965d"));
var setTripStatus = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("9e06b043a53f2f14fff17ba04319d6e689c366aa06bbaab435b300b61c7dcd74"));
var reviewList = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("cbb75616bdaa9a4a21b5c2958c01c9affc0541a677013764d70e2e07355b88df"));
var reviewDecide = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => input).handler(createSsrRpc("327c2b15651ac192c904a6fb119d7db2bb7a4027b2de920e10320782fa8d6df1"));
function deviceId() {
	const key = "rapidez-device";
	let id = localStorage.getItem(key);
	if (!id) {
		id = crypto.randomUUID();
		localStorage.setItem(key, id);
	}
	return id;
}
function messageOf(err) {
	return err instanceof Error ? err.message : "No se pudo completar.";
}
async function shrink(file) {
	const bitmap = await createImageBitmap(file);
	const scale = Math.min(1, 640 / Math.max(bitmap.width, bitmap.height));
	const canvas = document.createElement("canvas");
	canvas.width = Math.max(1, Math.round(bitmap.width * scale));
	canvas.height = Math.max(1, Math.round(bitmap.height * scale));
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("No se pudo leer la foto.");
	ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
	return canvas.toDataURL("image/jpeg", .62);
}
function LiveApp() {
	const { user, isPending } = useCurrentUserState();
	const zoomBy = useRapidez((s) => s.zoomBy);
	const phase = useRapidez((s) => s.phase);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "phone",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapCanvas, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "absolute top-3 right-3 left-3 z-20 flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex h-11 items-center rounded-full bg-paper px-3 shadow-lg",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-display text-base font-extrabold tracking-wide text-ink",
						children: "RAPIDEZ"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "ml-auto rounded-full bg-paper px-2 py-1 shadow-lg",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserButton, {})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "zoom-stack",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-label": "Acercar",
					onClick: () => zoomBy(1),
					className: "grid size-11 place-items-center rounded-full bg-paper text-ink shadow-lg",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-5" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-label": "Alejar",
					onClick: () => zoomBy(-1),
					className: "grid size-11 place-items-center rounded-full bg-paper text-ink shadow-lg",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { className: "size-5" })
				})]
			}),
			(phase === "pickup" || phase === "destination") && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "center-pin",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, {
					className: "size-12",
					fill: "currentColor",
					strokeWidth: 1.5
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"data-sheet": true,
				className: "sheet",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "sheet-in px-4 pt-3 pb-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mx-auto mb-3 h-1.5 w-10 rounded-full bg-line" }), isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: "Cargando tu cuenta…"
					}) : !user ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthPanel, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Desk, { userId: user.id })]
				})
			})
		]
	});
}
function Desk({ userId }) {
	const [profile, setProfile] = (0, import_react.useState)(void 0);
	const [locked, setLocked] = (0, import_react.useState)(false);
	const [drivers, setDrivers] = (0, import_react.useState)([]);
	const [trip, setTrip] = (0, import_react.useState)(null);
	const [offer, setOffer] = (0, import_react.useState)(null);
	const [review, setReview] = (0, import_react.useState)(false);
	const [online, setOnline] = (0, import_react.useState)(false);
	const [step, setStep] = (0, import_react.useState)("pickup");
	const [pickup, setPickup] = (0, import_react.useState)(null);
	const [dest, setDest] = (0, import_react.useState)(null);
	const [preferred, setPreferred] = (0, import_react.useState)(null);
	const [pay, setPay] = (0, import_react.useState)("CASH_USD");
	const [error, setError] = (0, import_react.useState)("");
	const pos = (0, import_react.useRef)(null);
	const seenOffer = (0, import_react.useRef)("");
	(0, import_react.useEffect)(() => {
		useRapidez.setState({
			useLive: true,
			fleet: []
		});
	}, []);
	(0, import_react.useEffect)(() => {
		if (!online || profile?.role !== "driver") return;
		if (!navigator.geolocation) return;
		const watch = navigator.geolocation.watchPosition((p) => {
			pos.current = {
				lat: p.coords.latitude,
				lng: p.coords.longitude
			};
		}, () => void 0, {
			enableHighAccuracy: true,
			maximumAge: 4e3
		});
		return () => navigator.geolocation.clearWatch(watch);
	}, [online, profile?.role]);
	(0, import_react.useEffect)(() => {
		let stop = false;
		const tick = async () => {
			try {
				const point = pos.current ?? (profile?.role === "passenger" ? useRapidez.getState().center : null);
				const result = await syncLive({ data: {
					deviceId: deviceId(),
					lat: point?.lat ?? null,
					lng: point?.lng ?? null,
					online
				} });
				if (stop) return;
				setProfile(result.profile);
				setLocked(result.locked);
				setDrivers(result.drivers.filter((d) => d.id !== userId));
				setTrip(result.trip);
				setOffer(result.offer);
				const fleet = result.drivers.map((d) => ({
					id: d.id,
					name: d.name,
					lat: d.lat,
					lng: d.lng,
					elite: d.elite
				}));
				const active = result.trip;
				const driverPoint = active?.driverLat != null && active.driverLng != null ? {
					lat: active.driverLat,
					lng: active.driverLng
				} : null;
				useRapidez.setState({
					useLive: true,
					fleet,
					pickup: active ? {
						lat: active.pickupLat,
						lng: active.pickupLng
					} : pickup ? {
						lat: pickup.lat,
						lng: pickup.lng
					} : null,
					dest: active ? {
						lat: active.destLat,
						lng: active.destLng
					} : dest ? {
						lat: dest.lat,
						lng: dest.lng
					} : null,
					driverPos: driverPoint,
					phase: phaseOf(active, step),
					route: driverPoint && active ? [{
						lat: driverPoint.lat,
						lng: driverPoint.lng
					}, targetOf(active)] : [],
					routeIndex: 1
				});
				if (result.offer && result.offer.id !== seenOffer.current) {
					seenOffer.current = result.offer.id;
					beepOffer();
				}
				if (!result.offer) seenOffer.current = "";
			} catch (err) {
				if (!stop) setError(messageOf(err));
			}
		};
		tick();
		const id = setInterval(() => void tick(), 2500);
		return () => {
			stop = true;
			clearInterval(id);
		};
	}, [
		online,
		profile?.role,
		userId,
		step,
		pickup,
		dest
	]);
	if (profile === void 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-muted",
		children: "Conectando con Carora…"
	});
	if (review) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Review, { onClose: () => setReview(false) });
	if (!profile) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cadastro, {
		onDone: () => setProfile(void 0),
		onReview: () => setReview(true)
	});
	if (locked) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-3xl font-extrabold",
			children: "Un solo teléfono"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted",
			children: "Esta cuenta ya está abierta en otro dispositivo. Cierra la sesión allá para usar este."
		})]
	});
	if (profile.status !== "approved") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-3xl font-extrabold",
				children: profile.status === "rejected" ? "Hay que corregir" : "En revisión"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: profile.status === "rejected" ? profile.rejectNote || "El desarrollador no aprobó esta identidad." : "Cédula y selfie quedaron en la bandeja del desarrollador. Cuando apruebe, este teléfono queda vinculado."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm font-semibold",
				children: [
					profile.fullName,
					" · ",
					profile.cedula
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "h-12 rounded-full bg-ink text-sm font-semibold text-paper",
				onClick: () => setReview(true),
				children: "Bandeja del desarrollador"
			}),
			profile.status === "rejected" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "h-12 rounded-full border border-line text-sm font-semibold",
				onClick: () => setProfile(null),
				children: "Enviar de nuevo"
			})
		]
	});
	if (profile.role === "driver") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DriverDesk, {
		profile,
		online,
		offer: trip?.driverId === userId ? null : offer,
		trip: trip?.driverId === userId ? trip : null,
		error,
		onOnline: (value) => {
			if (value && !pos.current) pos.current = { ...useRapidez.getState().center };
			setOnline(value);
		},
		onPin: () => {
			pos.current = { ...useRapidez.getState().center };
			setOnline(true);
		},
		onReview: () => setReview(true)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PassengerDesk, {
		drivers,
		trip,
		step,
		pickupRef: pickup?.ref ?? "",
		preferred,
		pay,
		error,
		onPay: setPay,
		onPrefer: setPreferred,
		onPickup: (ref) => {
			const center = useRapidez.getState().center;
			setPickup({
				...center,
				ref
			});
			setStep("dest");
			useRapidez.setState({
				phase: "destination",
				pickup: center
			});
		},
		onDest: (ref) => {
			const center = useRapidez.getState().center;
			setDest({
				...center,
				ref
			});
			setStep("choose");
			useRapidez.setState({
				phase: "confirm",
				dest: center
			});
		},
		onRequest: async () => {
			if (!pickup || !dest) return;
			setError("");
			try {
				await requestTrip({ data: {
					pickupLat: pickup.lat,
					pickupLng: pickup.lng,
					pickupRef: pickup.ref,
					destLat: dest.lat,
					destLng: dest.lng,
					destRef: dest.ref,
					payMethod: pay,
					preferredDriverId: preferred
				} });
			} catch (err) {
				setError(messageOf(err));
			}
		},
		onCancel: async () => {
			if (!trip) {
				setStep("pickup");
				setPickup(null);
				setDest(null);
				useRapidez.setState({
					phase: "pickup",
					pickup: null,
					dest: null
				});
				return;
			}
			await setTripStatus({ data: {
				tripId: trip.id,
				status: "cancelled"
			} });
			setStep("pickup");
			setPickup(null);
			setDest(null);
		}
	});
}
function phaseOf(trip, step) {
	if (!trip) {
		if (step === "dest") return "destination";
		if (step === "choose") return "confirm";
		return "pickup";
	}
	if (trip.status === "open") return "searching";
	if (trip.status === "accepted") return "enroute";
	if (trip.status === "arrived") return "arrived";
	if (trip.status === "riding") return "riding";
	if (trip.status === "pay") return "pay";
	return "done";
}
function targetOf(trip) {
	if (trip.status === "riding" || trip.status === "pay") return {
		lat: trip.destLat,
		lng: trip.destLng
	};
	return {
		lat: trip.pickupLat,
		lng: trip.pickupLng
	};
}
function Cadastro({ onDone, onReview }) {
	const [role, setRole] = (0, import_react.useState)("passenger");
	const [fullName, setFullName] = (0, import_react.useState)("");
	const [phone, setPhone] = (0, import_react.useState)("");
	const [cedula, setCedula] = (0, import_react.useState)("V-");
	const [plate, setPlate] = (0, import_react.useState)("");
	const [model, setModel] = (0, import_react.useState)("");
	const [bankPhone, setBankPhone] = (0, import_react.useState)("");
	const [cedulaPhoto, setCedulaPhoto] = (0, import_react.useState)("");
	const [selfie, setSelfie] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)("");
	const [pending, setPending] = (0, import_react.useState)(false);
	async function onFile(file, set) {
		if (!file) return;
		try {
			set(await shrink(file));
			setError("");
		} catch (err) {
			setError(messageOf(err));
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-3xl font-extrabold",
				children: "Verificación"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Como en el cabildo: la cédula y una selfie las revisa el desarrollador. Sin esa aprobación no hay entrada."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: role === "passenger" ? "h-11 rounded-full bg-ink text-sm font-semibold text-paper" : "h-11 rounded-full bg-paper text-sm font-semibold",
					onClick: () => setRole("passenger"),
					children: "Pasajero"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: role === "driver" ? "h-11 rounded-full bg-ink text-sm font-semibold text-paper" : "h-11 rounded-full bg-paper text-sm font-semibold",
					onClick: () => setRole("driver"),
					children: "Mototaxista"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				className: "field",
				placeholder: "Nombre y apellido",
				value: fullName,
				onChange: (e) => setFullName(e.target.value)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				className: "field",
				inputMode: "numeric",
				placeholder: "Teléfono",
				value: phone,
				onChange: (e) => setPhone(e.target.value)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				className: "field",
				placeholder: "Cédula V-12345678",
				value: cedula,
				onChange: (e) => setCedula(e.target.value)
			}),
			role === "driver" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: "field",
					placeholder: "Placa",
					value: plate,
					onChange: (e) => setPlate(e.target.value)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: "field",
					placeholder: "Moto",
					value: model,
					onChange: (e) => setModel(e.target.value)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: "field",
					placeholder: "Teléfono Pago Móvil",
					value: bankPhone,
					onChange: (e) => setBankPhone(e.target.value)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Photo, {
					label: "Foto de la cédula",
					ready: Boolean(cedulaPhoto),
					onFile: (file) => void onFile(file, setCedulaPhoto)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Photo, {
					label: "Selfie",
					ready: Boolean(selfie),
					capture: "user",
					onFile: (file) => void onFile(file, setSelfie)
				})
			] }),
			error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm font-medium text-signal",
				children: error
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				disabled: pending,
				className: "h-12 rounded-full bg-brand text-base font-semibold text-ink disabled:opacity-40",
				onClick: () => {
					setPending(true);
					submitProfile({ data: {
						role,
						fullName,
						phone,
						cedula,
						plate,
						model,
						bankPhone,
						cedulaPhoto,
						selfie
					} }).then(() => onDone()).catch((err) => setError(messageOf(err))).finally(() => setPending(false));
				},
				children: pending ? "Enviando…" : "Enviar a revisión"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "h-11 text-sm font-semibold text-muted",
				onClick: onReview,
				children: "Soy el desarrollador"
			})
		]
	});
}
function Photo({ label, ready, capture, onFile }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "flex h-12 items-center justify-between rounded-2xl border border-line bg-paper px-3 text-sm font-semibold",
		children: [
			label,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-muted",
				children: ready ? "Lista" : "Tomar"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				className: "sr-only",
				type: "file",
				accept: "image/*",
				capture,
				onChange: (e) => onFile(e.target.files?.[0])
			})
		]
	});
}
function PassengerDesk({ drivers, trip, step, pickupRef, preferred, pay, error, onPay, onPrefer, onPickup, onDest, onRequest, onCancel }) {
	const center = useRapidez((s) => s.center);
	const focusPlace = useRapidez((s) => s.focusPlace);
	const [ref, setRef] = (0, import_react.useState)(pickupRef);
	const [destRef, setDestRef] = (0, import_react.useState)("");
	if (trip && trip.status !== "cancelled") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TripCard, {
		trip,
		mine: "passenger",
		onCancel: () => void onCancel()
	});
	if (step === "pickup") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-3xl font-extrabold",
				children: "¿Dónde te buscamos?"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm font-semibold",
				children: placeLabel(center)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Places, { onPick: focusPlace }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				id: "pickup-ref",
				className: "field",
				placeholder: "Referencia, ej. portón blanco",
				value: ref,
				onChange: (e) => setRef(e.target.value)
			}),
			error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm font-medium text-signal",
				children: error
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				disabled: ref.trim().length < 4,
				className: "h-12 rounded-full bg-brand font-semibold text-ink disabled:opacity-40",
				onClick: () => onPickup(ref.trim()),
				children: "Confirmar recogida"
			})
		]
	});
	if (step === "dest") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-3xl font-extrabold",
				children: "¿A dónde vas?"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm font-semibold",
				children: placeLabel(center)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Places, { onPick: focusPlace }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				className: "field",
				placeholder: "Referencia del destino",
				value: destRef,
				onChange: (e) => setDestRef(e.target.value)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "h-12 rounded-full bg-brand font-semibold text-ink",
				onClick: () => onDest(destRef.trim()),
				children: "Ver motos cercanas"
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-3xl font-extrabold",
				children: "Elige la moto"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Están compartiendo su ubicación ahora. La más cercana va primero."
			}),
			drivers.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm",
				children: "Ningún mototaxista en línea en 3,2 km."
			}),
			drivers.map((driver) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => onPrefer(preferred === driver.id ? null : driver.id),
				className: preferred === driver.id ? "rounded-2xl bg-ink px-3 py-3 text-left text-paper" : "rounded-2xl bg-paper px-3 py-3 text-left",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block font-semibold",
					children: driver.name
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "block text-sm opacity-80",
					children: [
						formatKm(driver.meters),
						" · ",
						driver.model || "Moto",
						" · ",
						driver.plate,
						driver.elite ? " · Élite" : " · Catastrado"
					]
				})]
			}, driver.id)),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-3 gap-2",
				children: [
					["CASH_USD", "USD"],
					["CASH_VES", "Bs"],
					["PAGO_MOVIL", "Pago Móvil"]
				].map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: pay === id ? "h-11 rounded-full bg-ink text-xs font-semibold text-paper" : "h-11 rounded-full bg-paper text-xs font-semibold",
					onClick: () => onPay(id),
					children: label
				}, id))
			}),
			error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm font-medium text-signal",
				children: error
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "h-12 rounded-full bg-brand font-semibold text-ink",
				onClick: () => void onRequest(),
				children: preferred ? "Pedir esta moto" : "Pedir la más cercana"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "h-11 text-sm font-semibold text-muted",
				onClick: () => void onCancel(),
				children: "Volver"
			})
		]
	});
}
function Places({ onPick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "chip-row py-1",
		children: PLACES.map((place) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "shrink-0 rounded-full border border-line bg-paper px-3 py-2 text-sm font-medium",
			onClick: () => onPick(place),
			children: place.name
		}, place.id))
	});
}
function TripCard({ trip, mine, onCancel }) {
	const [payRef, setPayRef] = (0, import_react.useState)("");
	const meters = trip.driverLat != null && trip.driverLng != null ? haversine({
		lat: trip.driverLat,
		lng: trip.driverLng
	}, trip.status === "riding" ? {
		lat: trip.destLat,
		lng: trip.destLng
	} : {
		lat: trip.pickupLat,
		lng: trip.pickupLng
	}) : null;
	const title = trip.status === "open" ? "Esperando un mototaxista" : trip.status === "accepted" ? "La moto va hacia ti" : trip.status === "arrived" ? "La moto llegó" : trip.status === "riding" ? "En camino" : trip.status === "pay" ? "Cobro" : "Carrera lista";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-3xl font-extrabold",
				children: mine === "driver" && trip.status === "accepted" ? "Hacia el pasajero" : title
			}),
			trip.driverName && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm font-semibold",
				children: [trip.driverName, " · sello catastrado"]
			}),
			mine === "driver" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm font-semibold",
				children: trip.passengerName
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm",
				children: trip.status === "riding" ? trip.destRef || "Destino" : trip.pickupRef
			}),
			meters != null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-display text-2xl font-extrabold tabular-nums",
				children: formatKm(meters)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm text-muted",
				children: [
					formatUsd(trip.fareUsd),
					" · ",
					formatVes(vesOf(trip.fareUsd))
				]
			}),
			mine === "driver" && trip.status === "accepted" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "h-12 rounded-full bg-brand font-semibold",
				onClick: () => void setTripStatus({ data: {
					tripId: trip.id,
					status: "arrived"
				} }),
				children: "Ya llegué"
			}),
			mine === "driver" && trip.status === "arrived" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "h-12 rounded-full bg-brand font-semibold",
				onClick: () => void setTripStatus({ data: {
					tripId: trip.id,
					status: "riding"
				} }),
				children: "Iniciar viaje"
			}),
			mine === "driver" && trip.status === "riding" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "h-12 rounded-full bg-brand font-semibold",
				onClick: () => void setTripStatus({ data: {
					tripId: trip.id,
					status: "pay"
				} }),
				children: "Finalizar viaje"
			}),
			mine === "passenger" && trip.status === "pay" && trip.payMethod === "PAGO_MOVIL" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				className: "field",
				inputMode: "numeric",
				placeholder: "Últimos dígitos",
				value: payRef,
				onChange: (e) => setPayRef(e.target.value)
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "h-12 rounded-full bg-brand font-semibold",
				onClick: () => void setTripStatus({ data: {
					tripId: trip.id,
					status: "pay",
					payRef
				} }),
				children: "Enviar referencia"
			})] }),
			mine === "driver" && trip.status === "pay" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [trip.payRef && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-display text-3xl font-extrabold tabular-nums",
				children: trip.payRef
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "h-12 rounded-full bg-ink font-semibold text-paper",
				onClick: () => void setTripStatus({ data: {
					tripId: trip.id,
					status: "done"
				} }),
				children: "Confirmar pago"
			})] }),
			["open", "accepted"].includes(trip.status) && mine === "passenger" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "h-11 text-sm font-semibold text-muted",
				onClick: onCancel,
				children: "Cancelar"
			})
		]
	});
}
function DriverDesk({ profile, online, offer, trip, error, onOnline, onPin, onReview }) {
	const [hidden, setHidden] = (0, import_react.useState)("");
	if (trip) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TripCard, {
		trip,
		mine: "driver",
		onCancel: () => void 0
	});
	const visible = offer && offer.id !== hidden ? offer : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-xs font-semibold tracking-wide text-muted uppercase",
				children: ["Sello catastrado", profile.elite ? " · Élite" : ""]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-3xl font-extrabold",
					children: profile.fullName
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					role: "switch",
					"aria-checked": online,
					"aria-label": online ? "Pasar a desconectado" : "Pasar a en línea",
					onClick: () => onOnline(!online),
					className: online ? "relative h-8 w-14 rounded-full bg-brand" : "relative h-8 w-14 rounded-full bg-line",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: online ? "absolute top-1 right-1 size-6 rounded-full bg-ink" : "absolute top-1 left-1 size-6 rounded-full bg-ink" })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: online ? "Compartiendo ubicación. Los pasajeros te ven." : "Desconectado. Nadie te ve en el mapa."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "h-11 rounded-full bg-paper text-sm font-semibold",
				onClick: onPin,
				children: "Publicar el punto del mapa"
			}),
			error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm font-medium text-signal",
				children: error
			}),
			visible && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl bg-ink p-3 text-paper",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-semibold tracking-wide uppercase",
						children: "Nuevo pedido"
					}),
					visible.preferredDriverId === profile.userId && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-semibold",
						children: "Te eligieron"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-lg font-semibold",
						children: visible.pickupRef
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm",
						children: [
							formatUsd(visible.fareUsd),
							" · ",
							formatKm(visible.distanceM)
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 grid grid-cols-2 gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "h-11 rounded-full bg-paper font-semibold text-ink",
							onClick: () => setHidden(visible.id),
							children: "Rechazar"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "h-11 rounded-full bg-brand font-semibold text-ink",
							onClick: () => void acceptTrip({ data: { tripId: visible.id } }),
							children: "Aceptar"
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "h-11 text-sm font-semibold text-muted",
				onClick: onReview,
				children: "Bandeja del desarrollador"
			})
		]
	});
}
function Review({ onClose }) {
	const [key, setKey] = (0, import_react.useState)("");
	const [items, setItems] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)("");
	async function load(next = key) {
		setError("");
		try {
			setItems(await reviewList({ data: { key: next } }));
		} catch (err) {
			setItems(null);
			setError(messageOf(err));
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-3xl font-extrabold",
				children: "Bandeja"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Cédula y selfie, como la revisión del cabildo. Al aprobar, esa persona entra y queda en un solo teléfono."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				className: "field",
				placeholder: "Clave de revisión",
				value: key,
				onChange: (e) => setKey(e.target.value)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "h-12 rounded-full bg-ink font-semibold text-paper",
				onClick: () => void load(),
				children: "Abrir pendientes"
			}),
			error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm font-medium text-signal",
				children: error
			}),
			items?.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm",
				children: "No hay solicitudes pendientes."
			}),
			items?.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
				className: "rounded-2xl bg-paper p-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-semibold",
						children: item.fullName
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted",
						children: [
							item.role === "driver" ? "Mototaxista" : "Pasajero",
							" · ",
							item.cedula,
							" · ",
							item.phone
						]
					}),
					item.plate && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm",
						children: [
							item.plate,
							" · ",
							item.model
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 grid grid-cols-2 gap-2",
						children: [item.cedulaPhoto && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: item.cedulaPhoto,
							alt: "Cédula",
							className: "h-28 w-full rounded-xl object-cover"
						}), item.selfie && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: item.selfie,
							alt: "Selfie",
							className: "h-28 w-full rounded-xl object-cover"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 grid grid-cols-2 gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "h-11 rounded-full bg-brand text-sm font-semibold",
							onClick: () => void reviewDecide({ data: {
								key,
								userId: item.userId,
								approve: true,
								elite: item.role === "driver",
								note: ""
							} }).then(() => load()),
							children: "Aprobar"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "h-11 rounded-full bg-signal text-sm font-semibold text-paper",
							onClick: () => void reviewDecide({ data: {
								key,
								userId: item.userId,
								approve: false,
								elite: false,
								note: "La foto no coincide con la cédula."
							} }).then(() => load()),
							children: "Rechazar"
						})]
					})
				]
			}, item.userId)),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "h-11 text-sm font-semibold text-muted",
				onClick: onClose,
				children: "Volver"
			})
		]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "stage",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LiveApp, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "stage-note",
			children: "Pasajero y mototaxista, en vivo. Una cuenta por teléfono."
		})]
	});
}
//#endregion
export { Home as component };
