import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.WARN);

const collectorEndpoint =
  process.env.OTEL_COLLECTOR_OTLP_HTTP_ENDPOINT ||
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
  "http://otel-collector:4318/v1/traces";

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]:
      process.env.SERVICE_NAME || "payment-service",
  }),
  traceExporter: new OTLPTraceExporter({
    url: collectorEndpoint,
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

const start = async () => {
  try {
    await sdk.start();
  } catch (error) {
    diag.error("Failed to initialize OpenTelemetry SDK", error);
  }
};

start();

const shutdown = async () => {
  try {
    await sdk.shutdown();
  } catch (error) {
    diag.error("Error shutting down OpenTelemetry SDK", error);
  }
};

process.once("SIGTERM", shutdown);
process.once("SIGINT", shutdown);
