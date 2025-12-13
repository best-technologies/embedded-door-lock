import { IsString, IsOptional, IsDateString, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHolidayDto {
  @ApiProperty({ description: 'Name of the holiday', example: 'Christmas Day' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Date of the holiday (ISO date string)', example: '2025-12-25' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ description: 'Whether the holiday recurs every year', default: false })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean = false;

  @ApiPropertyOptional({ description: 'Optional description of the holiday' })
  @IsOptional()
  @IsString()
  description?: string;
}

