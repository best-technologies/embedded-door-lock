import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AppConfigModule } from '../config/config.module';
import { LoggerModule } from '../common/logger/logger.module';

@Global()
@Module({
  imports: [AppConfigModule, LoggerModule],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}

