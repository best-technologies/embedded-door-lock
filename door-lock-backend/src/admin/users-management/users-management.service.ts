import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { LoggerService } from '../../common/logger/logger.service';
import { ResponseHelper } from '../../common/helpers/response.helper';
import { UserIdHelper } from '../../common/helpers/user-id.helper';
import { EmailService } from '../../common/email/email.service';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FilterUsersDto } from './dto/filter-users.dto';
import { EnrollUserDto } from './dto/enroll-user.dto';
import { AddRfidTagDto } from './dto/add-rfid-tag.dto';
import { RegisterFingerprintDto } from './dto/register-fingerprint.dto';
import { SetKeypadPinDto } from './dto/set-keypad-pin.dto';
import { UserRole, UserStatus, Department } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Update user role
   */
  async updateUserRole(userId: string, updateUserRoleDto: UpdateUserRoleDto) {
    try {
      this.logger.info(
        `Updating role for user ${userId} to ${updateUserRoleDto.role}`,
        'UsersManagementService',
      );

      // Find user by userId (custom userId field, not Prisma id)
      const user = await this.prisma.user.findUnique({
        where: { userId },
        select: {
          id: true,
          userId: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          status: true,
        },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Check if role is already the same
      if (user.role === updateUserRoleDto.role) {
        throw new BadRequestException(`User already has the role: ${updateUserRoleDto.role}`);
      }

      // Update user role
      const updatedUser = await this.prisma.user.update({
        where: { userId },
        data: {
          role: updateUserRoleDto.role,
        },
        select: {
          userId: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          status: true,
          department: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      this.logger.success(
        `User role updated: ${userId} from ${user.role} to ${updateUserRoleDto.role}`,
        'UsersManagementService',
      );

      return ResponseHelper.success('User role updated successfully', updatedUser);
    } catch (error: any) {
      this.logger.error(
        `Failed to update user role: ${error?.message || 'Unknown error'}`,
        error?.stack,
        'UsersManagementService',
      );
      throw error;
    }
  }

  /**
   * Get all users with pagination and filtering
   */
  async findAllUsers(filterDto: FilterUsersDto) {
    try {
      this.logger.info(
        `Fetching all users with filters: ${JSON.stringify(filterDto)}`,
        'UsersManagementService',
      );

      const { page = 1, limit = 20, status, role, department } = filterDto;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (status) where.status = status;
      if (role) where.role = role;
      if (department) where.department = department;

      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          skip,
          take: limit,
          select: {
            id: true,
            userId: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            gender: true,
            employeeId: true,
            status: true,
            role: true,
            department: true,
            accessLevel: true,
            allowedAccessMethods: true,
            lastAccessAt: true,
            createdAt: true,
            updatedAt: true,
            profilePicture: {
              select: {
                secureUrl: true,
                publicId: true,
              },
            },
            rfidTags: {
              select: {
                tag: true,
              },
            },
            fingerprintIds: {
              select: {
                fingerprintId: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
        this.prisma.user.count({ where }),
      ]);

      // Transform response
      const transformedUsers = users.map((user) => ({
        ...user,
        rfidTags: user.rfidTags.map((tag) => tag.tag),
        fingerprintIds: user.fingerprintIds.map((fp) => fp.fingerprintId),
      }));

      this.logger.success(
        `Successfully fetched ${users.length} users (total: ${total})`,
        'UsersManagementService',
      );

      return ResponseHelper.paginated(
        'Users retrieved successfully',
        transformedUsers,
        total,
        page,
        limit,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to fetch users: ${error?.message || 'Unknown error'}`,
        error?.stack,
        'UsersManagementService',
      );
      throw error;
    }
  }

  /**
   * Enroll a new user
   */
  async enrollUser(enrollUserDto: EnrollUserDto) {
    try {
      this.logger.info(
        `Enrolling new user: ${JSON.stringify({ ...enrollUserDto, keypadPin: '***' })}`,
        'UsersManagementService',
      );

      // Check if email already exists
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: enrollUserDto.email },
      });

      if (existingEmail) {
        this.logger.warn(
          `User enrollment failed: Email ${enrollUserDto.email} already exists`,
          'UsersManagementService',
        );
        throw new ConflictException('User with this email already exists');
      }

      // Generate unique employeeId (if not provided)
      let employeeId: string;
      if (enrollUserDto.employeeId) {
        // Check if provided employeeId already exists
        const existingEmployeeId = await this.prisma.user.findUnique({
          where: { employeeId: enrollUserDto.employeeId },
        });

        if (existingEmployeeId) {
          this.logger.warn(
            `User enrollment failed: Employee ID ${enrollUserDto.employeeId} already exists`,
            'UsersManagementService',
          );
          throw new ConflictException('User with this employee ID already exists');
        }
        employeeId = enrollUserDto.employeeId;
      } else {
        // Auto-generate employeeId
        this.logger.info('Generating employeeId', 'UsersManagementService');
        employeeId = await UserIdHelper.generateEmployeeId(this.prisma);
        this.logger.info(`Generated employeeId: ${employeeId}`, 'UsersManagementService');
      }

      // Generate unique userId
      this.logger.info(
        `Generating userId for role: ${enrollUserDto.role}`,
        'UsersManagementService',
      );
      const userId = await UserIdHelper.generateUserId(this.prisma, enrollUserDto.role);
      this.logger.info(`Generated userId: ${userId}`, 'UsersManagementService');

      // Generate random password for user
      this.logger.info('Generating random password', 'UsersManagementService');
      const generatedPassword = this.generateRandomPassword();
      this.logger.info('Password generated successfully', 'UsersManagementService');

      // Hash password
      this.logger.info('Hashing password', 'UsersManagementService');
      const hashedPassword = await bcrypt.hash(generatedPassword, 10);

      // Hash keypad PIN if provided
      let hashedPin: string | undefined;
      if (enrollUserDto.keypadPin) {
        this.logger.info('Hashing keypad PIN', 'UsersManagementService');
        hashedPin = await bcrypt.hash(enrollUserDto.keypadPin, 10);
      }

      // Create user
      const user = await this.prisma.user.create({
        data: {
          userId,
          firstName: enrollUserDto.firstName,
          lastName: enrollUserDto.lastName,
          email: enrollUserDto.email,
          password: hashedPassword,
          phoneNumber: enrollUserDto.phoneNumber,
          gender: enrollUserDto.gender,
          employeeId: employeeId,
          role: enrollUserDto.role,
          department: enrollUserDto.department,
          status: enrollUserDto.status,
          accessLevel: enrollUserDto.accessLevel || 1,
          allowedAccessMethods: enrollUserDto.allowedAccessMethods,
          keypadPin: hashedPin,
        },
        include: {
          rfidTags: true,
          fingerprintIds: true,
          profilePicture: true,
        },
      });

      // Transform response
      const transformedUser = {
        id: user.id,
        userId: user.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        gender: user.gender,
        employeeId: user.employeeId,
        role: user.role,
        department: user.department,
        status: user.status,
        accessLevel: user.accessLevel,
        allowedAccessMethods: user.allowedAccessMethods,
        lastAccessAt: user.lastAccessAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        profilePicture: user.profilePicture
          ? {
              secureUrl: user.profilePicture.secureUrl,
              publicId: user.profilePicture.publicId,
            }
          : null,
        rfidTags: user.rfidTags.map((tag) => tag.tag),
        fingerprintIds: user.fingerprintIds.map((fp) => fp.fingerprintId),
      };

      this.logger.success(
        `User enrolled successfully with ID: ${userId}`,
        'UsersManagementService',
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
          'UsersManagementService',
        );
      } catch (emailError: any) {
        this.logger.error(
          `Failed to send registration email: ${emailError?.message || 'Unknown error'}`,
          emailError?.stack,
          'UsersManagementService',
        );
        // Continue even if email fails - user is still created
      }

      return ResponseHelper.success('User enrolled successfully', transformedUser);
    } catch (error: any) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(
        `Failed to enroll user: ${error?.message || 'Unknown error'}`,
        error?.stack,
        'UsersManagementService',
      );
      throw error;
    }
  }

  /**
   * Update user information
   */
  async updateUser(userId: string, updateUserDto: UpdateUserDto) {
    try {
      this.logger.info(
        `Updating user ${userId} with data: ${JSON.stringify(updateUserDto)}`,
        'UsersManagementService',
      );

      // Verify user exists
      const existingUser = await this.prisma.user.findUnique({
        where: { userId },
      });

      if (!existingUser) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Check if email is being updated and if it's already taken
      if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
        const emailExists = await this.prisma.user.findUnique({
          where: { email: updateUserDto.email },
        });

        if (emailExists) {
          throw new ConflictException(`Email ${updateUserDto.email} is already in use`);
        }
      }

      // Check if employeeId is being updated and if it's already taken
      if (
        updateUserDto.employeeId &&
        updateUserDto.employeeId !== existingUser.employeeId
      ) {
        const employeeIdExists = await this.prisma.user.findUnique({
          where: { employeeId: updateUserDto.employeeId },
        });

        if (employeeIdExists) {
          throw new ConflictException(
            `Employee ID ${updateUserDto.employeeId} is already in use`,
          );
        }
      }

      // Build update data object (only include provided fields)
      const updateData: any = {};

      if (updateUserDto.firstName !== undefined) {
        updateData.firstName = updateUserDto.firstName;
      }
      if (updateUserDto.lastName !== undefined) {
        updateData.lastName = updateUserDto.lastName;
      }
      if (updateUserDto.email !== undefined) {
        updateData.email = updateUserDto.email;
      }
      if (updateUserDto.phoneNumber !== undefined) {
        updateData.phoneNumber = updateUserDto.phoneNumber;
      }
      if (updateUserDto.gender !== undefined) {
        updateData.gender = updateUserDto.gender;
      }
      if (updateUserDto.employeeId !== undefined) {
        updateData.employeeId = updateUserDto.employeeId;
      }
      if (updateUserDto.status !== undefined) {
        updateData.status = updateUserDto.status;
      }
      if (updateUserDto.role !== undefined) {
        updateData.role = updateUserDto.role;
      }
      if (updateUserDto.department !== undefined) {
        updateData.department = updateUserDto.department;
      }
      if (updateUserDto.accessLevel !== undefined) {
        updateData.accessLevel = updateUserDto.accessLevel;
      }
      if (updateUserDto.allowedAccessMethods !== undefined) {
        updateData.allowedAccessMethods = updateUserDto.allowedAccessMethods;
      }

      // Update user
      const updatedUser = await this.prisma.user.update({
        where: { userId },
        data: updateData,
        select: {
          id: true,
          userId: true,
          firstName: true,
          lastName: true,
          email: true,
          phoneNumber: true,
          gender: true,
          employeeId: true,
          status: true,
          role: true,
          department: true,
          accessLevel: true,
          allowedAccessMethods: true,
          lastAccessAt: true,
          createdAt: true,
          updatedAt: true,
          profilePicture: {
            select: {
              secureUrl: true,
              publicId: true,
            },
          },
          rfidTags: {
            select: {
              tag: true,
            },
          },
          fingerprintIds: {
            select: {
              fingerprintId: true,
            },
          },
        },
      });

      // Transform response
      const transformedUser = {
        ...updatedUser,
        rfidTags: updatedUser.rfidTags.map((tag) => tag.tag),
        fingerprintIds: updatedUser.fingerprintIds.map((fp) => fp.fingerprintId),
      };

      this.logger.success(`User updated successfully: ${userId}`, 'UsersManagementService');

      return ResponseHelper.success('User updated successfully', transformedUser);
    } catch (error: any) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(
        `Failed to update user: ${error?.message || 'Unknown error'}`,
        error?.stack,
        'UsersManagementService',
      );
      throw error;
    }
  }

  /**
   * Generate a random secure password
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
   * Add RFID tag to user
   */
  async addRfidTag(userId: string, tag: string) {
    try {
      this.logger.info(`Adding RFID tag ${tag} to user: ${userId}`, 'UsersManagementService');

      // Verify user exists
      const user = await this.prisma.user.findUniqueOrThrow({
        where: { userId },
        select: { id: true, userId: true },
      });

      // Check if tag already exists for this user
      const existingTag = await this.prisma.rfidTag.findFirst({
        where: {
          tag,
          userId: user.id,
        },
      });

      if (existingTag) {
        this.logger.warn(
          `RFID tag ${tag} already exists for user: ${userId}`,
          'UsersManagementService',
        );
        throw new ConflictException('RFID tag already registered for this user');
      }

      // Create RFID tag
      const rfidTag = await this.prisma.rfidTag.create({
        data: {
          tag,
          userId: user.id,
        },
      });

      this.logger.success(
        `RFID tag ${tag} added successfully to user: ${userId}`,
        'UsersManagementService',
      );

      return ResponseHelper.success('RFID tag added successfully', {
        id: rfidTag.id,
        tag: rfidTag.tag,
        userId: user.userId,
        createdAt: rfidTag.createdAt,
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        this.logger.warn(`User not found: ${userId}`, 'UsersManagementService');
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(
        `Failed to add RFID tag to user ${userId}: ${error?.message || 'Unknown error'}`,
        error?.stack,
        'UsersManagementService',
      );
      throw error;
    }
  }

  /**
   * Register fingerprint for user
   */
  async registerFingerprint(userId: string, fingerprintId: number) {
    try {
      this.logger.info(
        `Registering fingerprint ${fingerprintId} for user: ${userId}`,
        'UsersManagementService',
      );

      // Verify user exists
      const user = await this.prisma.user.findUniqueOrThrow({
        where: { userId },
        select: { id: true, userId: true },
      });

      // Check if fingerprint ID already exists for this user
      const existingFingerprint = await this.prisma.fingerprintId.findFirst({
        where: {
          fingerprintId,
          userId: user.id,
        },
      });

      if (existingFingerprint) {
        this.logger.warn(
          `Fingerprint ${fingerprintId} already registered for user: ${userId}`,
          'UsersManagementService',
        );
        throw new ConflictException('Fingerprint ID already registered for this user');
      }

      // Create fingerprint ID
      const fingerprint = await this.prisma.fingerprintId.create({
        data: {
          fingerprintId,
          userId: user.id,
        },
      });

      this.logger.success(
        `Fingerprint ${fingerprintId} registered successfully for user: ${userId}`,
        'UsersManagementService',
      );

      return ResponseHelper.success('Fingerprint registered successfully', {
        id: fingerprint.id,
        fingerprintId: fingerprint.fingerprintId,
        userId: user.userId,
        createdAt: fingerprint.createdAt,
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        this.logger.warn(`User not found: ${userId}`, 'UsersManagementService');
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(
        `Failed to register fingerprint for user ${userId}: ${error?.message || 'Unknown error'}`,
        error?.stack,
        'UsersManagementService',
      );
      throw error;
    }
  }

  /**
   * Set or update keypad PIN for user
   */
  async setKeypadPin(userId: string, pin: string) {
    try {
      this.logger.info(`Setting keypad PIN for user: ${userId}`, 'UsersManagementService');

      // Verify user exists
      await this.prisma.user.findUniqueOrThrow({
        where: { userId },
      });

      // Hash the PIN
      const hashedPin = await bcrypt.hash(pin, 10);

      // Update user's keypad PIN
      const updated = await this.prisma.user.update({
        where: { userId },
        data: { keypadPin: hashedPin },
        select: { userId: true, updatedAt: true },
      });

      this.logger.success(
        `Keypad PIN set successfully for user: ${userId}`,
        'UsersManagementService',
      );

      return ResponseHelper.success('Keypad PIN set successfully', {
        userId: updated.userId,
        updatedAt: updated.updatedAt,
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        this.logger.warn(`User not found: ${userId}`, 'UsersManagementService');
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      this.logger.error(
        `Failed to set keypad PIN for user ${userId}: ${error?.message || 'Unknown error'}`,
        error?.stack,
        'UsersManagementService',
      );
      throw error;
    }
  }
}

