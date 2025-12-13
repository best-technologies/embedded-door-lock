import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { VerifyTemporaryCodeDto } from '../dto/verify-temporary-code.dto';
import { VerifyRfidResponseDto } from '../dto/verify-rfid-response.dto';

export function VerifyTemporaryCodeDecorators() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Verify temporary access code',
      description: 'Check if a temporary 6-digit code is valid and return user information if found. Code is deleted after successful verification (single-use).',
    }),
    ApiBody({ type: VerifyTemporaryCodeDto }),
    ApiResponse({
      status: 200,
      description: 'Temporary code verification result',
      type: VerifyRfidResponseDto,
    }),
  );
}

