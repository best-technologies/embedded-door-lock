import { IsInt, Min, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyFingerprintDto {
  @ApiProperty({
    description: 'Fingerprint ID to verify (1, 2, 3, etc.)',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  fingerprintId: number;

  @ApiProperty({
    description: 'Device ID making the request',
    example: 'DOOR-001',
    required: false,
  })
  @IsString()
  @IsOptional()
  deviceId?: string;
}

