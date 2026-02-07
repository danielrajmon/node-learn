import { Controller, Get, Logger } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';

@Controller('maintenance')
export class MaintenanceController {
  private logger = new Logger('MaintenanceController');

  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'maintenance', timestamp: new Date().toISOString() };
  }
}
