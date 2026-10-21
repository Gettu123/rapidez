export interface LatLng {
  lat: number;
  lng: number;
}

export const RATE_VES = 46.85;
export const SEARCH_RADIUS_M = 2500;
export const OFFER_MS = 18000;
export const COMMISSION = 0.1;
export const PROXIMITY_M = 100;
export const ARRIVE_M = 48;

export function haversine(a: LatLng, b: LatLng): number {
  const R = 6371e3;
  const p1 = (a.lat * Math.PI) / 180;
  const p2 = (b.lat * Math.PI) / 180;
  const dp = ((b.lat - a.lat) * Math.PI) / 180;
  const dl = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dp / 2) * Math.sin(dp / 2) +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function fareFor(distanceM: number): number {
  const raw = 1.2 + (distanceM / 1000) * 0.55;
  return Math.max(2, Math.round(raw * 100) / 100);
}

export function vesOf(usd: number): number {
  return Math.round(usd * RATE_VES * 100) / 100;
}

export function formatUsd(n: number): string {
  return `$ ${n.toFixed(2)}`;
}

export function formatVes(n: number): string {
  return `Bs ${n.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatKm(meters: number): string {
  if (meters < 1000) return `${Math.max(1, Math.round(meters))} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function bearing(a: LatLng, b: LatLng): number {
  const y = Math.sin(toRad(b.lng - a.lng)) * Math.cos(toRad(b.lat));
  const x =
    Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
    Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(toRad(b.lng - a.lng));
  return (Math.atan2(y, x) * 180) / Math.PI;
}

function toRad(d: number): number {
  return (d * Math.PI) / 180;
}

/** Curved path so the moto doesn't cut through blocks in a straight line. */
export function buildRoute(from: LatLng, to: LatLng): LatLng[] {
  const dist = haversine(from, to);
  const steps = Math.max(28, Math.min(70, Math.round(dist / 30)));
  const dx = to.lat - from.lat;
  const dy = to.lng - from.lng;
  const len = Math.hypot(dx, dy) || 1;
  const bend = Math.min(len * 0.16, 0.0035);
  const c = {
    lat: (from.lat + to.lat) / 2 + (-dy / len) * bend,
    lng: (from.lng + to.lng) / 2 + (dx / len) * bend,
  };
  const pts: LatLng[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const o = 1 - t;
    pts.push({
      lat: o * o * from.lat + 2 * o * t * c.lat + t * t * to.lat,
      lng: o * o * from.lng + 2 * o * t * c.lng + t * t * to.lng,
    });
  }
  return pts;
}
