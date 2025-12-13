import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetKeypadPinDto {
  @ApiProperty({
    description: 'Keypad PIN (will be hashed before storage)',
    example: '1234',
    minLength: 4,
    maxLength: 10,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(10)
  pin: string;
}

