import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { StructuredLogger } from './common/structured-logger.service';

@Controller()
export class AppController {
  private readonly logger = new StructuredLogger(AppController.name);

  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'ecommerce-backend',
    };
  }
}
