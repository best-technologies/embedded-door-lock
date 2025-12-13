import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { VerifyRfidDto } from '../dto/verify-rfid.dto';
import { VerifyRfidResponseDto } from '../dto/verify-rfid-response.dto';

export function VerifyRfidDecorators() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Verify RFID tag',
      description: 'Check if an RFID tag is registered and return user information if found',
    }),
    ApiBody({ type: VerifyRfidDto }),
    ApiResponse({
      status: 200,
      description: 'RFID verification result',
      type: VerifyRfidResponseDto,
    }),
  );
}

