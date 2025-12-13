import { Module, forwardRef } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { PrismaService } from '../database/prisma.service';
import { AppConfigModule } from '../config/config.module';
import { LoggerService } from '../common/logger/logger.service';
import { AccessModule } from '../access/access.module';

@Module({
  imports: [AppConfigModule, forwardRef(() => AccessModule)],
  controllers: [AttendanceController],
  providers: [AttendanceService, PrismaService, LoggerService],
  exports: [AttendanceService],
})
export class AttendanceModule {}

