import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function GetAccessLogsDecorators() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get access logs',
      description: 'Retrieve access logs with optional filtering',
    }),
    ApiResponse({
      status: 200,
      description: 'Access logs retrieved successfully',
    }),
  );
}

