import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proposal, ProposalStatus } from './entities/proposal.entity';
import { ProposalItem } from './entities/proposal-item.entity';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { UpdateProposalDto } from './dto/update-proposal.dto';

@Injectable()
export class ProposalsService {
  constructor(
    @InjectRepository(Proposal)
    private proposalRepository: Repository<Proposal>,
    @InjectRepository(ProposalItem)
    private proposalItemRepository: Repository<ProposalItem>,
  ) {}

  async create(createProposalDto: CreateProposalDto, partnerId: string) {
    const { items, ...proposalData } = createProposalDto;
    
    // Calcular valor total
    const totalValue = items.reduce((sum, item) => sum + Number(item.value), 0);

    // Criar proposta
    const proposal = this.proposalRepository.create({
      ...proposalData,
      totalValue,
      partnerId,
    });

    const savedProposal = await this.proposalRepository.save(proposal);

    // Criar itens da proposta
    if (items && items.length > 0) {
      const proposalItems = items.map(item => 
        this.proposalItemRepository.create({
          ...item,
          proposalId: savedProposal.id,
        })
      );
      await this.proposalItemRepository.save(proposalItems);
    }

    return this.findOne(savedProposal.id, partnerId);
  }

  async findAll(partnerId: string) {
    return this.proposalRepository.find({
      where: { partnerId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, partnerId: string) {
    const proposal = await this.proposalRepository.findOne({
      where: { id, partnerId },
      relations: ['items'],
    });

    if (!proposal) {
      throw new NotFoundException('Proposta não encontrada');
    }

    return proposal;
  }

  async findByPublicLink(publicLink: string) {
    const proposal = await this.proposalRepository.findOne({
      where: { publicLink },
      relations: ['items', 'partner'],
    });

    if (!proposal) {
      throw new NotFoundException('Proposta não encontrada');
    }

    return proposal;
  }

  async update(id: string, updateProposalDto: UpdateProposalDto, partnerId: string) {
    const proposal = await this.findOne(id, partnerId);
    
    const { items, ...proposalData } = updateProposalDto;

    // Se houver itens, recalcular valor total
    if (items) {
      const totalValue = items.reduce((sum, item) => sum + Number(item.value), 0);
      proposalData['totalValue'] = totalValue;

      // Deletar itens existentes
      await this.proposalItemRepository.delete({ proposalId: id });

      // Criar novos itens
      const proposalItems = items.map(item => 
        this.proposalItemRepository.create({
          ...item,
          proposalId: id,
        })
      );
      await this.proposalItemRepository.save(proposalItems);
    }

    await this.proposalRepository.update(id, proposalData);
    return this.findOne(id, partnerId);
  }

  async updateStatus(publicLink: string, status: ProposalStatus) {
    const proposal = await this.proposalRepository.findOne({
      where: { publicLink },
    });

    if (!proposal) {
      throw new NotFoundException('Proposta não encontrada');
    }

    await this.proposalRepository.update(proposal.id, { status });
    return this.findByPublicLink(publicLink);
  }

  async remove(id: string, partnerId: string) {
    const proposal = await this.findOne(id, partnerId);
    await this.proposalRepository.remove(proposal);
    return { message: 'Proposta deletada com sucesso' };
  }
} 