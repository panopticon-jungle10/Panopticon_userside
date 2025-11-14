// sdk.ts 또는 otel.ts

import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";

// OTLP Exporter endpoint
const OTLP_ENDPOINT =
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4318";

// Configure trace exporter
const traceExporter = new OTLPTraceExporter({
  url: `${OTLP_ENDPOINT}/v1/traces`,
  headers: {},
});

// Configure metric exporter
const metricExporter = new OTLPMetricExporter({
  url: `${OTLP_ENDPOINT}/v1/metrics`,
  headers: {},
});

// Create metric reader
const metricReader = new PeriodicExportingMetricReader({
  exporter: metricExporter,
  exportIntervalMillis: 30000, // Export every 30 seconds
});

// Initialize OpenTelemetry SDK
const sdk = new NodeSDK({
  serviceName: "ecommerce-back",
  traceExporter,
  metricReader,
  instrumentations: [
    getNodeAutoInstrumentations({
      // HTTP 요청 계측 (건강 체크 제외)
      "@opentelemetry/instrumentation-http": {
        enabled: true,
        ignoreIncomingRequestHook: (req) => {
          // Ignore health check, background tasks, system checks
          const url = req.url || "";
          return (
            url.includes("/health") ||
            url.includes("/metrics") ||
            // Options for kubernetes
            req.headers["user-agent"]?.includes("kube-probe")
          );
        },
      },
      // Express 및 NestJS 프레임워크 계측
      "@opentelemetry/instrumentation-express": {
        enabled: true,
      },
      "@opentelemetry/instrumentation-nestjs-core": {
        enabled: true,
      },
      // Node.js 런타임 메트릭 비활성화
      "@opentelemetry/instrumentation-runtime-node": {
        enabled: false,
      },
    }),
  ],
});

// Start SDK
sdk.start();
console.log("[OTEL] OpenTelemetry initialized successfully");

// Graceful shutdown
process.on("SIGTERM", () => {
  sdk
    .shutdown()
    .then(() => console.log("[OTEL] OpenTelemetry shut down successfully"))
    .catch((error) =>
      console.error("[OTEL] Error shutting down OpenTelemetry", error)
    )
    .finally(() => process.exit(0));
});

export default sdk;
