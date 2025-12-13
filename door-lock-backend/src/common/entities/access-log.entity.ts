export class AccessLog {
  logId: string;
  userId: string;
  userName?: string;
  deviceId: string;
  method: 'rfid' | 'fingerprint';
  rfidUid?: string;
  fingerprintId?: number;
  status: 'success' | 'failed';
  message?: string;
  timestamp: Date;
}

