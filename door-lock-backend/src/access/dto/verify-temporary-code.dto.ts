import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyTemporaryCodeDto {
  @ApiProperty({
    description: '6-digit temporary access code',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    description: 'Device ID making the request',
    example: 'DOOR-001',
    required: false,
  })
  @IsString()
  deviceId?: string;
}

