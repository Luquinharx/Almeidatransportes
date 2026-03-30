import * as Sentry from "@sentry/react";
import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals";

const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
const appEnvironment = import.meta.env.VITE_APP_ENV || "development";

export function initMonitoring() {
  Sentry.init({
    dsn: sentryDsn || undefined,
    enabled: Boolean(sentryDsn),
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: appEnvironment === "production" ? 0.2 : 1,
    environment: appEnvironment,
  });
}

export function reportWebVitals() {
  const emit = (metric: { name: string; value: number; rating: string }) => {
    if (!sentryDsn) return;

    Sentry.addBreadcrumb({
      category: "web-vitals",
      message: `${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`,
      level: "info",
    });
  };

  onCLS(emit);
  onINP(emit);
  onLCP(emit);
  onFCP(emit);
  onTTFB(emit);
}
