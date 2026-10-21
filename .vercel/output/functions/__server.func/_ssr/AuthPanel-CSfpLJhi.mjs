import { o as __toESM } from "../_runtime.mjs";
import { J as require_react, x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as signIn, t as authClient } from "./client-1vAx-gM_.mjs";
import { t as GROK_PROVIDERS } from "./server-DxaAbL3o.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/AuthPanel-CSfpLJhi.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AuthPanel() {
	const [mode, setMode] = (0, import_react.useState)("up");
	const [name, setName] = (0, import_react.useState)("");
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)("");
	const [pending, setPending] = (0, import_react.useState)(false);
	async function submit() {
		setError("");
		setPending(true);
		try {
			if (mode === "up") {
				const result = await authClient.signUp.email({
					name: name.trim() || "Rapidez",
					email: email.trim(),
					password,
					callbackURL: "/"
				});
				if (result.error) setError(result.error.message ?? "No se pudo crear la cuenta.");
			} else {
				const result = await authClient.signIn.email({
					email: email.trim(),
					password,
					callbackURL: "/"
				});
				if (result.error) setError(result.error.message ?? "Correo o clave incorrectos.");
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "No se pudo entrar.");
		} finally {
			setPending(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "w-full max-w-sm rounded-3xl bg-sheet p-5 text-ink",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-display text-2xl font-extrabold tracking-wide",
				children: "RAPIDEZ"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-1 font-display text-3xl font-extrabold",
				children: mode === "up" ? "Crear cuenta" : "Entrar"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted",
				children: "Una cuenta, un teléfono. Pasajero o mototaxista."
			}),
			mode === "up" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "mt-4 block text-sm font-semibold",
				children: ["Nombre", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: "field mt-1",
					value: name,
					onChange: (e) => setName(e.target.value)
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "mt-3 block text-sm font-semibold",
				children: ["Correo", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: "field mt-1",
					type: "email",
					autoComplete: "email",
					value: email,
					onChange: (e) => setEmail(e.target.value)
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "mt-3 block text-sm font-semibold",
				children: ["Clave", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: "field mt-1",
					type: "password",
					autoComplete: mode === "up" ? "new-password" : "current-password",
					value: password,
					onChange: (e) => setPassword(e.target.value)
				})]
			}),
			error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm font-medium text-signal",
				children: error
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				disabled: pending || password.length < 8 || !email.includes("@"),
				onClick: () => void submit(),
				className: "mt-4 h-12 w-full rounded-full bg-brand text-base font-semibold text-ink disabled:opacity-40",
				children: pending ? "Espera…" : mode === "up" ? "Crear cuenta" : "Entrar"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "mt-2 h-11 w-full text-sm font-semibold text-muted",
				onClick: () => setMode(mode === "up" ? "in" : "up"),
				children: mode === "up" ? "Ya tengo cuenta" : "Crear una cuenta"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 flex flex-col gap-2",
				children: GROK_PROVIDERS.map((provider) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => signIn(provider.providerId, { callbackURL: "/" }),
					className: "h-12 w-full rounded-full border border-line bg-paper text-sm font-semibold text-ink",
					children: ["Continuar con ", provider.label]
				}, provider.providerId))
			})
		]
	});
}
//#endregion
export { AuthPanel as t };
