import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class InstallRequestDto {
  @IsString()
  serviceName: string;

  @IsBoolean()
  collectTraces: boolean;

  @IsBoolean()
  collectLogs: boolean;

  @IsOptional()
  @IsString()
  otelEndpoint?: string;
}
