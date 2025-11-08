import { Injectable } from '@nestjs/common';
import { CreateAccessLogDto } from './dto/create-access-log.dto';
import { FilterAccessLogsDto } from './dto/filter-access-logs.dto';
import { AccessLog } from '../common/entities/access-log.entity';

@Injectable()
export class AccessService {
  // TODO: Replace with actual database implementation
  private accessLogs: AccessLog[] = [];

  create(createAccessLogDto: CreateAccessLogDto) {
    const newLog: AccessLog = {
      logId: `LOG-${Date.now()}`,
      userId: createAccessLogDto.userId,
      deviceId: createAccessLogDto.deviceId,
      method: createAccessLogDto.method,
      rfidUid: createAccessLogDto.rfidUid,
      fingerprintId: createAccessLogDto.fingerprintId,
      status: createAccessLogDto.status,
      message: createAccessLogDto.status === 'success' ? 'Access granted' : 'Unauthorized',
      timestamp: createAccessLogDto.timestamp
        ? new Date(createAccessLogDto.timestamp)
        : new Date(),
    };

    this.accessLogs.push(newLog);

    return {
      status: 'received',
      logId: newLog.logId,
    };
  }

  findAll(filterDto: FilterAccessLogsDto): AccessLog[] {
    let filtered = [...this.accessLogs];

    if (filterDto.deviceId) {
      filtered = filtered.filter((log) => log.deviceId === filterDto.deviceId);
    }

    if (filterDto.userId) {
      filtered = filtered.filter((log) => log.userId === filterDto.userId);
    }

    if (filterDto.status) {
      filtered = filtered.filter((log) => log.status === filterDto.status);
    }

    if (filterDto.method) {
      filtered = filtered.filter((log) => log.method === filterDto.method);
    }

    // TODO: Implement date filtering and pagination
    return filtered;
  }
}

