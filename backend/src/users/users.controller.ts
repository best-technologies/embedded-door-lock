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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { FilterUsersDto } from './dto/filter-users.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@Query() filterDto: FilterUsersDto) {
    return this.usersService.findAll(filterDto);
  }

  @Get(':userId')
  findOne(@Param('userId') userId: string) {
    return this.usersService.findOne(userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Patch(':userId/status')
  updateStatus(
    @Param('userId') userId: string,
    @Body() updateStatusDto: UpdateUserStatusDto,
  ) {
    return this.usersService.updateStatus(userId, updateStatusDto.status);
  }

  @Delete(':userId')
  @HttpCode(HttpStatus.OK)
  remove(@Param('userId') userId: string) {
    return this.usersService.remove(userId);
  }

  @Get(':userId/access-history')
  getAccessHistory(
    @Param('userId') userId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('type') type?: string,
  ) {
    return this.usersService.getAccessHistory(userId, { from, to, type });
  }
}

