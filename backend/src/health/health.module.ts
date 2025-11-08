import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { KeepAliveService } from './keep-alive.service';
import { DatabaseModule } from '../database/database.module';
import { LoggerModule } from '../common/logger/logger.module';
import { AppConfigModule } from '../config/config.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    DatabaseModule,
    LoggerModule,
    AppConfigModule,
  ],
  controllers: [HealthController],
  providers: [HealthService, KeepAliveService],
})
export class HealthModule {}

