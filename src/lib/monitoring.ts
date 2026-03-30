const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
const appEnvironment = import.meta.env.VITE_APP_ENV || "development";

type WebVitalMetric = {
  name: string;
  value: number;
  rating: string;
};

export async function initMonitoring() {
  if (!sentryDsn) return;

  const Sentry = await import("@sentry/react");
  Sentry.init({
    dsn: sentryDsn,
    enabled: true,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: appEnvironment === "production" ? 0.2 : 1,
    environment: appEnvironment,
  });
}

export async function reportWebVitals() {
  if (!sentryDsn) return;

  const [{ onCLS, onFCP, onINP, onLCP, onTTFB }, Sentry] = await Promise.all([
    import("web-vitals"),
    import("@sentry/react"),
  ]);

  const emit = (metric: WebVitalMetric) => {
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
