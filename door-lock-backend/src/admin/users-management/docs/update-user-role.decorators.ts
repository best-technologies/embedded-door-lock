import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UpdateUserRoleDto } from '../dto/update-user-role.dto';

export function UpdateUserRoleDecorators() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Update user role',
      description: 'Update the role of a user. Requires admin role.',
    }),
    ApiParam({
      name: 'userId',
      description: 'User ID (format: BTL-25-11-13)',
      example: 'BTL-25-11-13',
    }),
    ApiBody({
      type: UpdateUserRoleDto,
      description: 'New role to assign to the user',
    }),
    ApiResponse({
      status: 200,
      description: 'User role updated successfully',
      schema: {
        example: {
          success: true,
          message: 'User role updated successfully',
          data: {
            userId: 'BTL-25-11-13',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            role: 'staff',
            status: 'active',
            department: 'Engineering',
            createdAt: '2025-01-15T10:00:00.000Z',
            updatedAt: '2025-01-20T15:30:00.000Z',
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - User already has this role',
      schema: {
        example: {
          statusCode: 400,
          message: 'User already has the role: staff',
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
  );
}

