import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

export function SummaryDecorators() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get dashboard summary',
      description: 'Get basic dashboard summary statistics. Requires admin role.',
    }),
    ApiResponse({
      status: 200,
      description: 'Dashboard summary retrieved successfully',
      schema: {
        example: {
          totalUsers: 100,
          activeUsers: 95,
          suspendedUsers: 3,
          devicesOnline: 8,
          devicesOffline: 2,
          accessAttemptsToday: 150,
          successfulAttempts: 145,
          failedAttempts: 5,
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

