import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { LoggerService } from '../../common/logger/logger.service';
import { ResponseHelper } from '../../common/helpers/response.helper';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FilterUsersDto } from './dto/filter-users.dto';
import { UserRole, UserStatus, Department } from '@prisma/client';

@Injectable()
export class UsersManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
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
}

