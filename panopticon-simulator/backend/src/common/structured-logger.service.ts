import { ConsoleLogger, Injectable } from '@nestjs/common'

interface HttpMeta {
  method: string
  path: string
  status: number
  durationMs: number
  ip?: string
}

@Injectable()
export class StructuredLogger extends ConsoleLogger {
  private readonly serviceName = process.env.SERVICE_NAME ?? 'ecommerce-backend'
  private readonly environment =
    process.env.RUNTIME_ENV ?? process.env.NODE_ENV ?? 'local'
  private readonly logEndpoint =
    process.env.LOG_ENDPOINT ?? 'http://localhost:3005/producer/v1/logs'

  private async forward(payload: Record<string, unknown>) {
    try {
      const response = await fetch(this.logEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        super.error(`Failed to forward log: HTTP ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      super.error(`Failed to forward log to ${this.logEndpoint}: ${(error as Error).message}`)
    }
  }

  private emitPayload(level: string, message: string, extra?: Record<string, unknown>) {
    const payload = {
      timestamp: new Date().toISOString(),
      service_name: this.serviceName,
      environment: this.environment,
      signal_type: 'log',
      level,
      message,
      ...(extra ?? {}),
    }
    process.stdout.write(JSON.stringify(payload) + '\n')
    this.forward(payload)
  }

  override log(message: any, context?: string) {
    this.emitPayload('INFO', message, context ? { context } : undefined)
  }

  override warn(message: any, context?: string) {
    this.emitPayload('WARN', message, context ? { context } : undefined)
  }

  override error(message: any, stack?: string, context?: string) {
    const extra: Record<string, unknown> = {}
    if (stack) extra.stack = stack
    if (context) extra.context = context
    this.emitPayload('ERROR', message, extra)
  }

  override debug(message: any, context?: string) {
    this.emitPayload('DEBUG', message, context ? { context } : undefined)
  }

  logHttp(meta: HttpMeta) {
    this.emitPayload('INFO', `${meta.method} ${meta.path}`, {
      http_method: meta.method,
      http_path: meta.path,
      http_status_code: meta.status,
      duration_ms: meta.durationMs,
      client_ip: meta.ip,
    })
  }
}
