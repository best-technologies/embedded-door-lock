import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { FilterAttendanceDto } from './dto/filter-attendance.dto';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { AttendanceStatsDto } from './dto/attendance-stats.dto';

@ApiTags('Attendance')
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create or update attendance record',
    description: 'Manually create or update an attendance record for a user on a specific date',
  })
  @ApiResponse({
    status: 201,
    description: 'Attendance record created/updated successfully',
  })
  create(@Body() createAttendanceDto: CreateAttendanceDto) {
    return this.attendanceService.createOrUpdateAttendance(createAttendanceDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get attendance records',
    description: 'Retrieve attendance records with optional filtering by user, date range, status, or department',
  })
  @ApiResponse({
    status: 200,
    description: 'Attendance records retrieved successfully',
  })
  findAll(@Query() filterDto: FilterAttendanceDto) {
    return this.attendanceService.findAll(filterDto);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get attendance statistics',
    description: 'Get attendance statistics for a user or all users within a date range',
  })
  @ApiQuery({ name: 'userId', required: false, description: 'User ID to get stats for' })
  @ApiQuery({ name: 'from', required: false, description: 'Start date (ISO date string)' })
  @ApiQuery({ name: 'to', required: false, description: 'End date (ISO date string)' })
  @ApiResponse({
    status: 200,
    description: 'Attendance statistics retrieved successfully',
    type: AttendanceStatsDto,
  })
  getStats(
    @Query('userId') userId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.attendanceService.getAttendanceStats(userId, from, to);
  }

  @Post('holidays')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a holiday',
    description: 'Add a holiday to the system. Holidays prevent users from being marked absent.',
  })
  @ApiResponse({
    status: 201,
    description: 'Holiday created successfully',
  })
  createHoliday(@Body() createHolidayDto: CreateHolidayDto) {
    return this.attendanceService.createHoliday(createHolidayDto);
  }

  @Get('holidays')
  @ApiOperation({
    summary: 'Get all holidays',
    description: 'Retrieve all holidays, optionally filtered by date range',
  })
  @ApiQuery({ name: 'from', required: false, description: 'Start date (ISO date string)' })
  @ApiQuery({ name: 'to', required: false, description: 'End date (ISO date string)' })
  @ApiResponse({
    status: 200,
    description: 'Holidays retrieved successfully',
  })
  getHolidays(@Query('from') from?: string, @Query('to') to?: string) {
    return this.attendanceService.getHolidays(from, to);
  }

  @Delete('holidays/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a holiday',
    description: 'Remove a holiday from the system',
  })
  @ApiParam({ name: 'id', description: 'Holiday ID' })
  @ApiResponse({
    status: 200,
    description: 'Holiday deleted successfully',
  })
  deleteHoliday(@Param('id') id: string) {
    return this.attendanceService.deleteHoliday(id);
  }
}

