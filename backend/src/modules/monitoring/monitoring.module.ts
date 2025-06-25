import { Module } from '@nestjs/common';
import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './monitoring.service';
import { MonitoringConfig } from '../../config/monitoring.config';

@Module({
  controllers: [MonitoringController],
  providers: [MonitoringService, MonitoringConfig],
  exports: [MonitoringService, MonitoringConfig],
})
export class MonitoringModule {} 