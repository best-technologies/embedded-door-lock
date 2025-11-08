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

  getSummary() {
    const users = this.usersService.findAll({});
    const devices = this.devicesService.findAll();
    const accessLogs = this.accessService.findAll({});

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayLogs = accessLogs.filter(
      (log) => new Date(log.timestamp) >= today,
    );

    return {
      totalUsers: users.length,
      activeUsers: users.filter((u) => u.status === 'active').length,
      suspendedUsers: users.filter((u) => u.status === 'suspended').length,
      devicesOnline: devices.filter((d) => d.status === 'online').length,
      devicesOffline: devices.filter((d) => d.status === 'offline').length,
      accessAttemptsToday: todayLogs.length,
      successfulAttempts: todayLogs.filter((l) => l.status === 'success').length,
      failedAttempts: todayLogs.filter((l) => l.status === 'failed').length,
    };
  }
}

