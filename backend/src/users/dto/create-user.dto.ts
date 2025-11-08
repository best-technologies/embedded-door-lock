import { IsString, IsEmail, IsArray, IsOptional, IsEnum } from 'class-validator';

export class CreateUserDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsOptional()
  @IsString()
  profilePicture?: string;

  @IsArray()
  @IsString({ each: true })
  authTypes: string[];

  @IsArray()
  @IsString({ each: true })
  rfidTags: string[];

  @IsArray()
  @IsOptional()
  fingerprintIds?: number[];

  @IsEnum(['active', 'suspended', 'terminated'])
  status: 'active' | 'suspended' | 'terminated';

  @IsString()
  role: string;

  @IsOptional()
  @IsString()
  department?: string;
}

