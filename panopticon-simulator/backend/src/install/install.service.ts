import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { readFileSync, existsSync } from 'fs';
import * as path from 'path';
import { StructuredLogger } from '../common/structured-logger.service';
import { renderTemplate } from '../utils/template-renderer';
import { InstallRequestDto } from './dto/install-request.dto';
import {
  InstallConfig,
  resolveInstallConfigFromInput,
} from './install.resolver';

export interface InstallGuideResult {
  tracingJs: string;
  envFile: string;
  dockerCompose: string;
}

@Injectable()
export class InstallService {
  private readonly logger = new StructuredLogger(InstallService.name);

  async generateInstallGuide(input: InstallRequestDto): Promise<InstallGuideResult> {
    const config = await resolveInstallConfigFromInput(input);
    const params = this.buildTemplateParams(config);

    try {
      const tracingTemplate = this.loadTemplate(['node', 'tracing.js.tpl']);
      const envTemplate = this.loadTemplate(['docker', 'env.service.tpl']);
      const composeTemplate = this.loadTemplate([
        'docker',
        'docker-compose.service.tpl',
      ]);

      const tracingJs = config.collectTraces
        ? renderTemplate(tracingTemplate, params)
        : '// Tracing collection disabled for this service.\n';

      return {
        tracingJs,
        envFile: renderTemplate(envTemplate, params),
        dockerCompose: renderTemplate(composeTemplate, params),
      };
    } catch (error) {
      this.logger.error(
        'Failed to generate installer templates',
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        'Unable to generate installation guide. Please check server logs.',
      );
    }
  }

  private buildTemplateParams(config: InstallConfig) {
    return {
      SERVICE_NAME: config.serviceName,
      OTEL_EXPORTER_OTLP_ENDPOINT: config.otelEndpoint,
      PANOPTICON_API_KEY: '<YOUR_API_KEY_HERE>',
      PANOPTICON_TENANT_ID: '<YOUR_TENANT_ID_HERE>',
      PANOPTICON_INGEST_ENDPOINT: 'https://ingest.panopticon.example',
    };
  }

  private loadTemplate(segments: string[]): string {
    const templatePath = this.resolveTemplatePath(segments);
    return readFileSync(templatePath, 'utf8');
  }

  private resolveTemplatePath(segments: string[]): string {
    const candidateRoots = [
      path.resolve(process.cwd(), '..', 'infra', 'templates'),
      path.resolve(__dirname, '../../../../infra/templates'),
    ];

    for (const root of candidateRoots) {
      const fullPath = path.join(root, ...segments);
      if (existsSync(fullPath)) {
        return fullPath;
      }
    }

    throw new Error(
      `Template not found for path segments: ${segments.join('/')}`,
    );
  }
}
