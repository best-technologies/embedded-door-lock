import { Injectable, NotFoundException, Inject, forwardRef, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { FilterUsersDto } from './dto/filter-users.dto';
import { AccessService } from '../access/access.service';
import { UserIdHelper } from '../common/helpers/user-id.helper';
import { ResponseHelper } from '../common/helpers/response.helper';
import { LoggerService } from '../common/logger/logger.service';
import { UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => AccessService))
    private readonly accessService: AccessService,
    private readonly logger: LoggerService,
  ) {}

  async findAll(filterDto: FilterUsersDto) {
    try {
      this.logger.info(
        `Fetching users with filters: ${JSON.stringify(filterDto)}`,
        'UsersService',
      );

      const { page = 1, limit = 10, status, role, department } = filterDto;
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
          include: {
            rfidTags: true,
            fingerprintIds: true,
            profilePicture: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
        this.prisma.user.count({ where }),
      ]);

      this.logger.success(
        `Successfully fetched ${users.length} users (total: ${total})`,
        'UsersService',
      );

      return ResponseHelper.paginated(
        'Users retrieved successfully',
        users,
        total,
        page,
        limit,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to fetch users: ${error?.message || 'Unknown error'}`,
        error?.stack,
        'UsersService',
      );
      throw error;
    }
  }

  async findOne(userId: string) {
    try {
      this.logger.info(`Fetching user with ID: ${userId}`, 'UsersService');

      const user = await this.prisma.user.findUnique({
        where: { userId },
        include: {
          rfidTags: true,
          fingerprintIds: true,
          profilePicture: true,
        },
      });

      if (!user) {
        this.logger.warn(`User not found: ${userId}`, 'UsersService');
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      this.logger.success(`Successfully fetched user: ${userId}`, 'UsersService');

      return ResponseHelper.success('User retrieved successfully', user);
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to fetch user ${userId}: ${error?.message || 'Unknown error'}`,
        error?.stack,
        'UsersService',
      );
      throw error;
    }
  }

  async create(createUserDto: CreateUserDto) {
    try {
      this.logger.info(
        `Creating user: ${JSON.stringify({ ...createUserDto, keypadPin: '***' })}`,
        'UsersService',
      );

      // Check if email already exists
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: createUserDto.email },
      });

      if (existingEmail) {
        this.logger.warn(
          `User creation failed: Email ${createUserDto.email} already exists`,
          'UsersService',
        );
        throw new ConflictException('User with this email already exists');
      }

      // Check if employeeId already exists (if provided)
      if (createUserDto.employeeId) {
        const existingEmployeeId = await this.prisma.user.findUnique({
          where: { employeeId: createUserDto.employeeId },
        });

        if (existingEmployeeId) {
          this.logger.warn(
            `User creation failed: Employee ID ${createUserDto.employeeId} already exists`,
            'UsersService',
          );
          throw new ConflictException('User with this employee ID already exists');
        }
      }

      // Generate unique userId
      this.logger.info(
        `Generating userId for role: ${createUserDto.role}`,
        'UsersService',
      );
      const userId = await UserIdHelper.generateUserId(this.prisma, createUserDto.role);
      this.logger.info(`Generated userId: ${userId}`, 'UsersService');

      // Hash keypad PIN if provided
      let hashedPin: string | undefined;
      if (createUserDto.keypadPin) {
        this.logger.info('Hashing keypad PIN', 'UsersService');
        hashedPin = await bcrypt.hash(createUserDto.keypadPin, 10);
      }

      // Create user
      const user = await this.prisma.user.create({
        data: {
          userId,
          firstName: createUserDto.firstName,
          lastName: createUserDto.lastName,
          email: createUserDto.email,
          phoneNumber: createUserDto.phoneNumber,
          gender: createUserDto.gender,
          employeeId: createUserDto.employeeId,
          role: createUserDto.role,
          department: createUserDto.department,
          status: createUserDto.status,
          accessLevel: createUserDto.accessLevel || 1,
          allowedAccessMethods: createUserDto.allowedAccessMethods,
          keypadPin: hashedPin,
        },
        include: {
          rfidTags: true,
          fingerprintIds: true,
          profilePicture: true,
        },
      });

      this.logger.success(
        `User created successfully with ID: ${userId}`,
        'UsersService',
      );

      return ResponseHelper.success('User created successfully', user);
    } catch (error: any) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(
        `Failed to create user: ${error?.message || 'Unknown error'}`,
        error?.stack,
        'UsersService',
      );
      throw error;
    }
  }

  async updateStatus(userId: string, status: UserStatus) {
    try {
      this.logger.info(
        `Updating user status: ${userId} to ${status}`,
        'UsersService',
      );

      // Verify user exists
      await this.prisma.user.findUniqueOrThrow({
        where: { userId },
      });

      const updated = await this.prisma.user.update({
        where: { userId },
        data: { status },
        include: {
          rfidTags: true,
          fingerprintIds: true,
          profilePicture: true,
        },
      });

      this.logger.success(
        `User status updated successfully: ${userId} -> ${status}`,
        'UsersService',
      );

      return ResponseHelper.success('User status updated successfully', {
        userId: updated.userId,
        newStatus: status,
        updatedAt: updated.updatedAt,
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        // Prisma record not found
        this.logger.warn(`User not found: ${userId}`, 'UsersService');
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      this.logger.error(
        `Failed to update user status ${userId}: ${error?.message || 'Unknown error'}`,
        error?.stack,
        'UsersService',
      );
      throw error;
    }
  }

  async remove(userId: string) {
    try {
      this.logger.info(`Deleting user: ${userId}`, 'UsersService');

      // Verify user exists
      const user = await this.prisma.user.findUniqueOrThrow({
        where: { userId },
      });

      await this.prisma.user.delete({
        where: { userId },
      });

      this.logger.success(`User deleted successfully: ${userId}`, 'UsersService');

      return ResponseHelper.success('User access revoked', {
        userId: user.userId,
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        // Prisma record not found
        this.logger.warn(`User not found: ${userId}`, 'UsersService');
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      this.logger.error(
        `Failed to delete user ${userId}: ${error?.message || 'Unknown error'}`,
        error?.stack,
        'UsersService',
      );
      throw error;
    }
  }

  async getAccessHistory(userId: string, filters?: { from?: string; to?: string; type?: string }) {
    try {
      this.logger.info(
        `Fetching access history for user: ${userId} with filters: ${JSON.stringify(filters)}`,
        'UsersService',
      );

      // Verify user exists
      await this.prisma.user.findUniqueOrThrow({
        where: { userId },
      });

      const allLogsResponse = await this.accessService.findAll({
        userId,
        status: filters?.type === 'success' ? 'success' : filters?.type === 'failed' ? 'failed' : undefined,
        from: filters?.from,
        to: filters?.to,
      });
      const allLogs = (allLogsResponse as any)?.data || [];

      const history = allLogs.map((log: any) => ({
        timestamp: log.timestamp,
        deviceId: log.deviceId,
        accessType: log.method,
        result: log.status,
        message: log.message || (log.status === 'success' ? 'Access granted' : 'Unauthorized'),
      }));

      this.logger.success(
        `Successfully fetched ${history.length} access history records for user: ${userId}`,
        'UsersService',
      );

      return ResponseHelper.success(
        'Access history retrieved successfully',
        history,
        history.length,
      );
    } catch (error: any) {
      if (error.code === 'P2025') {
        // Prisma record not found
        this.logger.warn(`User not found: ${userId}`, 'UsersService');
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      this.logger.error(
        `Failed to fetch access history for user ${userId}: ${error?.message || 'Unknown error'}`,
        error?.stack,
        'UsersService',
      );
      throw error;
    }
  }

  async addRfidTag(userId: string, tag: string) {
    try {
      this.logger.info(`Adding RFID tag ${tag} to user: ${userId}`, 'UsersService');

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
          'UsersService',
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
        'UsersService',
      );

      return ResponseHelper.success('RFID tag added successfully', {
        id: rfidTag.id,
        tag: rfidTag.tag,
        userId: user.userId,
        createdAt: rfidTag.createdAt,
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        this.logger.warn(`User not found: ${userId}`, 'UsersService');
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(
        `Failed to add RFID tag to user ${userId}: ${error?.message || 'Unknown error'}`,
        error?.stack,
        'UsersService',
      );
      throw error;
    }
  }

  async registerFingerprint(userId: string, fingerprintId: number) {
    try {
      this.logger.info(
        `Registering fingerprint ${fingerprintId} for user: ${userId}`,
        'UsersService',
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
          'UsersService',
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
        'UsersService',
      );

      return ResponseHelper.success('Fingerprint registered successfully', {
        id: fingerprint.id,
        fingerprintId: fingerprint.fingerprintId,
        userId: user.userId,
        createdAt: fingerprint.createdAt,
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        this.logger.warn(`User not found: ${userId}`, 'UsersService');
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(
        `Failed to register fingerprint for user ${userId}: ${error?.message || 'Unknown error'}`,
        error?.stack,
        'UsersService',
      );
      throw error;
    }
  }

  async setKeypadPin(userId: string, pin: string) {
    try {
      this.logger.info(`Setting keypad PIN for user: ${userId}`, 'UsersService');

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
        'UsersService',
      );

      return ResponseHelper.success('Keypad PIN set successfully', {
        userId: updated.userId,
        updatedAt: updated.updatedAt,
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        this.logger.warn(`User not found: ${userId}`, 'UsersService');
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      this.logger.error(
        `Failed to set keypad PIN for user ${userId}: ${error?.message || 'Unknown error'}`,
        error?.stack,
        'UsersService',
      );
      throw error;
    }
  }

  /**
   * Generate a temporary 6-digit access code for a user
   * Code expires after specified duration (default: 1 hour)
   * Code is single-use and gets deleted after use
   */
  async generate2FACode(userId: string, expiresInMinutes: number = 60) {
    try {
      this.logger.info(
        `Generating temporary access code for user: ${userId}`,
        'UsersService',
      );

      // Verify user exists
      const user = await this.prisma.user.findUniqueOrThrow({
        where: { userId },
        select: { id: true, userId: true, firstName: true, lastName: true },
      });

      // Generate random 6-digit code
      const code = String(Math.floor(100000 + Math.random() * 900000));

      // Calculate expiration time
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

      // Delete any existing unused codes for this user
      await this.prisma.temporaryAccessCode.deleteMany({
        where: {
          userId: user.id,
          used: false,
        },
      });

      // Create new temporary code
      const temporaryCode = await this.prisma.temporaryAccessCode.create({
        data: {
          code,
          userId: user.id,
          expiresAt,
        },
      });

      this.logger.success(
        `Temporary access code generated for user: ${userId} (expires in ${expiresInMinutes} minutes)`,
        'UsersService',
      );

      return ResponseHelper.success('Temporary access code generated successfully', {
        code,
        userId: user.userId,
        expiresAt: temporaryCode.expiresAt,
        expiresInMinutes,
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        this.logger.warn(`User not found: ${userId}`, 'UsersService');
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      this.logger.error(
        `Failed to generate temporary access code for user ${userId}: ${error?.message || 'Unknown error'}`,
        error?.stack,
        'UsersService',
      );
      throw error;
    }
  }
}

