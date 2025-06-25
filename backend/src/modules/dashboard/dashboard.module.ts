import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { Client } from '../clients/entities/client.entity';
import { ClientService } from '../clients/entities/client-service.entity';
import { Partner } from '../partners/entities/partner.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Client, ClientService, Partner])
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {} 