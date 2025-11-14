// IMPORTANT: Import OTEL configuration FIRST, before any other imports
import '../otel-config';

import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { StructuredLogger } from './common/structured-logger.service';

async function bootstrap() {
  const structuredLogger = new StructuredLogger();
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    logger: structuredLogger,
  });
  app.useLogger(structuredLogger);
  Logger.overrideLogger(structuredLogger);

  // HTTP Request Logging Middleware
  app.use((req: any, res: any, next: any) => {
    const start = process.hrtime.bigint();
    const { method, originalUrl, ip } = req;

    res.on('finish', () => {
      if (originalUrl === '/health') {
        return;
      }
      const elapsed = Number(process.hrtime.bigint() - start) / 1_000_000;
      const durationMs = Math.round(elapsed * 100) / 100;
      structuredLogger.logHttp({
        method,
        path: originalUrl,
        status: res.statusCode,
        durationMs,
        ip,
      });
    });

    next();
  });

  // Enable CORS
  app.enableCors();

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);

  structuredLogger.log(`Application is running on: http://localhost:${port}`);
  structuredLogger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap();
