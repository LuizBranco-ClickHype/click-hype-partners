import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from '../clients/entities/client.entity';
import { ClientService } from '../clients/entities/client-service.entity';
import { Partner } from '../partners/entities/partner.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    @InjectRepository(ClientService)
    private clientServiceRepository: Repository<ClientService>,
    @InjectRepository(Partner)
    private partnerRepository: Repository<Partner>,
  ) {}

  async getPartnerStats(partnerId: string) {
    // Buscar informações do parceiro
    const partner = await this.partnerRepository.findOne({
      where: { id: partnerId }
    });

    if (!partner) {
      throw new Error('Parceiro não encontrado');
    }

    // Contar clientes ativos
    const activeClients = await this.clientRepository.count({
      where: { 
        partnerId,
        status: 'ACTIVE' 
      }
    });

    // Calcular MRR (Monthly Recurring Revenue)
    const services = await this.clientServiceRepository.find({
      where: { 
        client: { partnerId },
        status: 'ACTIVE' 
      },
      relations: ['client']
    });

    const mrr = services.reduce((total, service) => {
      return total + Number(service.monthlyFee);
    }, 0);

    // Calcular comissão estimada
    const estimatedCommission = mrr * (Number(partner.commissionRate) / 100);

    return {
      activeClients,
      mrr,
      estimatedCommission,
      commissionRate: partner.commissionRate
    };
  }

  async getPartnerHistory(partnerId: string) {
    // Buscar informações do parceiro
    const partner = await this.partnerRepository.findOne({
      where: { id: partnerId }
    });

    if (!partner) {
      throw new Error('Parceiro não encontrado');
    }

    // Gerar dados históricos dos últimos 12 meses
    const history = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      
      // Buscar serviços ativos nesse período
      const services = await this.clientServiceRepository
        .createQueryBuilder('service')
        .leftJoinAndSelect('service.client', 'client')
        .where('client.partnerId = :partnerId', { partnerId })
        .andWhere('service.startDate <= :endOfMonth', { 
          endOfMonth: new Date(date.getFullYear(), date.getMonth() + 1, 0) 
        })
        .andWhere('(service.endDate IS NULL OR service.endDate >= :startOfMonth)', { 
          startOfMonth: date 
        })
        .getMany();

      const revenue = services.reduce((total, service) => {
        return total + Number(service.monthlyFee);
      }, 0);

      const commission = revenue * (Number(partner.commissionRate) / 100);

      history.push({
        month: date.toISOString().substring(0, 7), // YYYY-MM format
        monthName: date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
        revenue,
        commission,
        activeServices: services.length
      });
    }

    return history;
  }
} 