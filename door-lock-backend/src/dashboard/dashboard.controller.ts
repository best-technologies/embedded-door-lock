import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { SummaryDecorators } from './docs/summary.decorators';
import { AdminDashboardDecorators } from './docs/admin-dashboard.decorators';
import { AdminOnly } from './decorators/admin-only.decorator';

@ApiTags('Dashboard')
@Controller('dashboard')
@AdminOnly()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @SummaryDecorators()
  async getSummary() {
    return this.dashboardService.getSummary();
  }

  @Get('admin')
  @AdminDashboardDecorators()
  async getAdminDashboard() {
    return this.dashboardService.getAdminDashboard();
  }
}
