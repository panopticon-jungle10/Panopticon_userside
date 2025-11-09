import express, { Request, Response } from 'express';
import cors from 'cors';
import * as $root from '@opentelemetry/otlp-transformer/build/src/generated/root';

const app = express();
const PORT = process.env.PORT || 4318;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.raw({ type: 'application/x-protobuf', limit: '50mb' }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  console.log('[HEALTH] Health check requested');
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'ingest-server',
  });
});

// OTLP HTTP Endpoints for traces, metrics, logs
// OpenTelemetry Protocol (OTLP) over HTTP

// Traces endpoint
app.post('/v1/traces', (req: Request, res: Response) => {
  // LOG RAW TRACE DATA
  console.log('━'.repeat(70));
  console.log('[RAW TRACE DATA] OpenTelemetry Trace 원본:');
  console.log(JSON.stringify(req.body, null, 2));
  console.log('━'.repeat(70));

  // Extract trace information from all spans
  const traceInfo: any = {
    endpoints: new Set(),
    methods: new Set(),
    statusCodes: new Set(),
    spanCount: 0,
    spanNames: new Set(),
  };

  if (req.body?.resourceSpans) {
    req.body.resourceSpans.forEach((resourceSpan: any) => {
      resourceSpan.scopeSpans?.forEach((scopeSpan: any) => {
        scopeSpan.spans?.forEach((span: any) => {
          traceInfo.spanCount++;
          if (span.name) {
            traceInfo.spanNames.add(span.name);
          }

          if (span?.attributes) {
            // HTTP target (endpoint)
            const httpTarget = span.attributes.find((attr: any) => attr.key === 'http.target' || attr.key === 'http.route');
            if (httpTarget) {
              traceInfo.endpoints.add(httpTarget.value.stringValue);
            }

            // HTTP method
            const httpMethod = span.attributes.find((attr: any) => attr.key === 'http.method');
            if (httpMethod) {
              traceInfo.methods.add(httpMethod.value.stringValue);
            }

            // HTTP status code
            const httpStatus = span.attributes.find((attr: any) => attr.key === 'http.status_code');
            if (httpStatus) {
              traceInfo.statusCodes.add(httpStatus.value.intValue);
            }
          }
        });
      });
    });
  }

  const endpoints = Array.from(traceInfo.endpoints);
  const methods = Array.from(traceInfo.methods);
  const spanNames = Array.from(traceInfo.spanNames);

  // Skip health check logs - TEMPORARILY DISABLED FOR DEBUGGING
  // const isHealthCheck = endpoints.includes('/health') || spanNames.some((name: any) => name?.includes('/health'));
  // if (isHealthCheck) {
  //   res.status(200).json({ status: 'success' });
  //   return;
  // }

  console.log('━'.repeat(50));
  console.log('[TRACES] Trace received');
  console.log('Spans:', traceInfo.spanCount);
  console.log('Span names:', spanNames.slice(0, 3).join(', '));
  if (methods.length > 0 && endpoints.length > 0) {
    console.log('API Calls:', methods.map((m, i) => `${m} ${endpoints[i] || endpoints[0]}`).join(', '));
  } else if (endpoints.length > 0) {
    console.log('Endpoints:', endpoints.join(', '));
  } else {
    // No endpoints found, show span names for debugging
    console.log('No HTTP endpoints found. Span names:', spanNames.join(', '));
  }
  if (traceInfo.statusCodes.size > 0) {
    console.log('Status codes:', Array.from(traceInfo.statusCodes).join(', '));
  }
  console.log('━'.repeat(50));

  res.status(200).json({ status: 'success' });
});

// Metrics endpoint
app.post('/v1/metrics', (req: Request, res: Response) => {
  // LOG RAW METRICS DATA
  console.log('━'.repeat(70));
  console.log('[RAW METRICS DATA] OpenTelemetry Metrics 원본:');
  console.log(JSON.stringify(req.body, null, 2));
  console.log('━'.repeat(70));

  const contentType = req.headers['content-type'];
  console.log('[METRICS] Content-Type:', contentType);

  let metricsData: any = null;

  // Handle protobuf format
  if (contentType?.includes('application/x-protobuf')) {
    try {
      // Protobuf data comes as Buffer through express.raw()
      const buffer = req.body as Buffer;
      console.log('[METRICS] Received protobuf data, length:', buffer.length);

      // Access the protobuf message type directly from the namespace
      const ExportMetricsServiceRequest = ($root as any).opentelemetry.proto.collector.metrics.v1.ExportMetricsServiceRequest;
      const decoded = ExportMetricsServiceRequest.decode(buffer);
      metricsData = ExportMetricsServiceRequest.toObject(decoded, {
        longs: String,
        enums: String,
        bytes: String,
      });
      console.log('[METRICS] Deserialized protobuf successfully');
    } catch (error) {
      console.error('[METRICS] Error decoding protobuf:', error);
      metricsData = null;
    }
  } else {
    // Handle JSON format (from backend SDK)
    metricsData = req.body;
  }

  // Extract metric names and values
  const metricNames: string[] = [];
  const metricDetails: any[] = [];

  if (metricsData?.resourceMetrics) {
    metricsData.resourceMetrics.forEach((resourceMetric: any) => {
      if (resourceMetric.scopeMetrics) {
        resourceMetric.scopeMetrics.forEach((scopeMetric: any) => {
          scopeMetric.metrics?.forEach((metric: any) => {
            if (metric.name) {
              metricNames.push(metric.name);

              // Extract values from data points
              let values: any[] = [];
              if (metric.gauge?.dataPoints) {
                values = metric.gauge.dataPoints.map((dp: any) => ({
                  value: dp.asDouble || dp.asInt || 'N/A',
                  timestamp: dp.timeUnixNano
                }));
              } else if (metric.sum?.dataPoints) {
                values = metric.sum.dataPoints.map((dp: any) => ({
                  value: dp.asDouble || dp.asInt || 'N/A',
                  timestamp: dp.timeUnixNano
                }));
              } else if (metric.histogram?.dataPoints) {
                values = metric.histogram.dataPoints.map((dp: any) => ({
                  count: dp.count,
                  sum: dp.sum,
                  timestamp: dp.timeUnixNano
                }));
              }

              metricDetails.push({
                name: metric.name,
                values: values
              });
            }
          });
        });
      }
    });
  }

  console.log('━'.repeat(50));
  console.log('[METRICS] Received metrics data');
  console.log('Metrics:', metricNames.slice(0, 5).join(', '), metricNames.length > 5 ? '...' : '');
  console.log('Total metrics:', metricNames.length);
  console.log('All metric names:', metricNames.join(', '));

  // Print detailed values for system metrics only
  console.log('\n[SYSTEM METRICS VALUES]:');
  metricDetails
    .filter(m => m.name.startsWith('system.'))
    .forEach(metric => {
      const firstValue = metric.values[0];
      if (firstValue) {
        const valueStr = firstValue.value !== undefined ? firstValue.value : `count=${firstValue.count}, sum=${firstValue.sum}`;
        console.log(`  ${metric.name}: ${valueStr}`);
      }
    });

  console.log('━'.repeat(50));

  res.status(200).json({ status: 'success' });
});

// Logs endpoint (for OTLP logs)
app.post('/v1/logs', (req: Request, res: Response) => {
  console.log('[LOGS-OTLP] Received OTLP logs data');
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Logs payload size:', JSON.stringify(req.body).length, 'bytes');

  // Log sample of logs data
  if (req.body && req.body.resourceLogs) {
    console.log('Number of resource logs:', req.body.resourceLogs.length);
  }

  res.status(200).json({ status: 'success' });
});

// Fluent-bit endpoint (HTTP output plugin)
app.post('/fluent-bit/logs', (req: Request, res: Response) => {
  // LOG RAW DATA - 원본 JSON 데이터 출력
  console.log('━'.repeat(70));
  console.log('[RAW DATA] Fluent Bit이 보낸 날것의 데이터:');
  console.log(JSON.stringify(req.body, null, 2));
  console.log('━'.repeat(70));

  if (Array.isArray(req.body)) {
    // Extract actual log messages
    const logMessages = req.body.map((entry: any) => {
      // Parse the log field which contains the actual log line
      const rawLog = entry.log || entry.message || '';

      // Extract the actual application log message (after the timestamp and docker formatting)
      // Format: "2025-11-09T10:56:47.232525011Z stdout F [actual log message]"
      const logMatch = rawLog.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z\s+\w+\s+F\s+(.+)/);
      const logMessage = logMatch ? logMatch[1] : rawLog;

      const namespace = entry.kubernetes?.namespace_name || 'unknown';
      const podName = entry.kubernetes?.pod_name || 'unknown';
      const containerName = entry.kubernetes?.container_name || 'unknown';
      const appLabel = entry.kubernetes?.labels?.app || 'unknown';
      const timestamp = entry.timestamp || entry['@timestamp'] || 'unknown';

      return {
        timestamp,
        namespace,
        podName,
        containerName,
        appLabel,
        log: logMessage
      };
    });

    // Skip if no meaningful logs
    if (logMessages.length === 0) {
      res.status(200).json({ status: 'success' });
      return;
    }

    // Filter out health check logs for cleaner output
    const nonHealthCheckLogs = logMessages.filter(msg =>
      !msg.log.includes('Health check') && !msg.log.includes('GET /health')
    );

    // If we have interesting (non-health) logs, print them
    if (nonHealthCheckLogs.length > 0) {
      console.log('━'.repeat(70));
      console.log(`[LOGS] ${nonHealthCheckLogs.length} log entries from ${nonHealthCheckLogs[0].appLabel}`);
      nonHealthCheckLogs.forEach((msg, i) => {
        // Remove ANSI color codes for cleaner output
        const cleanLog = msg.log.replace(/\u001b\[\d+(?:;\d+)*m/g, '');
        console.log(`  ${cleanLog}`);
      });
      console.log('━'.repeat(70));
    }
  }

  res.status(200).json({ status: 'success' });
});

// Generic data endpoint
app.post('/ingest', (req: Request, res: Response) => {
  console.log('[INGEST] Received generic data');
  console.log('Data:', JSON.stringify(req.body, null, 2));

  res.status(200).json({
    status: 'success',
    message: 'Data received',
    timestamp: new Date().toISOString(),
  });
});

// Catch-all for debugging
app.all('*', (req: Request, res: Response) => {
  console.log(`[UNKNOWN] Unhandled request: ${req.method} ${req.path}`);
  res.status(404).json({
    error: 'Not found',
    method: req.method,
    path: req.path,
  });
});

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`=� Ingest Server running on port ${PORT}`);
  console.log('='.repeat(50));
  console.log('Available endpoints:');
  console.log('  - GET  /health                (Health check)');
  console.log('  - POST /v1/traces             (OTLP traces)');
  console.log('  - POST /v1/metrics            (OTLP metrics)');
  console.log('  - POST /v1/logs               (OTLP logs)');
  console.log('  - POST /fluent-bit/logs       (Fluent-bit logs)');
  console.log('  - POST /ingest                (Generic data)');
  console.log('='.repeat(50));
});
