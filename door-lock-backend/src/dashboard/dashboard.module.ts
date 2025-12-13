import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { UsersModule } from '../users/users.module';
import { DevicesModule } from '../devices/devices.module';
import { AccessModule } from '../access/access.module';
import { AttendanceModule } from '../attendance/attendance.module';
import { DatabaseModule } from '../database/database.module';
import { LoggerModule } from '../common/logger/logger.module';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [
    UsersModule,
    DevicesModule,
    AccessModule,
    AttendanceModule,
    DatabaseModule,
    LoggerModule,
    IdentityModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}

