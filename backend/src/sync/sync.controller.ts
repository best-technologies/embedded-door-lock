import { Controller, Get, Query } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncUpdatesDto } from './dto/sync-updates.dto';

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('updates')
  getUpdates(@Query() syncDto: SyncUpdatesDto) {
    return this.syncService.getUpdates(syncDto.since);
  }
}

