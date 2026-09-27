import { createFileRoute } from "@tanstack/react-router";
import { RapidezApp } from "@/components/rapidez/RapidezApp";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <main className="stage">
      <RapidezApp />
      <p className="stage-note">Misma carrera, dos roles. Cambia entre pasajero y conductor.</p>
    </main>
  );
}
