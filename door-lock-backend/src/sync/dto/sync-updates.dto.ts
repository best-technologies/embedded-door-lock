import { IsDateString, IsOptional } from 'class-validator';

export class SyncUpdatesDto {
  @IsOptional()
  @IsDateString()
  since?: string;
}

