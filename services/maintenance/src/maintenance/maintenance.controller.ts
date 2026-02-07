import { Controller, Get, Post, Param, Logger } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';

@Controller('maintenance')
export class MaintenanceController {
  private logger = new Logger('MaintenanceController');

  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'maintenance', timestamp: new Date().toISOString() };
  }

  @Post('migrations/init-table/:tableName')
  async initializeTable(@Param('tableName') tableName: string) {
    this.logger.debug(`Initializing table: ${tableName}`);
    return this.maintenanceService.initializeTable(tableName);
  }

  @Get('migrations/table-status')
  async getTableStatus() {
    this.logger.debug('Fetching table status across all databases');
    return this.maintenanceService.getTableStatus();
  }
}
