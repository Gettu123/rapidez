import { beepOffer, unlockAudio } from "@/lib/rapidez/audio";
import { NPCS, type DriverProfile } from "@/lib/rapidez/data";
import { SEARCH_RADIUS_M, haversine, type LatLng } from "@/lib/rapidez/geo";
import { useRapidez, youProfile } from "@/lib/rapidez/store";

export interface NearbyDriver extends DriverProfile {
  meters: number;
}

let timer: ReturnType<typeof setInterval> | null = null;
let beepedFor = 0;

export function armAudio() {
  unlockAudio();
}

export function startEngine() {
  if (timer) clearInterval(timer);
  timer = setInterval(() => tick(Date.now()), 320);
  return () => {
    if (timer) clearInterval(timer);
    timer = null;
  };
}

export function listNearby(origin: LatLng, online: boolean): NearbyDriver[] {
  const payout = useRapidez.getState().payout;
  const drivers = online ? [youProfile(payout), ...NPCS] : NPCS;
  return drivers
    .map((driver) => ({ ...driver, meters: haversine(driver.pos, origin) }))
    .filter((driver) => driver.meters <= SEARCH_RADIUS_M)
    .sort((a, b) => a.meters - b.meters);
}

function tick(now: number) {
  const s = useRapidez.getState();

  if (s.phase === "searching" && s.pickup && !s.assigned) {
    if (s.online && !s.offerOpen) {
      s.openOffer(now + 15000);
      if (beepedFor !== s.searchStartedAt) {
        beepedFor = s.searchStartedAt;
        beepOffer();
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate([140, 70, 140, 70, 180]);
        }
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
