import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateAccessLogDto } from './dto/create-access-log.dto';
import { FilterAccessLogsDto } from './dto/filter-access-logs.dto';
import { VerifyRfidDto } from './dto/verify-rfid.dto';
import { VerifyFingerprintDto } from './dto/verify-fingerprint.dto';
import { AccessLog } from '../common/entities/access-log.entity';
import { LoggerService } from '../common/logger/logger.service';
import { ResponseHelper } from '../common/helpers/response.helper';

@Injectable()
export class AccessService {
  // TODO: Replace with actual database implementation
  private accessLogs: AccessLog[] = [];

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  async create(createAccessLogDto: CreateAccessLogDto) {
    try {
      this.logger.info(
        `Creating access log: ${JSON.stringify({
          ...createAccessLogDto,
          rfidUid: createAccessLogDto.rfidUid ? '***' : undefined,
          fingerprintId: createAccessLogDto.fingerprintId,
        })}`,
        'AccessService',
      );

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

      this.logger.success(
        `Access log created successfully: ${newLog.logId} (${createAccessLogDto.status})`,
        'AccessService',
      );

      return ResponseHelper.success('Access log created successfully', {
        logId: newLog.logId,
        status: createAccessLogDto.status,
        timestamp: newLog.timestamp,
      });
    } catch (error: any) {
      this.logger.error(
        `Failed to create access log: ${error?.message || 'Unknown error'}`,
        error?.stack,
        'AccessService',
      );
      throw error;
    }
  }

  async findAll(filterDto: FilterAccessLogsDto) {
    try {
      this.logger.info(
        `Fetching access logs with filters: ${JSON.stringify(filterDto)}`,
        'AccessService',
      );

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

      this.logger.success(
        `Successfully fetched ${filtered.length} access log(s)`,
        'AccessService',
      );

      return ResponseHelper.success('Access logs retrieved successfully', filtered);
    } catch (error: any) {
      this.logger.error(
        `Failed to fetch access logs: ${error?.message || 'Unknown error'}`,
        error?.stack,
        'AccessService',
      );
      throw error;
    }
  }

  /**
   * Verify RFID tag and return user if found
   */
  async verifyRfid(verifyRfidDto: VerifyRfidDto) {
    try {
      const { rfidTag, deviceId } = verifyRfidDto;
      
      this.logger.info(
        `Verifying RFID tag: ${rfidTag}${deviceId ? ` from device: ${deviceId}` : ''}`,
        'AccessService',
      );

      // Normalize RFID tag (remove 0x prefix if present, convert to uppercase)
      const normalizedTag = rfidTag.toUpperCase().replace(/^0X/, '');

      this.logger.info(
        `Normalized RFID tag: ${normalizedTag}`,
        'AccessService',
      );

      // Find RFID tag in database (case-insensitive search)
      // Get all RFID tags and filter in memory for case-insensitive match
      const allRfidTags = await this.prisma.rfidTag.findMany({
        include: {
          user: {
            include: {
              rfidTags: true,
              fingerprintIds: true,
              profilePicture: true,
            },
          },
        },
      });

      // Find matching tag (case-insensitive)
      const rfidTagRecord = allRfidTags.find(
        (tag) => tag.tag.toUpperCase().replace(/^0X/, '') === normalizedTag,
      );

      if (!rfidTagRecord) {
        this.logger.warn(
          `RFID tag not found in database: ${rfidTag} (normalized: ${normalizedTag})`,
          'AccessService',
        );
        return ResponseHelper.success('RFID tag verification failed', {
          authorized: false,
          user: null,
          reason: 'RFID tag not registered',
        });
      }

      const user = rfidTagRecord.user;

      this.logger.info(
        `RFID tag found for user: ${user.userId}, checking access permissions`,
        'AccessService',
      );

      // Check if user is active
      if (user.status !== 'active') {
        this.logger.warn(
          `RFID tag found but user account is ${user.status}: ${user.userId}`,
          'AccessService',
        );
        return ResponseHelper.success('RFID tag verification failed', {
          authorized: false,
          user: null,
          reason: `User account is ${user.status}`,
        });
      }

      // Check if user has RFID access method enabled
      if (!user.allowedAccessMethods.includes('rfid')) {
        this.logger.warn(
          `RFID tag found but user doesn't have RFID access method enabled: ${user.userId}`,
          'AccessService',
        );
        return ResponseHelper.success('RFID tag verification failed', {
          authorized: false,
          user: null,
          reason: 'RFID access method not enabled for this user',
        });
      }

      this.logger.success(
        `RFID tag verified successfully for user: ${user.userId} (${user.firstName} ${user.lastName})`,
        'AccessService',
      );

      return ResponseHelper.success('RFID tag verified successfully', {
        authorized: true,
        user: {
          userId: user.userId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          status: user.status,
          role: user.role,
          department: user.department,
          allowedAccessMethods: user.allowedAccessMethods,
          rfidTags: user.rfidTags.map((tag) => tag.tag),
          fingerprintIds: user.fingerprintIds.map((fp) => fp.fingerprintId),
        },
      });
    } catch (error: any) {
      this.logger.error(
        `Failed to verify RFID tag ${verifyRfidDto.rfidTag}: ${error?.message || 'Unknown error'}`,
        error?.stack,
        'AccessService',
      );
      throw error;
    }
  }

  /**
   * Verify fingerprint ID and return user if found
   */
  async verifyFingerprint(verifyFingerprintDto: VerifyFingerprintDto) {
    try {
      const { fingerprintId, deviceId } = verifyFingerprintDto;
      
      this.logger.info(
        `Verifying fingerprint ID: ${fingerprintId}${deviceId ? ` from device: ${deviceId}` : ''}`,
        'AccessService',
      );

      // Find fingerprint ID in database
      const fingerprintRecord = await this.prisma.fingerprintId.findFirst({
        where: {
          fingerprintId,
        },
        include: {
          user: {
            include: {
              rfidTags: true,
              fingerprintIds: true,
              profilePicture: true,
            },
          },
        },
      });

      if (!fingerprintRecord) {
        this.logger.warn(
          `Fingerprint ID not found in database: ${fingerprintId}`,
          'AccessService',
        );
        return ResponseHelper.success('Fingerprint ID verification failed', {
          authorized: false,
          user: null,
          reason: 'Fingerprint ID not registered',
        });
      }

      const user = fingerprintRecord.user;

      this.logger.info(
        `Fingerprint ID found for user: ${user.userId}, checking access permissions`,
        'AccessService',
      );

      // Check if user is active
      if (user.status !== 'active') {
        this.logger.warn(
          `Fingerprint ID found but user account is ${user.status}: ${user.userId}`,
          'AccessService',
        );
        return ResponseHelper.success('Fingerprint ID verification failed', {
          authorized: false,
          user: null,
          reason: `User account is ${user.status}`,
        });
      }

      // Check if user has fingerprint access method enabled
      if (!user.allowedAccessMethods.includes('fingerprint')) {
        this.logger.warn(
          `Fingerprint ID found but user doesn't have fingerprint access method enabled: ${user.userId}`,
          'AccessService',
        );
        return ResponseHelper.success('Fingerprint ID verification failed', {
          authorized: false,
          user: null,
          reason: 'Fingerprint access method not enabled for this user',
        });
      }

      this.logger.success(
        `Fingerprint ID verified successfully for user: ${user.userId} (${user.firstName} ${user.lastName})`,
        'AccessService',
      );

      return ResponseHelper.success('Fingerprint ID verified successfully', {
        authorized: true,
        user: {
          userId: user.userId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          status: user.status,
          role: user.role,
          department: user.department,
          allowedAccessMethods: user.allowedAccessMethods,
          rfidTags: user.rfidTags.map((tag) => tag.tag),
          fingerprintIds: user.fingerprintIds.map((fp) => fp.fingerprintId),
        },
      });
    } catch (error: any) {
      this.logger.error(
        `Failed to verify fingerprint ID ${verifyFingerprintDto.fingerprintId}: ${error?.message || 'Unknown error'}`,
        error?.stack,
        'AccessService',
      );
      throw error;
    }
  }
}

