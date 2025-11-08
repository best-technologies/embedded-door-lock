import { Controller, Get, Patch, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { UpdateDeviceSettingsDto } from './dto/update-device-settings.dto';

@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get()
  findAll() {
    return this.devicesService.findAll();
  }

  @Get(':deviceId')
  findOne(@Param('deviceId') deviceId: string) {
    return this.devicesService.findOne(deviceId);
  }

  @Patch(':deviceId/settings')
  @HttpCode(HttpStatus.OK)
  updateSettings(
    @Param('deviceId') deviceId: string,
    @Body() updateSettingsDto: UpdateDeviceSettingsDto,
  ) {
    return this.devicesService.updateSettings(deviceId, updateSettingsDto);
  }
}

