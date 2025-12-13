import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserStatus, UserRole, Department } from '@prisma/client';

export function GetAllUsersDecorators() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get all users',
      description: 'Retrieve a paginated list of all users with optional filtering by status, role, and department. Requires admin role.',
    }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Page number (starts from 1)',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Number of items per page',
      example: 20,
    }),
    ApiQuery({
      name: 'status',
      required: false,
      enum: UserStatus,
      description: 'Filter by user status',
    }),
    ApiQuery({
      name: 'role',
      required: false,
      enum: UserRole,
      description: 'Filter by user role',
    }),
    ApiQuery({
      name: 'department',
      required: false,
      enum: Department,
      description: 'Filter by department',
    }),
    ApiResponse({
      status: 200,
      description: 'Users retrieved successfully',
      schema: {
        example: {
          success: true,
          message: 'Users retrieved successfully',
          data: [
            {
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
          ],
          total: 100,
          page: 1,
          limit: 20,
          totalPages: 5,
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
  );
}

