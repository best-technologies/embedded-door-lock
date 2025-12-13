import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddRfidTagDto {
  @ApiProperty({
    description: 'RFID tag value (e.g., 0xA1B2C3D4)',
    example: '0xA1B2C3D4',
  })
  @IsString()
  @IsNotEmpty()
  tag: string;
}

