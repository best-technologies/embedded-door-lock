import { IsOptional, IsInt, Min, Max } from 'class-validator';

export class UpdateDeviceSettingsDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  autoLockDelay?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  volume?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  ledBrightness?: number;
}

