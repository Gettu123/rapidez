import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { Map as LeafletMap, LayerGroup, Marker, Polyline } from "leaflet";
import { HOME } from "@/lib/rapidez/data";
import { bearing } from "@/lib/rapidez/geo";
import { listNearby } from "@/lib/rapidez/engine";
import { useRapidez } from "@/lib/rapidez/store";

const MOTO_HTML = `<div class="moto-pin"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6.2" cy="16.5" r="2.4"/><circle cx="17.8" cy="16.5" r="2.4"/><path d="M6.2 16.5h2.2l1.8-4.6h4.6l1.7 2.8h1.3"/><path d="M10.2 11.9 8.4 8.2H6.4"/></svg></div>`;

function token(name: string, fallback: string) {
  if (typeof document === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

export function MapCanvas() {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let dead = false;
    let unsub = () => {};
    let resize: ResizeObserver | null = null;

    void (async () => {
      const mod = (await import("leaflet")) as typeof import("leaflet") & {
        default?: typeof import("leaflet");
      };
      const L = typeof mod.map === "function" ? mod : (mod.default ?? mod);
      if (dead || !hostRef.current || mapRef.current) return;

      const map = L.map(hostRef.current, {
        zoomControl: false,
        attributionControl: true,
        scrollWheelZoom: true,
      });
      mapRef.current = map;
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const ink = token("--color-ink", "#1a1c14");
      const brand = token("--color-brand", "#e6a100");
      const signal = token("--color-signal", "#c4392c");
      const paper = token("--color-paper", "#f4efe4");

      const dots: LayerGroup = L.layerGroup().addTo(map);
      let lineA: Polyline | null = null;
      let lineB: Polyline | null = null;
      let pickupMark: ReturnType<typeof L.circleMarker> | null = null;
      let destMark: ReturnType<typeof L.circleMarker> | null = null;
      let driver: Marker | null = null;
      let anim = 0;
      let lastCmd = 0;
      const icon = L.divIcon({
        className: "moto-icon",
        html: MOTO_HTML,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      const pinLatLng = () => {
        const pin = document.querySelector(".center-pin");
        const rect = map.getContainer().getBoundingClientRect();
        if (!pin) {
          const c = map.getCenter();
          return { lat: c.lat, lng: c.lng };
        }
        const pr = pin.getBoundingClientRect();
        const ll = map.containerPointToLatLng([
          pr.left + pr.width / 2 - rect.left,
          pr.bottom - rect.top,
        ]);
        return { lat: ll.lat, lng: ll.lng };
      };

      const publishPin = () => {
        const { phase, setCenter } = useRapidez.getState();
        if (phase === "pickup" || phase === "destination") setCenter(pinLatLng());
      };

      const viewFor = (lat: number, lng: number, zoom: number) => {
        const pin = document.querySelector(".center-pin");
        const size = map.getSize();
        const target = map.project([lat, lng], zoom);
        if (!pin || !size.y) return L.latLng(lat, lng);
        const pr = pin.getBoundingClientRect();
        const mr = map.getContainer().getBoundingClientRect();
        const tipY = pr.bottom - mr.top;
        const offset = tipY - size.y / 2;
        return map.unproject(target.subtract([0, offset]), zoom);
      };

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const moveDriver = (lat: number, lng: number, heading: number | null) => {
        if (!driver) {
          driver = L.marker([lat, lng], { icon, interactive: false, zIndexOffset: 600 }).addTo(map);
        }
        const el = driver.getElement()?.querySelector(".moto-pin") as HTMLElement | null;
        if (el && heading != null) el.style.setProperty("--rot", `${heading - 90}deg`);
        if (reduced) {
          driver.setLatLng([lat, lng]);
          return;
        }
        const from = driver.getLatLng();
        const start = performance.now();
        cancelAnimationFrame(anim);
        const frame = (t: number) => {
          const k = Math.min(1, (t - start) / 320);
          driver?.setLatLng([from.lat + (lat - from.lat) * k, from.lng + (lng - from.lng) * k]);
          if (k < 1) anim = requestAnimationFrame(frame);
        };
        anim = requestAnimationFrame(frame);
        const bounds = map.getBounds().pad(-0.15);
        if (!bounds.contains([lat, lng])) map.panTo([lat, lng], { animate: true, duration: 0.4 });
      };

      const drawRoute = (pts: { lat: number; lng: number }[]) => {
        const latlngs = pts.map((p) => [p.lat, p.lng] as [number, number]);
        if (!latlngs.length) {
          lineA?.remove();
          lineB?.remove();
          lineA = null;
          lineB = null;
          return;
        }
        if (!lineA || !lineB) {
          lineA = L.polyline(latlngs, { color: ink, weight: 7, opacity: 0.88 }).addTo(map);
          lineB = L.polyline(latlngs, { color: brand, weight: 3, opacity: 1 }).addTo(map);
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
              fillOpacity: 1,
            }).addTo(dots);
          }
        }

        const showEnds = s.pickup && !selecting;
        if (showEnds && s.pickup) {
          if (!pickupMark) {
            pickupMark = L.circleMarker([s.pickup.lat, s.pickup.lng], {
              radius: 7,
              color: paper,
              weight: 2,
              fillColor: signal,
              fillOpacity: 1,
            }).addTo(map);
          } else pickupMark.setLatLng([s.pickup.lat, s.pickup.lng]);
        } else if (s.phase === "destination" && s.pickup) {
          if (!pickupMark) {
            pickupMark = L.circleMarker([s.pickup.lat, s.pickup.lng], {
              radius: 7,
              color: paper,
              weight: 2,
              fillColor: signal,
              fillOpacity: 1,
            }).addTo(map);
          } else pickupMark.setLatLng([s.pickup.lat, s.pickup.lng]);
        } else {
          pickupMark?.remove();
          pickupMark = null;
        }

        if (s.dest && (s.phase === "confirm" || s.phase === "riding" || s.phase === "pay" || s.phase === "done" || s.phase === "enroute" || s.phase === "arrived" || s.phase === "searching")) {
          if (!destMark) {
            destMark = L.circleMarker([s.dest.lat, s.dest.lng], {
              radius: 7,
              color: brand,
              weight: 2,
              fillColor: ink,
              fillOpacity: 1,
            }).addTo(map);
          } else destMark.setLatLng([s.dest.lat, s.dest.lng]);
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
            map.flyTo(center, zoom, { duration: reduced ? 0 : 0.65 });
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

  return <div ref={hostRef} className="absolute inset-0 z-0" />;
}
