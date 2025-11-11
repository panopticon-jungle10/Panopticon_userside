import express, { Request, Response } from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import * as $root from "@opentelemetry/otlp-transformer/build/src/generated/root";

const app = express();
const PORT = process.env.PORT || 4318;
const LOG_FILE_PATH = path.resolve(__dirname, "../../logs.log");

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.raw({ type: "application/x-protobuf", limit: "50mb" }));

// Logging middleware
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "ingest-server",
  });
});

// OTLP HTTP Endpoints for traces, metrics, logs
// OpenTelemetry Protocol (OTLP) over HTTP

// Traces endpoint
app.post("/v1/traces", (req: Request, res: Response) => {
  const contentType = req.headers["content-type"];
  let traceData: any = null;

  if (contentType?.includes("application/x-protobuf")) {
    try {
      const buffer = req.body as Buffer;
      const ExportTraceServiceRequest = ($root as any).opentelemetry.proto
        .collector.trace.v1.ExportTraceServiceRequest;
      const decoded = ExportTraceServiceRequest.decode(buffer);
      traceData = ExportTraceServiceRequest.toObject(decoded, {
        longs: String,
        enums: String,
        bytes: String,
      });
    } catch (error) {
      console.error("[TRACES] Error decoding protobuf:", error);
      traceData = null;
    }
  } else {
    traceData = req.body;
  }

  // const spans = transformSpansToCustomSchema(traceData);

  // if (spans.length > 0) {
  //   console.log('━'.repeat(70));
  //   console.log('[TRACES] Structured spans payload');
  //   spans.forEach((span) => console.log(JSON.stringify(span)));
  //   console.log('━'.repeat(70));
  // }

  // res.status(200).json({
  //   status: 'success',
  //   processed: spans.length,
  // });
  console.log("━".repeat(70));
  console.log("[RAW TRACE DATA] OpenTelemetry Traces 원본:");
  console.log(JSON.stringify(traceData, null, 2));
  console.log("━".repeat(70));

  res.status(200).json({
    status: "success",
    processed: traceData?.resourceSpans?.length ?? 0,
  });
});

// Metrics endpoint
app.post("/v1/metrics", (req: Request, res: Response) => {
  const contentType = req.headers["content-type"];
  let metricsData: any = null;

  if (contentType?.includes("application/x-protobuf")) {
    try {
      const buffer = req.body as Buffer;
      const ExportMetricsServiceRequest = ($root as any).opentelemetry.proto
        .collector.metrics.v1.ExportMetricsServiceRequest;
      const decoded = ExportMetricsServiceRequest.decode(buffer);
      metricsData = ExportMetricsServiceRequest.toObject(decoded, {
        longs: String,
        enums: String,
        bytes: String,
      });
    } catch (error) {
      console.error("[METRICS] Error decoding protobuf:", error);
      metricsData = null;
    }
  } else {
    metricsData = req.body;
  }

  console.log("━".repeat(70));
  console.log("[RAW METRICS DATA] OpenTelemetry Metrics 원본:");
  console.log(JSON.stringify(metricsData, null, 2));
  console.log("━".repeat(70));

  // const customMetrics = transformMetricsToCustomSchema(metricsData);

  // if (customMetrics.length > 0) {
  //   console.log('━'.repeat(70));
  //   console.log('[METRICS] Structured metrics payload');
  //   customMetrics.forEach((record) => console.log(JSON.stringify(record)));
  //   console.log('━'.repeat(70));
  // }

  // res.status(200).json({
  //   status: 'success',
  //   processed: customMetrics.length,
  // });
  res.status(200).json({
    status: "success",
    processed: metricsData?.resourceMetrics?.length ?? 0,
  });
});

// Logs endpoint (for OTLP logs)
app.post("/v1/logs", (req: Request, res: Response) => {
  console.log(
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  );
  console.log("[RAW LOG DATA] Fluent-bit logs:");

  // Check if it's OTLP format
  if (req.body && req.body.resourceLogs) {
    console.log("[LOGS-OTLP] Received OTLP logs data");
    console.log("Number of resource logs:", req.body.resourceLogs.length);
  } else {
    // Fluent-bit JSON format
    console.log("[LOGS-JSON] Received Fluent-bit logs");
    console.log(JSON.stringify(req.body, null, 2));
  }

  console.log(
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  );

  res.status(200).json({ status: "success" });
});

type CustomMetricRecord = {
  type: "metric";
  timestamp: string;
  service_name: string;
  environment: string;
  metric_name: string;
  value: number | null;
  labels?: Record<string, string | number>;
};

type CustomSpanRecord = {
  type: "span";
  timestamp: string;
  service_name: string;
  environment: string;
  trace_id: string | null;
  span_id: string | null;
  parent_span_id?: string | null;
  name: string;
  duration_ms: number | null;
  status: string;
  kind?: string;
  http_method?: string;
  http_path?: string;
  http_status_code?: number | null;
  labels?: Record<string, string | number>;
};

type FluentBitRecord = {
  type?: string | null;
  timestamp?: string | null;
  service_name?: string | null;
  environment?: string | null;
  level?: string | null;
  message?: string | null;
  trace_id?: string | null;
  span_id?: string | null;
  http_method?: string | null;
  http_path?: string | null;
  http_status_code?: number | null;
  duration_ms?: number | null;
  client_ip?: string | null;
};

const requiredLogFields: Array<keyof FluentBitRecord> = [
  "timestamp",
  "service_name",
  "message",
];

const kvListToObject = (
  attributes?: Array<{ key: string; value: any }>
): Record<string, any> => {
  if (!attributes) return {};
  const result: Record<string, any> = {};
  attributes.forEach((attr) => {
    if (!attr || typeof attr !== "object") return;
    const value = attr.value || {};
    const normalized =
      value.stringValue ??
      value.doubleValue ??
      value.intValue ??
      value.boolValue ??
      value.bytesValue ??
      value.arrayValue ??
      value.kvlistValue ??
      value;
    result[attr.key] = normalized;
  });
  return result;
};

const nanoToISOString = (nano?: string | number | null) => {
  if (!nano) return new Date().toISOString();
  const asNumber = typeof nano === "string" ? Number(nano) : nano;
  if (!Number.isFinite(asNumber)) return new Date().toISOString();
  const millis = asNumber / 1_000_000;
  return new Date(millis).toISOString();
};

const extractValueFromDataPoint = (dp: any): number | null => {
  if (dp == null) return null;
  const candidates = [
    dp.asDouble,
    dp.asInt,
    dp.value,
    dp.sum,
    dp.count !== undefined && dp.count !== null ? dp.count : undefined,
    dp.gauge,
  ];
  const found = candidates.find(
    (v) => typeof v === "number" || typeof v === "string"
  );
  if (found === undefined || found === null) return null;
  const num = Number(found);
  return Number.isFinite(num) ? num : null;
};

const attributesToLabels = (
  resourceAttrs: Record<string, any>,
  dataPointAttrs?: Array<{ key: string; value: any }>
) => {
  const labels: Record<string, string | number> = {};
  const combined = { ...resourceAttrs, ...kvListToObject(dataPointAttrs) };
  Object.entries(combined).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (typeof value === "object") return;
    labels[key] = value;
  });
  return labels;
};

const transformMetricsToCustomSchema = (
  metricsData: any
): CustomMetricRecord[] => {
  if (!metricsData?.resourceMetrics) return [];
  const records: CustomMetricRecord[] = [];

  metricsData.resourceMetrics.forEach((resourceMetric: any) => {
    const resourceAttrs = kvListToObject(resourceMetric?.resource?.attributes);
    const serviceName =
      (resourceAttrs["service.name"] as string) ||
      (resourceAttrs["host.name"] as string) ||
      "unknown-service";
    const environment =
      (resourceAttrs["deployment.environment"] as string) ||
      (resourceAttrs["environment"] as string) ||
      "unknown";

    resourceMetric.scopeMetrics?.forEach((scopeMetric: any) => {
      scopeMetric.metrics?.forEach((metric: any) => {
        const metricName = metric?.name || "unknown_metric";
        const dataPoints =
          metric?.gauge?.dataPoints ||
          metric?.sum?.dataPoints ||
          metric?.histogram?.dataPoints ||
          [];

        dataPoints.forEach((dp: any) => {
          const value = extractValueFromDataPoint(dp);
          const timestamp = nanoToISOString(dp?.timeUnixNano);
          const labels = attributesToLabels(resourceAttrs, dp?.attributes);

          records.push({
            type: "metric",
            timestamp,
            service_name: serviceName,
            environment,
            metric_name: metricName,
            value,
            labels: Object.keys(labels).length > 0 ? labels : undefined,
          });
        });
      });
    });
  });

  return records;
};

const transformSpansToCustomSchema = (traceData: any): CustomSpanRecord[] => {
  if (!traceData?.resourceSpans) return [];
  const records: CustomSpanRecord[] = [];
  const kindMap: Record<number, string> = {
    0: "SPAN_KIND_UNSPECIFIED",
    1: "INTERNAL",
    2: "SERVER",
    3: "CLIENT",
    4: "PRODUCER",
    5: "CONSUMER",
  };

  traceData.resourceSpans.forEach((resourceSpan: any) => {
    const resourceAttrs = kvListToObject(resourceSpan?.resource?.attributes);
    const serviceName =
      (resourceAttrs["service.name"] as string) ||
      (resourceAttrs["host.name"] as string) ||
      "unknown-service";
    const environment =
      (resourceAttrs["deployment.environment"] as string) ||
      (resourceAttrs["environment"] as string) ||
      "unknown";

    resourceSpan.scopeSpans?.forEach((scopeSpan: any) => {
      scopeSpan.spans?.forEach((span: any) => {
        const attributes = kvListToObject(span?.attributes);
        const start = Number(span?.startTimeUnixNano ?? 0);
        const end = Number(span?.endTimeUnixNano ?? 0);
        const durationMs =
          Number.isFinite(start) && Number.isFinite(end)
            ? Math.max((end - start) / 1_000_000, 0)
            : null;
        const statusCode = span?.status?.code;
        const status =
          statusCode === 2 ? "ERROR" : statusCode === 1 ? "OK" : "UNSET";

        const httpMethod =
          attributes["http.method"] || attributes["http.request.method"];
        const httpPath =
          attributes["http.target"] ||
          attributes["http.route"] ||
          attributes["http.url"] ||
          attributes["http.path"];
        const httpStatus =
          attributes["http.status_code"] ||
          attributes["http.response.status_code"];

        const spanLabels: Record<string, string | number> = {};
        Object.entries(attributes).forEach(([key, value]) => {
          if (
            value === undefined ||
            value === null ||
            typeof value === "object"
          ) {
            return;
          }
          spanLabels[key] = value;
        });

        records.push({
          type: "span",
          timestamp: nanoToISOString(span?.startTimeUnixNano),
          service_name: serviceName,
          environment,
          trace_id: span?.traceId || null,
          span_id: span?.spanId || null,
          parent_span_id: span?.parentSpanId || null,
          name: span?.name || "unknown-span",
          duration_ms: durationMs,
          status,
          kind: kindMap[span?.kind ?? 0],
          http_method: httpMethod,
          http_path: httpPath,
          http_status_code: httpStatus ? Number(httpStatus) : undefined,
          labels: Object.keys(spanLabels).length > 0 ? spanLabels : undefined,
        });
      });
    });
  });

  return records;
};

const sanitizeRecord = (entry: FluentBitRecord): FluentBitRecord => {
  return {
    type: entry.type ?? "log",
    timestamp: entry.timestamp ?? null,
    service_name: entry.service_name ?? "unknown",
    environment: entry.environment ?? "unknown",
    level: entry.level ?? "INFO",
    message: entry.message ?? "",
    trace_id: entry.trace_id ?? null,
    span_id: entry.span_id ?? null,
    http_method: entry.http_method,
    http_path: entry.http_path,
    http_status_code: entry.http_status_code,
    duration_ms: entry.duration_ms,
    client_ip: entry.client_ip,
  };
};

const isValidRecord = (record: FluentBitRecord) =>
  requiredLogFields.every((field) => Boolean(record[field]));

// Fluent-bit endpoint (HTTP output plugin)
app.post("/fluent-bit/logs", (req: Request, res: Response) => {
  // console.log(req.body);

  // if (!Array.isArray(req.body)) {
  //   console.warn("[FLUENT-BIT] Payload must be an array. Ignoring request.");
  //   res
  //     .status(400)
  //     .json({ status: "error", message: "Payload must be an array" });
  //   return;
  // }

  // const sanitized = req.body
  //   .filter((entry) => entry && typeof entry === "object")
  //   .map((entry: FluentBitRecord) => sanitizeRecord(entry));

  // const validRecords = sanitized.filter(isValidRecord);
  // const appRecords = validRecords.filter((record) => record.type === "log");
  // const discarded = sanitized.length - validRecords.length;

  // if (appRecords.length > 0) {
  //   console.log("━".repeat(70));
  //   console.log(
  //     `[FLUENT-BIT] Total ${appRecords.length} log entries (discarded ${discarded})`
  //   );
  //   appRecords.forEach((record) =>
  //     console.log(JSON.stringify(record, null, 2))
  //   );
  //   console.log("━".repeat(70));
  // } else {
  //   console.log("[FLUENT-BIT] No valid log entries in payload.");
  // }

  res.status(200).json({
    status: "success",
  });
});

// Generic data endpoint
app.post("/ingest", (req: Request, res: Response) => {
  const payload = JSON.stringify(req.body);
  fs.appendFile(LOG_FILE_PATH, payload + "\n", (err) => {
    if (err) {
      console.error("[INGEST] Failed to write payload to logs.log:", err);
    }
  });

  res.status(200).json({
    status: "success",
    message: "Data received",
    timestamp: new Date().toISOString(),
  });
});

// Catch-all for debugging
app.all("*", (req: Request, res: Response) => {
  console.log(`[UNKNOWN] Unhandled request: ${req.method} ${req.path}`);
  res.status(404).json({
    error: "Not found",
    method: req.method,
    path: req.path,
  });
});

// Start server
app.listen(PORT, () => {});
