import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Bike,
  Check,
  ChevronLeft,
  Copy,
  MapPin,
  Minus,
  Plus,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MapCanvas } from "@/components/rapidez/MapCanvas";
import { BANKS, PLACES, placeLabel } from "@/lib/rapidez/data";
import { armAudio, listNearby, startEngine } from "@/lib/rapidez/engine";
import {
  RATE_VES,
  formatKm,
  formatUsd,
  formatVes,
  haversine,
  vesOf,
} from "@/lib/rapidez/geo";
import { useRapidez, actingDriver, roster, type PayMethod, type Role } from "@/lib/rapidez/store";

const METHODS: { id: PayMethod; title: string; detail: string }[] = [
  { id: "CASH_USD", title: "Efectivo USD", detail: "Billetes en dólares" },
  { id: "CASH_VES", title: "Efectivo Bs", detail: "Bolívares en efectivo" },
  { id: "PAGO_MOVIL", title: "Pago Móvil", detail: "Transferencia al conductor" },
];

function prettyPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
  return phone;
}

async function copyText(label: string, text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast(`${label} copiado`);
  } catch {
    toast("No se pudo copiar");
  }
}

export function RapidezApp() {
  const phoneRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const told = useRef(false);
  const role = useRapidez((s) => s.role);
  const phase = useRapidez((s) => s.phase);
  const proximity = useRapidez((s) => s.proximity);
  const offerOpen = useRapidez((s) => s.offerOpen);
  const setRole = useRapidez((s) => s.setRole);
  const zoomBy = useRapidez((s) => s.zoomBy);
  const showPin = phase === "pickup" || phase === "destination";

  useEffect(() => startEngine(), []);

  useEffect(() => {
    const sheet = sheetRef.current;
    const phone = phoneRef.current;
    if (!sheet || !phone) return;
    const apply = () => phone.style.setProperty("--sheet", `${sheet.offsetHeight}px`);
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(sheet);
    return () => ro.disconnect();
  }, [phase, role, offerOpen]);

  useEffect(() => {
    if (phase !== "enroute") {
      told.current = false;
      return;
    }
    if (proximity && !told.current) {
      told.current = true;
      toast("Tu mototaxi está a menos de 100 metros");
    }
  }, [proximity, phase]);

  return (
    <div ref={phoneRef} className="phone">
      <MapCanvas />
      <header className="absolute top-3 right-3 left-3 z-20 flex items-center gap-2">
        <div className="flex h-11 items-center rounded-full bg-paper px-3 shadow-lg">
          <span className="font-display text-base font-extrabold tracking-wide text-ink">RAPIDEZ</span>
        </div>
        <div className="ml-auto flex h-11 rounded-full bg-paper p-1 shadow-lg">
          <RoleButton active={role === "passenger"} onClick={() => setRole("passenger")}>
            Pasajero
          </RoleButton>
          <RoleButton active={role === "driver"} onClick={() => setRole("driver")}>
            Conductor
          </RoleButton>
        </div>
      </header>

      <div className="zoom-stack">
        <IconButton label="Acercar" onClick={() => zoomBy(1)}>
          <Plus className="size-5" />
        </IconButton>
        <IconButton label="Alejar" onClick={() => zoomBy(-1)}>
          <Minus className="size-5" />
        </IconButton>
      </div>

      {showPin && (
        <div className="center-pin" aria-hidden="true">
          <MapPin className="size-12" fill="currentColor" strokeWidth={1.5} />
        </div>
      )}

      {phase === "enroute" && proximity && role === "passenger" && (
        <p className="absolute top-16 right-16 left-3 z-20 rounded-full bg-ink px-3 py-2 text-sm font-semibold text-paper shadow-lg">
          Tu mototaxi está a menos de 100 m
        </p>
      )}

      {offerOpen && role === "passenger" && <OfferHint />}

      <div ref={sheetRef} data-sheet className="sheet">
        <div key={`${role}-${phase}`} className="sheet-in px-4 pt-3 pb-5">
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line" />
          {role === "passenger" ? <PassengerSheet /> : <DriverSheet />}
        </div>
      </div>

      {offerOpen && role === "driver" && <OfferDialog />}
    </div>
  );
}

function RoleButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "h-9 rounded-full bg-ink px-3 text-sm font-semibold text-paper"
          : "h-9 rounded-full px-3 text-sm font-semibold text-muted"
      }
    >
      {children}
    </button>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-11 place-items-center rounded-full bg-paper text-ink shadow-lg"
    >
      {children}
    </button>
  );
}

function PassengerSheet() {
  const phase = useRapidez((s) => s.phase);
  if (phase === "pickup") return <PickupStep />;
  if (phase === "destination") return <DestStep />;
  if (phase === "confirm") return <ConfirmStep />;
  if (phase === "searching") return <SearchingStep />;
  if (phase === "enroute" || phase === "arrived" || phase === "riding") return <TrackStep />;
  if (phase === "pay") return <PassengerPay />;
  return <DoneStep />;
}

function PlaceChips() {
  const focusPlace = useRapidez((s) => s.focusPlace);
  return (
    <div className="chip-row py-1">
      {PLACES.map((place) => (
        <button
          key={place.id}
          type="button"
          onClick={() => focusPlace(place)}
          className="shrink-0 rounded-full border border-line bg-paper px-3 py-2 text-sm font-medium text-ink"
        >
          {place.name}
        </button>
      ))}
    </div>
  );
}

function PickupStep() {
  const center = useRapidez((s) => s.center);
  const pickupRef = useRapidez((s) => s.pickupRef);
  const formError = useRapidez((s) => s.formError);
  const setPickupRef = useRapidez((s) => s.setPickupRef);
  const confirmPickup = useRapidez((s) => s.confirmPickup);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold tracking-wide text-muted uppercase">Carora · Lara</p>
      <h1 className="font-display text-3xl font-extrabold text-ink">¿Dónde te buscamos?</h1>
      <p className="text-sm text-muted">
        Mueve el mapa. El pin es el punto exacto. En Carora la referencia manda más que la calle.
      </p>
      <p className="text-sm font-semibold text-ink">{placeLabel(center)}</p>
      <PlaceChips />
      <label className="text-sm font-semibold text-ink" htmlFor="pickup-ref">
        Punto de referencia
      </label>
      <input
        id="pickup-ref"
        className="field"
        value={pickupRef}
        placeholder="Ej: frente a la farmacia, portón blanco"
        onChange={(e) => setPickupRef(e.target.value)}
      />
      {formError && <p className="text-sm font-medium text-signal">{formError}</p>}
      <Button full disabled={pickupRef.trim().length < 4} onClick={confirmPickup}>
        Confirmar recogida
      </Button>
    </div>
  );
}

function DestStep() {
  const center = useRapidez((s) => s.center);
  const destRef = useRapidez((s) => s.destRef);
  const formError = useRapidez((s) => s.formError);
  const setDestRef = useRapidez((s) => s.setDestRef);
  const confirmDest = useRapidez((s) => s.confirmDest);
  const back = useRapidez((s) => s.back);
  return (
    <div className="flex flex-col gap-3">
      <button type="button" onClick={back} className="flex items-center gap-1 text-sm font-semibold text-muted">
        <ChevronLeft className="size-4" /> Recogida
      </button>
      <h1 className="font-display text-3xl font-extrabold">¿A dónde vas?</h1>
      <p className="text-sm font-semibold">{placeLabel(center)}</p>
      <PlaceChips />
      <label className="text-sm font-semibold" htmlFor="dest-ref">
        Referencia del destino <span className="font-medium text-muted">(opcional)</span>
      </label>
      <input
        id="dest-ref"
        className="field"
        value={destRef}
        placeholder="Ej: terminal, puerta principal"
        onChange={(e) => setDestRef(e.target.value)}
      />
      {formError && <p className="text-sm font-medium text-signal">{formError}</p>}
      <Button full onClick={confirmDest}>
        Ver tarifa
      </Button>
    </div>
  );
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
  return (
    <div className="flex flex-col gap-3">
      <button type="button" onClick={back} className="flex items-center gap-1 text-sm font-semibold text-muted">
        <ChevronLeft className="size-4" /> Destino
      </button>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{formatKm(distanceM)} · tasa {RATE_VES.toFixed(2)} Bs</p>
          <p className="font-display text-4xl font-extrabold tabular-nums">{formatUsd(fareUsd)}</p>
          <p className="text-lg font-semibold text-muted tabular-nums">{formatVes(ves)}</p>
        </div>
        <Bike className="size-8 text-ink" />
      </div>
      <p className="text-sm">
        <span className="font-semibold">Recogida. </span>
        {pickupLabel}
      </p>
      <p className="text-sm">
        <span className="font-semibold">Destino. </span>
        {destLabel || (dest ? placeLabel(dest) : "—")}
      </p>
      <div className="grid gap-2">
        {METHODS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setMethod(item.id)}
            className={
              method === item.id
                ? "flex items-center justify-between rounded-2xl border-2 border-ink bg-paper px-3 py-2 text-left"
                : "flex items-center justify-between rounded-2xl border border-line bg-sheet px-3 py-2 text-left"
            }
          >
            <span className="font-semibold">{item.title}</span>
            <span className="flex items-center gap-2 text-sm text-muted">
              {item.detail}
              {method === item.id && <Check className="size-4 text-ink" />}
            </span>
          </button>
        ))}
      </div>
      <Button
        full
        onClick={() => {
          armAudio();
          requestTrip();
        }}
      >
        Pedir mototaxi
      </Button>
    </div>
  );
}

function SearchingStep() {
  const pickup = useRapidez((s) => s.pickup);
  const cancelTrip = useRapidez((s) => s.cancelTrip);
  const nearby = pickup ? listNearby(pickup).length : 0;
  return (
    <div className="flex flex-col gap-3">
      <h1 className="font-display text-3xl font-extrabold">Buscando moto</h1>
      <p className="text-sm text-muted">
        {nearby} mototaxistas catastrados en 3,2 km. Nadie toma la carrera solo.
      </p>
      <p className="text-sm">Entra como conductor, ponte en línea y acepta. El sello catastrado tiene que estar visible.</p>
      <Button variant="quiet" full onClick={cancelTrip}>
        Cancelar
      </Button>
    </div>
  );
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
  const secs = Math.max(1, Math.round((route.length - routeIndex) * 0.32));
  const where = phase === "riding" ? destLabel || (dest ? placeLabel(dest) : "") : pickupLabel;
  const title =
    phase === "arrived" ? "Tu moto llegó" : phase === "riding" ? "En camino" : "La moto viene hacia ti";
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold tracking-wide text-muted uppercase">En vivo</p>
      <h1 className="font-display text-3xl font-extrabold">{title}</h1>
      {assigned && (
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold">{assigned.name}</p>
            <p className="text-sm text-muted">
              {assigned.model} · {assigned.rating.toFixed(2)}
            </p>
            <Seal elite={assigned.elite} />
          </div>
          <Plate plate={assigned.plate} />
        </div>
      )}
      <p className="text-sm">
        <span className="font-semibold">{phase === "riding" ? "Destino. " : "Referencia. "}</span>
        {where}
      </p>
      <p className="font-display text-2xl font-extrabold tabular-nums">
        {phase === "arrived" ? "En el punto" : `${formatKm(meters)} · ${secs}s`}
      </p>
      <p className="text-sm text-muted tabular-nums">Tarifa {formatUsd(fareUsd)} · {formatVes(vesOf(fareUsd))}</p>
      {phase === "arrived" && (
        <Button full onClick={startRide}>
          Ya subí
        </Button>
      )}
      {phase === "enroute" && (
        <Button variant="ghost" full onClick={cancelTrip}>
          Cancelar carrera
        </Button>
      )}
    </div>
  );
}

function PassengerPay() {
  const method = useRapidez((s) => s.method);
  const fareUsd = useRapidez((s) => s.fareUsd);
  const payStatus = useRapidez((s) => s.payStatus);
  const payRef = useRapidez((s) => s.payRef);
  const confirmCash = useRapidez((s) => s.confirmCash);
  const [open, setOpen] = useState(false);
  const ves = vesOf(fareUsd);
  return (
    <div className="flex flex-col gap-3">
      <h1 className="font-display text-3xl font-extrabold">Llegaste</h1>
      <p className="font-display text-4xl font-extrabold tabular-nums">
        {method === "CASH_USD" ? formatUsd(fareUsd) : formatVes(ves)}
      </p>
      {method === "PAGO_MOVIL" ? (
        <>
          <p className="text-sm text-muted">
            {payStatus === "PENDING"
              ? "Copia los datos del conductor y reporta los últimos dígitos."
              : payStatus === "VERIFYING"
                ? `Referencia ${payRef}. El conductor está validando.`
                : "Pago confirmado."}
          </p>
          {payStatus === "PENDING" && (
            <Button full onClick={() => setOpen(true)}>
              Datos de Pago Móvil
            </Button>
          )}
          {open && <PagoMovilModal onClose={() => setOpen(false)} />}
        </>
      ) : (
        <>
          <p className="text-sm text-muted">
            Paga en efectivo al conductor
            {method === "CASH_VES" ? " en bolívares." : " en dólares."}
          </p>
          <Button full disabled={payStatus !== "PENDING"} onClick={() => confirmCash("passenger")}>
            {payStatus === "PENDING" ? "Ya pagué en efectivo" : "Esperando confirmación"}
          </Button>
        </>
      )}
    </div>
  );
}

function PagoMovilModal({ onClose }: { onClose: () => void }) {
  const assigned = useRapidez((s) => s.assigned);
  const fareUsd = useRapidez((s) => s.fareUsd);
  const submitPayRef = useRapidez((s) => s.submitPayRef);
  const [ref, setRef] = useState("");
  if (!assigned) return null;
  const ves = vesOf(fareUsd);
  const block = `Pago Móvil Rapidez\nBanco: ${assigned.bankName}\nCódigo: ${assigned.bank}\nTeléfono: ${assigned.phone}\nCédula: ${assigned.cedula}\nMonto: ${formatVes(ves)}`;
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/50 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="pago-title">
      <div className="sheet-in w-full max-w-md rounded-t-3xl bg-sheet p-4 sm:rounded-3xl">
        <h2 id="pago-title" className="font-display text-2xl font-extrabold">
          Pago Móvil
        </h2>
        <p className="mt-1 text-lg font-semibold tabular-nums">{formatVes(ves)}</p>
        <ul className="mt-3 divide-y divide-line">
          <CopyRow label="Teléfono" value={prettyPhone(assigned.phone)} copy={assigned.phone} />
          <CopyRow label="Cédula" value={assigned.cedula} copy={assigned.cedula} />
          <CopyRow label="Banco" value={`${assigned.bankName}`} copy={assigned.bank} hint={assigned.bank} />
        </ul>
        <button type="button" onClick={() => void copyText("Datos", block)} className="mt-3 text-sm font-semibold underline">
          Copiar todo
        </button>
        <label className="mt-4 mb-1 block text-sm font-semibold" htmlFor="pay-ref">
          Número de referencia (últimos 6)
        </label>
        <input
          id="pay-ref"
          className="field tabular-nums"
          inputMode="numeric"
          maxLength={6}
          value={ref}
          placeholder="481920"
          onChange={(e) => setRef(e.target.value.replace(/\D/g, "").slice(0, 6))}
        />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button variant="quiet" full onClick={onClose}>
            Cerrar
          </Button>
          <Button
            full
            disabled={ref.length < 4}
            onClick={() => {
              submitPayRef(ref);
              onClose();
              toast("Referencia enviada al conductor");
            }}
          >
            Reportar pago
          </Button>
        </div>
      </div>
    </div>
  );
}

function CopyRow({
  label,
  value,
  copy,
  hint,
}: {
  label: string;
  value: string;
  copy: string;
  hint?: string;
}) {
  return (
    <li className="flex items-center gap-2 py-2">
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-muted">{label}</span>
        <span className="block truncate font-semibold">{value}</span>
        {hint && <span className="text-sm text-muted">Código {hint}</span>}
      </span>
      <button
        type="button"
        aria-label={`Copiar ${label}`}
        onClick={() => void copyText(label, copy)}
        className="grid size-11 place-items-center rounded-full bg-paper text-ink"
      >
        <Copy className="size-4" />
      </button>
    </li>
  );
}

function DriverSheet() {
  const phase = useRapidez((s) => s.phase);
  const assigned = useRapidez((s) => s.assigned);
  const actingId = useRapidez((s) => s.actingId);
  const mine = assigned?.id === actingId;
  if (phase === "done") return <DoneStep />;
  if (mine && phase === "enroute") return <DriverLeg kind="pickup" />;
  if (mine && phase === "arrived") return <DriverArrived />;
  if (mine && phase === "riding") return <DriverLeg kind="dest" />;
  if (mine && phase === "pay") return <DriverPay />;
  if (assigned && !mine && !["pickup", "destination", "confirm", "searching"].includes(phase)) {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-extrabold">Carrera tomada</h1>
        <p className="text-sm text-muted">{assigned.name} ya va con el pasajero. Cambia a Pasajero para seguir el mapa.</p>
      </div>
    );
  }
  return <DriverHome />;
}

function DriverHome() {
  const online = useRapidez((s) => s.online);
  const setOnline = useRapidez((s) => s.setOnline);
  const phase = useRapidez((s) => s.phase);
  const payout = useRapidez((s) => s.payout);
  const setPayout = useRapidez((s) => s.setPayout);
  const actingId = useRapidez((s) => s.actingId);
  const setActing = useRapidez((s) => s.setActing);
  const me = actingDriver(actingId, payout);
  const fleet = roster(payout);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold tracking-wide text-muted uppercase">Conductor · Carora</p>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold">{me.name}</h1>
          <p className="text-sm text-muted">
            {me.plate} · {me.model}
          </p>
          <Seal elite={me.elite} />
          {me.elite && (
            <p className="mt-1 text-sm">Acabas de entrar a la élite. El sello catastrado ya está activo.</p>
          )}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={online}
          aria-label={online ? "Pasar a desconectado" : "Pasar a en línea"}
          onClick={() => {
            armAudio();
            setOnline(!online);
          }}
          className={
            online
              ? "relative mt-1 h-8 w-14 shrink-0 rounded-full bg-brand"
              : "relative mt-1 h-8 w-14 shrink-0 rounded-full bg-line"
          }
        >
          <span
            className={
              online
                ? "absolute top-1 right-1 size-6 rounded-full bg-ink"
                : "absolute top-1 left-1 size-6 rounded-full bg-ink"
            }
          />
        </button>
      </div>
      <p className="text-sm text-muted">
        {online ? "En línea. Si hay solicitud, suena 15 segundos." : "Desconectado. Entra en línea para recibir carreras."}
        {phase === "searching" && !online ? " Hay una solicitud esperando." : ""}
      </p>
      <p className="text-sm font-semibold">Probar con otro mototaxista catastrado</p>
      <div className="flex flex-wrap gap-2">
        {fleet.map((driver) => (
          <button
            key={driver.id}
            type="button"
            onClick={() => setActing(driver.id)}
            className={
              driver.id === actingId
                ? "rounded-full bg-ink px-3 py-2 text-sm font-semibold text-paper"
                : "rounded-full bg-paper px-3 py-2 text-sm font-semibold text-ink"
            }
          >
            {driver.id === "you" ? "Tú · élite" : driver.name.split(" ")[0]}
          </button>
        ))}
      </div>
      {actingId === "you" && (
        <>
          <p className="text-sm font-semibold">Datos de Pago Móvil</p>
          <label className="text-sm text-muted" htmlFor="bank">
            Banco
          </label>
          <select
            id="bank"
            className="field"
            value={payout.bank}
            onChange={(e) => setPayout({ bank: e.target.value })}
          >
            {BANKS.map((bank) => (
              <option key={bank.code} value={bank.code}>
                {bank.code} · {bank.name}
              </option>
            ))}
          </select>
          <label className="text-sm text-muted" htmlFor="phone">
            Teléfono
          </label>
          <input
            id="phone"
            className="field"
            inputMode="numeric"
            value={payout.phone}
            onChange={(e) => setPayout({ phone: e.target.value.replace(/[^\d]/g, "").slice(0, 11) })}
          />
          <label className="text-sm text-muted" htmlFor="cedula">
            Cédula
          </label>
          <input
            id="cedula"
            className="field"
            value={payout.cedula}
            onChange={(e) => setPayout({ cedula: e.target.value.slice(0, 16) })}
          />
        </>
      )}
    </div>
  );
}

function Seal({ elite }: { elite: boolean }) {
  return (
    <p className="mt-1 text-sm font-extrabold tracking-wide text-ink uppercase">
      Sello catastrado{elite ? " · Élite" : ""}
    </p>
  );
}

function DriverLeg({ kind }: { kind: "pickup" | "dest" }) {
  const pickupLabel = useRapidez((s) => s.pickupLabel);
  const markArrived = useRapidez((s) => s.markArrived);
  const finishRide = useRapidez((s) => s.finishRide);
  const driverPos = useRapidez((s) => s.driverPos);
  const pickup = useRapidez((s) => s.pickup);
  const dest = useRapidez((s) => s.dest);
  const target = kind === "pickup" ? pickup : dest;
  const meters = driverPos && target ? haversine(driverPos, target) : 0;
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold tracking-wide text-muted uppercase">Transmitiendo ubicación</p>
      <h1 className="font-display text-3xl font-extrabold">
        {kind === "pickup" ? "Hacia el pasajero" : "Llevando al pasajero"}
      </h1>
      <p className="text-lg font-semibold">{kind === "pickup" ? pickupLabel : <DestText />}</p>
      <p className="font-display text-2xl font-extrabold tabular-nums">{formatKm(meters)}</p>
      {kind === "pickup" ? (
        <Button full onClick={markArrived}>
          Ya llegué
        </Button>
      ) : (
        <Button full onClick={finishRide}>
          Finalizar viaje
        </Button>
      )}
    </div>
  );
}

function DestText() {
  const destLabel = useRapidez((s) => s.destLabel);
  const dest = useRapidez((s) => s.dest);
  return <>{destLabel || (dest ? placeLabel(dest) : "Destino")}</>;
}

function DriverArrived() {
  const pickupLabel = useRapidez((s) => s.pickupLabel);
  const startRide = useRapidez((s) => s.startRide);
  return (
    <div className="flex flex-col gap-3">
      <h1 className="font-display text-3xl font-extrabold">Esperando al pasajero</h1>
      <p className="text-lg font-semibold">{pickupLabel}</p>
      <Button full onClick={startRide}>
        Iniciar viaje
      </Button>
    </div>
  );
}

function DriverPay() {
  const method = useRapidez((s) => s.method);
  const payRef = useRapidez((s) => s.payRef);
  const payStatus = useRapidez((s) => s.payStatus);
  const fareUsd = useRapidez((s) => s.fareUsd);
  const validatePay = useRapidez((s) => s.validatePay);
  const confirmCash = useRapidez((s) => s.confirmCash);
  const cash = method !== "PAGO_MOVIL";
  return (
    <div className="flex flex-col gap-3">
      <h1 className="font-display text-3xl font-extrabold">Cobrar</h1>
      <p className="font-display text-4xl font-extrabold tabular-nums">
        {method === "CASH_USD" ? formatUsd(fareUsd) : formatVes(vesOf(fareUsd))}
      </p>
      {cash ? (
        <Button full onClick={() => confirmCash("driver")}>
          Recibí el efectivo
        </Button>
      ) : payStatus === "PENDING" ? (
        <p className="text-sm text-muted">Esperando el número de referencia del pasajero.</p>
      ) : (
        <>
          <p className="text-sm text-muted">Referencia reportada</p>
          <p className="font-display text-4xl font-extrabold tabular-nums">{payRef}</p>
          <Button full onClick={validatePay}>
            Validar pago
          </Button>
        </>
      )}
    </div>
  );
}

function DoneStep() {
  const rating = useRapidez((s) => s.rating);
  const setRating = useRapidez((s) => s.setRating);
  const resetTrip = useRapidez((s) => s.resetTrip);
  const role = useRapidez((s) => s.role);
  return (
    <div className="flex flex-col gap-3">
      <h1 className="font-display text-3xl font-extrabold">Carrera lista</h1>
      <p className="text-sm text-muted">
        {role === "passenger" ? "¿Cómo estuvo el viaje?" : "Pago confirmado. Ya puedes tomar otra."}
      </p>
      {role === "passenger" && (
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" aria-label={`${n} estrellas`} onClick={() => setRating(n)} className="grid size-11 place-items-center">
              <Star className="size-6 text-ink" fill={n <= rating ? "currentColor" : "none"} />
            </button>
          ))}
        </div>
      )}
      <Button full onClick={resetTrip}>
        Nueva carrera
      </Button>
    </div>
  );
}

function OfferHint() {
  const deadline = useRapidez((s) => s.offerDeadline);
  const setRole = useRapidez((s) => s.setRole);
  return (
    <button
      type="button"
      onClick={() => setRole("driver")}
      className="absolute top-16 right-3 left-3 z-20 rounded-2xl bg-brand px-3 py-3 text-left text-ink shadow-lg"
    >
      <span className="block text-sm font-extrabold">Conductor catastrado en línea</span>
      <span className="text-sm">{deadline ? <Countdown deadline={deadline} /> : "15 s"} para aceptar</span>
    </button>
  );
}

function OfferDialog() {
  const deadline = useRapidez((s) => s.offerDeadline);
  const pickupLabel = useRapidez((s) => s.pickupLabel);
  const fareUsd = useRapidez((s) => s.fareUsd);
  const distanceM = useRapidez((s) => s.distanceM);
  const method = useRapidez((s) => s.method);
  const acceptOffer = useRapidez((s) => s.acceptOffer);
  const rejectOffer = useRapidez((s) => s.rejectOffer);
  const pay =
    method === "PAGO_MOVIL" ? "Pago Móvil" : method === "CASH_USD" ? "Efectivo USD" : "Efectivo Bs";
  return (
    <div className="absolute inset-0 z-40 flex items-end bg-ink/55 p-3" role="dialog" aria-modal="true" aria-labelledby="offer-title">
      <div className="sheet-in w-full rounded-3xl bg-sheet p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-wide text-muted uppercase">Nueva carrera · sello catastrado</p>
            <h2 id="offer-title" className="font-display text-3xl font-extrabold">
              {deadline ? <Countdown deadline={deadline} /> : "15"}
            </h2>
          </div>
          {deadline && <Ring deadline={deadline} />}
        </div>
        <p className="mt-2 text-lg font-semibold">{pickupLabel}</p>
        <p className="text-sm text-muted">
          {formatKm(distanceM)} · {formatUsd(fareUsd)} · {pay}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="quiet" full onClick={rejectOffer}>
            Rechazar
          </Button>
          <Button full onClick={acceptOffer}>
            Aceptar
          </Button>
        </div>
      </div>
    </div>
  );
}

function Countdown({ deadline }: { deadline: number }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [deadline]);
  const left = now == null ? 15 : Math.max(0, Math.ceil((deadline - now) / 1000));
  return <span className="tabular-nums">{left}s</span>;
}

function Ring({ deadline }: { deadline: number }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [deadline]);
  const p = now == null ? 1 : Math.max(0, Math.min(1, (deadline - now) / 15000));
  const r = 22;
  const c = 2 * Math.PI * r;
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true">
      <circle cx="28" cy="28" r={r} fill="none" stroke="var(--color-line)" strokeWidth="4" />
      <circle
        cx="28"
        cy="28"
        r={r}
        fill="none"
        stroke="var(--color-ink)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - p)}
        transform="rotate(-90 28 28)"
      />
    </svg>
  );
}

function Plate({ plate }: { plate: string }) {
  return (
    <span className="rounded-md border-2 border-ink bg-brand px-2 py-1 font-display text-sm font-extrabold tracking-widest">
      {plate}
    </span>
  );
}
