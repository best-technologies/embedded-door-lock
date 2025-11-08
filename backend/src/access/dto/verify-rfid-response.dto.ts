import { ApiProperty } from '@nestjs/swagger';

export class UserInfoDto {
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

export class VerifyRfidDataDto {
  @ApiProperty({ example: true })
  authorized: boolean;

  @ApiProperty({ type: UserInfoDto, nullable: true, required: false })
  user: UserInfoDto | null;

  @ApiProperty({ example: 'RFID tag not registered', required: false })
  reason?: string;
}

export class VerifyRfidResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'RFID tag verified successfully' })
  message: string;

  @ApiProperty({ type: VerifyRfidDataDto })
  data: VerifyRfidDataDto;
}

