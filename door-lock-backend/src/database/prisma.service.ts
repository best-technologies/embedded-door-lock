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
    // Prisma 6: Connection URL is read from DATABASE_URL env var automatically
    // No need to pass it here - PrismaClient reads from environment
    super({
      log: ['error', 'warn'],
      errorFormat: 'pretty',
      // Configure connection pool to prevent cached plan issues
      // This helps avoid "cached plan must not change result type" errors
      // after schema migrations
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

  /**
   * Reset database connection to clear cached query plans
   * Useful after schema migrations that change column types
   * to fix "cached plan must not change result type" errors
   */
  async resetConnection() {
    try {
      this.logger.info('Resetting database connection to clear cached plans', 'PrismaService');
      await this.$disconnect();
      await this.$connect();
      this.logger.success('Database connection reset successfully', 'PrismaService');
    } catch (error: any) {
      this.logger.error(
        `Failed to reset database connection: ${error?.message || 'Unknown error'}`,
        error?.stack,
        'PrismaService',
      );
      throw error;
    }
  }
}

