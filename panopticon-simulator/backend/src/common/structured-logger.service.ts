import { ConsoleLogger, Injectable } from "@nestjs/common";
import { context, trace } from "@opentelemetry/api";

type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

interface HttpMeta {
  method: string;
  path: string;
  status: number;
  durationMs: number;
  ip?: string;
}

@Injectable()
export class StructuredLogger extends ConsoleLogger {
  private readonly serviceName = process.env.SERVICE_NAME ?? "order-service";
  private readonly environment =
    process.env.RUNTIME_ENV ?? process.env.NODE_ENV ?? "local";
  private readonly defaultContext?: string;

  constructor(contextName?: string) {
    super(contextName);
    this.defaultContext = contextName;
  }

  private buildPayload(
    level: LogLevel,
    message: string,
    extra?: Record<string, unknown>
  ) {
    const span = trace.getSpan(context.active());
    const spanContext = span?.spanContext();

    return {
      type: "log",
      timestamp: new Date().toISOString(),
      service_name: this.serviceName,
      environment: this.environment,
      level,
      message,
      trace_id: spanContext?.traceId ?? null,
      span_id: spanContext?.spanId ?? null,
      ...(extra ?? {}),
    };
  }

  private withContext(
    extra: Record<string, unknown> = {},
    contextName?: string
  ) {
    const contextValue = contextName ?? this.defaultContext;
    return contextValue ? { ...extra, context: contextValue } : extra;
  }

  private emit(
    level: LogLevel,
    message: string,
    extra?: Record<string, unknown>
  ) {
    const payload = this.buildPayload(level, message, extra);
    const isHttpLog =
      typeof (payload as any).http_method === "string" &&
      typeof (payload as any).http_path === "string";
    const messageText =
      typeof payload.message === "string"
        ? payload.message.toLowerCase()
        : "";

    if (level === "INFO" && !isHttpLog && messageText.includes("health")) {
      return;
    }

    process.stdout.write(JSON.stringify(payload) + "\n");
  }

  override log(message: any, contextName?: string) {
    this.emit("INFO", message, this.withContext(undefined, contextName));
  }

  override warn(message: any, contextName?: string) {
    this.emit("WARN", message, this.withContext(undefined, contextName));
  }

  override error(message: any, stack?: string, contextName?: string) {
    const extra: Record<string, unknown> = stack ? { stack } : {};
    this.emit("ERROR", message, this.withContext(extra, contextName));
  }

  override debug(message: any, contextName?: string) {
    this.emit("DEBUG", message, this.withContext(undefined, contextName));
  }

  logHttp(meta: HttpMeta) {
    this.emit("INFO", `${meta.method} ${meta.path}`, {
      http_method: meta.method,
      http_path: meta.path,
      http_status_code: meta.status,
      duration_ms: meta.durationMs,
      client_ip: meta.ip,
    });
  }
}
