import { IsString, IsEnum, IsOptional, IsDateString } from 'class-validator';

export class CreateAccessLogDto {
  @IsString()
  deviceId: string;

  @IsString()
  userId: string;

  @IsEnum(['rfid', 'fingerprint'])
  method: 'rfid' | 'fingerprint';

  @IsOptional()
  @IsString()
  rfidUid?: string;

  @IsOptional()
  fingerprintId?: number;

  @IsEnum(['success', 'failed'])
  status: 'success' | 'failed';

  @IsOptional()
  @IsDateString()
  timestamp?: string;
}

