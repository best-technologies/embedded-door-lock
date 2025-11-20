import { IsInt, Min, Max, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateTemporaryCodeDto {
  @ApiProperty({
    description: 'Expiration time in minutes (default: 60 minutes)',
    example: 60,
    minimum: 1,
    maximum: 1440, // 24 hours
    required: false,
    default: 60,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1440)
  expiresInMinutes?: number;
}

