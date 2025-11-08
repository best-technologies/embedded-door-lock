import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class FilterUsersDto extends PaginationDto {
  @IsOptional()
  @IsEnum(['active', 'suspended', 'terminated'])
  status?: 'active' | 'suspended' | 'terminated';

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  department?: string;
}

