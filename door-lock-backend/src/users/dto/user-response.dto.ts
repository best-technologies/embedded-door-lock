import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus, UserRole, Gender, AccessMethod, Department } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty({
    description: 'Unique user ID in format BTL-YY-MM-SS',
    example: 'BTL-25-11-13',
  })
  userId: string;

  @ApiProperty({
    description: 'First name',
    example: 'Mayowa',
  })
  firstName: string;

  @ApiProperty({
    description: 'Last name',
    example: 'Bernard',
  })
  lastName: string;

  @ApiProperty({
    description: 'Email address',
    example: 'bernardmayowaa@gmail.com',
  })
  email: string;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '+2348012345678',
  })
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'Gender',
    enum: Gender,
    example: Gender.M,
  })
  gender?: Gender;

  @ApiPropertyOptional({
    description: 'Employee ID',
    example: 'EMP-001',
  })
  employeeId?: string;

  @ApiProperty({
    description: 'User status',
    enum: UserStatus,
    example: UserStatus.active,
  })
  status: UserStatus;

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    example: UserRole.staff,
  })
  role: UserRole;

  @ApiPropertyOptional({
    description: 'Department',
    enum: Department,
    example: Department.Engineering,
  })
  department?: Department;

  @ApiProperty({
    description: 'Access level',
    example: 1,
  })
  accessLevel: number;

  @ApiProperty({
    description: 'Allowed access methods',
    enum: AccessMethod,
    isArray: true,
    example: [AccessMethod.rfid, AccessMethod.fingerprint],
  })
  allowedAccessMethods: AccessMethod[];

  @ApiPropertyOptional({
    description: 'Last access timestamp',
    example: '2025-11-08T12:00:00Z',
  })
  lastAccessAt?: Date;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2025-01-15T08:32:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2025-11-08T12:00:00Z',
  })
  updatedAt: Date;
}

