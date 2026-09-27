import { haversine, type LatLng } from "@/lib/rapidez/geo";

export interface Place {
  id: string;
  name: string;
  hint: string;
  lat: number;
  lng: number;
}

export interface Bank {
  code: string;
  name: string;
}

export interface DriverProfile {
  id: string;
  name: string;
  plate: string;
  model: string;
  rating: number;
  bank: string;
  bankName: string;
  phone: string;
  cedula: string;
  pos: LatLng;
}

export const BANKS: Bank[] = [
  { code: "0102", name: "Banco de Venezuela" },
  { code: "0108", name: "Banco Provincial" },
  { code: "0105", name: "Banco Mercantil" },
  { code: "0134", name: "Banesco" },
  { code: "0114", name: "Banco del Tesoro" },
];

export const PLACES: Place[] = [
  {
    id: "catedral",
    name: "Catedral San Juan Bautista",
    hint: "frente a la plaza",
    lat: 10.18073,
    lng: -70.08813,
  },
  {
    id: "plaza",
    name: "Plaza Bolívar",
    hint: "lado de la catedral",
    lat: 10.1804,
    lng: -70.08755,
  },
  {
    id: "centro",
    name: "Centro histórico",
    hint: "casco de Carora",
    lat: 10.1789,
    lng: -70.0854,
  },
  {
    id: "hospital",
    name: "Hospital de Carora",
    hint: "frente a emergencias",
    lat: 10.1766,
    lng: -70.0832,
  },
  {
    id: "miranda",
    name: "Av. Francisco de Miranda",
    hint: "sobre la avenida",
    lat: 10.1736,
    lng: -70.0796,
  },
  {
    id: "terminal",
    name: "Terminal de Pasajeros",
    hint: "entrada principal",
    lat: 10.1702,
    lng: -70.0746,
  },
  {
    id: "industrial",
    name: "Zona Industrial",
    hint: "portón de la zona",
    lat: 10.1654,
    lng: -70.0678,
  },
];

export const HOME: LatLng = { lat: PLACES[1].lat, lng: PLACES[1].lng };

export const NPCS: DriverProfile[] = [
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
    pos: { lat: 10.1782, lng: -70.0848 },
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
    pos: { lat: 10.1714, lng: -70.0768 },
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
    pos: { lat: 10.1691, lng: -70.0894 },
  },
];

export const YOU_BASE: DriverProfile = {
  id: "you",
  name: "Carlos Mendoza",
  plate: "RP21EZ",
  model: "Bera SBR",
  rating: 4.97,
  bank: "0102",
  bankName: "Banco de Venezuela",
  phone: "04125551234",
  cedula: "V-18999888",
  pos: { lat: 10.1831, lng: -70.0824 },
};

export function nearestPlace(point: LatLng): { place: Place; meters: number } {
  let place = PLACES[0];
  let meters = Infinity;
  for (const candidate of PLACES) {
    const d = haversine(point, candidate);
    if (d < meters) {
      place = candidate;
      meters = d;
    }
  }
  return { place, meters };
}

export function placeLabel(point: LatLng): string {
  const { place, meters } = nearestPlace(point);
  if (meters < 180) return place.name;
  return `Cerca de ${place.name}`;
}
