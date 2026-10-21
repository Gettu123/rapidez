import { createFileRoute } from "@tanstack/react-router";
import { AuthPanel } from "@/components/rapidez/AuthPanel";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  return (
    <main className="grid min-h-dvh place-items-center bg-ink p-6">
      <AuthPanel />
    </main>
  );
}
