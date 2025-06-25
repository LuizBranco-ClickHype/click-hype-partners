import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ProposalsService } from './proposals.service';
import { Proposal, ProposalStatus } from './entities/proposal.entity';
import { ProposalItem } from './entities/proposal-item.entity';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { UpdateProposalDto } from './dto/update-proposal.dto';

describe('ProposalsService', () => {
  let service: ProposalsService;
  let proposalRepository: jest.Mocked<Repository<Proposal>>;
  let proposalItemRepository: jest.Mocked<Repository<ProposalItem>>;

  const mockProposal: Proposal = {
    id: '1',
    title: 'Test Proposal',
    clientName: 'Test Client',
    scope: 'Test scope',
    partnerId: 'partner-1',
    clientId: null,
    validUntil: new Date('2024-12-31'),
    status: ProposalStatus.DRAFT,
    totalValue: 1000,
    publicToken: 'test-token',
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [],
    partner: null,
    client: null,
  };

  const mockProposalItem: ProposalItem = {
    id: '1',
    description: 'Test Item',
    value: 500,
    proposalId: '1',
    proposal: mockProposal,
  };

  const mockCreateProposalDto: CreateProposalDto = {
    title: 'New Proposal',
    clientName: 'New Client',
    scope: 'New scope',
    validUntil: new Date('2024-12-31'),
    items: [
      {
        description: 'Item 1',
        value: 500,
      },
      {
        description: 'Item 2',
        value: 300,
      },
    ],
  };

  beforeEach(async () => {
    const mockProposalRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn(),
      })),
    };

    const mockProposalItemRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProposalsService,
        {
          provide: getRepositoryToken(Proposal),
          useValue: mockProposalRepository,
        },
        {
          provide: getRepositoryToken(ProposalItem),
          useValue: mockProposalItemRepository,
        },
      ],
    }).compile();

    service = module.get<ProposalsService>(ProposalsService);
    proposalRepository = module.get(getRepositoryToken(Proposal));
    proposalItemRepository = module.get(getRepositoryToken(ProposalItem));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a proposal with correct total value calculation', async () => {
      const expectedTotalValue = 800; // 500 + 300
      const savedProposal = {
        ...mockProposal,
        ...mockCreateProposalDto,
        totalValue: expectedTotalValue,
        items: [],
      };

      proposalRepository.create.mockReturnValue(savedProposal);
      proposalRepository.save.mockResolvedValue(savedProposal);
      proposalItemRepository.create.mockImplementation((item) => item as ProposalItem);
      proposalItemRepository.save.mockResolvedValue(mockProposalItem);

      const result = await service.create(mockCreateProposalDto, 'partner-1');

      expect(proposalRepository.create).toHaveBeenCalledWith({
        title: mockCreateProposalDto.title,
        clientName: mockCreateProposalDto.clientName,
        scope: mockCreateProposalDto.scope,
        validUntil: mockCreateProposalDto.validUntil,
        partnerId: 'partner-1',
        totalValue: expectedTotalValue,
        status: ProposalStatus.DRAFT,
      });

      expect(proposalRepository.save).toHaveBeenCalledWith(savedProposal);
      expect(proposalItemRepository.save).toHaveBeenCalledTimes(2);
      expect(result.totalValue).toBe(expectedTotalValue);
    });

    it('should handle empty items array', async () => {
      const dtoWithoutItems = { ...mockCreateProposalDto, items: [] };
      const savedProposal = { ...mockProposal, totalValue: 0 };

      proposalRepository.create.mockReturnValue(savedProposal);
      proposalRepository.save.mockResolvedValue(savedProposal);

      const result = await service.create(dtoWithoutItems, 'partner-1');

      expect(result.totalValue).toBe(0);
      expect(proposalItemRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated proposals for a partner', async () => {
      const proposals = [mockProposal];
      const total = 1;
      const queryBuilder = proposalRepository.createQueryBuilder();
      queryBuilder.getManyAndCount = jest.fn().mockResolvedValue([proposals, total]);

      const result = await service.findAll('partner-1', { page: 1, limit: 10 });

      expect(queryBuilder.where).toHaveBeenCalledWith('proposal.partnerId = :partnerId', {
        partnerId: 'partner-1',
      });
      expect(result).toEqual({
        data: proposals,
        total,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });
  });

  describe('findOne', () => {
    it('should return a proposal when found and belongs to partner', async () => {
      proposalRepository.findOne.mockResolvedValue(mockProposal);

      const result = await service.findOne('1', 'partner-1');

      expect(proposalRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1', partnerId: 'partner-1' },
        relations: ['items'],
      });
      expect(result).toEqual(mockProposal);
    });

    it('should throw NotFoundException when proposal not found', async () => {
      proposalRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999', 'partner-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when proposal belongs to different partner', async () => {
      const otherPartnerProposal = { ...mockProposal, partnerId: 'other-partner' };
      proposalRepository.findOne.mockResolvedValue(otherPartnerProposal);

      await expect(service.findOne('1', 'partner-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update proposal and recalculate total value', async () => {
      const updateDto: UpdateProposalDto = {
        title: 'Updated Title',
        items: [{ description: 'Updated Item', value: 1000 }],
      };

      const existingProposal = { ...mockProposal };
      const updatedProposal = { ...existingProposal, ...updateDto, totalValue: 1000 };

      proposalRepository.findOne.mockResolvedValue(existingProposal);
      proposalRepository.save.mockResolvedValue(updatedProposal);
      proposalItemRepository.delete.mockResolvedValue({ affected: 1 } as any);
      proposalItemRepository.create.mockImplementation((item) => item as ProposalItem);
      proposalItemRepository.save.mockResolvedValue(mockProposalItem);

      const result = await service.update('1', updateDto, 'partner-1');

      expect(proposalRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Updated Title',
          totalValue: 1000,
        })
      );
      expect(result.totalValue).toBe(1000);
    });

    it('should throw NotFoundException when proposal not found', async () => {
      proposalRepository.findOne.mockResolvedValue(null);

      await expect(service.update('999', {}, 'partner-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete proposal when found and belongs to partner', async () => {
      proposalRepository.findOne.mockResolvedValue(mockProposal);
      proposalRepository.delete.mockResolvedValue({ affected: 1 } as any);

      const result = await service.remove('1', 'partner-1');

      expect(proposalRepository.delete).toHaveBeenCalledWith('1');
      expect(result).toBe(true);
    });

    it('should throw NotFoundException when proposal not found', async () => {
      proposalRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('999', 'partner-1')).rejects.toThrow(NotFoundException);
    });

    it('should return false when delete fails', async () => {
      proposalRepository.findOne.mockResolvedValue(mockProposal);
      proposalRepository.delete.mockResolvedValue({ affected: 0 } as any);

      const result = await service.remove('1', 'partner-1');

      expect(result).toBe(false);
    });
  });

  describe('updateStatus', () => {
    it('should update proposal status', async () => {
      const updatedProposal = { ...mockProposal, status: ProposalStatus.SENT };
      proposalRepository.findOne.mockResolvedValue(mockProposal);
      proposalRepository.save.mockResolvedValue(updatedProposal);

      const result = await service.updateStatus('1', ProposalStatus.SENT, 'partner-1');

      expect(proposalRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ProposalStatus.SENT,
        })
      );
      expect(result.status).toBe(ProposalStatus.SENT);
    });
  });

  describe('findByPublicToken', () => {
    it('should return proposal by public token', async () => {
      proposalRepository.findOne.mockResolvedValue(mockProposal);

      const result = await service.findByPublicToken('test-token');

      expect(proposalRepository.findOne).toHaveBeenCalledWith({
        where: { publicToken: 'test-token' },
        relations: ['items', 'partner'],
      });
      expect(result).toEqual(mockProposal);
    });

    it('should throw NotFoundException when token not found', async () => {
      proposalRepository.findOne.mockResolvedValue(null);

      await expect(service.findByPublicToken('invalid-token')).rejects.toThrow(NotFoundException);
    });
  });

  describe('calculateTotalValue', () => {
    it('should calculate correct total from items', () => {
      const items = [
        { description: 'Item 1', value: 100 },
        { description: 'Item 2', value: 200 },
        { description: 'Item 3', value: 300 },
      ];

      const total = service['calculateTotalValue'](items);

      expect(total).toBe(600);
    });

    it('should return 0 for empty items array', () => {
      const total = service['calculateTotalValue']([]);

      expect(total).toBe(0);
    });

    it('should handle items with zero values', () => {
      const items = [
        { description: 'Free Item', value: 0 },
        { description: 'Paid Item', value: 100 },
      ];

      const total = service['calculateTotalValue'](items);

      expect(total).toBe(100);
    });
  });
}); 