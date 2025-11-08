import { Module, forwardRef } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AccessModule } from '../access/access.module';
import { DatabaseModule } from '../database/database.module';
import { LoggerModule } from '../common/logger/logger.module';

@Module({
  imports: [
    DatabaseModule, // Provides PrismaService
    LoggerModule, // Provides LoggerService
    forwardRef(() => AccessModule),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

