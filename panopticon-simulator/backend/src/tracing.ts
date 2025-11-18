// 파일 위치 예시: backend/src/tracing.ts

// backend/src/tracing.ts
import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import {
  defaultResource,
  resourceFromAttributes,
} from "@opentelemetry/resources";
import {
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
} from "@opentelemetry/semantic-conventions";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-node";
import type { ExpressLayerType } from "@opentelemetry/instrumentation-express";
const diagLog = process.env.PANOPTICON_DIAG_LOG;
// 디버그 로그 보고 싶으면 PANOPTICON_DIAG_LOG=true 주면 됨
if (diagLog && diagLog === "true") {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
}

const serviceName =
  process.env.OTEL_SERVICE_NAME ||
  process.env.SERVICE_NAME ||
  "test-service-backend";

// 네가 준 OTLP 엔드포인트 (full URL 그대로 사용)
// Docker 환경에서는 host.docker.internal을 사용해야 호스트 머신에 접근 가능
const defaultTracesEndpoint = "http://127.0.0.1:4318/v1/traces";

const tracesEndpoint =
  process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || defaultTracesEndpoint;

const traceExporter = new OTLPTraceExporter({
  url: tracesEndpoint,
});

// BatchSpanProcessor 설정 - 테스트를 위해 더 자주 export
const spanProcessor = new BatchSpanProcessor(traceExporter, {
  maxQueueSize: 100,
  maxExportBatchSize: 10,
  scheduledDelayMillis: 1000, // 2초마다 전송
});

const detectedResource = resourceFromAttributes({
  [SEMRESATTRS_SERVICE_NAME]: serviceName,
  [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || "prod",
});

const sdk = new NodeSDK({
  resource: defaultResource().merge(detectedResource),
  spanProcessor,
  instrumentations: [
    getNodeAutoInstrumentations({
      "@opentelemetry/instrumentation-http": {
        ignoreIncomingRequestHook: (req: { url?: string }) => {
          const url = req.url || "";
          return url.includes("/health") || url.includes("/ready");
        },
      },
      "@opentelemetry/instrumentation-express": {
        ignoreLayersType: ["middleware"] as ExpressLayerType[],
      },
    }),
  ],
});

// OTEL은 선택적 기능 - 실패해도 앱은 계속 실행
try {
  sdk.start();
  console.log(
    `[OTEL] NodeSDK started. service.name=${serviceName}, tracesEndpoint=${tracesEndpoint}`
  );
} catch (error) {
  console.error("[OTEL] Failed to start - tracing disabled", error);
  // 에러를 삼키고 계속 진행
}

// SDK 초기화 실패 시 앱 종료 방지
process.on("uncaughtException", (error) => {
  if (error.message?.includes("OTLP") || error.message?.includes("trace")) {
    console.error("[OTEL] Tracing error - continuing without traces", error);
    return; // 앱 종료 방지
  }
  throw error; // 다른 에러는 정상 처리
});

// 종료 시 안전하게 플러시
const shutdown = async () => {
  try {
    await sdk.shutdown();
    console.log("[OTEL] NodeSDK shut down");
    process.exit(0);
  } catch (error) {
    console.error("[OTEL] Error shutting down NodeSDK", error);
    process.exit(1);
  }
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
