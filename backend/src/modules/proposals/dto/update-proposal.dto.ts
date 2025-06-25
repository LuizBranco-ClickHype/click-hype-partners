import { PartialType } from '@nestjs/mapped-types';
import { CreateProposalDto } from './create-proposal.dto';
import { IsOptional, IsEnum } from 'class-validator';
import { ProposalStatus } from '../entities/proposal.entity';

export class UpdateProposalDto extends PartialType(CreateProposalDto) {
  @IsOptional()
  @IsEnum(ProposalStatus)
  status?: ProposalStatus;
} 