import { IsString, IsEmail, IsArray, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, Gender, AccessMethod, UserStatus, Department } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({
    description: 'First name of the user',
    example: 'Mayowa',
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'Last name of the user',
    example: 'Bernard',
  })
  @IsString()
  lastName: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'bernardmayowaa@gmail.com',
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'Phone number of the user',
    example: '+2348012345678',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'Gender of the user',
    enum: Gender,
    example: Gender.M,
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({
    description: 'Employee ID',
    example: 'EMP-001',
  })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    example: UserRole.staff,
  })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({
    description: 'Department',
    enum: Department,
    example: Department.Engineering,
  })
  @IsOptional()
  @IsEnum(Department)
  department?: Department;

  @ApiPropertyOptional({
    description: 'Access level (1-10)',
    example: 1,
    minimum: 1,
    maximum: 10,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  @Type(() => Number)
  accessLevel?: number;

  @ApiProperty({
    description: 'Allowed access methods for the user',
    enum: AccessMethod,
    isArray: true,
    example: [AccessMethod.rfid, AccessMethod.fingerprint],
  })
  @IsArray()
  @IsEnum(AccessMethod, { each: true })
  allowedAccessMethods: AccessMethod[];

  @ApiPropertyOptional({
    description: 'Keypad PIN (will be hashed)',
    example: '1234',
  })
  @IsOptional()
  @IsString()
  keypadPin?: string;

  @ApiProperty({
    description: 'User account status',
    enum: UserStatus,
    example: UserStatus.active,
    default: UserStatus.active,
  })
  @IsEnum(UserStatus)
  status: UserStatus;
}
