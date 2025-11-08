import { Module } from '@nestjs/common';
import { AccessController } from './access.controller';
import { AccessService } from './access.service';
import { PrismaService } from '../database/prisma.service';
import { LoggerService } from '../common/logger/logger.service';

@Module({
  controllers: [AccessController],
  providers: [AccessService, PrismaService, LoggerService],
  exports: [AccessService],
})
export class AccessModule {}

