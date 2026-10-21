import { create } from "zustand";
import {
  BANKS,
  HOME,
  NPCS,
  YOU_BASE,
  type DriverProfile,
  type Place,
} from "@/lib/rapidez/data";
import { buildRoute, fareFor, haversine, type LatLng } from "@/lib/rapidez/geo";

export type Role = "passenger" | "driver";
export type Phase =
  | "pickup"
  | "destination"
  | "confirm"
  | "searching"
  | "enroute"
  | "arrived"
  | "riding"
  | "pay"
  | "done";
export type PayMethod = "CASH_USD" | "CASH_VES" | "PAGO_MOVIL";
export type PayStatus = "PENDING" | "VERIFYING" | "PAID";

export interface Payout {
  bank: string;
  bankName: string;
  phone: string;
  cedula: string;
}

export interface MapCmd {
  seq: number;
  type: "fly" | "zoom-in" | "zoom-out";
  lat?: number;
  lng?: number;
}

interface RapidezState {
  role: Role;
  online: boolean;
  phase: Phase;
  center: LatLng;
  pickup: LatLng | null;
  pickupRef: string;
  pickupLabel: string;
  dest: LatLng | null;
  destRef: string;
  destLabel: string;
  method: PayMethod;
  fareUsd: number;
  distanceM: number;
  assigned: DriverProfile | null;
  driverPos: LatLng | null;
  ping: number;
  route: LatLng[];
  routeIndex: number;
  proximity: boolean;
  payStatus: PayStatus;
  payRef: string;
  searchStartedAt: number;
  offerOpen: boolean;
  offerDeadline: number | null;
  verifyAt: number | null;
  arrivedAt: number | null;
  rating: number;
  formError: string;
  actingId: string;
  offerCooldown: number;
  useLive: boolean;
  fleet: { id: string; name: string; lat: number; lng: number; elite: boolean }[];
  payout: Payout;
  mapSeq: number;
  mapCmd: MapCmd | null;
  setRole: (role: Role) => void;
  setOnline: (online: boolean) => void;
  setCenter: (center: LatLng) => void;
  setPickupRef: (value: string) => void;
  setDestRef: (value: string) => void;
  setMethod: (method: PayMethod) => void;
  setPayout: (patch: Partial<Payout>) => void;
  setActing: (id: string) => void;
  confirmPickup: () => void;
  confirmDest: () => void;
  requestTrip: () => void;
  acceptOffer: () => void;
  rejectOffer: () => void;
  markArrived: () => void;
  startRide: () => void;
  finishRide: () => void;
  submitPayRef: (ref: string) => void;
  confirmCash: (by: Role) => void;
  validatePay: () => void;
  setRating: (n: number) => void;
  back: () => void;
  cancelTrip: () => void;
  resetTrip: () => void;
  focusPlace: (place: Place) => void;
  zoomBy: (dir: 1 | -1) => void;
  openOffer: (deadline: number) => void;
  assignDriver: (driver: DriverProfile, pickup: LatLng) => void;
  advance: () => void;
  autoStartIfWaiting: (now: number) => void;
  autoValidateIfWaiting: (now: number) => void;
}

const tripDefaults = {
  phase: "pickup" as Phase,
  pickup: null as LatLng | null,
  dest: null as LatLng | null,
  destRef: "",
  destLabel: "",
  method: "PAGO_MOVIL" as PayMethod,
  fareUsd: 0,
  distanceM: 0,
  assigned: null as DriverProfile | null,
  driverPos: null as LatLng | null,
  route: [] as LatLng[],
  routeIndex: 0,
  proximity: false,
  payStatus: "PENDING" as PayStatus,
  payRef: "",
  searchStartedAt: 0,
  offerOpen: false,
  offerDeadline: null as number | null,
  verifyAt: null as number | null,
  arrivedAt: null as number | null,
  rating: 0,
  formError: "",
};

export function youProfile(payout: Payout): DriverProfile {
  return {
    ...YOU_BASE,
    bank: payout.bank,
    bankName: payout.bankName,
    phone: payout.phone,
    cedula: payout.cedula,
  };
}

export const useRapidez = create<RapidezState>((set, get) => ({
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
    cedula: YOU_BASE.cedula,
  },
  mapSeq: 0,
  mapCmd: null,
  ping: 0,
  ...tripDefaults,

  setRole: (role) => set({ role }),
  setOnline: (online) => set({ online }),
  setCenter: (center) => set({ center, formError: "" }),
  setPickupRef: (pickupRef) => set({ pickupRef, formError: "" }),
  setDestRef: (destRef) => set({ destRef }),
  setMethod: (method) => set({ method }),
  setPayout: (patch) =>
    set((s) => {
      const payout = { ...s.payout, ...patch };
      if (patch.bank) {
        const bank = BANKS.find((b) => b.code === patch.bank);
        if (bank) payout.bankName = bank.name;
      }
      return { payout };
    }),
  setActing: (actingId) => set({ actingId, formError: "" }),
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
      formError: "",
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
      formError: "",
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
      formError: "",
    });
  },

  openOffer: (deadline) => set({ offerOpen: true, offerDeadline: deadline }),

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
      arrivedAt: null,
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
      offerCooldown: Date.now() + 8000,
    });
  },

  markArrived: () => set({ phase: "arrived", proximity: true, arrivedAt: Date.now() }),

  startRide: () => {
    const s = get();
    if (!s.pickup || !s.dest) return;
    const from = s.driverPos ?? s.pickup;
    set((prev) => ({
      phase: "riding",
      route: buildRoute(from, s.dest!),
      routeIndex: 0,
      proximity: false,
      ping: prev.ping + 1,
      arrivedAt: null,
    }));
  },

  finishRide: () => set({ phase: "pay" }),

  advance: () => {
    const s = get();
    if ((s.phase !== "enroute" && s.phase !== "riding") || s.route.length < 2) return;
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
        ping: s.ping + 1,
      });
      return;
    }
    if (s.phase === "riding" && done) {
      set({
        routeIndex: next,
        driverPos: s.dest,
        phase: "pay",
        ping: s.ping + 1,
      });
      return;
    }
    set({
      routeIndex: next,
      driverPos: pos,
      proximity: s.phase === "enroute" && dist <= 100 ? true : s.proximity,
      ping: s.ping + 1,
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
    set({ payRef: clean, payStatus: "VERIFYING", verifyAt: null });
  },

  confirmCash: (by) => {
    const s = get();
    if (s.method === "PAGO_MOVIL") return;
    if (by === "driver" || s.assigned?.id !== "you") {
      set({ payStatus: "PAID", phase: "done", verifyAt: null });
      return;
    }
    set({ payStatus: "VERIFYING", verifyAt: null });
  },

  validatePay: () => set({ payStatus: "PAID", phase: "done", verifyAt: null }),

  autoValidateIfWaiting: (now) => {
    const s = get();
    if (s.phase !== "pay" || s.payStatus !== "VERIFYING") return;
    if (s.assigned?.id === "you") return;
    if (!s.verifyAt) {
      set({ verifyAt: now + 1800 });
      return;
    }
    if (now >= s.verifyAt) set({ payStatus: "PAID", phase: "done", verifyAt: null });
  },

  back: () =>
    set((s) => {
      if (s.phase === "destination") return { phase: "pickup", formError: "" };
      if (s.phase === "confirm") return { phase: "destination", formError: "" };
      return {};
    }),

  cancelTrip: () => set({ ...tripDefaults, ping: get().ping + 1 }),

  resetTrip: () =>
    set({
      ...tripDefaults,
      pickupRef: "",
      ping: get().ping + 1,
    }),

  focusPlace: (place) =>
    set((s) => ({
      mapSeq: s.mapSeq + 1,
      mapCmd: { seq: s.mapSeq + 1, type: "fly", lat: place.lat, lng: place.lng },
    })),

  zoomBy: (dir) =>
    set((s) => ({
      mapSeq: s.mapSeq + 1,
      mapCmd: { seq: s.mapSeq + 1, type: dir > 0 ? "zoom-in" : "zoom-out" },
    })),
}));

export function actingDriver(actingId: string, payout: Payout): DriverProfile {
  if (actingId === "you") return youProfile(payout);
  return NPCS.find((driver) => driver.id === actingId) ?? youProfile(payout);
}

export function roster(payout: Payout): DriverProfile[] {
  return [youProfile(payout), ...NPCS];
}
