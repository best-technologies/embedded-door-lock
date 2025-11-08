import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({
    description: 'Health status of the service',
    example: 'ok',
    enum: ['ok', 'degraded'],
  })
  status: string;

  @ApiProperty({
    description: 'Current timestamp in ISO format',
    example: '2025-11-08T10:30:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Application uptime in seconds',
    example: 3600.5,
  })
  uptime: number;

  @ApiProperty({
    description: 'Current environment',
    example: 'development',
    enum: ['development', 'production', 'test'],
  })
  environment: string;

  @ApiProperty({
    description: 'Database connection status',
    example: 'connected',
    enum: ['connected', 'disconnected'],
  })
  database: string;
}

