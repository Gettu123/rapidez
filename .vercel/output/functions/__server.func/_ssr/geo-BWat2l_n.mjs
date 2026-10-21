import { n as createMiddleware } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/geo-BWat2l_n.js
/**
* Auth middleware for server functions — the standard way to get the caller's
* verified user id. When deployed the session cookie is same-origin and rides
* along automatically. In the live preview the client also forwards the bearer
* token (partitioned cookies) via the `.client` hook below — call sites do not
* thread it themselves.
*
*   import { createServerFn } from "@tanstack/react-start";
*   import { getSql } from "@/lib/db";
*   import { authMiddleware } from "@/lib/auth/middleware";
*
*   export const listTodos = createServerFn({ method: "GET" })
*     .middleware([authMiddleware])
*     .handler(async ({ context }) => {
*       const sql = await getSql();
*       return sql`select * from todos where user_id = ${context.userId}`;
*     });
*
* Signed out with auth on (live preview included) -> throws `UnauthorizedError`
* (see `verify.server.ts`). With auth disabled (`VITE_AUTH_ENABLED=false`, the
* shipped default) it resolves the shared dev user — but throws instead when a
* `DATABASE_URL` is also set, so an app without sign-in must not use this at
* all. On the auth-on path, use it on every server function that touches
* per-user data and scope every query by `context.userId`.
*/
var authMiddleware = createMiddleware({ type: "function" }).client(async ({ next }) => {
	const { getBearerToken } = await import("./client-1vAx-gM_.mjs").then((n) => n.n).then((n) => n.n);
	return next({ sendContext: { bearerToken: getBearerToken() ?? void 0 } });
}).server(async ({ next, context }) => {
	const { assertSameSiteRequest } = await import("./isolation.server-_hq0tw-r.mjs");
	const { requireUserId } = await import("./verify.server-BKFhNVa1.mjs");
	assertSameSiteRequest();
	return next({ context: { userId: await requireUserId(context.bearerToken) } });
});
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
//#endregion
export { fareFor as a, formatVes as c, buildRoute as i, haversine as l, authMiddleware as n, formatKm as o, bearing as r, formatUsd as s, SEARCH_RADIUS_M as t, vesOf as u };
