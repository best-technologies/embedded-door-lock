import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';
import { SignInDto } from './dto/sign-in.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto, AuthUserDto } from './dto/auth-response.dto';
import { LoggerService } from '../common/logger/logger.service';
import { UserIdHelper } from '../common/helpers/user-id.helper';
import { AppConfigService } from '../config/config.service';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class IdentityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly logger: LoggerService,
    private readonly configService: AppConfigService,
  ) {}

  async signIn(signInDto: SignInDto): Promise<AuthResponseDto> {
    try {
      this.logger.info(
        `Sign in attempt for email: ${signInDto.email}`,
        'IdentityService',
      );

      // Find user by email
      const user = await this.prisma.user.findUnique({
        where: { email: signInDto.email },
        select: {
          id: true,
          userId: true,
          firstName: true,
          lastName: true,
          email: true,
          password: true,
          status: true,
          role: true,
          department: true,
          accessLevel: true,
          allowedAccessMethods: true,
        },
      });

      if (!user) {
        this.logger.warn(
          `Sign in failed: User not found with email ${signInDto.email}`,
          'IdentityService',
        );
        throw new UnauthorizedException('Invalid email or password');
      }

      // Check if user has a password set
      if (!user.password) {
        this.logger.warn(
          `Sign in failed: User ${user.userId} does not have a password set`,
          'IdentityService',
        );
        throw new UnauthorizedException('Password not set. Please contact administrator.');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(signInDto.password, user.password);
      if (!isPasswordValid) {
        this.logger.warn(
          `Sign in failed: Invalid password for user ${user.userId}`,
          'IdentityService',
        );
        throw new UnauthorizedException('Invalid email or password');
      }

      // Check if user is active
      if (user.status !== 'active') {
        this.logger.warn(
          `Sign in failed: User ${user.userId} account is ${user.status}`,
          'IdentityService',
        );
        throw new UnauthorizedException(`User account is ${user.status}`);
      }

      // Generate JWT token
      const payload: JwtPayload = {
        sub: user.userId,
        email: user.email,
      };

      const accessToken = this.jwtService.sign(payload);

      this.logger.success(
        `User ${user.userId} signed in successfully`,
        'IdentityService',
      );

      const authResponse: AuthResponseDto = {
        accessToken,
        user: {
          userId: user.userId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          status: user.status,
          role: user.role,
        },
      };

      return authResponse;
    } catch (error: any) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(
        `Failed to sign in: ${error?.message || 'Unknown error'}`,
        error?.stack,
        'IdentityService',
      );
      throw error;
    }
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    try {
      this.logger.info(
        `Registration attempt for email: ${registerDto.email}`,
        'IdentityService',
      );

      // Check if email already exists
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: registerDto.email },
      });

      if (existingEmail) {
        this.logger.warn(
          `Registration failed: Email ${registerDto.email} already exists`,
          'IdentityService',
        );
        throw new ConflictException('User with this email already exists');
      }

      // Generate unique userId
      this.logger.info(
        `Generating userId for role: ${registerDto.role}`,
        'IdentityService',
      );
      const userId = await UserIdHelper.generateUserId(this.prisma, registerDto.role);
      this.logger.info(`Generated userId: ${userId}`, 'IdentityService');

      // Generate unique employeeId
      this.logger.info('Generating employeeId', 'IdentityService');
      const employeeId = await UserIdHelper.generateEmployeeId(this.prisma);
      this.logger.info(`Generated employeeId: ${employeeId}`, 'IdentityService');

      // Hash password
      this.logger.info('Hashing password', 'IdentityService');
      const hashedPassword = await bcrypt.hash(registerDto.password, 10);

      // Hash keypad PIN if provided
      let hashedPin: string | undefined;
      if (registerDto.keypadPin) {
        this.logger.info('Hashing keypad PIN', 'IdentityService');
        hashedPin = await bcrypt.hash(registerDto.keypadPin, 10);
      }

      // Create user
      const user = await this.prisma.user.create({
        data: {
          userId,
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
          email: registerDto.email,
          password: hashedPassword,
          phoneNumber: registerDto.phoneNumber,
          gender: registerDto.gender,
          employeeId: employeeId,
          role: registerDto.role,
          department: registerDto.department,
          status: registerDto.status,
          accessLevel: registerDto.accessLevel || 1,
          allowedAccessMethods: registerDto.allowedAccessMethods,
          keypadPin: hashedPin,
        },
        select: {
          id: true,
          userId: true,
          firstName: true,
          lastName: true,
          email: true,
          status: true,
          role: true,
          department: true,
          accessLevel: true,
          allowedAccessMethods: true,
        },
      });

      this.logger.success(
        `User registered successfully with ID: ${userId}`,
        'IdentityService',
      );

      // Generate JWT token
      const payload: JwtPayload = {
        sub: user.userId,
        email: user.email,
      };

      const accessToken = this.jwtService.sign(payload);

      const authResponse: AuthResponseDto = {
        accessToken,
        user: {
          userId: user.userId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          status: user.status,
          role: user.role,
        },
      };

      return authResponse;
    } catch (error: any) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(
        `Failed to register user: ${error?.message || 'Unknown error'}`,
        error?.stack,
        'IdentityService',
      );
      throw error;
    }
  }
}

