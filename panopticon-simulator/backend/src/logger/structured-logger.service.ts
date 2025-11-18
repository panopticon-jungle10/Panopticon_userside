// backend/src/logger/structured-logger.service.ts 파일을 새로 생성합니다.

import { Injectable, LoggerService } from "@nestjs/common";
import { trace } from "@opentelemetry/api";

interface StructuredLogData {
  type: "log";
  timestamp: string;
  service_name: string;
  environment: string;
  level: string;
  message: string;
  trace_id?: string;
  span_id?: string;
  [key: string]: any;
}

@Injectable()
export class StructuredLogger implements LoggerService {
  private readonly serviceName = process.env.SERVICE_NAME || "backend-service";
  private readonly environment = process.env.NODE_ENV || "development";

  // (선택) 나중에 Trace SDK를 붙이면 자동으로 trace_id / span_id를 채우기 위한 자리입니다.
  private getTraceContext() {
    const span = trace.getActiveSpan();
    if (!span) return {};
    const ctx = span.spanContext();
    return {
      trace_id: ctx.traceId,
      span_id: ctx.spanId,
    };
  }

  private format(level: string, message: any, meta?: Record<string, any>) {
    const payload: StructuredLogData = {
      type: "log", // Fluent Bit에서 type=log만 필터링해서 전송합니다.
      timestamp: new Date().toISOString(),
      service_name: this.serviceName,
      environment: this.environment,
      level: level.toUpperCase(),
      message: String(message),
      ...this.getTraceContext(),
      ...meta,
    };

    console.log(JSON.stringify(payload));
  }

  log(message: any, meta?: any) {
    this.format("info", message, meta);
  }

  error(message: any, trace?: string, meta?: any) {
    this.format("error", message, { trace, ...meta });
  }

  warn(message: any, meta?: any) {
    this.format("warn", message, meta);
  }

  debug(message: any, meta?: any) {
    this.format("debug", message, meta);
  }

  verbose(message: any, meta?: any) {
    this.format("verbose", message, meta);
  }

  // HTTP 요청 전용 헬퍼
  logHttp(params: {
    method: string;
    path: string;
    status: number;
    durationMs: number;
    ip?: string;
  }) {
    const level =
      params.status >= 500 ? "error" : params.status >= 400 ? "warn" : "info";

    this.format(level, `${params.method} ${params.path}`, {
      http_method: params.method,
      http_path: params.path,
      http_status_code: params.status,
      duration_ms: params.durationMs,
      client_ip: params.ip,
    });
  }
}
