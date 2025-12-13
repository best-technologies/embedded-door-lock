import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { AppConfigModule } from '../../config/config.module';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [AppConfigModule, LoggerModule],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}

