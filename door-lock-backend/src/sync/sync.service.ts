import { Injectable } from '@nestjs/common';

@Injectable()
export class SyncService {
  getUpdates(since?: string) {
    // TODO: Implement sync logic to return new users, updated users, and revoked users
    const sinceDate = since ? new Date(since) : new Date(Date.now() - 24 * 60 * 60 * 1000);

    return {
      newUsers: [],
      updatedUsers: [],
      revokedUsers: [],
      timestamp: new Date().toISOString(),
    };
  }
}

