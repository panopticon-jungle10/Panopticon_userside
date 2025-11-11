import { metrics } from '@opentelemetry/api';

export interface HttpMetricMeta {
  method: string;
  path: string;
  status: number;
  durationMs: number;
}

const meter = metrics.getMeter('ecommerce-backend');

const requestCounter = meter.createCounter('http.server.request.count', {
  description: 'Total number of HTTP requests processed by the backend.',
});

const errorCounter = meter.createCounter('http.server.error.count', {
  description: 'Total number of HTTP requests that resulted in 5xx responses.',
});

const durationHistogram = meter.createHistogram('http.server.duration', {
  description: 'HTTP request duration in milliseconds.',
  unit: 'ms',
});

const buildLabels = (meta: HttpMetricMeta) => {
  const statusClass = `${Math.floor(meta.status / 100)}xx`;
  return {
    http_method: meta.method,
    http_path: meta.path,
    http_status_code: String(meta.status),
    http_status_class: statusClass,
  };
};

export const recordHttpMetrics = (meta: HttpMetricMeta) => {
  // Ignore health checks and system endpoints
  if (meta.path.includes('/health') || meta.path.includes('/metrics')) {
    return;
  }

  const labels = buildLabels(meta);
  requestCounter.add(1, labels);
  durationHistogram.record(meta.durationMs, labels);

  if (meta.status >= 500) {
    errorCounter.add(1, labels);
  }
};
