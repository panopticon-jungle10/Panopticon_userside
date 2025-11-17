import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: '${OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces',
  }),
  resource: {
    attributes: {
      'service.name': '${SERVICE_NAME}',
    },
  },
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk
  .start()
  .then(() => console.log('[OTEL] ${SERVICE_NAME} tracing started'))
  .catch((err) => console.error('Error starting OTEL SDK', err));
