import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { RegisterFingerprintDto } from '../dto/register-fingerprint.dto';

export function RegisterFingerprintDecorators() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Register fingerprint for user',
      description: 'Register a fingerprint ID from the device for fingerprint-based access. The fingerprint ID must be unique for the user.',
    }),
    ApiParam({
      name: 'userId',
      description: 'User ID in format BTL-YY-MM-SS',
      example: 'BTL-25-11-13',
    }),
    ApiBody({
      type: RegisterFingerprintDto,
      description: 'Fingerprint registration data',
      examples: {
        example1: {
          summary: 'Register fingerprint',
          value: {
            fingerprintId: 1,
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Fingerprint registered successfully',
      schema: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          message: {
            type: 'string',
            example: 'Fingerprint registered successfully',
          },
          data: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                example: 'clx1234567890',
              },
              fingerprintId: {
                type: 'number',
                example: 1,
              },
              userId: {
                type: 'string',
                example: 'BTL-25-11-13',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
                example: '2025-01-15T10:30:00.000Z',
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'User not found',
      schema: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          message: {
            type: 'string',
            example: 'User with ID BTL-25-11-13 not found',
          },
          statusCode: {
            type: 'number',
            example: 404,
          },
        },
      },
    }),
    ApiResponse({
      status: 409,
      description: 'Fingerprint ID already registered for this user',
      schema: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          message: {
            type: 'string',
            example: 'Fingerprint ID already registered for this user',
          },
          statusCode: {
            type: 'number',
            example: 409,
          },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Admin role required',
    }),
  );
}

