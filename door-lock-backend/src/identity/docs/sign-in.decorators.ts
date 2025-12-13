import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { SignInDto } from '../dto/sign-in.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';

export function SignInDecorators() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Sign in',
      description: 'Authenticate a user with email and password. Returns a JWT access token upon successful authentication.',
    }),
    ApiBody({ type: SignInDto }),
    ApiResponse({
      status: 200,
      description: 'User signed in successfully',
      type: AuthResponseDto,
      schema: {
        example: {
          success: true,
          message: 'User signed in successfully',
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
      status: 401,
      description: 'Invalid email or password',
      schema: {
        example: {
          success: false,
          message: 'Invalid email or password',
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'User account is not active',
      schema: {
        example: {
          success: false,
          message: 'User account is suspended',
        },
      },
    }),
  );
}

