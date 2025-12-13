import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { UsersModule } from '../users/users.module';
import { DevicesModule } from '../devices/devices.module';
import { AccessModule } from '../access/access.module';

@Module({
  imports: [UsersModule, DevicesModule, AccessModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}

