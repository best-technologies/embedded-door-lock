import { Module } from '@nestjs/common';
import { UsersManagementModule } from './users-management/users-management.module';

@Module({
  imports: [UsersManagementModule],
  exports: [UsersManagementModule],
})
export class AdminModule {}

