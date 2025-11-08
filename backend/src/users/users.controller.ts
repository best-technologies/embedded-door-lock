import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { FilterUsersDto } from './dto/filter-users.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { AccessHistoryResponseDto } from './dto/access-history-response.dto';
import { PaginatedUsersResponseDto } from './dto/paginated-users-response.dto';
import { AddRfidTagDto } from './dto/add-rfid-tag.dto';
import { RegisterFingerprintDto } from './dto/register-fingerprint.dto';
import { SetKeypadPinDto } from './dto/set-keypad-pin.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all users',
    description: 'Retrieve a paginated list of all users with optional filtering by status, role, and department',
  })
  @ApiResponse({
    status: 200,
    description: 'List of users retrieved successfully',
    type: PaginatedUsersResponseDto,
  })
  async findAll(@Query() filterDto: FilterUsersDto) {
    return this.usersService.findAll(filterDto);
  }

  @Get(':userId')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieve detailed information about a specific user by their userId',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID in format BTL-YY-MM-SS',
    example: 'BTL-25-11-13',
  })
  @ApiResponse({
    status: 200,
    description: 'User details retrieved successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async findOne(@Param('userId') userId: string) {
    return this.usersService.findOne(userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new user',
    description: 'Register a new user in the system. A unique userId will be auto-generated based on role and current date.',
  })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 409,
    description: 'User with email or employeeId already exists',
  })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Patch(':userId/status')
  @ApiOperation({
    summary: 'Update user status',
    description: 'Change the account status of a user (active, suspended, or terminated)',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID in format BTL-YY-MM-SS',
    example: 'BTL-25-11-13',
  })
  @ApiBody({ type: UpdateUserStatusDto })
  @ApiResponse({
    status: 200,
    description: 'User status updated successfully',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', example: 'BTL-25-11-13' },
        newStatus: { type: 'string', enum: ['active', 'suspended', 'terminated'], example: 'suspended' },
        updatedAt: { type: 'string', format: 'date-time', example: '2025-11-08T12:05:00Z' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async updateStatus(
    @Param('userId') userId: string,
    @Body() updateStatusDto: UpdateUserStatusDto,
  ) {
    return this.usersService.updateStatus(userId, updateStatusDto.status);
  }

  @Delete(':userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete user',
    description: 'Remove a user from the system (soft delete recommended)',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID in format BTL-YY-MM-SS',
    example: 'BTL-25-11-13',
  })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'User access revoked' },
        userId: { type: 'string', example: 'BTL-25-11-13' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async remove(@Param('userId') userId: string) {
    return this.usersService.remove(userId);
  }

  @Get(':userId/access-history')
  @ApiOperation({
    summary: 'Get user access history',
    description: 'Retrieve the access attempt history for a specific user',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID in format BTL-YY-MM-SS',
    example: 'BTL-25-11-13',
  })
  @ApiQuery({
    name: 'from',
    required: false,
    description: 'Start date (ISO 8601 format)',
    example: '2025-11-01T00:00:00Z',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    description: 'End date (ISO 8601 format)',
    example: '2025-11-08T23:59:59Z',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filter by result type',
    enum: ['success', 'failed'],
    example: 'success',
  })
  @ApiResponse({
    status: 200,
    description: 'Access history retrieved successfully',
    type: [AccessHistoryResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getAccessHistory(
    @Param('userId') userId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('type') type?: string,
  ) {
    return this.usersService.getAccessHistory(userId, { from, to, type });
  }

  @Post(':userId/rfid-tags')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add RFID tag to user',
    description: 'Attach an RFID tag to a user for RFID-based access',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID in format BTL-YY-MM-SS',
    example: 'BTL-25-11-13',
  })
  @ApiBody({ type: AddRfidTagDto })
  @ApiResponse({
    status: 201,
    description: 'RFID tag added successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 409,
    description: 'RFID tag already registered for this user',
  })
  async addRfidTag(
    @Param('userId') userId: string,
    @Body() addRfidTagDto: AddRfidTagDto,
  ) {
    return this.usersService.addRfidTag(userId, addRfidTagDto.tag);
  }

  @Post(':userId/fingerprints')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register fingerprint for user',
    description: 'Register a fingerprint ID from the device for fingerprint-based access',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID in format BTL-YY-MM-SS',
    example: 'BTL-25-11-13',
  })
  @ApiBody({ type: RegisterFingerprintDto })
  @ApiResponse({
    status: 201,
    description: 'Fingerprint registered successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Fingerprint ID already registered for this user',
  })
  async registerFingerprint(
    @Param('userId') userId: string,
    @Body() registerFingerprintDto: RegisterFingerprintDto,
  ) {
    return this.usersService.registerFingerprint(userId, registerFingerprintDto.fingerprintId);
  }

  @Patch(':userId/keypad-pin')
  @ApiOperation({
    summary: 'Set or update keypad PIN',
    description: 'Set or update the keypad PIN for a user (PIN will be hashed)',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID in format BTL-YY-MM-SS',
    example: 'BTL-25-11-13',
  })
  @ApiBody({ type: SetKeypadPinDto })
  @ApiResponse({
    status: 200,
    description: 'Keypad PIN set successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async setKeypadPin(
    @Param('userId') userId: string,
    @Body() setKeypadPinDto: SetKeypadPinDto,
  ) {
    return this.usersService.setKeypadPin(userId, setKeypadPinDto.pin);
  }
}

