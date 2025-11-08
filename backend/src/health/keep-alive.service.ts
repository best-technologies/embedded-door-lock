import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AppConfigService } from '../config/config.service';
import { LoggerService } from '../common/logger/logger.service';
import * as https from 'https';
import * as http from 'http';

@Injectable()
export class KeepAliveService implements OnModuleInit {
  constructor(
    private readonly configService: AppConfigService,
    private readonly logger: LoggerService,
  ) {}

  private getHealthUrl(): string {
    const healthEndpoint = this.configService.apiHealthEndpoint;
    let baseUrl = this.configService.backendBaseUrl;
    this.logger.info(`Backend base URL: ${baseUrl}`, 'KeepAliveService');
    
    // If BACKEND_BASE_URL is not set, use localhost with current port
    if (!baseUrl || baseUrl.trim() === '') {
      const port = this.configService.port;
      baseUrl = `http://localhost:${port}`;
    }
    
    // Ensure health endpoint starts with /
    const endpoint = healthEndpoint.startsWith('/') 
      ? healthEndpoint 
      : `/${healthEndpoint}`;
    
    // Ensure baseUrl doesn't end with /
    const cleanBaseUrl = baseUrl.endsWith('/') 
      ? baseUrl.slice(0, -1) 
      : baseUrl;
    
    return `${cleanBaseUrl}${endpoint}`;
  }

  onModuleInit() {
    const healthUrl = this.getHealthUrl();
    this.logger.info(
      `Keep-alive service initialized. Will ping ${healthUrl} every 13 minutes`,
      'KeepAliveService',
    );
  }

  // Run every 13 minutes
  @Cron('*/13 * * * *', {
    name: 'keep-alive',
    timeZone: 'UTC',
  })
  async handleKeepAlive() {
    const healthUrl = this.getHealthUrl();

    try {
      this.logger.info(`Pinging health endpoint: ${healthUrl}`, 'KeepAliveService');

      const url = new URL(healthUrl);
      const client = url.protocol === 'https:' ? https : http;

      await new Promise<void>((resolve, reject) => {
        const req = client.get(url.toString(), (res) => {
          let data = '';

          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            if (res.statusCode === 200) {
              this.logger.success(
                `Health check successful: ${res.statusCode}`,
                'KeepAliveService',
              );
              resolve();
            } else {
              this.logger.warn(
                `Health check returned status: ${res.statusCode}`,
                'KeepAliveService',
              );
              resolve();
            }
          });
        });

        req.on('error', (error) => {
          this.logger.error(
            `Health check failed: ${error.message}`,
            error.stack,
            'KeepAliveService',
          );
          reject(error);
        });

        req.setTimeout(10000, () => {
          req.destroy();
          reject(new Error('Health check timeout'));
        });
      });
    } catch (error: any) {
      this.logger.error(
        `Failed to ping health endpoint: ${error?.message || 'Unknown error'}`,
        error?.stack,
        'KeepAliveService',
      );
    }
  }
}

