import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { EnrollUserDto } from '../dto/enroll-user.dto';

export function EnrollUserDecorators() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Enroll a new user',
      description:
        'Create a new user account in the system. A unique userId and employeeId will be auto-generated. A secure password will be automatically generated and sent to the user via email along with their account details. The user will be created with the specified role, access methods, and other details.',
    }),
    ApiBody({
      type: EnrollUserDto,
      description: 'User enrollment data',
      examples: {
        staff: {
          summary: 'Enroll a staff member',
          value: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phoneNumber: '+2348012345678',
            gender: 'M',
            role: 'staff',
            department: 'Engineering',
            accessLevel: 1,
            allowedAccessMethods: ['rfid', 'fingerprint'],
            keypadPin: '1234',
            status: 'active',
          },
        },
        admin: {
          summary: 'Enroll an admin user',
          value: {
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane.smith@example.com',
            phoneNumber: '+2348012345679',
            gender: 'F',
            role: 'admin',
            department: 'Management',
            accessLevel: 10,
            allowedAccessMethods: ['rfid', 'fingerprint', 'keypad'],
            status: 'active',
          },
        },
        employeeWithId: {
          summary: 'Enroll with custom employee ID',
          value: {
            firstName: 'Bob',
            lastName: 'Johnson',
            email: 'bob.johnson@example.com',
            employeeId: 'EMP-001',
            role: 'staff',
            department: 'Sales',
            accessLevel: 2,
            allowedAccessMethods: ['rfid'],
            status: 'active',
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'User enrolled successfully',
      schema: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          message: {
            type: 'string',
            example: 'User enrolled successfully',
          },
          data: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                example: 'clx1234567890abcdef',
              },
              userId: {
                type: 'string',
                example: 'BTL-25-11-13',
                description: 'Auto-generated unique user ID',
              },
              firstName: {
                type: 'string',
                example: 'John',
              },
              lastName: {
                type: 'string',
                example: 'Doe',
              },
              email: {
                type: 'string',
                example: 'john.doe@example.com',
              },
              phoneNumber: {
                type: 'string',
                example: '+2348012345678',
              },
              gender: {
                type: 'string',
                enum: ['M', 'F', 'OTHER'],
                example: 'M',
              },
              employeeId: {
                type: 'string',
                example: 'EMP-001',
                description: 'Auto-generated if not provided (format: EMP-XXX)',
                nullable: true,
              },
              role: {
                type: 'string',
                enum: ['admin', 'staff', 'employee', 'nysc', 'intern'],
                example: 'staff',
              },
              department: {
                type: 'string',
                enum: [
                  'Engineering',
                  'Sales',
                  'Marketing',
                  'HR',
                  'Finance',
                  'Operations',
                  'Management',
                  'Other',
                ],
                example: 'Engineering',
                nullable: true,
              },
              status: {
                type: 'string',
                enum: ['active', 'inactive', 'suspended'],
                example: 'active',
              },
              accessLevel: {
                type: 'number',
                example: 1,
                minimum: 1,
                maximum: 10,
              },
              allowedAccessMethods: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: ['rfid', 'fingerprint', 'keypad'],
                },
                example: ['rfid', 'fingerprint'],
              },
              lastAccessAt: {
                type: 'string',
                format: 'date-time',
                nullable: true,
                example: null,
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
                example: '2025-01-15T10:30:00.000Z',
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
                example: '2025-01-15T10:30:00.000Z',
              },
              profilePicture: {
                type: 'object',
                nullable: true,
                properties: {
                  secureUrl: {
                    type: 'string',
                    example: 'https://example.com/profile.jpg',
                  },
                  publicId: {
                    type: 'string',
                    example: 'profile_abc123',
                  },
                },
              },
              rfidTags: {
                type: 'array',
                items: {
                  type: 'string',
                },
                example: [],
                description: 'Array of RFID tag UIDs',
              },
              fingerprintIds: {
                type: 'array',
                items: {
                  type: 'string',
                },
                example: [],
                description: 'Array of fingerprint IDs',
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Invalid input data',
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
                  example: 'email',
                },
                message: {
                  type: 'string',
                  example: 'email must be an email',
                },
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 409,
      description: 'User with email or employeeId already exists',
      schema: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          message: {
            type: 'string',
            example: 'User with this email already exists',
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
      schema: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          message: {
            type: 'string',
            example: 'Unauthorized',
          },
          statusCode: {
            type: 'number',
            example: 401,
          },
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Admin role required',
      schema: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          message: {
            type: 'string',
            example: 'Forbidden resource',
          },
          statusCode: {
            type: 'number',
            example: 403,
          },
        },
      },
    }),
  );
}

