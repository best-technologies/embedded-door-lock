import { Module } from '@nestjs/common';
import { UsersManagementController } from './users-management.controller';
import { UsersManagementService } from './users-management.service';
import { PrismaService } from '../../database/prisma.service';
import { LoggerModule } from '../../common/logger/logger.module';
import { EmailModule } from '../../common/email/email.module';

@Module({
  imports: [LoggerModule, EmailModule],
  controllers: [UsersManagementController],
  providers: [UsersManagementService, PrismaService],
  exports: [UsersManagementService],
})
export class UsersManagementModule {}

