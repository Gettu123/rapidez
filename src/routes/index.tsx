import { createFileRoute } from "@tanstack/react-router";
import { LiveApp } from "@/components/rapidez/LiveApp";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <main className="stage">
      <LiveApp />
      <p className="stage-note">Un destino. Primero la moto más cercana, 18 segundos.</p>
    </main>
  );
}
