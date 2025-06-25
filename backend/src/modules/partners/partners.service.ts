import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Partner } from './entities/partner.entity';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import { PaginationDto } from '../../shared/dto/pagination.dto';

export interface PaginatedPartners {
  data: Partner[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class PartnersService {
  constructor(
    @InjectRepository(Partner)
    private partnersRepository: Repository<Partner>,
  ) {}

  async create(createPartnerDto: CreatePartnerDto): Promise<Partner> {
    // Verificar se já existe um parceiro com este email
    const existingPartner = await this.partnersRepository.findOne({
      where: { email: createPartnerDto.email },
    });

    if (existingPartner) {
      throw new ConflictException('Já existe um parceiro com este email');
    }

    const partner = this.partnersRepository.create(createPartnerDto);
    return this.partnersRepository.save(partner);
  }

  async findAll(paginationDto: PaginationDto): Promise<PaginatedPartners> {
    const { page = 1, limit = 10, search } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.partnersRepository.createQueryBuilder('partner');

    if (search) {
      queryBuilder.where(
        'partner.companyName ILIKE :search OR partner.email ILIKE :search',
        { search: `%${search}%` },
      );
    }

    const [data, total] = await queryBuilder
      .orderBy('partner.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Partner> {
    const partner = await this.partnersRepository.findOne({ where: { id } });
    
    if (!partner) {
      throw new NotFoundException('Parceiro não encontrado');
    }

    return partner;
  }

  async findById(id: string): Promise<Partner | null> {
    return this.partnersRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<Partner | null> {
    return this.partnersRepository.findOne({ where: { email } });
  }

  async update(id: string, updatePartnerDto: UpdatePartnerDto): Promise<Partner> {
    const partner = await this.findOne(id);

    // Verificar se o email já está sendo usado por outro parceiro
    if (updatePartnerDto.email && updatePartnerDto.email !== partner.email) {
      const existingPartner = await this.partnersRepository.findOne({
        where: { email: updatePartnerDto.email },
      });

      if (existingPartner && existingPartner.id !== id) {
        throw new ConflictException('Já existe um parceiro com este email');
      }
    }

    Object.assign(partner, updatePartnerDto);
    return this.partnersRepository.save(partner);
  }

  async remove(id: string): Promise<void> {
    const partner = await this.findOne(id);
    await this.partnersRepository.remove(partner);
  }

  async getStats() {
    const total = await this.partnersRepository.count();
    const active = await this.partnersRepository.count({
      where: { status: 'ACTIVE' },
    });
    const pending = await this.partnersRepository.count({
      where: { status: 'PENDING' },
    });

    return {
      total,
      active,
      pending,
      inactive: total - active - pending,
    };
  }
} 