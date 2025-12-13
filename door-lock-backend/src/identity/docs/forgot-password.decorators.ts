import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';

export function ForgotPasswordDecorators() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Request password reset',
      description: 'Request a password reset by submitting your email address. A 6-digit verification code will be sent to your email. The code expires in 15 minutes.',
    }),
    ApiBody({ type: ForgotPasswordDto }),
    ApiResponse({
      status: 200,
      description: 'Verification code sent successfully (if email exists)',
      schema: {
        example: {
          success: true,
          message: 'If an account with that email exists, a verification code has been sent.',
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Invalid email format',
      schema: {
        example: {
          success: false,
          message: 'Validation failed',
          errors: ['email must be an email'],
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Failed to send email',
      schema: {
        example: {
          success: false,
          message: 'Failed to send verification code. Please try again.',
        },
      },
    }),
  );
}

