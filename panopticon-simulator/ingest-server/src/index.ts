import express, { Request, Response } from "express";
import cors from "cors";
import * as $root from "@opentelemetry/otlp-transformer/build/src/generated/root";

const app = express();
const PORT = process.env.PORT || 4318;

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.raw({ type: "application/x-protobuf", limit: "50mb" }));

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "ingest-server",
  });
});

// Traces endpoint - receives OTLP traces (Protobuf or JSON)
app.post("/v1/traces", (req: Request, res: Response) => {
  const contentType = req.headers["content-type"];
  let traceData: any = null;

  // Decode Protobuf if needed
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

  // Output raw data as-is
  console.log("━".repeat(70));
  console.log("[RAW TRACE DATA] OpenTelemetry Traces 원본:");
  console.log(JSON.stringify(traceData, null, 2));
  console.log("━".repeat(70));

  res.status(200).json({
    status: "success",
    processed: traceData?.resourceSpans?.length ?? 0,
  });
});

// Metrics endpoint - receives OTLP metrics (Protobuf or JSON)
app.post("/v1/metrics", (req: Request, res: Response) => {
  const contentType = req.headers["content-type"];
  let metricsData: any = null;

  // Decode Protobuf if needed
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

  // Output raw data as-is
  console.log("━".repeat(70));
  console.log("[RAW METRICS DATA] OpenTelemetry Metrics 원본:");
  console.log(JSON.stringify(metricsData, null, 2));
  console.log("━".repeat(70));

  res.status(200).json({
    status: "success",
    processed: metricsData?.resourceMetrics?.length ?? 0,
  });
});

// Logs endpoint - receives logs from Fluent Bit (JSON format only)
app.post("/v1/logs", (req: Request, res: Response) => {
  console.log("━".repeat(70));
  console.log("[RAW LOG DATA] Fluent Bit Logs 원본:");
  console.log(JSON.stringify(req.body, null, 2));
  console.log("━".repeat(70));

  res.status(200).json({ status: "success" });
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
app.listen(PORT, () => {
  console.log("==================================================");
  console.log(`= Ingest Server running on port ${PORT}`);
  console.log("==================================================");
  console.log("Available endpoints:");
  console.log("  - GET  /health        (Health check)");
  console.log("  - POST /v1/traces     (OTLP traces - auto-decodes Protobuf)");
  console.log("  - POST /v1/metrics    (OTLP metrics - auto-decodes Protobuf)");
  console.log("  - POST /v1/logs       (Fluent Bit logs - JSON only)");
  console.log("==================================================");
});
