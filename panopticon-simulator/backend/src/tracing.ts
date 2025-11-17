import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { Resource } from '@opentelemetry/resources'
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions'
import type { RequestOptions } from 'http'
import { ReadableSpan, Span, SpanProcessor, BatchSpanProcessor } from '@opentelemetry/sdk-trace-node'
import { Context } from '@opentelemetry/api'

class MiddlewareFilterProcessor implements SpanProcessor {
  constructor(private readonly nextProcessor: SpanProcessor) {}

  forceFlush(): Promise<void> {
    return this.nextProcessor.forceFlush()
  }

  onStart(span: Span, parentContext: Context): void {
    this.nextProcessor.onStart(span, parentContext)
  }

  onEnd(span: ReadableSpan): void {
    // Filter out middleware spans
    const spanName = span.name
    const attributes = span.attributes

    // Skip if it's a middleware span
    if (
      attributes['express.type'] === 'middleware' ||
      spanName.startsWith('middleware -')
    ) {
      console.log(`[FILTER] Dropping middleware span: ${spanName}`)
      return // Don't export this span
    }

    console.log(`[FILTER] Passing span: ${spanName}`)
    // Pass non-middleware spans to the next processor
    this.nextProcessor.onEnd(span)
  }

  shutdown(): Promise<void> {
    return this.nextProcessor.shutdown()
  }
}

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR)

const traceEndpoint =
  process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ||
  'http://localhost:3005/producer/v1/traces'

const shouldIgnoreUrl = (url?: string) => {
  if (!url) return false
  return /\/producer\/v1\/(logs|traces)/.test(url)
}

const buildOutgoingUrl = (options: RequestOptions): string => {
  const protocol = options.protocol || 'http:'
  const host = options.hostname || options.host || 'localhost'
  const port = options.port ? `:${options.port}` : ''
  const path = options.path || ''
  return `${protocol}//${host}${port}${path}`
}

// Create the OTLP exporter
const traceExporter = new OTLPTraceExporter({ url: traceEndpoint })

// Wrap the exporter with BatchSpanProcessor
const batchProcessor = new BatchSpanProcessor(traceExporter)

// Wrap with our filter processor
const filterProcessor = new MiddlewareFilterProcessor(batchProcessor)

const sdk = new NodeSDK({
  resource: new Resource({
    [ATTR_SERVICE_NAME]: process.env.SERVICE_NAME || 'ecommerce-backend',
  }),
  spanProcessor: filterProcessor,
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-dns': { enabled: false },
      '@opentelemetry/instrumentation-net': { enabled: false },
      '@opentelemetry/instrumentation-http': {
        ignoreIncomingRequestHook: (request) => shouldIgnoreUrl(request.url),
        ignoreOutgoingRequestHook: (request) =>
          shouldIgnoreUrl(buildOutgoingUrl(request)),
      },
    }),
  ],
})

;(async () => {
  try {
    await sdk.start()
    diag.debug('OTel SDK started')
  } catch (error) {
    diag.error('Failed to start OTel SDK', error)
  }
})()

const shutdown = async () => {
  try {
    await sdk.shutdown()
  } catch (error) {
    diag.error('Error shutting down OTel SDK', error)
  }
}

process.once('SIGTERM', shutdown)
process.once('SIGINT', shutdown)
