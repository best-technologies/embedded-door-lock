import { ApiProperty } from '@nestjs/swagger';
import { UserInfoDto } from './verify-rfid-response.dto';

export class VerifyFingerprintDataDto {
  @ApiProperty({ example: true })
  authorized: boolean;

  @ApiProperty({ type: UserInfoDto, nullable: true, required: false })
  user: UserInfoDto | null;

  @ApiProperty({ example: 'Fingerprint ID not registered', required: false })
  reason?: string;
}

export class VerifyFingerprintResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Fingerprint ID verified successfully' })
  message: string;

  @ApiProperty({ type: VerifyFingerprintDataDto })
  data: VerifyFingerprintDataDto;
}

