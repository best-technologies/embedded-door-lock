import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { SetKeypadPinDto } from '../dto/set-keypad-pin.dto';

export function SetKeypadPinDecorators() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Set or update keypad PIN',
      description: 'Set or update the keypad PIN for a user. The PIN will be hashed before storage. PIN must be between 4 and 10 characters.',
    }),
    ApiParam({
      name: 'userId',
      description: 'User ID in format BTL-YY-MM-SS',
      example: 'BTL-25-11-13',
    }),
    ApiBody({
      type: SetKeypadPinDto,
      description: 'Keypad PIN data',
      examples: {
        example1: {
          summary: 'Set keypad PIN',
          value: {
            pin: '1234',
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Keypad PIN set successfully',
      schema: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          message: {
            type: 'string',
            example: 'Keypad PIN set successfully',
          },
          data: {
            type: 'object',
            properties: {
              userId: {
                type: 'string',
                example: 'BTL-25-11-13',
              },
              updatedAt: {
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
      status: 400,
      description: 'Invalid input data - PIN validation failed',
      schema: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          message: {
            type: 'string',
            example: 'Validation failed',
          },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: {
                  type: 'string',
                  example: 'pin',
                },
                message: {
                  type: 'string',
                  example: 'pin must be longer than or equal to 4 characters',
                },
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
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Admin role required',
    }),
  );
}

