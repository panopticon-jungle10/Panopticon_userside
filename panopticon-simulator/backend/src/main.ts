import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { StructuredLogger } from "./logger/structured-logger.service";
import "./tracing";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, // 부트스트랩 중 로그도 StructuredLogger로 버퍼링합니다.
  });

  const structuredLogger = app.get(StructuredLogger);
  app.useLogger(structuredLogger);

  // CORS 설정
  app.enableCors({
    origin: [
      "https://panopticon-userside.vercel.app",
      "http://localhost:3001", // 로컬 개발용
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  // [추가] HTTP 요청 로깅 미들웨어
  app.use((req: any, res: any, next: any) => {
    const start = process.hrtime.bigint();
    const { method, originalUrl, ip } = req;

    res.on("finish", () => {
      // 헬스 체크 엔드포인트는 로그 노이즈를 줄이기 위해 제외합니다.
      if (originalUrl === "/health") return;

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

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
