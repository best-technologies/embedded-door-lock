export class Device {
  deviceId: string;
  name: string;
  location: string;
  status: 'online' | 'offline';
  firmwareVersion?: string;
  lastSeen?: Date;
  settings?: DeviceSettings;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DeviceSettings {
  autoLockDelay: number;
  volume: number;
  ledBrightness: number;
}

