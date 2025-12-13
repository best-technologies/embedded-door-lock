import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { AddRfidTagDto } from '../dto/add-rfid-tag.dto';

export function AddRfidTagDecorators() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Add RFID tag to user',
      description: 'Attach an RFID tag to a user for RFID-based access. The tag must be unique for the user.',
    }),
    ApiParam({
      name: 'userId',
      description: 'User ID in format BTL-YY-MM-SS',
      example: 'BTL-25-11-13',
    }),
    ApiBody({
      type: AddRfidTagDto,
      description: 'RFID tag data',
      examples: {
        example1: {
          summary: 'Add RFID tag',
          value: {
            tag: '0xA1B2C3D4',
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'RFID tag added successfully',
      schema: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          message: {
            type: 'string',
            example: 'RFID tag added successfully',
          },
          data: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                example: 'clx1234567890',
              },
              tag: {
                type: 'string',
                example: '0xA1B2C3D4',
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
      description: 'RFID tag already registered for this user',
      schema: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          message: {
            type: 'string',
            example: 'RFID tag already registered for this user',
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

