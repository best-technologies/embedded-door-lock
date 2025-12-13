import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CreateAccessLogDto } from '../dto/create-access-log.dto';

export function CreateAccessLogDecorators() {
  return applyDecorators(
    HttpCode(HttpStatus.CREATED),
    ApiOperation({
      summary: 'Create access log',
      description: 'Log an access attempt (success or failed)',
    }),
    ApiBody({ type: CreateAccessLogDto }),
    ApiResponse({
      status: 201,
      description: 'Access log created successfully',
    }),
  );
}

