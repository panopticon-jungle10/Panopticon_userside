import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

// OTLP Exporter endpoint (ingest-server)
const OTLP_ENDPOINT = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318';

console.log('[OTEL] Initializing OpenTelemetry...');
console.log(`[OTEL] OTLP Endpoint: ${OTLP_ENDPOINT}`);

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
  exportIntervalMillis: 10000, // Export every 10 seconds
});

// Initialize OpenTelemetry SDK
const sdk = new NodeSDK({
  serviceName: 'ecommerce-backend',
  traceExporter,
  metricReader,
  instrumentations: [
    getNodeAutoInstrumentations({
      // Enable all auto-instrumentations
      '@opentelemetry/instrumentation-http': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-express': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-nestjs-core': {
        enabled: true,
      },
    }),
  ],
});

// Start SDK
sdk.start();
console.log('[OTEL] OpenTelemetry initialized successfully');

// Graceful shutdown
process.on('SIGTERM', () => {
  sdk
    .shutdown()
    .then(() => console.log('[OTEL] OpenTelemetry shut down successfully'))
    .catch((error) => console.error('[OTEL] Error shutting down OpenTelemetry', error))
    .finally(() => process.exit(0));
});

export default sdk;
