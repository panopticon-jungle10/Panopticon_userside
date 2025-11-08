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
  console.log('[TRACES] Received trace data');
  console.log('Trace payload size:', JSON.stringify(req.body).length, 'bytes');

  // Log sample of trace data
  if (req.body && req.body.resourceSpans) {
    console.log('Number of resource spans:', req.body.resourceSpans.length);
  }

  res.status(200).json({ status: 'success' });
});

// Metrics endpoint
app.post('/v1/metrics', (req: Request, res: Response) => {
  console.log('[METRICS] Received metrics data');
  console.log('Metrics payload size:', JSON.stringify(req.body).length, 'bytes');

  // Log sample of metrics data
  if (req.body && req.body.resourceMetrics) {
    console.log('Number of resource metrics:', req.body.resourceMetrics.length);
  }

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
  console.log('[LOGS-FLUENTBIT] Received Fluent-bit logs');

  if (Array.isArray(req.body)) {
    console.log('Number of log entries:', req.body.length);

    // Log first few entries as sample
    req.body.slice(0, 3).forEach((logEntry, index) => {
      console.log(`Log entry ${index + 1}:`, JSON.stringify(logEntry, null, 2));
    });
  } else {
    console.log('Log data:', JSON.stringify(req.body, null, 2));
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
  console.log(`=€ Ingest Server running on port ${PORT}`);
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
