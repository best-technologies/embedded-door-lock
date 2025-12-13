import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { RegisterDto } from '../dto/register.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';

export function RegisterDecorators() {
  return applyDecorators(
    HttpCode(HttpStatus.CREATED),
    ApiOperation({
      summary: 'Register a new user',
      description: 'Register a new user account. A unique userId will be auto-generated based on role and current date. Returns a JWT access token upon successful registration.',
    }),
    ApiBody({ type: RegisterDto }),
    ApiResponse({
      status: 201,
      description: 'User registered successfully',
      type: AuthResponseDto,
      schema: {
        example: {
          success: true,
          message: 'User registered successfully',
          data: [
            {
              accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              user: {
                userId: 'BTL-25-11-13',
                firstName: 'Mayowa',
                lastName: 'Bernard',
                email: 'bernardmayowaa@gmail.com',
                status: 'active',
                role: 'staff',
              },
            },
          ],
          total: 1,
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Invalid input data',
      schema: {
        example: {
          success: false,
          message: 'Validation failed',
          errors: ['email must be an email', 'password must be longer than or equal to 6 characters'],
        },
      },
    }),
    ApiResponse({
      status: 409,
      description: 'User with email already exists',
      schema: {
        example: {
          success: false,
          message: 'User with this email already exists',
        },
      },
    }),
  );
}

