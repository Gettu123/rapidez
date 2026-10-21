import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import type { CircleMarker, Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import { sharedTrip, type SharedView } from "@/lib/rapidez/live-api";

export const Route = createFileRoute("/viaje/$token")({
  component: ViajeCompartido,
});

function ViajeCompartido() {
  const { token } = Route.useParams();
  const [view, setView] = useState<SharedView | null | undefined>(undefined);

  useEffect(() => {
    let stop = false;
    const tick = () => {
      void sharedTrip({ data: token })
        .then((next) => {
          if (!stop) setView(next);
        })
        .catch(() => {
          if (!stop) setView(null);
        });
    };
    tick();
    const id = setInterval(tick, 4000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [token]);

  const title =
    !view
      ? ""
      : view.status === "riding"
        ? "En camino"
        : view.status === "accepted"
          ? "La moto va a buscarlo"
          : view.status === "arrived"
            ? "La moto llegó"
            : view.status === "done" || view.status === "pay"
              ? "Viaje terminado"
              : view.status === "cancelled"
                ? "Viaje cancelado"
                : "Buscando una moto";

  const live = Boolean(view && view.lat != null && view.lng != null && !["done", "cancelled", "pay"].includes(view.status));

  return (
    <main className="grid min-h-dvh place-items-center bg-ink p-6">
      <article className="w-full max-w-sm rounded-3xl bg-sheet p-5 text-ink">
        <p className="font-display text-sm font-extrabold tracking-wide">RAPIDEZ · CARORA</p>
        {view === undefined && <p className="mt-4 text-sm text-muted">Buscando el viaje…</p>}
        {view === null && (
          <>
            <h1 className="mt-3 font-display text-3xl font-extrabold">Enlace sin viaje</h1>
            <p className="mt-2 text-sm text-muted">Pide a quien va en la moto que te mande el enlace otra vez.</p>
          </>
        )}
        {view && (
          <>
            <h1 className="mt-3 font-display text-3xl font-extrabold">{title}</h1>
            {view.driverName && <p className="mt-2 text-sm font-semibold">Mototaxista {view.driverName}</p>}
            <p className="mt-3 text-sm text-muted">Sale de</p>
            <p className="font-semibold">{view.pickup}</p>
            <p className="mt-2 text-sm text-muted">Va hacia</p>
            <p className="font-semibold">{view.dest}</p>
            {live && view.lat != null && view.lng != null && <LiveMap lat={view.lat} lng={view.lng} />}
            <p className="mt-4 text-xs text-muted">Solo el trayecto. Sin teléfono ni cédula.</p>
          </>
        )}
      </article>
    </main>
  );
}

function LiveMap({ lat, lng }: { lat: number; lng: number }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markRef = useRef<CircleMarker | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let dead = false;
    void import("leaflet").then((mod) => {
      const leaflet = mod as typeof import("leaflet") & { default?: typeof import("leaflet") };
      const L = typeof leaflet.map === "function" ? leaflet : (leaflet.default ?? leaflet);
      if (dead || !hostRef.current || mapRef.current) return;
      const map = L.map(hostRef.current, { zoomControl: false, attributionControl: true, scrollWheelZoom: false });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      map.setView([lat, lng], 16);
      markRef.current = L.circleMarker([lat, lng], {
        radius: 8,
        color: "#1a1c14",
        weight: 2,
        fillColor: "#e6a100",
        fillOpacity: 1,
      }).addTo(map);
      mapRef.current = map;
      setTimeout(() => map.invalidateSize(), 50);
    });
    return () => {
      dead = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markRef.current = null;
    };
  }, []);

  useEffect(() => {
    markRef.current?.setLatLng([lat, lng]);
    mapRef.current?.panTo([lat, lng]);
  }, [lat, lng]);

  return <div ref={hostRef} className="mt-4 h-52 overflow-hidden rounded-2xl" />;
}
