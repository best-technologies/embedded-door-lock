import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { LoggerService } from '../common/logger/logger.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  async getHealth() {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: 'unknown',
    };

    try {
      // Check database connection
      await this.prisma.$queryRaw`SELECT 1`;
      health.database = 'connected';
    } catch (error) {
      health.database = 'disconnected';
      health.status = 'degraded';
      this.logger.warn('Database health check failed', 'HealthService');
    }

    return health;
  }
}

