import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initMonitoring, reportWebVitals } from "@/lib/monitoring";

async function cleanupStaleServiceWorkers() {
	if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

	try {
		const registrations = await navigator.serviceWorker.getRegistrations();
		await Promise.all(registrations.map((registration) => registration.unregister()));
	} catch {
		// Ignore cleanup errors: this is a defensive best effort.
	}

	if ("caches" in window) {
		try {
			const cacheKeys = await caches.keys();
			await Promise.all(cacheKeys.map((key) => caches.delete(key)));
		} catch {
			// Ignore cache cleanup errors as well.
		}
	}
}

void initMonitoring();
void reportWebVitals();
void cleanupStaleServiceWorkers();

createRoot(document.getElementById("root")!).render(<App />);
