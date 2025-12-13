import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterFingerprintDto {
  @ApiProperty({
    description: 'Fingerprint ID from the device (1, 2, 3, etc.)',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  fingerprintId: number;
}

