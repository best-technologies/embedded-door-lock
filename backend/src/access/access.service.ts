import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateAccessLogDto } from './dto/create-access-log.dto';
import { FilterAccessLogsDto } from './dto/filter-access-logs.dto';
import { VerifyRfidDto } from './dto/verify-rfid.dto';
import { VerifyFingerprintDto } from './dto/verify-fingerprint.dto';
import { VerifyTemporaryCodeDto } from './dto/verify-temporary-code.dto';
import { AccessLog } from '../common/entities/access-log.entity';
import { LoggerService } from '../common/logger/logger.service';
import { ResponseHelper } from '../common/helpers/response.helper';

@Injectable()
export class AccessService {
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
        return ResponseHelper.verification(
          'RFID tag not registered',
          {
            authorized: false,
            user: null,
            reason: 'RFID tag not registered',
          },
          false,
        );
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
        return ResponseHelper.verification(
          `User account is ${user.status}`,
          {
            authorized: false,
            user: null,
            reason: `User account is ${user.status}`,
          },
          false,
        );
      }

      // Check if user has RFID access method enabled
      if (!user.allowedAccessMethods.includes('rfid')) {
        this.logger.warn(
          `RFID tag found but user doesn't have RFID access method enabled: ${user.userId}`,
          'AccessService',
        );
        return ResponseHelper.verification(
          'RFID access method not enabled for this user',
          {
            authorized: false,
            user: null,
            reason: 'RFID access method not enabled for this user',
          },
          false,
        );
      }

      this.logger.success(
        `RFID tag verified successfully for user: ${user.userId} (${user.firstName} ${user.lastName})`,
        'AccessService',
      );

      // Safely handle visitor users - they might not have RFID tags or fingerprints
      const rfidTags = user.rfidTags && Array.isArray(user.rfidTags) 
        ? user.rfidTags.map((tag) => tag.tag) 
        : [];
      
      const fingerprintIds = user.fingerprintIds && Array.isArray(user.fingerprintIds)
        ? user.fingerprintIds.map((fp) => fp.fingerprintId)
        : [];

      return ResponseHelper.verification(
        'RFID tag verified successfully',
        {
          authorized: true,
          user: {
            userId: user.userId,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            status: user.status,
            role: user.role,
            department: user.department || null,
            allowedAccessMethods: user.allowedAccessMethods || [],
            rfidTags,
            fingerprintIds,
          },
        },
        true,
      );
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
        return ResponseHelper.verification(
          'Fingerprint ID not registered',
          {
            authorized: false,
            user: null,
            reason: 'Fingerprint ID not registered',
          },
          false,
        );
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
        return ResponseHelper.verification(
          `User account is ${user.status}`,
          {
            authorized: false,
            user: null,
            reason: `User account is ${user.status}`,
          },
          false,
        );
      }

      // Check if user has fingerprint access method enabled
      if (!user.allowedAccessMethods.includes('fingerprint')) {
        this.logger.warn(
          `Fingerprint ID found but user doesn't have fingerprint access method enabled: ${user.userId}`,
          'AccessService',
        );
        return ResponseHelper.verification(
          'Fingerprint access method not enabled for this user',
          {
            authorized: false,
            user: null,
            reason: 'Fingerprint access method not enabled for this user',
          },
          false,
        );
      }

      this.logger.success(
        `Fingerprint ID verified successfully for user: ${user.userId} (${user.firstName} ${user.lastName})`,
        'AccessService',
      );

      // Safely handle visitor users - they might not have RFID tags or fingerprints
      const rfidTags = user.rfidTags && Array.isArray(user.rfidTags) 
        ? user.rfidTags.map((tag) => tag.tag) 
        : [];
      
      const fingerprintIds = user.fingerprintIds && Array.isArray(user.fingerprintIds)
        ? user.fingerprintIds.map((fp) => fp.fingerprintId)
        : [];

      return ResponseHelper.verification(
        'Fingerprint ID verified successfully',
        {
          authorized: true,
          user: {
            userId: user.userId,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            status: user.status,
            role: user.role,
            department: user.department || null,
            allowedAccessMethods: user.allowedAccessMethods || [],
            rfidTags,
            fingerprintIds,
          },
        },
        true,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to verify fingerprint ID ${verifyFingerprintDto.fingerprintId}: ${error?.message || 'Unknown error'}`,
        error?.stack,
        'AccessService',
      );
      throw error;
    }
  }

  /**
   * Verify temporary access code and return user if found
   * Code is deleted after successful verification (single-use)
   */
  async verifyTemporaryCode(verifyTemporaryCodeDto: VerifyTemporaryCodeDto) {
    try {
      const { code, deviceId } = verifyTemporaryCodeDto;
      
      this.logger.info(
        `Verifying temporary access code: ${code}${deviceId ? ` from device: ${deviceId}` : ''}`,
        'AccessService',
      );

      // Find temporary code in database
      const temporaryCode = await this.prisma.temporaryAccessCode.findUnique({
        where: {
          code,
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

      if (!temporaryCode) {
        this.logger.warn(`Temporary access code not found: ${code}`, 'AccessService');
        return ResponseHelper.verification(
          'Invalid access code',
          {
            authorized: false,
            user: null,
            reason: 'Invalid access code',
          },
          false,
        );
      }

      // Check if code has already been used
      if (temporaryCode.used) {
        this.logger.warn(
          `Temporary access code already used: ${code}`,
          'AccessService',
        );
        return ResponseHelper.verification(
          'Access code has already been used',
          {
            authorized: false,
            user: null,
            reason: 'Access code has already been used',
          },
          false,
        );
      }

      // Check if code has expired
      if (new Date() > temporaryCode.expiresAt) {
        this.logger.warn(
          `Temporary access code expired: ${code}`,
          'AccessService',
        );
        // Delete expired code
        await this.prisma.temporaryAccessCode.delete({
          where: { id: temporaryCode.id },
        });
        return ResponseHelper.verification(
          'Access code has expired',
          {
            authorized: false,
            user: null,
            reason: 'Access code has expired',
          },
          false,
        );
      }

      const user = temporaryCode.user;

      // Check if user is active
      if (user.status !== 'active') {
        this.logger.warn(
          `Temporary code found but user account is ${user.status}: ${user.userId}`,
          'AccessService',
        );
        return ResponseHelper.verification(
          `User account is ${user.status}`,
          {
            authorized: false,
            user: null,
            reason: `User account is ${user.status}`,
          },
          false,
        );
      }

      // Mark code as used and delete it (single-use)
      await this.prisma.temporaryAccessCode.delete({
        where: { id: temporaryCode.id },
      });

      this.logger.success(
        `Temporary access code verified and deleted for user: ${user.userId} (${user.firstName} ${user.lastName})`,
        'AccessService',
      );

      // Safely handle visitor users - they might not have RFID tags or fingerprints
      const rfidTags = user.rfidTags && Array.isArray(user.rfidTags) 
        ? user.rfidTags.map((tag) => tag.tag) 
        : [];
      
      const fingerprintIds = user.fingerprintIds && Array.isArray(user.fingerprintIds)
        ? user.fingerprintIds.map((fp) => fp.fingerprintId)
        : [];

      return ResponseHelper.verification(
        'Temporary access code verified successfully',
        {
          authorized: true,
          user: {
            userId: user.userId,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            status: user.status,
            role: user.role,
            department: user.department || null,
            allowedAccessMethods: user.allowedAccessMethods || [],
            rfidTags,
            fingerprintIds,
          },
        },
        true,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to verify temporary access code: ${error?.message || 'Unknown error'}`,
        error?.stack,
        'AccessService',
      );
      throw error;
    }
  }
}

