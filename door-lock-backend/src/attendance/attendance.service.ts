import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AppConfigService } from '../config/config.service';
import { LoggerService } from '../common/logger/logger.service';
import { ResponseHelper } from '../common/helpers/response.helper';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { FilterAttendanceDto } from './dto/filter-attendance.dto';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { AttendanceStatsDto } from './dto/attendance-stats.dto';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Check if a date is a working day (Monday to Friday)
   */
  private isWorkingDay(date: Date): boolean {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const workingDays = this.config.workingDays.split(',').map(Number);
    return workingDays.includes(dayOfWeek);
  }

  /**
   * Check if a date is a holiday
   */
  private async isHoliday(date: Date): Promise<{ isHoliday: boolean; holidayName?: string }> {
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    // Check for exact date match
    const holiday = await this.prisma.holiday.findFirst({
      where: {
        date: {
          gte: dateOnly,
          lt: new Date(dateOnly.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    if (holiday) {
      return { isHoliday: true, holidayName: holiday.name };
    }

    // Check for recurring holidays (same month and day, different year)
    const month = dateOnly.getMonth() + 1; // 1-12
    const day = dateOnly.getDate();

    const recurringHolidays = await this.prisma.holiday.findMany({
      where: {
        isRecurring: true,
      },
    });

    for (const recurringHoliday of recurringHolidays) {
      const holidayDate = new Date(recurringHoliday.date);
      if (holidayDate.getMonth() + 1 === month && holidayDate.getDate() === day) {
        return { isHoliday: true, holidayName: recurringHoliday.name };
      }
    }

    return { isHoliday: false };
  }

  /**
   * Parse time string (HH:MM) and return minutes from midnight
   */
  private timeToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Calculate attendance status based on check-in/check-out times
   */
  private calculateAttendanceStatus(
    checkIn: Date | null,
    checkOut: Date | null,
    isWorkingDay: boolean,
    isHoliday: boolean,
  ): {
    status: 'present' | 'absent' | 'late' | 'early_departure' | 'half_day' | 'holiday' | 'weekend';
    minutesLate?: number;
    minutesEarly?: number;
    totalHours?: number;
  } {
    if (!isWorkingDay) {
      return { status: 'weekend' };
    }

    if (isHoliday) {
      return { status: 'holiday' };
    }

    if (!checkIn) {
      return { status: 'absent' };
    }

    const openingTime = this.timeToMinutes(this.config.officeOpeningTime);
    const closingTime = this.timeToMinutes(this.config.officeClosingTime);
    const lateThreshold = this.config.lateThresholdMinutes;

    const checkInMinutes = checkIn.getHours() * 60 + checkIn.getMinutes();
    const checkOutMinutes = checkOut ? checkOut.getHours() * 60 + checkOut.getMinutes() : null;

    let minutesLate: number | undefined;
    if (checkInMinutes > openingTime + lateThreshold) {
      minutesLate = checkInMinutes - openingTime;
    }

    let minutesEarly: number | undefined;
    if (checkOutMinutes && checkOutMinutes < closingTime) {
      minutesEarly = closingTime - checkOutMinutes;
    }

    let totalHours: number | undefined;
    if (checkIn && checkOut) {
      totalHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
    }

    // Determine status
    let status: 'present' | 'late' | 'early_departure' | 'half_day' | 'absent';
    
    if (!checkOut) {
      status = 'half_day';
    } else if (minutesLate && minutesLate > lateThreshold) {
      status = 'late';
    } else if (minutesEarly && minutesEarly > 60) {
      // More than 1 hour early departure
      status = 'early_departure';
    } else if (totalHours && totalHours < 4) {
      // Less than 4 hours worked
      status = 'half_day';
    } else {
      status = 'present';
    }

    return {
      status,
      minutesLate,
      minutesEarly,
      totalHours,
    };
  }

  /**
   * Generate attendance ID
   */
  private generateAttendanceId(userId: string, date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `ATT-${year}-${month}-${day}-${userId}`;
  }

  /**
   * Check if a timestamp is within the checkout window
   */
  private isWithinCheckoutWindow(timestamp: Date): boolean {
    const windowStart = this.timeToMinutes(this.config.checkoutWindowStart);
    const windowEnd = this.timeToMinutes(this.config.checkoutWindowEnd);
    const accessMinutes = timestamp.getHours() * 60 + timestamp.getMinutes();

    return accessMinutes >= windowStart && accessMinutes <= windowEnd;
  }

  /**
   * Record attendance from access log
   * 
   * Logic:
   * - First access of the day = check-in time
   * - Last access within checkout window (e.g., 4:50 PM - 5:05 PM) = check-out time
   * - Accesses outside checkout window are ignored for checkout purposes
   */
  async recordAttendanceFromAccess(userId: string, timestamp: Date): Promise<void> {
    try {
      const date = new Date(timestamp);
      date.setHours(0, 0, 0, 0);

      const isWorking = this.isWorkingDay(date);
      const holidayCheck = await this.isHoliday(date);
      const isInCheckoutWindow = this.isWithinCheckoutWindow(timestamp);

      // Find existing attendance record for this date
      const existingAttendance = await this.prisma.attendance.findUnique({
        where: {
          userId_date: {
            userId,
            date,
          },
        },
      });

      if (existingAttendance) {
        // Update existing record
        let checkIn = existingAttendance.checkIn;
        let checkOut = existingAttendance.checkOut;

        // Check-in: First access of the day or earlier than current check-in
        if (!checkIn || timestamp < checkIn) {
          checkIn = timestamp;
        }

        // Check-out: Only update if this access is within checkout window
        // and is later than current check-out (or if no check-out exists yet)
        if (isInCheckoutWindow) {
          if (!checkOut || timestamp > checkOut) {
            checkOut = timestamp;
          }
        }
        // If access is outside checkout window, don't update check-out
        // This prevents mid-day exits from being recorded as check-out

        const statusCalc = this.calculateAttendanceStatus(
          checkIn,
          checkOut,
          isWorking,
          holidayCheck.isHoliday,
        );

        await this.prisma.attendance.update({
          where: { id: existingAttendance.id },
          data: {
            checkIn,
            checkOut,
            status: statusCalc.status,
            minutesLate: statusCalc.minutesLate,
            minutesEarly: statusCalc.minutesEarly,
            totalHours: statusCalc.totalHours,
            isWorkingDay: isWorking,
            isHoliday: holidayCheck.isHoliday,
            holidayName: holidayCheck.holidayName,
          },
        });
      } else {
        // Create new attendance record
        // Check-in: This is the first access
        const checkIn = timestamp;
        
        // Check-out: Only set if this access is within checkout window
        // (unlikely for first access, but handles edge cases)
        const checkOut = isInCheckoutWindow ? timestamp : null;

        const statusCalc = this.calculateAttendanceStatus(
          checkIn,
          checkOut,
          isWorking,
          holidayCheck.isHoliday,
        );

        await this.prisma.attendance.create({
          data: {
            attendanceId: this.generateAttendanceId(userId, date),
            userId,
            date,
            checkIn,
            checkOut,
            status: statusCalc.status,
            minutesLate: statusCalc.minutesLate,
            minutesEarly: statusCalc.minutesEarly,
            totalHours: statusCalc.totalHours,
            isWorkingDay: isWorking,
            isHoliday: holidayCheck.isHoliday,
            holidayName: holidayCheck.holidayName,
          },
        });
      }

      this.logger.info(
        `Attendance recorded for user ${userId} on ${date.toISOString().split('T')[0]} (${isInCheckoutWindow ? 'checkout window' : 'regular access'})`,
        'AttendanceService',
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to record attendance: ${error?.message || 'Unknown error'}`,
        error?.stack,
        'AttendanceService',
      );
      throw error;
    }
  }

  /**
   * Create or update attendance record manually
   */
  async createOrUpdateAttendance(dto: CreateAttendanceDto) {
    try {
      const date = new Date(dto.date);
      date.setHours(0, 0, 0, 0);

      // Verify user exists
      const user = await this.prisma.user.findUnique({
        where: { id: dto.userId },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${dto.userId} not found`);
      }

      const isWorking = this.isWorkingDay(date);
      const holidayCheck = await this.isHoliday(date);

      const checkIn = dto.checkIn ? new Date(dto.checkIn) : null;
      const checkOut = dto.checkOut ? new Date(dto.checkOut) : null;

      const statusCalc = this.calculateAttendanceStatus(
        checkIn,
        checkOut,
        isWorking,
        holidayCheck.isHoliday,
      );

      const attendanceData = {
        attendanceId: this.generateAttendanceId(dto.userId, date),
        userId: dto.userId,
        date,
        checkIn,
        checkOut,
        status: statusCalc.status,
        minutesLate: statusCalc.minutesLate,
        minutesEarly: statusCalc.minutesEarly,
        totalHours: statusCalc.totalHours,
        isWorkingDay: isWorking,
        isHoliday: holidayCheck.isHoliday,
        holidayName: holidayCheck.holidayName,
        notes: dto.notes,
      };

      // Check if attendance already exists
      const existing = await this.prisma.attendance.findUnique({
        where: {
          userId_date: {
            userId: dto.userId,
            date,
          },
        },
      });

      const attendance = await this.prisma.attendance.upsert({
        where: {
          userId_date: {
            userId: dto.userId,
            date,
          },
        },
        create: attendanceData,
        update: attendanceData,
        include: {
          user: {
            select: {
              userId: true,
              firstName: true,
              lastName: true,
              email: true,
              department: true,
              role: true,
            },
          },
        },
      });

      this.logger.success(
        `Attendance ${existing ? 'updated' : 'created'} for user ${dto.userId} on ${dto.date}`,
        'AttendanceService',
      );

      return ResponseHelper.success('Attendance recorded successfully', attendance);
    } catch (error: any) {
      this.logger.error(
        `Failed to create/update attendance: ${error?.message || 'Unknown error'}`,
        error?.stack,
        'AttendanceService',
      );
      throw error;
    }
  }

  /**
   * Get attendance records with filters
   */
  async findAll(filterDto: FilterAttendanceDto) {
    this.logger.info(`Fetching attendance records with filters: ${JSON.stringify(filterDto)}`, 'AttendanceService');
    try {
      const page = filterDto.page || 1;
      const limit = filterDto.limit || 20;
      const skip = (page - 1) * limit;

      const where: any = {};

      if (filterDto.userId) {
        where.userId = filterDto.userId;
      }

      if (filterDto.from || filterDto.to) {
        where.date = {};
        if (filterDto.from) {
          where.date.gte = new Date(filterDto.from);
        }
        if (filterDto.to) {
          const toDate = new Date(filterDto.to);
          toDate.setHours(23, 59, 59, 999);
          where.date.lte = toDate;
        }
      }

      if (filterDto.status) {
        where.status = filterDto.status;
      }

      if (filterDto.department) {
        where.user = {
          department: filterDto.department,
        };
      }

      const [attendance, total] = await Promise.all([
        this.prisma.attendance.findMany({
          where,
          include: {
            user: {
              select: {
                userId: true,
                firstName: true,
                lastName: true,
                email: true,
                department: true,
                role: true,
              },
            },
          },
          orderBy: {
            date: 'desc',
          },
          skip,
          take: limit,
        }),
        this.prisma.attendance.count({ where }),
      ]);

      this.logger.success(`Successfully fetched ${attendance.length} attendance records (total: ${total})`, 'AttendanceService');

      return ResponseHelper.success('Attendance records retrieved successfully', {
        data: attendance,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      this.logger.error(
        `Failed to fetch attendance records: ${error?.message || 'Unknown error'}`,
        error?.stack,
        'AttendanceService',
      );
      throw error;
    }
  }

  /**
   * Get attendance statistics for a user or all users
   */
  async getAttendanceStats(userId?: string, from?: string, to?: string): Promise<AttendanceStatsDto> {
    try {
      const startDate = from ? new Date(from) : new Date();
      startDate.setDate(1); // First day of current month if not specified
      startDate.setHours(0, 0, 0, 0);

      const endDate = to ? new Date(to) : new Date();
      endDate.setHours(23, 59, 59, 999);

      const where: any = {
        date: {
          gte: startDate,
          lte: endDate,
        },
      };

      if (userId) {
        where.userId = userId;
      }

      const attendanceRecords = await this.prisma.attendance.findMany({
        where,
        select: {
          status: true,
          isWorkingDay: true,
          isHoliday: true,
          totalHours: true,
        },
      });

      const stats: AttendanceStatsDto = {
        totalDays: 0,
        workingDays: 0,
        present: 0,
        absent: 0,
        late: 0,
        earlyDeparture: 0,
        halfDay: 0,
        holidays: 0,
        weekends: 0,
        attendancePercentage: 0,
        averageHoursPerDay: 0,
      };

      // Calculate days in range
      const currentDate = new Date(startDate);
      let totalDays = 0;
      let workingDaysCount = 0;
      let holidaysCount = 0;
      let weekendsCount = 0;

      while (currentDate <= endDate) {
        totalDays++;
        if (this.isWorkingDay(currentDate)) {
          workingDaysCount++;
        } else {
          weekendsCount++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Count holidays in the range
      const holidaysInRange = await this.prisma.holiday.findMany({
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      });
      holidaysCount = holidaysInRange.length;

      stats.totalDays = totalDays;
      stats.workingDays = workingDaysCount;
      stats.holidays = holidaysCount;
      stats.weekends = weekendsCount;

      // Count attendance statuses
      attendanceRecords.forEach((record) => {
        switch (record.status) {
          case 'present':
            stats.present++;
            break;
          case 'absent':
            stats.absent++;
            break;
          case 'late':
            stats.late++;
            break;
          case 'early_departure':
            stats.earlyDeparture++;
            break;
          case 'half_day':
            stats.halfDay++;
            break;
        }
      });

      // Calculate attendance percentage (excluding holidays and weekends)
      const expectedWorkingDays = workingDaysCount - holidaysCount;
      if (expectedWorkingDays > 0) {
        stats.attendancePercentage = (stats.present / expectedWorkingDays) * 100;
      }

      // Calculate average hours
      const totalHours = attendanceRecords
        .filter((r) => r.totalHours)
        .reduce((sum, r) => sum + (r.totalHours || 0), 0);
      const daysWithHours = attendanceRecords.filter((r) => r.totalHours).length;
      stats.averageHoursPerDay = daysWithHours > 0 ? totalHours / daysWithHours : 0;

      return stats;
    } catch (error: any) {
      this.logger.error(
        `Failed to calculate attendance stats: ${error?.message || 'Unknown error'}`,
        error?.stack,
        'AttendanceService',
      );
      throw error;
    }
  }

  /**
   * Create a holiday
   */
  async createHoliday(dto: CreateHolidayDto) {
    try {
      const date = new Date(dto.date);
      date.setHours(0, 0, 0, 0);

      // Check if holiday already exists
      const existing = await this.prisma.holiday.findUnique({
        where: { date },
      });

      if (existing) {
        throw new BadRequestException(`Holiday already exists for date ${dto.date}`);
      }

      const holiday = await this.prisma.holiday.create({
        data: {
          name: dto.name,
          date,
          isRecurring: dto.isRecurring || false,
          description: dto.description,
        },
      });

      this.logger.success(`Holiday created: ${dto.name} on ${dto.date}`, 'AttendanceService');

      return ResponseHelper.success('Holiday created successfully', holiday);
    } catch (error: any) {
      this.logger.error(
        `Failed to create holiday: ${error?.message || 'Unknown error'}`,
        error?.stack,
        'AttendanceService',
      );
      throw error;
    }
  }

  /**
   * Get all holidays
   */
  async getHolidays(from?: string, to?: string) {
    try {
      const where: any = {};

      if (from || to) {
        where.date = {};
        if (from) {
          where.date.gte = new Date(from);
        }
        if (to) {
          const toDate = new Date(to);
          toDate.setHours(23, 59, 59, 999);
          where.date.lte = toDate;
        }
      }

      const holidays = await this.prisma.holiday.findMany({
        where,
        orderBy: {
          date: 'asc',
        },
      });

      return ResponseHelper.success('Holidays retrieved successfully', holidays);
    } catch (error: any) {
      this.logger.error(
        `Failed to fetch holidays: ${error?.message || 'Unknown error'}`,
        error?.stack,
        'AttendanceService',
      );
      throw error;
    }
  }

  /**
   * Delete a holiday
   */
  async deleteHoliday(id: string) {
    try {
      const holiday = await this.prisma.holiday.findUnique({
        where: { id },
      });

      if (!holiday) {
        throw new NotFoundException(`Holiday with ID ${id} not found`);
      }

      await this.prisma.holiday.delete({
        where: { id },
      });

      this.logger.success(`Holiday deleted: ${holiday.name}`, 'AttendanceService');

      return ResponseHelper.success('Holiday deleted successfully');
    } catch (error: any) {
      this.logger.error(
        `Failed to delete holiday: ${error?.message || 'Unknown error'}`,
        error?.stack,
        'AttendanceService',
      );
      throw error;
    }
  }
}

