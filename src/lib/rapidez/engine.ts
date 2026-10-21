import { beepOffer, unlockAudio } from "@/lib/rapidez/audio";
import { type DriverProfile } from "@/lib/rapidez/data";
import { SEARCH_RADIUS_M, haversine, type LatLng } from "@/lib/rapidez/geo";
import { roster, useRapidez } from "@/lib/rapidez/store";

export interface NearbyDriver extends DriverProfile {
  meters: number;
}

let timer: ReturnType<typeof setInterval> | null = null;

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

export function listNearby(origin: LatLng): NearbyDriver[] {
  const { payout } = useRapidez.getState();
  return roster(payout)
    .map((driver) => ({ ...driver, meters: haversine(driver.pos, origin) }))
    .filter((driver) => driver.registered && driver.meters <= SEARCH_RADIUS_M)
    .sort((a, b) => a.meters - b.meters);
}

function tick(now: number) {
  const s = useRapidez.getState();

  if (s.phase === "searching" && s.pickup && !s.assigned) {
    if (s.offerOpen && s.offerDeadline && now > s.offerDeadline) {
      s.rejectOffer();
      return;
    }
    if (s.online && !s.offerOpen && now >= s.offerCooldown) {
      s.openOffer(now + 15000);
      beepOffer();
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([140, 70, 140, 70, 180]);
      }
    }
    return;
  }

  if (s.phase === "enroute" || s.phase === "riding") s.advance();
}
