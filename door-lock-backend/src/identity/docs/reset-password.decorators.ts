import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { ResetPasswordDto } from '../dto/reset-password.dto';

export function ResetPasswordDecorators() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Reset password',
      description: 'Reset your password using the verification code sent to your email. The code must match the email and must not be expired or already used.',
    }),
    ApiBody({ type: ResetPasswordDto }),
    ApiResponse({
      status: 200,
      description: 'Password reset successfully',
      schema: {
        example: {
          success: true,
          message: 'Password has been reset successfully. You can now sign in with your new password.',
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Invalid or expired verification code',
      schema: {
        example: {
          success: false,
          message: 'Invalid or expired verification code',
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Verification code already used',
      schema: {
        example: {
          success: false,
          message: 'Verification code has already been used',
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Verification code expired',
      schema: {
        example: {
          success: false,
          message: 'Verification code has expired. Please request a new one.',
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'User not found',
      schema: {
        example: {
          success: false,
          message: 'User not found',
        },
      },
    }),
  );
}

