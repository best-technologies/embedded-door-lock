import { Injectable, UnauthorizedException, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';
import { SignInDto } from './dto/sign-in.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthResponseDto, AuthUserDto } from './dto/auth-response.dto';
import { LoggerService } from '../common/logger/logger.service';
import { UserIdHelper } from '../common/helpers/user-id.helper';
import { AppConfigService } from '../config/config.service';
import { EmailService } from '../common/email/email.service';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class IdentityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly logger: LoggerService,
    private readonly configService: AppConfigService,
    private readonly emailService: EmailService,
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

      // Generate random password
      this.logger.info('Generating random password', 'IdentityService');
      const generatedPassword = this.generateRandomPassword();
      this.logger.info('Password generated successfully', 'IdentityService');

      // Hash password
      this.logger.info('Hashing password', 'IdentityService');
      const hashedPassword = await bcrypt.hash(generatedPassword, 10);

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

      // Send registration email with password
      try {
        await this.emailService.sendRegistrationEmail(
          user.email,
          user.firstName,
          generatedPassword,
          user.userId,
        );
        this.logger.success(
          `Registration email sent to ${user.email}`,
          'IdentityService',
        );
      } catch (emailError: any) {
        this.logger.error(
          `Failed to send registration email: ${emailError?.message || 'Unknown error'}`,
          emailError?.stack,
          'IdentityService',
        );
        // Continue even if email fails - user is still created
      }

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

  /**
   * Generate a random password
   */
  private generateRandomPassword(): string {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    // Ensure at least one of each type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // uppercase
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // lowercase
    password += '0123456789'[Math.floor(Math.random() * 10)]; // number
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // special char
    
    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Request password reset - sends verification code to email
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    try {
      this.logger.info(
        `Password reset request for email: ${forgotPasswordDto.email}`,
        'IdentityService',
      );

      // Find user by email
      const user = await this.prisma.user.findUnique({
        where: { email: forgotPasswordDto.email },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      });

      // Don't reveal if user exists or not (security best practice)
      if (!user) {
        this.logger.warn(
          `Password reset requested for non-existent email: ${forgotPasswordDto.email}`,
          'IdentityService',
        );
        // Return success message even if user doesn't exist (security)
        return {
          message: 'If an account with that email exists, a verification code has been sent.',
        };
      }

      // Delete any existing unused reset codes for this email
      await this.prisma.passwordResetCode.deleteMany({
        where: {
          email: forgotPasswordDto.email,
          used: false,
        },
      });

      // Generate 6-digit verification code
      const verificationCode = String(Math.floor(100000 + Math.random() * 900000));

      // Set expiration to 15 minutes from now
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);

      // Create password reset code
      await this.prisma.passwordResetCode.create({
        data: {
          code: verificationCode,
          email: forgotPasswordDto.email,
          expiresAt,
        },
      });

      // Send email with verification code
      try {
        await this.emailService.sendPasswordResetEmail(
          user.email,
          user.firstName,
          verificationCode,
        );
        this.logger.success(
          `Password reset email sent to ${user.email}`,
          'IdentityService',
        );
      } catch (emailError: any) {
        this.logger.error(
          `Failed to send password reset email: ${emailError?.message || 'Unknown error'}`,
          emailError?.stack,
          'IdentityService',
        );
        throw new BadRequestException('Failed to send verification code. Please try again.');
      }

      return {
        message: 'If an account with that email exists, a verification code has been sent.',
      };
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `Failed to process password reset request: ${error?.message || 'Unknown error'}`,
        error?.stack,
        'IdentityService',
      );
      throw error;
    }
  }

  /**
   * Reset password with verification code
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    try {
      this.logger.info(
        `Password reset attempt for email: ${resetPasswordDto.email}`,
        'IdentityService',
      );

      // Find the verification code
      const resetCode = await this.prisma.passwordResetCode.findUnique({
        where: { code: resetPasswordDto.code },
      });

      if (!resetCode) {
        this.logger.warn(
          `Invalid reset code provided: ${resetPasswordDto.code}`,
          'IdentityService',
        );
        throw new BadRequestException('Invalid or expired verification code');
      }

      // Check if code matches the email
      if (resetCode.email !== resetPasswordDto.email) {
        this.logger.warn(
          `Reset code email mismatch: ${resetCode.email} vs ${resetPasswordDto.email}`,
          'IdentityService',
        );
        throw new BadRequestException('Invalid verification code for this email');
      }

      // Check if code has been used
      if (resetCode.used) {
        this.logger.warn(
          `Reset code already used: ${resetPasswordDto.code}`,
          'IdentityService',
        );
        throw new BadRequestException('Verification code has already been used');
      }

      // Check if code has expired
      if (new Date() > resetCode.expiresAt) {
        this.logger.warn(
          `Reset code expired: ${resetPasswordDto.code}`,
          'IdentityService',
        );
        // Delete expired code
        await this.prisma.passwordResetCode.delete({
          where: { id: resetCode.id },
        });
        throw new BadRequestException('Verification code has expired. Please request a new one.');
      }

      // Find user
      const user = await this.prisma.user.findUnique({
        where: { email: resetPasswordDto.email },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);

      // Update user password
      await this.prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      // Mark code as used
      await this.prisma.passwordResetCode.update({
        where: { id: resetCode.id },
        data: {
          used: true,
          usedAt: new Date(),
        },
      });

      this.logger.success(
        `Password reset successfully for user: ${user.userId}`,
        'IdentityService',
      );

      return {
        message: 'Password has been reset successfully. You can now sign in with your new password.',
      };
    } catch (error: any) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error(
        `Failed to reset password: ${error?.message || 'Unknown error'}`,
        error?.stack,
        'IdentityService',
      );
      throw error;
    }
  }
}

