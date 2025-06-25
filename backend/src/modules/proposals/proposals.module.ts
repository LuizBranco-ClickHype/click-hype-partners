import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProposalsService } from './proposals.service';
import { ProposalsController } from './proposals.controller';
import { PdfService } from './pdf.service';
import { Proposal } from './entities/proposal.entity';
import { ProposalItem } from './entities/proposal-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Proposal, ProposalItem])
  ],
  controllers: [ProposalsController],
  providers: [ProposalsService, PdfService],
  exports: [ProposalsService],
})
export class ProposalsModule {} 