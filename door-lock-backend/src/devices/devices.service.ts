import { Injectable, NotFoundException } from '@nestjs/common';
import { Device, DeviceSettings } from '../common/entities/device.entity';
import { UpdateDeviceSettingsDto } from './dto/update-device-settings.dto';

@Injectable()
export class DevicesService {
  // TODO: Replace with actual database implementation
  private devices: Device[] = [];

  findAll(): Device[] {
    return this.devices;
  }

  findOne(deviceId: string): Device {
    const device = this.devices.find((d) => d.deviceId === deviceId);
    if (!device) {
      throw new NotFoundException(`Device with ID ${deviceId} not found`);
    }
    return device;
  }

  updateSettings(deviceId: string, updateSettingsDto: UpdateDeviceSettingsDto) {
    const device = this.findOne(deviceId);

    if (!device.settings) {
      device.settings = {
        autoLockDelay: 3000,
        volume: 7,
        ledBrightness: 80,
      };
    }

    if (updateSettingsDto.autoLockDelay !== undefined) {
      device.settings.autoLockDelay = updateSettingsDto.autoLockDelay;
    }

    if (updateSettingsDto.volume !== undefined) {
      device.settings.volume = updateSettingsDto.volume;
    }

    if (updateSettingsDto.ledBrightness !== undefined) {
      device.settings.ledBrightness = updateSettingsDto.ledBrightness;
    }

    device.updatedAt = new Date();

    return {
      deviceId: device.deviceId,
      updated: true,
    };
  }
}

