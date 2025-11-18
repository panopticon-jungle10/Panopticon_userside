// backend/src/logger/logger.module.ts 파일을 새로 생성합니다.

import { Global, Module } from "@nestjs/common";
import { StructuredLogger } from "./structured-logger.service";

@Global()
@Module({
  providers: [StructuredLogger],
  exports: [StructuredLogger],
})
export class LoggerModule {}
