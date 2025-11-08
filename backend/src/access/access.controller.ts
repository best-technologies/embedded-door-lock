import { Controller, Get, Post, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { AccessService } from './access.service';
import { CreateAccessLogDto } from './dto/create-access-log.dto';
import { FilterAccessLogsDto } from './dto/filter-access-logs.dto';

@Controller('access/logs')
export class AccessController {
  constructor(private readonly accessService: AccessService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createAccessLogDto: CreateAccessLogDto) {
    return this.accessService.create(createAccessLogDto);
  }

  @Get()
  findAll(@Query() filterDto: FilterAccessLogsDto) {
    return this.accessService.findAll(filterDto);
  }
}

