import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  const logger = new Logger('Bootstrap');

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
      logger.log(
        `${method} ${originalUrl} ${res.statusCode} - ${durationMs}ms (${ip || 'unknown'})`,
        'HTTP',
      );
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

  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap();
