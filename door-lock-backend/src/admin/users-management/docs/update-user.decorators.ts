import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UpdateUserDto } from '../dto/update-user.dto';

export function UpdateUserDecorators() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Update user information',
      description: 'Update user information including name, email, status, role, department, and other fields. Requires admin role.',
    }),
    ApiParam({
      name: 'userId',
      description: 'User ID (format: BTL-25-11-13)',
      example: 'BTL-25-11-13',
    }),
    ApiBody({
      type: UpdateUserDto,
      description: 'User information to update (all fields optional)',
    }),
    ApiResponse({
      status: 200,
      description: 'User updated successfully',
      schema: {
        example: {
          success: true,
          message: 'User updated successfully',
          data: {
            id: 'clx1234567890',
            userId: 'BTL-25-11-13',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phoneNumber: '+1234567890',
            gender: 'M',
            employeeId: 'EMP001',
            status: 'active',
            role: 'staff',
            department: 'Engineering',
            accessLevel: 1,
            allowedAccessMethods: ['rfid', 'fingerprint'],
            lastAccessAt: '2025-01-20T08:30:00.000Z',
            createdAt: '2025-01-15T10:00:00.000Z',
            updatedAt: '2025-01-20T15:30:00.000Z',
            profilePicture: {
              secureUrl: 'https://example.com/image.jpg',
              publicId: 'profile-123',
            },
            rfidTags: ['A1B2C3D4'],
            fingerprintIds: [1, 2],
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - Invalid data',
      schema: {
        example: {
          statusCode: 400,
          message: ['email must be an email', 'accessLevel must be a number'],
          error: 'Bad Request',
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing token',
      schema: {
        example: {
          statusCode: 401,
          message: 'Unauthorized',
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Admin access required',
      schema: {
        example: {
          statusCode: 403,
          message: 'Insufficient permissions. Admin access required.',
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'User not found',
      schema: {
        example: {
          statusCode: 404,
          message: 'User with ID BTL-25-11-13 not found',
          error: 'Not Found',
        },
      },
    }),
    ApiResponse({
      status: 409,
      description: 'Conflict - Email or Employee ID already in use',
      schema: {
        example: {
          statusCode: 409,
          message: 'Email john.doe@example.com is already in use',
          error: 'Conflict',
        },
      },
    }),
  );
}

