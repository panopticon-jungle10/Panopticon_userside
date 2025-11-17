import 'zone.js'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web'
import { Resource } from '@opentelemetry/resources'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'
import { registerInstrumentations } from '@opentelemetry/instrumentation'
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load'
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch'
import { XMLHttpRequestInstrumentation } from '@opentelemetry/instrumentation-xml-http-request'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { ZoneContextManager } from '@opentelemetry/context-zone-peer-dep'
import { W3CTraceContextPropagator } from '@opentelemetry/core'
import { propagation } from '@opentelemetry/api'

let initialized = false

function init() {
  if (initialized || typeof window === 'undefined') {
    return
  }

  const endpoint =
    process.env.NEXT_PUBLIC_OTEL_EXPORTER_OTLP_URL ||
    'http://localhost:3005/producer/v1/traces'
  const exportUrl = endpoint.startsWith('http')
    ? endpoint
    : `${window.location.origin}${endpoint}`

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

  console.log('[OTEL Browser] Initializing with:', {
    exportUrl,
    apiUrl,
    serviceName: 'ecommerce-frontend',
    env: process.env.NEXT_PUBLIC_DEPLOYMENT_ENV || 'development'
  })

  const provider = new WebTracerProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: 'ecommerce-frontend',
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]:
        process.env.NEXT_PUBLIC_DEPLOYMENT_ENV || 'development',
    }),
  })

  provider.addSpanProcessor(
    new BatchSpanProcessor(
      new OTLPTraceExporter({ url: exportUrl }),
      {
        maxQueueSize: 100,
        maxExportBatchSize: 20,
        scheduledDelayMillis: 500,
      },
    ),
  )

  // Set up W3C Trace Context propagator
  propagation.setGlobalPropagator(new W3CTraceContextPropagator())

  provider.register({ contextManager: new ZoneContextManager() })

  registerInstrumentations({
    tracerProvider: provider,
    instrumentations: [
      new DocumentLoadInstrumentation(),
      new FetchInstrumentation({
        propagateTraceHeaderCorsUrls: [
          new RegExp(apiUrl.replace(/https?:\/\//, 'https?://')),
          /localhost:\d+/,
          /.*/
        ],
        clearTimingResources: true,
        applyCustomAttributesOnSpan: (span, request) => {
          const url = typeof request === 'string' ? request : (request as Request).url
          console.log('[OTEL] Fetch request:', {
            url,
            traceId: span.spanContext().traceId,
            spanId: span.spanContext().spanId,
          })
        },
      }),
      new XMLHttpRequestInstrumentation({
        propagateTraceHeaderCorsUrls: [
          new RegExp(apiUrl.replace(/https?:\/\//, 'https?://')),
          /localhost:\d+/,
          /.*/
        ],
        clearTimingResources: true,
      }),
    ],
  })

  initialized = true
}

// Initialize immediately when module is loaded (browser only)
if (typeof window !== 'undefined') {
  init()
}

// Export for manual initialization if needed
export function initBrowserTracing() {
  init()
}
