import { useState } from "react";
import { GROK_PROVIDERS, authClient, signIn } from "@/lib/auth/client";

export function AuthPanel() {
  const [mode, setMode] = useState<"in" | "up">("up");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit() {
    setError("");
    setPending(true);
    try {
      if (mode === "up") {
        const result = await authClient.signUp.email({
          name: name.trim() || "Rapidez",
          email: email.trim(),
          password,
          callbackURL: "/",
        });
        if (result.error) setError(result.error.message ?? "No se pudo crear la cuenta.");
      } else {
        const result = await authClient.signIn.email({
          email: email.trim(),
          password,
          callbackURL: "/",
        });
        if (result.error) setError(result.error.message ?? "Correo o clave incorrectos.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo entrar.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="w-full max-w-sm rounded-3xl bg-sheet p-5 text-ink">
      <p className="font-display text-2xl font-extrabold tracking-wide">RAPIDEZ</p>
      <h1 className="mt-1 font-display text-3xl font-extrabold">
        {mode === "up" ? "Crear cuenta" : "Entrar"}
      </h1>
      <p className="mt-1 text-sm text-muted">Una cuenta, un teléfono. Pasajero o mototaxista.</p>
      {mode === "up" && (
        <label className="mt-4 block text-sm font-semibold">
          Nombre
          <input className="field mt-1" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
      )}
      <label className="mt-3 block text-sm font-semibold">
        Correo
        <input
          className="field mt-1"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label className="mt-3 block text-sm font-semibold">
        Clave
        <input
          className="field mt-1"
          type="password"
          autoComplete={mode === "up" ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      {error && <p className="mt-2 text-sm font-medium text-signal">{error}</p>}
      <button
        type="button"
        disabled={pending || password.length < 8 || !email.includes("@")}
        onClick={() => void submit()}
        className="mt-4 h-12 w-full rounded-full bg-brand text-base font-semibold text-ink disabled:opacity-40"
      >
        {pending ? "Espera…" : mode === "up" ? "Crear cuenta" : "Entrar"}
      </button>
      <button
        type="button"
        className="mt-2 h-11 w-full text-sm font-semibold text-muted"
        onClick={() => setMode(mode === "up" ? "in" : "up")}
      >
        {mode === "up" ? "Ya tengo cuenta" : "Crear una cuenta"}
      </button>
      <div className="mt-3 flex flex-col gap-2">
        {GROK_PROVIDERS.map((provider) => (
          <button
            key={provider.providerId}
            type="button"
            onClick={() => signIn(provider.providerId, { callbackURL: "/" })}
            className="h-12 w-full rounded-full border border-line bg-paper text-sm font-semibold text-ink"
          >
            Continuar con {provider.label}
          </button>
        ))}
      </div>
    </div>
  );
}
