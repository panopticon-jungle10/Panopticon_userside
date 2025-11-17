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

let initialized = false

export const initBrowserTracing = () => {
  if (initialized || typeof window === 'undefined') {
    return
  }

  const collectorUrl = process.env.NEXT_PUBLIC_OTEL_EXPORTER_OTLP_URL ?? '/otel/v1/traces'
  const exportUrl = collectorUrl.startsWith('http')
    ? collectorUrl
    : `${window.location.origin}${collectorUrl}`
  const deploymentEnv = process.env.NEXT_PUBLIC_DEPLOYMENT_ENV ?? 'development'

  const provider = new WebTracerProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: 'ecommerce-frontend',
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: deploymentEnv,
      'app.id': 'panopticon-userside',
    }),
  })

  const exporter = new OTLPTraceExporter({ url: exportUrl })
  provider.addSpanProcessor(
    new BatchSpanProcessor(exporter, {
      maxQueueSize: 100,
      maxExportBatchSize: 20,
      scheduledDelayMillis: 500,
    }),
  )

  provider.register({
    contextManager: new ZoneContextManager(),
  })

  registerInstrumentations({
    tracerProvider: provider,
    instrumentations: [
      new DocumentLoadInstrumentation(),
      new FetchInstrumentation({
        // 모든 동일 출처 호출에 traceparent 헤더를 붙인다.
        propagateTraceHeaderCorsUrls: [/.*/],
        clearTimingResources: true,
        ignoreUrls: [exportUrl],
      }),
      new XMLHttpRequestInstrumentation({
        propagateTraceHeaderCorsUrls: [/.*/],
        ignoreUrls: [exportUrl],
      }),
    ],
  })

  initialized = true
}
