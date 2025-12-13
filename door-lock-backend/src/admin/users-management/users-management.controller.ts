import { Controller, Get, Post, Patch, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UsersManagementService } from './users-management.service';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FilterUsersDto } from './dto/filter-users.dto';
import { EnrollUserDto } from './dto/enroll-user.dto';
import { AddRfidTagDto } from './dto/add-rfid-tag.dto';
import { RegisterFingerprintDto } from './dto/register-fingerprint.dto';
import { SetKeypadPinDto } from './dto/set-keypad-pin.dto';
import { UpdateUserRoleDecorators } from './docs/update-user-role.decorators';
import { UpdateUserDecorators } from './docs/update-user.decorators';
import { GetAllUsersDecorators } from './docs/get-all-users.decorators';
import { EnrollUserDecorators } from './docs/enroll-user.decorators';
import { AddRfidTagDecorators } from './docs/add-rfid-tag.decorators';
import { RegisterFingerprintDecorators } from './docs/register-fingerprint.decorators';
import { SetKeypadPinDecorators } from './docs/set-keypad-pin.decorators';
import { AdminOnly } from '../decorators/admin-only.decorator';

@ApiTags('Admin - Users Management')
@Controller('admin/users-management')
@AdminOnly()
export class UsersManagementController {
  constructor(private readonly usersManagementService: UsersManagementService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @EnrollUserDecorators()
  async enrollUser(@Body() enrollUserDto: EnrollUserDto) {
    return this.usersManagementService.enrollUser(enrollUserDto);
  }

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

  @Post(':userId/rfid-tags')
  @HttpCode(HttpStatus.CREATED)
  @AddRfidTagDecorators()
  async addRfidTag(
    @Param('userId') userId: string,
    @Body() addRfidTagDto: AddRfidTagDto,
  ) {
    return this.usersManagementService.addRfidTag(userId, addRfidTagDto.tag);
  }

  @Post(':userId/fingerprints')
  @HttpCode(HttpStatus.CREATED)
  @RegisterFingerprintDecorators()
  async registerFingerprint(
    @Param('userId') userId: string,
    @Body() registerFingerprintDto: RegisterFingerprintDto,
  ) {
    return this.usersManagementService.registerFingerprint(userId, registerFingerprintDto.fingerprintId);
  }

  @Patch(':userId/keypad-pin')
  @SetKeypadPinDecorators()
  async setKeypadPin(
    @Param('userId') userId: string,
    @Body() setKeypadPinDto: SetKeypadPinDto,
  ) {
    return this.usersManagementService.setKeypadPin(userId, setKeypadPinDto.pin);
  }
}

