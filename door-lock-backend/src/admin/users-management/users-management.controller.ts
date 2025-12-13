import { Controller, Get, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UsersManagementService } from './users-management.service';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FilterUsersDto } from './dto/filter-users.dto';
import { UpdateUserRoleDecorators } from './docs/update-user-role.decorators';
import { UpdateUserDecorators } from './docs/update-user.decorators';
import { GetAllUsersDecorators } from './docs/get-all-users.decorators';
import { AdminOnly } from '../decorators/admin-only.decorator';

@ApiTags('Admin - Users Management')
@Controller('admin/users-management')
@AdminOnly()
export class UsersManagementController {
  constructor(private readonly usersManagementService: UsersManagementService) {}

  @Get()
  @GetAllUsersDecorators()
  async getAllUsers(@Query() filterDto: FilterUsersDto) {
    return this.usersManagementService.findAllUsers(filterDto);
  }

  @Patch(':userId')
  @UpdateUserDecorators()
  async updateUser(
    @Param('userId') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersManagementService.updateUser(userId, updateUserDto);
  }

  @Patch(':userId/role')
  @UpdateUserRoleDecorators()
  async updateUserRole(
    @Param('userId') userId: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
  ) {
    return this.usersManagementService.updateUserRole(userId, updateUserRoleDto);
  }
}

