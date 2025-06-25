import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client, ClientStatus } from './entities/client.entity';
import { ClientService } from './entities/client-service.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { CreateClientServiceDto } from './dto/create-client-service.dto';
import { UpdateClientServiceDto } from './dto/update-client-service.dto';
import { PaginationDto } from '../../shared/dto/pagination.dto';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    @InjectRepository(ClientService)
    private clientServiceRepository: Repository<ClientService>,
  ) {}

  async create(
    createClientDto: CreateClientDto,
    partnerId: string,
  ): Promise<Client> {
    const client = this.clientRepository.create({
      ...createClientDto,
      partnerId,
    });

    return this.clientRepository.save(client);
  }

  async findAll(
    partnerId: string,
    paginationDto: PaginationDto,
  ): Promise<{ clients: Client[]; total: number; totalPages: number }> {
    const { page = 1, limit = 10, search } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.clientRepository
      .createQueryBuilder('client')
      .leftJoinAndSelect('client.services', 'services')
      .where('client.partnerId = :partnerId', { partnerId });

    if (search) {
      queryBuilder.andWhere(
        '(client.name ILIKE :search OR client.email ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    const [clients, total] = await queryBuilder
      .orderBy('client.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      clients,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, partnerId: string): Promise<Client> {
    const client = await this.clientRepository.findOne({
      where: { id, partnerId },
      relations: ['services'],
    });

    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }

    return client;
  }

  async update(
    id: string,
    updateClientDto: UpdateClientDto,
    partnerId: string,
  ): Promise<Client> {
    const client = await this.findOne(id, partnerId);

    Object.assign(client, updateClientDto);
    return this.clientRepository.save(client);
  }

  async remove(id: string, partnerId: string): Promise<void> {
    const client = await this.findOne(id, partnerId);
    await this.clientRepository.remove(client);
  }

  // Client Services methods
  async createService(
    clientId: string,
    createServiceDto: CreateClientServiceDto,
    partnerId: string,
  ): Promise<ClientService> {
    // Verify client belongs to partner
    await this.findOne(clientId, partnerId);

    const service = this.clientServiceRepository.create({
      ...createServiceDto,
      clientId,
    });

    return this.clientServiceRepository.save(service);
  }

  async updateService(
    serviceId: string,
    updateServiceDto: UpdateClientServiceDto,
    partnerId: string,
  ): Promise<ClientService> {
    const service = await this.clientServiceRepository.findOne({
      where: { id: serviceId },
      relations: ['client'],
    });

    if (!service || service.client.partnerId !== partnerId) {
      throw new ForbiddenException('Acesso negado a este serviço');
    }

    Object.assign(service, updateServiceDto);
    return this.clientServiceRepository.save(service);
  }

  async removeService(serviceId: string, partnerId: string): Promise<void> {
    const service = await this.clientServiceRepository.findOne({
      where: { id: serviceId },
      relations: ['client'],
    });

    if (!service || service.client.partnerId !== partnerId) {
      throw new ForbiddenException('Acesso negado a este serviço');
    }

    await this.clientServiceRepository.remove(service);
  }

  async getPartnerStats(partnerId: string) {
    const clients = await this.clientRepository.find({
      where: {
        partnerId,
        status: ClientStatus.ACTIVE,
      },
      relations: ['services'],
    });

    const activeClients = clients.length;

    const mrr = clients.reduce((total, client) => {
      const clientMRR = client.services.reduce(
        (clientTotal, service) => clientTotal + Number(service.monthlyFee),
        0
      );
      return total + clientMRR;
    }, 0);

    return {
      activeClients,
      mrr: Number(mrr.toFixed(2)),
    };
  }
} 