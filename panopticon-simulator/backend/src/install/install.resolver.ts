import { InstallRequestDto } from './dto/install-request.dto';

export interface InstallConfig extends InstallRequestDto {
  otelEndpoint: string;
}

export async function resolveInstallConfigFromInput(
  input: InstallRequestDto,
): Promise<InstallConfig> {
  // 현재는 클라이언트가 보내 준 값을 그대로 사용한다.
  return {
    ...input,
    otelEndpoint: input.otelEndpoint || 'http://panopticon-agent:4318',
  };
}
