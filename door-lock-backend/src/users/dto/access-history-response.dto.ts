import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AccessHistoryResponseDto {
  @ApiProperty({
    description: 'Timestamp of the access attempt',
    example: '2025-11-08T08:35:12Z',
  })
  timestamp: Date;

  @ApiProperty({
    description: 'Device ID where access was attempted',
    example: 'DOOR-001',
  })
  deviceId: string;

  @ApiProperty({
    description: 'Access method used',
    example: 'rfid',
    enum: ['rfid', 'fingerprint', 'keypad'],
  })
  accessType: string;

  @ApiProperty({
    description: 'Result of the access attempt',
    example: 'success',
    enum: ['success', 'failed'],
  })
  result: string;

  @ApiProperty({
    description: 'Message describing the result',
    example: 'Access granted',
  })
  message: string;
}

