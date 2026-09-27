import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as MapPin, c as Check, i as Minus, l as Bike, n as Star, o as Copy, r as Plus, s as ChevronLeft } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Slot } from "../_libs/radix-ui__react-slot.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { t as create } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-CS1fgwoY.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 rounded-full px-5 text-base font-semibold transition-transform duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40", {
	variants: {
		variant: {
			primary: "h-12 bg-brand text-ink",
			dark: "h-12 bg-ink text-paper",
			quiet: "h-12 border border-line bg-sheet text-ink",
			signal: "h-12 bg-signal text-paper",
			ghost: "h-11 bg-transparent text-ink"
		},
		full: {
			true: "w-full",
			false: ""
		}
	},
	defaultVariants: {
		variant: "primary",
		full: false
	}
});
function Button({ className, variant, full, asChild, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			full
		}), className),
		...asChild ? {} : { type: "button" },
		...props
	});
}
var RATE_VES = 46.85;
var SEARCH_RADIUS_M = 3200;
function haversine(a, b) {
	const R = 6371e3;
	const p1 = a.lat * Math.PI / 180;
	const p2 = b.lat * Math.PI / 180;
	const dp = (b.lat - a.lat) * Math.PI / 180;
	const dl = (b.lng - a.lng) * Math.PI / 180;
	const h = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
	return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
function fareFor(distanceM) {
	const raw = 1.2 + distanceM / 1e3 * .55;
	return Math.max(2, Math.round(raw * 100) / 100);
}
function vesOf(usd) {
	return Math.round(usd * RATE_VES * 100) / 100;
}
function formatUsd(n) {
	return `$ ${n.toFixed(2)}`;
}
function formatVes(n) {
	return `Bs ${n.toLocaleString("es-VE", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	})}`;
}
function formatKm(meters) {
	if (meters < 1e3) return `${Math.max(1, Math.round(meters))} m`;
	return `${(meters / 1e3).toFixed(1)} km`;
}
function bearing(a, b) {
	const y = Math.sin(toRad(b.lng - a.lng)) * Math.cos(toRad(b.lat));
	const x = Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) - Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(toRad(b.lng - a.lng));
	return Math.atan2(y, x) * 180 / Math.PI;
}
function toRad(d) {
	return d * Math.PI / 180;
}
/** Curved path so the moto doesn't cut through blocks in a straight line. */
function buildRoute(from, to) {
	const dist = haversine(from, to);
	const steps = Math.max(28, Math.min(70, Math.round(dist / 30)));
	const dx = to.lat - from.lat;
	const dy = to.lng - from.lng;
	const len = Math.hypot(dx, dy) || 1;
	const bend = Math.min(len * .16, .0035);
	const c = {
		lat: (from.lat + to.lat) / 2 + -dy / len * bend,
		lng: (from.lng + to.lng) / 2 + dx / len * bend
	};
	const pts = [];
	for (let i = 0; i <= steps; i++) {
		const t = i / steps;
		const o = 1 - t;
		pts.push({
			lat: o * o * from.lat + 2 * o * t * c.lat + t * t * to.lat,
			lng: o * o * from.lng + 2 * o * t * c.lng + t * t * to.lng
		});
	}
	return pts;
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
		}
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
		}
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
		}
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
	}
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
function unlockAudio() {
	if (typeof window === "undefined") return;
	const AC = window.AudioContext || window.webkitAudioContext;
	if (!AC) return;
	if (!ctx) ctx = new AC();
	if (ctx.state === "suspended") ctx.resume();
}
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
		if (!s.pickup) return;
		get().assignDriver(youProfile(s.payout), s.pickup);
	},
	rejectOffer: () => {
		const s = get();
		if (s.phase === "searching" && s.pickup) {
			get().assignDriver(nearestNpc(s.pickup), s.pickup);
			return;
		}
		set({
			offerOpen: false,
			offerDeadline: null
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
function nearestNpc(pickup) {
	return [...NPCS].sort((a, b) => haversine(a.pos, pickup) - haversine(b.pos, pickup))[0];
}
var timer = null;
var beepedFor = 0;
function armAudio() {
	unlockAudio();
}
function startEngine() {
	if (timer) clearInterval(timer);
	timer = setInterval(() => tick(Date.now()), 320);
	return () => {
		if (timer) clearInterval(timer);
		timer = null;
	};
}
function listNearby(origin, online) {
	const payout = useRapidez.getState().payout;
	return (online ? [youProfile(payout), ...NPCS] : NPCS).map((driver) => ({
		...driver,
		meters: haversine(driver.pos, origin)
	})).filter((driver) => driver.meters <= SEARCH_RADIUS_M).sort((a, b) => a.meters - b.meters);
}
function tick(now) {
	const s = useRapidez.getState();
	if (s.phase === "searching" && s.pickup && !s.assigned) {
		if (s.online && !s.offerOpen) {
			s.openOffer(now + 15e3);
			if (beepedFor !== s.searchStartedAt) {
				beepedFor = s.searchStartedAt;
				beepOffer();
				if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([
					140,
					70,
					140,
					70,
					180
				]);
			}
			return;
		}
		if (!s.online && now - s.searchStartedAt > 4200) {
			s.rejectOffer();
			return;
		}
		if (s.offerOpen && s.offerDeadline && now > s.offerDeadline) {
			s.rejectOffer();
			return;
		}
	}
	if (s.phase === "enroute" || s.phase === "riding") s.advance();
	if (s.phase === "arrived") s.autoStartIfWaiting(now);
	if (s.phase === "pay") s.autoValidateIfWaiting(now);
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
			L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
				subdomains: "abcd",
				maxZoom: 20,
				attribution: "&copy; OpenStreetMap &copy; CARTO"
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
					for (const d of listNearby(origin, s.online)) {
						if (s.assigned && d.id === s.assigned.id) continue;
						L.circleMarker([d.pos.lat, d.pos.lng], {
							radius: 6,
							color: ink,
							weight: 2,
							fillColor: brand,
							fillOpacity: 1
						}).addTo(dots);
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
var METHODS = [
	{
		id: "CASH_USD",
		title: "Efectivo USD",
		detail: "Billetes en dólares"
	},
	{
		id: "CASH_VES",
		title: "Efectivo Bs",
		detail: "Bolívares en efectivo"
	},
	{
		id: "PAGO_MOVIL",
		title: "Pago Móvil",
		detail: "Transferencia al conductor"
	}
];
function prettyPhone(phone) {
	const digits = phone.replace(/\D/g, "");
	if (digits.length === 11) return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
	return phone;
}
async function copyText(label, text) {
	try {
		await navigator.clipboard.writeText(text);
		toast(`${label} copiado`);
	} catch {
		toast("No se pudo copiar");
	}
}
function RapidezApp() {
	const phoneRef = (0, import_react.useRef)(null);
	const sheetRef = (0, import_react.useRef)(null);
	const told = (0, import_react.useRef)(false);
	const role = useRapidez((s) => s.role);
	const phase = useRapidez((s) => s.phase);
	const proximity = useRapidez((s) => s.proximity);
	const offerOpen = useRapidez((s) => s.offerOpen);
	const setRole = useRapidez((s) => s.setRole);
	const zoomBy = useRapidez((s) => s.zoomBy);
	const showPin = phase === "pickup" || phase === "destination";
	(0, import_react.useEffect)(() => startEngine(), []);
	(0, import_react.useEffect)(() => {
		const sheet = sheetRef.current;
		const phone = phoneRef.current;
		if (!sheet || !phone) return;
		const apply = () => phone.style.setProperty("--sheet", `${sheet.offsetHeight}px`);
		apply();
		const ro = new ResizeObserver(apply);
		ro.observe(sheet);
		return () => ro.disconnect();
	}, [
		phase,
		role,
		offerOpen
	]);
	(0, import_react.useEffect)(() => {
		if (phase !== "enroute") {
			told.current = false;
			return;
		}
		if (proximity && !told.current) {
			told.current = true;
			toast("Tu mototaxi está a menos de 100 metros");
		}
	}, [proximity, phase]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref: phoneRef,
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
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "ml-auto flex h-11 rounded-full bg-paper p-1 shadow-lg",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoleButton, {
						active: role === "passenger",
						onClick: () => setRole("passenger"),
						children: "Pasajero"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoleButton, {
						active: role === "driver",
						onClick: () => setRole("driver"),
						children: "Conductor"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "zoom-stack",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconButton, {
					label: "Acercar",
					onClick: () => zoomBy(1),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-5" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconButton, {
					label: "Alejar",
					onClick: () => zoomBy(-1),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { className: "size-5" })
				})]
			}),
			showPin && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "center-pin",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, {
					className: "size-12",
					fill: "currentColor",
					strokeWidth: 1.5
				})
			}),
			phase === "enroute" && proximity && role === "passenger" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "absolute top-16 right-16 left-3 z-20 rounded-full bg-ink px-3 py-2 text-sm font-semibold text-paper shadow-lg",
				children: "Tu mototaxi está a menos de 100 m"
			}),
			offerOpen && role === "passenger" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OfferHint, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				ref: sheetRef,
				"data-sheet": true,
				className: "sheet",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "sheet-in px-4 pt-3 pb-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mx-auto mb-3 h-1.5 w-10 rounded-full bg-line" }), role === "passenger" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PassengerSheet, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DriverSheet, {})]
				}, `${role}-${phase}`)
			}),
			offerOpen && role === "driver" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OfferDialog, {})
		]
	});
}
function RoleButton({ active, children, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick,
		className: active ? "h-9 rounded-full bg-ink px-3 text-sm font-semibold text-paper" : "h-9 rounded-full px-3 text-sm font-semibold text-muted",
		children
	});
}
function IconButton({ label, onClick, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		"aria-label": label,
		onClick,
		className: "grid size-11 place-items-center rounded-full bg-paper text-ink shadow-lg",
		children
	});
}
function PassengerSheet() {
	const phase = useRapidez((s) => s.phase);
	if (phase === "pickup") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PickupStep, {});
	if (phase === "destination") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DestStep, {});
	if (phase === "confirm") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConfirmStep, {});
	if (phase === "searching") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SearchingStep, {});
	if (phase === "enroute" || phase === "arrived" || phase === "riding") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrackStep, {});
	if (phase === "pay") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PassengerPay, {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DoneStep, {});
}
function PlaceChips() {
	const focusPlace = useRapidez((s) => s.focusPlace);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "chip-row py-1",
		children: PLACES.map((place) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: () => focusPlace(place),
			className: "shrink-0 rounded-full border border-line bg-paper px-3 py-2 text-sm font-medium text-ink",
			children: place.name
		}, place.id))
	});
}
function PickupStep() {
	const center = useRapidez((s) => s.center);
	const pickupRef = useRapidez((s) => s.pickupRef);
	const formError = useRapidez((s) => s.formError);
	const setPickupRef = useRapidez((s) => s.setPickupRef);
	const confirmPickup = useRapidez((s) => s.confirmPickup);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-semibold tracking-wide text-muted uppercase",
				children: "Carora · Lara"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-3xl font-extrabold text-ink",
				children: "¿Dónde te buscamos?"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Mueve el mapa. El pin es el punto exacto. En Carora la referencia manda más que la calle."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm font-semibold text-ink",
				children: placeLabel(center)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlaceChips, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
				className: "text-sm font-semibold text-ink",
				htmlFor: "pickup-ref",
				children: "Punto de referencia"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				id: "pickup-ref",
				className: "field",
				value: pickupRef,
				placeholder: "Ej: frente a la farmacia, portón blanco",
				onChange: (e) => setPickupRef(e.target.value)
			}),
			formError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm font-medium text-signal",
				children: formError
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				full: true,
				disabled: pickupRef.trim().length < 4,
				onClick: confirmPickup,
				children: "Confirmar recogida"
			})
		]
	});
}
function DestStep() {
	const center = useRapidez((s) => s.center);
	const destRef = useRapidez((s) => s.destRef);
	const formError = useRapidez((s) => s.formError);
	const setDestRef = useRapidez((s) => s.setDestRef);
	const confirmDest = useRapidez((s) => s.confirmDest);
	const back = useRapidez((s) => s.back);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: back,
				className: "flex items-center gap-1 text-sm font-semibold text-muted",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-4" }), " Recogida"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-3xl font-extrabold",
				children: "¿A dónde vas?"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm font-semibold",
				children: placeLabel(center)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlaceChips, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "text-sm font-semibold",
				htmlFor: "dest-ref",
				children: ["Referencia del destino ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-medium text-muted",
					children: "(opcional)"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				id: "dest-ref",
				className: "field",
				value: destRef,
				placeholder: "Ej: terminal, puerta principal",
				onChange: (e) => setDestRef(e.target.value)
			}),
			formError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm font-medium text-signal",
				children: formError
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				full: true,
				onClick: confirmDest,
				children: "Ver tarifa"
			})
		]
	});
}
function ConfirmStep() {
	const pickupLabel = useRapidez((s) => s.pickupLabel);
	const destLabel = useRapidez((s) => s.destLabel);
	const dest = useRapidez((s) => s.dest);
	const fareUsd = useRapidez((s) => s.fareUsd);
	const distanceM = useRapidez((s) => s.distanceM);
	const method = useRapidez((s) => s.method);
	const setMethod = useRapidez((s) => s.setMethod);
	const back = useRapidez((s) => s.back);
	const requestTrip = useRapidez((s) => s.requestTrip);
	const ves = vesOf(fareUsd);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: back,
				className: "flex items-center gap-1 text-sm font-semibold text-muted",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-4" }), " Destino"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-end justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted",
						children: [
							formatKm(distanceM),
							" · tasa ",
							RATE_VES.toFixed(2),
							" Bs"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-4xl font-extrabold tabular-nums",
						children: formatUsd(fareUsd)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-lg font-semibold text-muted tabular-nums",
						children: formatVes(ves)
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bike, { className: "size-8 text-ink" })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-semibold",
					children: "Recogida. "
				}), pickupLabel]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-semibold",
					children: "Destino. "
				}), destLabel || (dest ? placeLabel(dest) : "—")]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-2",
				children: METHODS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => setMethod(item.id),
					className: method === item.id ? "flex items-center justify-between rounded-2xl border-2 border-ink bg-paper px-3 py-2 text-left" : "flex items-center justify-between rounded-2xl border border-line bg-sheet px-3 py-2 text-left",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-semibold",
						children: item.title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "flex items-center gap-2 text-sm text-muted",
						children: [item.detail, method === item.id && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4 text-ink" })]
					})]
				}, item.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				full: true,
				onClick: () => {
					armAudio();
					requestTrip();
				},
				children: "Pedir mototaxi"
			})
		]
	});
}
function SearchingStep() {
	const pickup = useRapidez((s) => s.pickup);
	const online = useRapidez((s) => s.online);
	const cancelTrip = useRapidez((s) => s.cancelTrip);
	const nearby = pickup ? listNearby(pickup, online).length : 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-3xl font-extrabold",
				children: "Buscando moto"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: nearby > 0 ? `${nearby} ${nearby === 1 ? "moto" : "motos"} en un radio de 3,2 km.` : "Nadie en 3,2 km. Ampliamos al conductor más cercano."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Si el modo conductor está en línea, tienes 15 segundos para aceptar la carrera."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "quiet",
				full: true,
				onClick: cancelTrip,
				children: "Cancelar"
			})
		]
	});
}
function TrackStep() {
	const phase = useRapidez((s) => s.phase);
	const assigned = useRapidez((s) => s.assigned);
	const driverPos = useRapidez((s) => s.driverPos);
	const pickup = useRapidez((s) => s.pickup);
	const dest = useRapidez((s) => s.dest);
	const route = useRapidez((s) => s.route);
	const routeIndex = useRapidez((s) => s.routeIndex);
	const pickupLabel = useRapidez((s) => s.pickupLabel);
	const destLabel = useRapidez((s) => s.destLabel);
	const fareUsd = useRapidez((s) => s.fareUsd);
	const startRide = useRapidez((s) => s.startRide);
	const cancelTrip = useRapidez((s) => s.cancelTrip);
	const target = phase === "riding" ? dest : pickup;
	const meters = driverPos && target ? haversine(driverPos, target) : 0;
	const secs = Math.max(1, Math.round((route.length - routeIndex) * .32));
	const where = phase === "riding" ? destLabel || (dest ? placeLabel(dest) : "") : pickupLabel;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-semibold tracking-wide text-muted uppercase",
				children: "Recorrido acelerado"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-3xl font-extrabold",
				children: phase === "arrived" ? "Tu moto llegó" : phase === "riding" ? "En camino" : "La moto viene hacia ti"
			}),
			assigned && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-semibold",
					children: assigned.name
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted",
					children: [
						assigned.model,
						" · ",
						assigned.rating.toFixed(2)
					]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plate, { plate: assigned.plate })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-semibold",
					children: phase === "riding" ? "Destino. " : "Referencia. "
				}), where]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-display text-2xl font-extrabold tabular-nums",
				children: phase === "arrived" ? "En el punto" : `${formatKm(meters)} · ${secs}s`
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm text-muted tabular-nums",
				children: [
					"Tarifa ",
					formatUsd(fareUsd),
					" · ",
					formatVes(vesOf(fareUsd))
				]
			}),
			phase === "arrived" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				full: true,
				onClick: startRide,
				children: "Ya subí"
			}),
			phase === "enroute" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				full: true,
				onClick: cancelTrip,
				children: "Cancelar carrera"
			})
		]
	});
}
function PassengerPay() {
	const method = useRapidez((s) => s.method);
	const fareUsd = useRapidez((s) => s.fareUsd);
	const payStatus = useRapidez((s) => s.payStatus);
	const payRef = useRapidez((s) => s.payRef);
	const confirmCash = useRapidez((s) => s.confirmCash);
	const [open, setOpen] = (0, import_react.useState)(false);
	const ves = vesOf(fareUsd);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-3xl font-extrabold",
				children: "Llegaste"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-display text-4xl font-extrabold tabular-nums",
				children: method === "CASH_USD" ? formatUsd(fareUsd) : formatVes(ves)
			}),
			method === "PAGO_MOVIL" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: payStatus === "PENDING" ? "Copia los datos del conductor y reporta los últimos dígitos." : payStatus === "VERIFYING" ? `Referencia ${payRef}. El conductor está validando.` : "Pago confirmado."
				}),
				payStatus === "PENDING" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					full: true,
					onClick: () => setOpen(true),
					children: "Datos de Pago Móvil"
				}),
				open && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PagoMovilModal, { onClose: () => setOpen(false) })
			] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm text-muted",
				children: ["Paga en efectivo al conductor", method === "CASH_VES" ? " en bolívares." : " en dólares."]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				full: true,
				disabled: payStatus !== "PENDING",
				onClick: () => confirmCash("passenger"),
				children: payStatus === "PENDING" ? "Ya pagué en efectivo" : "Esperando confirmación"
			})] })
		]
	});
}
function PagoMovilModal({ onClose }) {
	const assigned = useRapidez((s) => s.assigned);
	const fareUsd = useRapidez((s) => s.fareUsd);
	const submitPayRef = useRapidez((s) => s.submitPayRef);
	const [ref, setRef] = (0, import_react.useState)("");
	if (!assigned) return null;
	const ves = vesOf(fareUsd);
	const block = `Pago Móvil Rapidez\nBanco: ${assigned.bankName}\nCódigo: ${assigned.bank}\nTeléfono: ${assigned.phone}\nCédula: ${assigned.cedula}\nMonto: ${formatVes(ves)}`;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-40 flex items-end justify-center bg-ink/50 sm:items-center",
		role: "dialog",
		"aria-modal": "true",
		"aria-labelledby": "pago-title",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "sheet-in w-full max-w-md rounded-t-3xl bg-sheet p-4 sm:rounded-3xl",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					id: "pago-title",
					className: "font-display text-2xl font-extrabold",
					children: "Pago Móvil"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-lg font-semibold tabular-nums",
					children: formatVes(ves)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "mt-3 divide-y divide-line",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyRow, {
							label: "Teléfono",
							value: prettyPhone(assigned.phone),
							copy: assigned.phone
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyRow, {
							label: "Cédula",
							value: assigned.cedula,
							copy: assigned.cedula
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyRow, {
							label: "Banco",
							value: `${assigned.bankName}`,
							copy: assigned.bank,
							hint: assigned.bank
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => void copyText("Datos", block),
					className: "mt-3 text-sm font-semibold underline",
					children: "Copiar todo"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
					className: "mt-4 mb-1 block text-sm font-semibold",
					htmlFor: "pay-ref",
					children: "Número de referencia (últimos 6)"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					id: "pay-ref",
					className: "field tabular-nums",
					inputMode: "numeric",
					maxLength: 6,
					value: ref,
					placeholder: "481920",
					onChange: (e) => setRef(e.target.value.replace(/\D/g, "").slice(0, 6))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 grid grid-cols-2 gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "quiet",
						full: true,
						onClick: onClose,
						children: "Cerrar"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						full: true,
						disabled: ref.length < 4,
						onClick: () => {
							submitPayRef(ref);
							onClose();
							toast("Referencia enviada al conductor");
						},
						children: "Reportar pago"
					})]
				})
			]
		})
	});
}
function CopyRow({ label, value, copy, hint }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
		className: "flex items-center gap-2 py-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "min-w-0 flex-1",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block text-xs text-muted",
					children: label
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block truncate font-semibold",
					children: value
				}),
				hint && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-sm text-muted",
					children: ["Código ", hint]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			"aria-label": `Copiar ${label}`,
			onClick: () => void copyText(label, copy),
			className: "grid size-11 place-items-center rounded-full bg-paper text-ink",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-4" })
		})]
	});
}
function DriverSheet() {
	const phase = useRapidez((s) => s.phase);
	const assigned = useRapidez((s) => s.assigned);
	const mine = assigned?.id === "you";
	if (phase === "done") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DoneStep, {});
	if (mine && phase === "enroute") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DriverLeg, { kind: "pickup" });
	if (mine && phase === "arrived") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DriverArrived, {});
	if (mine && phase === "riding") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DriverLeg, { kind: "dest" });
	if (mine && phase === "pay") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DriverPay, {});
	if (assigned && !mine && ![
		"pickup",
		"destination",
		"confirm",
		"searching"
	].includes(phase)) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-3xl font-extrabold",
			children: "Carrera tomada"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "text-sm text-muted",
			children: [assigned.name, " ya va con el pasajero. Cambia a Pasajero para seguir el mapa."]
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DriverHome, {});
}
function DriverHome() {
	const online = useRapidez((s) => s.online);
	const setOnline = useRapidez((s) => s.setOnline);
	const phase = useRapidez((s) => s.phase);
	const payout = useRapidez((s) => s.payout);
	const setPayout = useRapidez((s) => s.setPayout);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-semibold tracking-wide text-muted uppercase",
				children: "Conductor · Carora"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-3xl font-extrabold",
					children: online ? "En línea" : "Desconectado"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: phase === "searching" && !online ? "Hay una solicitud. Entra en línea para recibirla." : "El GPS de fondo se simula: la moto sigue la ruta aunque cambies de vista."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					role: "switch",
					"aria-checked": online,
					"aria-label": online ? "Pasar a desconectado" : "Pasar a en línea",
					onClick: () => {
						armAudio();
						setOnline(!online);
					},
					className: online ? "relative h-8 w-14 shrink-0 rounded-full bg-brand" : "relative h-8 w-14 shrink-0 rounded-full bg-line",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: online ? "absolute top-1 right-1 size-6 rounded-full bg-ink" : "absolute top-1 left-1 size-6 rounded-full bg-ink" })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm font-semibold",
				children: "Datos de Pago Móvil"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
				className: "text-sm text-muted",
				htmlFor: "bank",
				children: "Banco"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
				id: "bank",
				className: "field",
				value: payout.bank,
				onChange: (e) => setPayout({ bank: e.target.value }),
				children: BANKS.map((bank) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
					value: bank.code,
					children: [
						bank.code,
						" · ",
						bank.name
					]
				}, bank.code))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
				className: "text-sm text-muted",
				htmlFor: "phone",
				children: "Teléfono"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				id: "phone",
				className: "field",
				inputMode: "numeric",
				value: payout.phone,
				onChange: (e) => setPayout({ phone: e.target.value.replace(/[^\d]/g, "").slice(0, 11) })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
				className: "text-sm text-muted",
				htmlFor: "cedula",
				children: "Cédula"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				id: "cedula",
				className: "field",
				value: payout.cedula,
				onChange: (e) => setPayout({ cedula: e.target.value.slice(0, 16) })
			})
		]
	});
}
function DriverLeg({ kind }) {
	const pickupLabel = useRapidez((s) => s.pickupLabel);
	const markArrived = useRapidez((s) => s.markArrived);
	const finishRide = useRapidez((s) => s.finishRide);
	const driverPos = useRapidez((s) => s.driverPos);
	const pickup = useRapidez((s) => s.pickup);
	const dest = useRapidez((s) => s.dest);
	const target = kind === "pickup" ? pickup : dest;
	const meters = driverPos && target ? haversine(driverPos, target) : 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-semibold tracking-wide text-muted uppercase",
				children: "Transmitiendo ubicación"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-3xl font-extrabold",
				children: kind === "pickup" ? "Hacia el pasajero" : "Llevando al pasajero"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-lg font-semibold",
				children: kind === "pickup" ? pickupLabel : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DestText, {})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-display text-2xl font-extrabold tabular-nums",
				children: formatKm(meters)
			}),
			kind === "pickup" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				full: true,
				onClick: markArrived,
				children: "Ya llegué"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				full: true,
				onClick: finishRide,
				children: "Finalizar viaje"
			})
		]
	});
}
function DestText() {
	const destLabel = useRapidez((s) => s.destLabel);
	const dest = useRapidez((s) => s.dest);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: destLabel || (dest ? placeLabel(dest) : "Destino") });
}
function DriverArrived() {
	const pickupLabel = useRapidez((s) => s.pickupLabel);
	const startRide = useRapidez((s) => s.startRide);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-3xl font-extrabold",
				children: "Esperando al pasajero"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-lg font-semibold",
				children: pickupLabel
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				full: true,
				onClick: startRide,
				children: "Iniciar viaje"
			})
		]
	});
}
function DriverPay() {
	const method = useRapidez((s) => s.method);
	const payRef = useRapidez((s) => s.payRef);
	const payStatus = useRapidez((s) => s.payStatus);
	const fareUsd = useRapidez((s) => s.fareUsd);
	const validatePay = useRapidez((s) => s.validatePay);
	const confirmCash = useRapidez((s) => s.confirmCash);
	const cash = method !== "PAGO_MOVIL";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-3xl font-extrabold",
				children: "Cobrar"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-display text-4xl font-extrabold tabular-nums",
				children: method === "CASH_USD" ? formatUsd(fareUsd) : formatVes(vesOf(fareUsd))
			}),
			cash ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				full: true,
				onClick: () => confirmCash("driver"),
				children: "Recibí el efectivo"
			}) : payStatus === "PENDING" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Esperando el número de referencia del pasajero."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "Referencia reportada"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-4xl font-extrabold tabular-nums",
					children: payRef
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					full: true,
					onClick: validatePay,
					children: "Validar pago"
				})
			] })
		]
	});
}
function DoneStep() {
	const rating = useRapidez((s) => s.rating);
	const setRating = useRapidez((s) => s.setRating);
	const resetTrip = useRapidez((s) => s.resetTrip);
	const role = useRapidez((s) => s.role);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-3xl font-extrabold",
				children: "Carrera lista"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: role === "passenger" ? "¿Cómo estuvo el viaje?" : "Pago confirmado. Ya puedes tomar otra."
			}),
			role === "passenger" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex gap-1",
				children: [
					1,
					2,
					3,
					4,
					5
				].map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-label": `${n} estrellas`,
					onClick: () => setRating(n),
					className: "grid size-11 place-items-center",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, {
						className: "size-6 text-ink",
						fill: n <= rating ? "currentColor" : "none"
					})
				}, n))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				full: true,
				onClick: resetTrip,
				children: "Nueva carrera"
			})
		]
	});
}
function OfferHint() {
	const deadline = useRapidez((s) => s.offerDeadline);
	const setRole = useRapidez((s) => s.setRole);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick: () => setRole("driver"),
		className: "absolute top-16 right-3 left-3 z-20 rounded-2xl bg-brand px-3 py-3 text-left text-ink shadow-lg",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "block text-sm font-extrabold",
			children: "Solicitud sonando en Conductor"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "text-sm",
			children: [deadline ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Countdown, { deadline }) : "15 s", " para aceptar"]
		})]
	});
}
function OfferDialog() {
	const deadline = useRapidez((s) => s.offerDeadline);
	const pickupLabel = useRapidez((s) => s.pickupLabel);
	const fareUsd = useRapidez((s) => s.fareUsd);
	const distanceM = useRapidez((s) => s.distanceM);
	const method = useRapidez((s) => s.method);
	const acceptOffer = useRapidez((s) => s.acceptOffer);
	const rejectOffer = useRapidez((s) => s.rejectOffer);
	const pay = method === "PAGO_MOVIL" ? "Pago Móvil" : method === "CASH_USD" ? "Efectivo USD" : "Efectivo Bs";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "absolute inset-0 z-40 flex items-end bg-ink/55 p-3",
		role: "dialog",
		"aria-modal": "true",
		"aria-labelledby": "offer-title",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "sheet-in w-full rounded-3xl bg-sheet p-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-semibold tracking-wide text-muted uppercase",
						children: "Nueva carrera"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						id: "offer-title",
						className: "font-display text-3xl font-extrabold",
						children: deadline ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Countdown, { deadline }) : "15"
					})] }), deadline && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ring, { deadline })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-lg font-semibold",
					children: pickupLabel
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted",
					children: [
						formatKm(distanceM),
						" · ",
						formatUsd(fareUsd),
						" · ",
						pay
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 grid grid-cols-2 gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "quiet",
						full: true,
						onClick: rejectOffer,
						children: "Rechazar"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						full: true,
						onClick: acceptOffer,
						children: "Aceptar"
					})]
				})
			]
		})
	});
}
function Countdown({ deadline }) {
	const [now, setNow] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		const tick = () => setNow(Date.now());
		tick();
		const id = setInterval(tick, 100);
		return () => clearInterval(id);
	}, [deadline]);
	const left = now == null ? 15 : Math.max(0, Math.ceil((deadline - now) / 1e3));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: "tabular-nums",
		children: [left, "s"]
	});
}
function Ring({ deadline }) {
	const [now, setNow] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		const tick = () => setNow(Date.now());
		tick();
		const id = setInterval(tick, 100);
		return () => clearInterval(id);
	}, [deadline]);
	const p = now == null ? 1 : Math.max(0, Math.min(1, (deadline - now) / 15e3));
	const r = 22;
	const c = 2 * Math.PI * r;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		width: "56",
		height: "56",
		viewBox: "0 0 56 56",
		"aria-hidden": "true",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
			cx: "28",
			cy: "28",
			r,
			fill: "none",
			stroke: "var(--color-line)",
			strokeWidth: "4"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
			cx: "28",
			cy: "28",
			r,
			fill: "none",
			stroke: "var(--color-ink)",
			strokeWidth: "4",
			strokeLinecap: "round",
			strokeDasharray: c,
			strokeDashoffset: c * (1 - p),
			transform: "rotate(-90 28 28)"
		})]
	});
}
function Plate({ plate }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "rounded-md border-2 border-ink bg-brand px-2 py-1 font-display text-sm font-extrabold tracking-widest",
		children: plate
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "stage",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RapidezApp, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "stage-note",
			children: "Misma carrera, dos roles. Cambia entre pasajero y conductor."
		})]
	});
}
//#endregion
export { Home as component };
