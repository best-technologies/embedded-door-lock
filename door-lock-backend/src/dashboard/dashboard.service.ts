import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { DevicesService } from '../devices/devices.service';
import { AccessService } from '../access/access.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly usersService: UsersService,
    private readonly devicesService: DevicesService,
    private readonly accessService: AccessService,
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
}

