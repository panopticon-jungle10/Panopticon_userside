import express, { Request, Response } from 'express';
import cors from 'cors';

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
  // Extract API endpoint from spans
  let apiEndpoint = 'unknown';
  if (req.body?.resourceSpans?.[0]?.scopeSpans?.[0]?.spans) {
    const spans = req.body.resourceSpans[0].scopeSpans[0].spans;
    const span = spans[0];
    if (span?.attributes) {
      const httpTarget = span.attributes.find((attr: any) => attr.key === 'http.target');
      if (httpTarget) {
        apiEndpoint = httpTarget.value.stringValue;
      }
    }
  }

  // Skip health check logs
  if (apiEndpoint === '/health') {
    res.status(200).json({ status: 'success' });
    return;
  }

  console.log('━'.repeat(50));
  console.log('[TRACES] API Call:', apiEndpoint);
  console.log('Payload size:', JSON.stringify(req.body).length, 'bytes');
  console.log('Resource spans:', req.body?.resourceSpans?.length || 0);
  console.log('━'.repeat(50));

  res.status(200).json({ status: 'success' });
});

// Metrics endpoint
app.post('/v1/metrics', (req: Request, res: Response) => {
  // Extract metric names
  const metricNames: string[] = [];
  if (req.body?.resourceMetrics?.[0]?.scopeMetrics) {
    req.body.resourceMetrics[0].scopeMetrics.forEach((scopeMetric: any) => {
      scopeMetric.metrics?.forEach((metric: any) => {
        if (metric.name) metricNames.push(metric.name);
      });
    });
  }

  console.log('━'.repeat(50));
  console.log('[METRICS] Received metrics data');
  console.log('Metrics:', metricNames.slice(0, 5).join(', '), metricNames.length > 5 ? '...' : '');
  console.log('Total metrics:', metricNames.length);
  console.log('━'.repeat(50));

  res.status(200).json({ status: 'success' });
});

// Logs endpoint (for OTLP logs)
app.post('/v1/logs', (req: Request, res: Response) => {
  console.log('[LOGS-OTLP] Received OTLP logs data');
  console.log('Logs payload size:', JSON.stringify(req.body).length, 'bytes');

  // Log sample of logs data
  if (req.body && req.body.resourceLogs) {
    console.log('Number of resource logs:', req.body.resourceLogs.length);
  }

  res.status(200).json({ status: 'success' });
});

// Fluent-bit endpoint (HTTP output plugin)
app.post('/fluent-bit/logs', (req: Request, res: Response) => {
  if (Array.isArray(req.body)) {
    // Extract actual log messages
    const logMessages = req.body.map((entry: any) => {
      const logMessage = entry.log || entry.message || JSON.stringify(entry);
      const namespace = entry.kubernetes?.namespace_name || 'unknown';
      const podName = entry.kubernetes?.pod_name || 'unknown';
      return { namespace, podName, log: logMessage.substring(0, 100) };
    });

    // Skip if no meaningful logs
    if (logMessages.length === 0) {
      res.status(200).json({ status: 'success' });
      return;
    }

    console.log('━'.repeat(50));
    console.log(`[LOGS] ${logMessages.length} log entries from ${logMessages[0].namespace}/${logMessages[0].podName}`);
    logMessages.slice(0, 2).forEach((msg, i) => {
      console.log(`  [${i + 1}] ${msg.log}`);
    });
    console.log('━'.repeat(50));
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
