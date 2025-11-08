import { IsEnum } from 'class-validator';

export class UpdateUserStatusDto {
  @IsEnum(['active', 'suspended', 'terminated'])
  status: 'active' | 'suspended' | 'terminated';
}

