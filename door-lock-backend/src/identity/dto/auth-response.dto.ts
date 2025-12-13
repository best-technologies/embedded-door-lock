import { ApiProperty } from '@nestjs/swagger';
import { UserStatus, UserRole, Gender, AccessMethod } from '@prisma/client';

export class AuthUserDto {
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
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'User information',
    type: AuthUserDto,
  })
  user: AuthUserDto;
}

