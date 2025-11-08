import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { FilterUsersDto } from './dto/filter-users.dto';
import { User } from '../common/entities/user.entity';
import { AccessService } from '../access/access.service';

@Injectable()
export class UsersService {
  // TODO: Replace with actual database implementation
  private users: User[] = [];

  constructor(
    @Inject(forwardRef(() => AccessService))
    private readonly accessService: AccessService,
  ) {}

  findAll(filterDto: FilterUsersDto): User[] {
    let filtered = [...this.users];

    if (filterDto.status) {
      filtered = filtered.filter((user) => user.status === filterDto.status);
    }

    if (filterDto.role) {
      filtered = filtered.filter((user) => user.role === filterDto.role);
    }

    if (filterDto.department) {
      filtered = filtered.filter(
        (user) => user.department === filterDto.department,
      );
    }

    // TODO: Implement pagination
    return filtered;
  }

  findOne(userId: string): User {
    const user = this.users.find((u) => u.userId === userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return user;
  }

  create(createUserDto: CreateUserDto): User {
    const newUser: User = {
      userId: `USR${Date.now()}`,
      ...createUserDto,
      createdAt: new Date(),
      fingerprintIds: createUserDto.fingerprintIds || [],
    };
    this.users.push(newUser);
    return newUser;
  }

  updateStatus(userId: string, status: 'active' | 'suspended' | 'terminated') {
    const user = this.findOne(userId);
    user.status = status;
    user.updatedAt = new Date();
    return {
      userId: user.userId,
      newStatus: status,
      updatedAt: user.updatedAt,
    };
  }

  remove(userId: string) {
    const user = this.findOne(userId);
    const index = this.users.indexOf(user);
    this.users.splice(index, 1);
    return {
      message: 'User access revoked',
      userId: user.userId,
    };
  }

  getAccessHistory(userId: string, filters?: { from?: string; to?: string; type?: string }) {
    const allLogs = this.accessService.findAll({
      userId,
      status: filters?.type === 'success' ? 'success' : filters?.type === 'failed' ? 'failed' : undefined,
      from: filters?.from,
      to: filters?.to,
    });

    return allLogs.map((log) => ({
      timestamp: log.timestamp,
      deviceId: log.deviceId,
      accessType: log.method,
      result: log.status,
      message: log.message || (log.status === 'success' ? 'Access granted' : 'Unauthorized'),
    }));
  }
}

