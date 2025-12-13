import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AccessService } from './access.service';
import { CreateAccessLogDto } from './dto/create-access-log.dto';
import { FilterAccessLogsDto } from './dto/filter-access-logs.dto';
import { VerifyRfidDto } from './dto/verify-rfid.dto';
import { VerifyFingerprintDto } from './dto/verify-fingerprint.dto';
import { VerifyTemporaryCodeDto } from './dto/verify-temporary-code.dto';
import { CreateAccessLogDecorators } from './docs/create-access-log.decorators';
import { GetAccessLogsDecorators } from './docs/get-access-logs.decorators';
import { VerifyRfidDecorators } from './docs/verify-rfid.decorators';
import { VerifyFingerprintDecorators } from './docs/verify-fingerprint.decorators';
import { VerifyTemporaryCodeDecorators } from './docs/verify-temporary-code.decorators';

@ApiTags('Access')
@Controller('access')
export class AccessController {
  constructor(private readonly accessService: AccessService) {}

  @Post('logs')
  @CreateAccessLogDecorators()
  create(@Body() createAccessLogDto: CreateAccessLogDto) {
    return this.accessService.create(createAccessLogDto);
  }

  @Get('logs')
  @GetAccessLogsDecorators()
  findAll(@Query() filterDto: FilterAccessLogsDto) {
    return this.accessService.findAll(filterDto);
  }

  @Post('verify-rfid')
  @VerifyRfidDecorators()
  verifyRfid(@Body() verifyRfidDto: VerifyRfidDto) {
    return this.accessService.verifyRfid(verifyRfidDto);
  }

  @Post('verify-fingerprint')
  @VerifyFingerprintDecorators()
  verifyFingerprint(@Body() verifyFingerprintDto: VerifyFingerprintDto) {
    return this.accessService.verifyFingerprint(verifyFingerprintDto);
  }

  @Post('verify-temporary-code')
  @VerifyTemporaryCodeDecorators()
  verifyTemporaryCode(@Body() verifyTemporaryCodeDto: VerifyTemporaryCodeDto) {
    return this.accessService.verifyTemporaryCode(verifyTemporaryCodeDto);
  }
}

