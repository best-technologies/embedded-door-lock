import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email address of the user',
    example: 'bernardmayowaa@gmail.com',
  })
  @IsEmail()
  email: string;
}

