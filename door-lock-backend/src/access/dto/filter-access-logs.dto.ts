import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class FilterAccessLogsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsEnum(['success', 'failed'])
  status?: 'success' | 'failed';

  @IsOptional()
  @IsEnum(['rfid', 'fingerprint'])
  method?: 'rfid' | 'fingerprint';

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}

