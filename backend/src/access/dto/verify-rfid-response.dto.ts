import { ApiProperty } from '@nestjs/swagger';

class UserInfoDto {
  @ApiProperty({ example: 'BTL-25-11-13' })
  userId: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  email: string;

  @ApiProperty({ example: 'active', enum: ['active', 'suspended', 'terminated'] })
  status: string;

  @ApiProperty({ example: 'staff', enum: ['staff', 'admin', 'intern', 'nysc', 'trainee', 'contractor', 'visitor'] })
  role: string;

  @ApiProperty({ example: 'Engineering', required: false })
  department?: string;

  @ApiProperty({ example: ['rfid', 'keypad'], type: [String] })
  allowedAccessMethods: string[];

  @ApiProperty({ example: ['A1B2C3D4'], type: [String] })
  rfidTags: string[];

  @ApiProperty({ example: [1, 2], type: [Number] })
  fingerprintIds: number[];
}

export class VerifyRfidResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'RFID tag verified successfully' })
  message: string;

  @ApiProperty({
    type: 'object',
    properties: {
      authorized: { type: 'boolean', example: true },
      user: { type: 'object', nullable: true },
      reason: { type: 'string', required: false },
    },
  })
  data: {
    authorized: boolean;
    user: UserInfoDto | null;
    reason?: string;
  };
}

