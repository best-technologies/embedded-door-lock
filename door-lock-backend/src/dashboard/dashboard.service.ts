import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UsersService } from '../users/users.service';
import { DevicesService } from '../devices/devices.service';
import { AccessService } from '../access/access.service';
import { AttendanceService } from '../attendance/attendance.service';
import { LoggerService } from '../common/logger/logger.service';
import { ResponseHelper } from '../common/helpers/response.helper';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly devicesService: DevicesService,
    private readonly accessService: AccessService,
    private readonly attendanceService: AttendanceService,
    private readonly logger: LoggerService,
  ) {}

  async getSummary() {
    try {
      // Get all users (no pagination limit for summary)
      const usersResult = await this.usersService.findAll({ limit: 10000 });
      const users = usersResult.data || [];
      
      const devices = await this.devicesService.findAll();
      const accessLogsResponse = await this.accessService.findAll({});
      const accessLogs = (accessLogsResponse as any)?.data || [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayLogs = accessLogs.filter(
        (log: any) => new Date(log.timestamp) >= today,
      );

      return {
        totalUsers: usersResult.total || 0,
        activeUsers: users.filter((u) => u.status === 'active').length,
        suspendedUsers: users.filter((u) => u.status === 'suspended').length,
        devicesOnline: devices.filter((d) => d.status === 'online').length,
        devicesOffline: devices.filter((d) => d.status === 'offline').length,
        accessAttemptsToday: todayLogs.length,
        successfulAttempts: todayLogs.filter((l: any) => l.status === 'success').length,
        failedAttempts: todayLogs.filter((l: any) => l.status === 'failed').length,
      };
    } catch (error: any) {
      // Return default values on error
      return {
        totalUsers: 0,
        activeUsers: 0,
        suspendedUsers: 0,
        devicesOnline: 0,
        devicesOffline: 0,
        accessAttemptsToday: 0,
        successfulAttempts: 0,
        failedAttempts: 0,
      };
    }
  }

  /**
   * Format time to 12-hour format (00:00 AM/PM)
   */
  private formatTime(date: Date | null | undefined): string {
    if (!date) return '-';
    const d = new Date(date);
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${ampm}`;
  }

  /**
   * Get comprehensive admin dashboard data
   */
  async getAdminDashboard() {
    try {
      this.logger.info('Fetching admin dashboard data', 'DashboardService');

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);

      // Get all users with their data
      const allUsers = await this.prisma.user.findMany({
        select: {
          id: true,
          userId: true,
          firstName: true,
          lastName: true,
          email: true,
          gender: true,
          role: true,
          department: true,
          status: true,
          createdAt: true,
          lastAccessAt: true,
        },
      });

      // Get today's attendance
      const todayAttendance = await this.prisma.attendance.findMany({
        where: {
          date: {
            gte: today,
            lte: todayEnd,
          },
        },
        include: {
          user: {
            select: {
              userId: true,
              firstName: true,
              lastName: true,
              email: true,
              gender: true,
              role: true,
              department: true,
            },
          },
        },
        orderBy: {
          checkIn: 'asc',
        },
      });

      // Calculate statistics
      const totalUsers = allUsers.length;
      const maleCount = allUsers.filter((u) => u.gender === 'M').length;
      const femaleCount = allUsers.filter((u) => u.gender === 'F').length;
      const genderNotSpecified = totalUsers - maleCount - femaleCount;

      const totalAdmins = allUsers.filter((u) => u.role === 'admin').length;

      // Staff breakdown by role
      const staffCount = allUsers.filter((u) => u.role === 'staff').length;
      const nyscCount = allUsers.filter((u) => u.role === 'nysc').length;
      const internCount = allUsers.filter((u) => u.role === 'intern').length;
      const traineeCount = allUsers.filter((u) => u.role === 'trainee').length;
      const contractorCount = allUsers.filter((u) => u.role === 'contractor').length;
      const visitorCount = allUsers.filter((u) => u.role === 'visitor').length;

      // Today's attendance stats
      const clockedInToday = todayAttendance.filter(
        (a) => a.checkIn !== null && (a.status === 'present' || a.status === 'late'),
      ).length;
      const clockedInMale = todayAttendance.filter(
        (a) =>
          a.checkIn !== null &&
          (a.status === 'present' || a.status === 'late') &&
          a.user.gender === 'M',
      ).length;
      const clockedInFemale = todayAttendance.filter(
        (a) =>
          a.checkIn !== null &&
          (a.status === 'present' || a.status === 'late') &&
          a.user.gender === 'F',
      ).length;

      // Get first 5 users
      const recentUsers = await this.prisma.user.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          userId: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          department: true,
          status: true,
          gender: true,
          createdAt: true,
          lastAccessAt: true,
        },
      });

      // Format today's attendance table
      const todayAttendanceTable = todayAttendance.map((attendance) => ({
        id: attendance.id,
        date: attendance.date.toISOString().split('T')[0],
        name: `${attendance.user.firstName} ${attendance.user.lastName}`,
        checkIn: this.formatTime(attendance.checkIn),
        checkOut: this.formatTime(attendance.checkOut),
        status: attendance.status,
        minutesLate: attendance.minutesLate,
        minutesEarly: attendance.minutesEarly,
        totalHours: attendance.totalHours,
        isWorkingDay: attendance.isWorkingDay,
        isHoliday: attendance.isHoliday,
        holidayName: attendance.holidayName,
        user: {
          userId: attendance.user.userId,
          email: attendance.user.email,
          role: attendance.user.role,
          department: attendance.user.department,
          gender: attendance.user.gender,
        },
      }));

      // Additional useful statistics
      const activeUsers = allUsers.filter((u) => u.status === 'active').length;
      const suspendedUsers = allUsers.filter((u) => u.status === 'suspended').length;
      const terminatedUsers = allUsers.filter((u) => u.status === 'terminated').length;

      // Department breakdown
      const departmentBreakdown = allUsers.reduce((acc, user) => {
        const dept = user.department || 'Unassigned';
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Today's attendance status breakdown
      const presentToday = todayAttendance.filter((a) => a.status === 'present').length;
      const lateToday = todayAttendance.filter((a) => a.status === 'late').length;
      const absentToday = allUsers.filter((user) => {
        const hasAttendance = todayAttendance.some((a) => a.userId === user.id);
        return !hasAttendance && user.status === 'active' && user.role !== 'visitor';
      }).length;
      const halfDayToday = todayAttendance.filter((a) => a.status === 'half_day').length;
      const earlyDepartureToday = todayAttendance.filter(
        (a) => a.status === 'early_departure',
      ).length;

      // Get devices status
      const devices = await this.prisma.device.findMany({
        select: {
          id: true,
          deviceId: true,
          name: true,
          location: true,
          status: true,
        },
      });
      const devicesOnline = devices.filter((d) => d.status === 'online').length;
      const devicesOffline = devices.filter((d) => d.status === 'offline').length;

      // Recent access logs (last 10)
      const recentAccessLogs = await this.prisma.accessLog.findMany({
        take: 10,
        orderBy: {
          timestamp: 'desc',
        },
        include: {
          user: {
            select: {
              userId: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          device: {
            select: {
              deviceId: true,
              name: true,
              location: true,
            },
          },
        },
      });

      const dashboardData = {
        // Stat Cards
        stats: {
          totalUsers: {
            total: totalUsers,
            male: maleCount,
            female: femaleCount,
            notSpecified: genderNotSpecified,
          },
          totalAdmins: {
            total: totalAdmins,
            active: allUsers.filter((u) => u.role === 'admin' && u.status === 'active').length,
          },
          totalStaff: {
            total: staffCount + nyscCount + internCount + traineeCount + contractorCount,
            staff: staffCount,
            nysc: nyscCount,
            intern: internCount,
            trainee: traineeCount,
            contractor: contractorCount,
            visitor: visitorCount,
          },
          clockedInToday: {
            total: clockedInToday,
            male: clockedInMale,
            female: clockedInFemale,
            present: presentToday,
            late: lateToday,
            absent: absentToday,
            halfDay: halfDayToday,
            earlyDeparture: earlyDepartureToday,
          },
          // Additional stats
          userStatus: {
            active: activeUsers,
            suspended: suspendedUsers,
            terminated: terminatedUsers,
          },
          devices: {
            total: devices.length,
            online: devicesOnline,
            offline: devicesOffline,
          },
        },

        // Users Table (First 5)
        recentUsers: recentUsers.map((user) => ({
          userId: user.userId,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role,
          department: user.department,
          status: user.status,
          gender: user.gender,
          createdAt: user.createdAt,
          lastAccessAt: user.lastAccessAt,
        })),

        // Today's Attendance Table
        todayAttendance: todayAttendanceTable,

        // Additional Data
        departmentBreakdown,
        recentAccessLogs: recentAccessLogs.map((log) => ({
          logId: log.logId,
          timestamp: log.timestamp,
          method: log.method,
          status: log.status,
          user: {
            userId: log.user.userId,
            name: `${log.user.firstName} ${log.user.lastName}`,
            email: log.user.email,
          },
          device: {
            deviceId: log.device.deviceId,
            name: log.device.name,
            location: log.device.location,
          },
        })),
      };

      this.logger.success('Admin dashboard data fetched successfully', 'DashboardService');

      return ResponseHelper.success('Dashboard data retrieved successfully', dashboardData);
    } catch (error: any) {
      this.logger.error(
        `Failed to fetch admin dashboard data: ${error?.message || 'Unknown error'}`,
        error?.stack,
        'DashboardService',
      );
      throw error;
    }
  }
}

