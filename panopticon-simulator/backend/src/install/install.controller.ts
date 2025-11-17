import { Body, Controller, Post } from '@nestjs/common';
import { InstallRequestDto } from './dto/install-request.dto';
import { InstallService } from './install.service';
import { InstallGuideResult } from './install.service';

@Controller('api/install')
export class InstallController {
  constructor(private readonly installService: InstallService) {}

  @Post('generate')
  generate(@Body() body: InstallRequestDto): Promise<InstallGuideResult> {
    return this.installService.generateInstallGuide(body);
  }
}
