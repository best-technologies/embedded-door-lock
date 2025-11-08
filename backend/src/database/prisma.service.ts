import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AppConfigService } from '../config/config.service';
import { LoggerService } from '../common/logger/logger.service';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(
    private readonly configService: AppConfigService,
    private readonly logger: LoggerService,
  ) {
    super({
      log: ['error', 'warn'],
      errorFormat: 'pretty',
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.success('Database connected successfully', 'PrismaService');
    } catch (error: any) {
      this.logger.error(
        `Failed to connect to database: ${error?.message || 'Unknown error'}`,
        error?.stack,
        'PrismaService',
      );
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.info('Database disconnected successfully', 'PrismaService');
    } catch (error: any) {
      this.logger.error(
        `Error disconnecting from database: ${error?.message || 'Unknown error'}`,
        error?.stack,
        'PrismaService',
      );
    }
  }

  async enableShutdownHooks(app: any) {
    process.on('beforeExit', async () => {
      await app.close();
    });
  }
}

