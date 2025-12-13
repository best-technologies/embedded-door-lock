import { Module, forwardRef } from '@nestjs/common';
import { AccessController } from './access.controller';
import { AccessService } from './access.service';
import { PrismaService } from '../database/prisma.service';
import { LoggerService } from '../common/logger/logger.service';
import { AttendanceModule } from '../attendance/attendance.module';

@Module({
  imports: [forwardRef(() => AttendanceModule)],
  controllers: [AccessController],
  providers: [AccessService, PrismaService, LoggerService],
  exports: [AccessService],
})
export class AccessModule {}

