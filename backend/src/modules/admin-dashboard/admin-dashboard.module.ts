import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';
import { Partner } from '../partners/entities/partner.entity';
import { Client } from '../clients/entities/client.entity';
import { Proposal } from '../proposals/entities/proposal.entity';
import { ClientService } from '../clients/entities/client-service.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Partner, Client, Proposal, ClientService]),
    HttpModule,
  ],
  controllers: [AdminDashboardController],
  providers: [AdminDashboardService],
  exports: [AdminDashboardService],
})
export class AdminDashboardModule {} 