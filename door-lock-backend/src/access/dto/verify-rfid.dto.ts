import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyRfidDto {
  @ApiProperty({
    description: 'RFID tag value to verify (e.g., 0xA1B2C3D4 or A1B2C3D4)',
    example: '0xA1B2C3D4',
  })
  @IsString()
  @IsNotEmpty()
  rfidTag: string;

  @ApiProperty({
    description: 'Device ID making the request',
    example: 'DOOR-001',
    required: false,
  })
  @IsString()
  deviceId?: string;
}

