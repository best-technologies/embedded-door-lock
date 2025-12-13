import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

export function AdminDashboardDecorators() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get admin dashboard data',
      description: 'Get comprehensive admin dashboard data including stats, users, and attendance. Requires admin role.',
    }),
    ApiResponse({
      status: 200,
      description: 'Admin dashboard data retrieved successfully',
      schema: {
        example: {
          success: true,
          message: 'Dashboard data retrieved successfully',
          data: {
            stats: {
              totalUsers: {
                total: 100,
                male: 60,
                female: 40,
                notSpecified: 0,
              },
              totalAdmins: {
                total: 5,
                active: 5,
              },
              totalStaff: {
                total: 85,
                staff: 50,
                nysc: 10,
                intern: 15,
                trainee: 5,
                contractor: 3,
                visitor: 2,
              },
              clockedInToday: {
                total: 75,
                male: 45,
                female: 30,
                present: 70,
                late: 5,
                absent: 10,
                halfDay: 2,
                earlyDeparture: 3,
              },
              userStatus: {
                active: 95,
                suspended: 3,
                terminated: 2,
              },
              devices: {
                total: 10,
                online: 8,
                offline: 2,
              },
            },
            recentUsers: [
              {
                userId: 'BTL-25-11-13',
                name: 'John Doe',
                email: 'john.doe@example.com',
                role: 'staff',
                department: 'Engineering',
                status: 'active',
                gender: 'M',
                createdAt: '2025-01-15T10:00:00.000Z',
                lastAccessAt: '2025-01-20T08:30:00.000Z',
              },
            ],
            todayAttendance: [
              {
                id: 'clx1234567890',
                date: '2025-01-20',
                name: 'John Doe',
                checkIn: '8:30 AM',
                checkOut: '5:00 PM',
                status: 'present',
                minutesLate: null,
                minutesEarly: null,
                totalHours: 8.5,
                isWorkingDay: true,
                isHoliday: false,
                holidayName: null,
                user: {
                  userId: 'BTL-25-11-13',
                  email: 'john.doe@example.com',
                  role: 'staff',
                  department: 'Engineering',
                  gender: 'M',
                },
              },
            ],
            departmentBreakdown: {
              Engineering: 25,
              HR: 10,
              Finance: 15,
              Operations: 20,
              IT: 12,
              Sales: 8,
              Marketing: 5,
              Unassigned: 3,
            },
            recentAccessLogs: [
              {
                logId: 'LOG-1737360000000-abc123',
                timestamp: '2025-01-20T17:00:00.000Z',
                method: 'rfid',
                status: 'success',
                user: {
                  userId: 'BTL-25-11-13',
                  name: 'John Doe',
                  email: 'john.doe@example.com',
                },
                device: {
                  deviceId: 'DOOR-001',
                  name: 'Main Entrance',
                  location: 'Front Door',
                },
              },
            ],
          },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing token',
      schema: {
        example: {
          statusCode: 401,
          message: 'Unauthorized',
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Admin access required',
      schema: {
        example: {
          statusCode: 403,
          message: 'Insufficient permissions. Admin access required.',
        },
      },
    }),
  );
}

