import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { VerifyFingerprintDto } from '../dto/verify-fingerprint.dto';
import { VerifyFingerprintResponseDto } from '../dto/verify-fingerprint-response.dto';

export function VerifyFingerprintDecorators() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Verify fingerprint ID',
      description: 'Check if a fingerprint ID is registered and return user information if found',
    }),
    ApiBody({ type: VerifyFingerprintDto }),
    ApiResponse({
      status: 200,
      description: 'Fingerprint verification result',
      type: VerifyFingerprintResponseDto,
    }),
  );
}

