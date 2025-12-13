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
      description: 'Register a new user account. A unique userId and employeeId will be auto-generated. A secure password will be automatically generated and sent to the user via email. Returns a JWT access token upon successful registration.',
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
          errors: ['email must be an email', 'role must be a valid enum value'],
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

