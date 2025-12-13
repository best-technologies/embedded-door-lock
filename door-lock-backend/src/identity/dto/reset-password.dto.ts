import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Email address of the user',
    example: 'bernardmayowaa@gmail.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Verification code sent to email',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @MinLength(6)
  code: string;

  @ApiProperty({
    description: 'New password',
    example: 'NewSecurePassword123!',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  newPassword: string;
}

