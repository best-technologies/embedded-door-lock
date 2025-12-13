import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IdentityService } from './identity.service';
import { SignInDto } from './dto/sign-in.dto';
import { RegisterDto } from './dto/register.dto';
import { SignInDecorators } from './docs/sign-in.decorators';
import { RegisterDecorators } from './docs/register.decorators';

@ApiTags('Identity')
@Controller('identity')
export class IdentityController {
  constructor(private readonly identityService: IdentityService) {}

  @Post('sign-in')
  @SignInDecorators()
  async signIn(@Body() signInDto: SignInDto) {
    const result = await this.identityService.signIn(signInDto);
    return {
      success: true,
      message: 'User signed in successfully',
      data: [result],
      total: 1,
    };
  }

  @Post('register')
  @RegisterDecorators()
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.identityService.register(registerDto);
    return {
      success: true,
      message: 'User registered successfully',
      data: [result],
      total: 1,
    };
  }
}

