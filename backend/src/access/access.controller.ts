import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { AccessService } from './access.service';
import { CreateAccessLogDto } from './dto/create-access-log.dto';
import { FilterAccessLogsDto } from './dto/filter-access-logs.dto';
import { VerifyRfidDto } from './dto/verify-rfid.dto';
import { VerifyFingerprintDto } from './dto/verify-fingerprint.dto';
import { VerifyRfidResponseDto } from './dto/verify-rfid-response.dto';
import { VerifyFingerprintResponseDto } from './dto/verify-fingerprint-response.dto';

@ApiTags('Access')
@Controller('access')
export class AccessController {
  constructor(private readonly accessService: AccessService) {}

  @Post('logs')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create access log',
    description: 'Log an access attempt (success or failed)',
  })
  @ApiBody({ type: CreateAccessLogDto })
  @ApiResponse({
    status: 201,
    description: 'Access log created successfully',
  })
  create(@Body() createAccessLogDto: CreateAccessLogDto) {
    return this.accessService.create(createAccessLogDto);
  }

  @Get('logs')
  @ApiOperation({
    summary: 'Get access logs',
    description: 'Retrieve access logs with optional filtering',
  })
  @ApiResponse({
    status: 200,
    description: 'Access logs retrieved successfully',
  })
  findAll(@Query() filterDto: FilterAccessLogsDto) {
    return this.accessService.findAll(filterDto);
  }

  @Post('verify-rfid')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify RFID tag',
    description: 'Check if an RFID tag is registered and return user information if found. Returns authorized: true if tag is valid and user is active with RFID access enabled.',
  })
  @ApiBody({ type: VerifyRfidDto })
  @ApiResponse({
    status: 200,
    description: 'RFID verification result - returns authorized: true with user data if valid, or authorized: false with reason if invalid',
    type: VerifyRfidResponseDto,
    schema: {
      example: {
        success: true,
        message: 'RFID tag verified successfully',
        data: {
          authorized: true,
          user: {
            userId: 'BTL-25-11-13',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            status: 'active',
            role: 'staff',
            department: 'Engineering',
            allowedAccessMethods: ['rfid', 'keypad'],
            rfidTags: ['A1B2C3D4'],
            fingerprintIds: [1, 2],
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'RFID verification failed - tag not found or user not authorized',
    schema: {
      example: {
        success: true,
        message: 'RFID tag verification failed',
        data: {
          authorized: false,
          user: null,
          reason: 'RFID tag not registered',
        },
      },
    },
  })
  verifyRfid(@Body() verifyRfidDto: VerifyRfidDto) {
    return this.accessService.verifyRfid(verifyRfidDto);
  }

  @Post('verify-fingerprint')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify fingerprint ID',
    description: 'Check if a fingerprint ID is registered and return user information if found. Returns authorized: true if fingerprint is valid and user is active with fingerprint access enabled.',
  })
  @ApiBody({ type: VerifyFingerprintDto })
  @ApiResponse({
    status: 200,
    description: 'Fingerprint verification result - returns authorized: true with user data if valid, or authorized: false with reason if invalid',
    type: VerifyFingerprintResponseDto,
    schema: {
      example: {
        success: true,
        message: 'Fingerprint ID verified successfully',
        data: {
          authorized: true,
          user: {
            userId: 'BTL-25-11-13',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            status: 'active',
            role: 'staff',
            department: 'Engineering',
            allowedAccessMethods: ['fingerprint', 'rfid'],
            rfidTags: ['A1B2C3D4'],
            fingerprintIds: [1, 2],
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Fingerprint verification failed - ID not found or user not authorized',
    schema: {
      example: {
        success: true,
        message: 'Fingerprint ID verification failed',
        data: {
          authorized: false,
          user: null,
          reason: 'Fingerprint ID not registered',
        },
      },
    },
  })
  verifyFingerprint(@Body() verifyFingerprintDto: VerifyFingerprintDto) {
    return this.accessService.verifyFingerprint(verifyFingerprintDto);
  }
}

