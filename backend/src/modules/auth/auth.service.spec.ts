import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { PartnersService } from '../partners/partners.service';
import { User, UserRole } from '../users/entities/user.entity';
import { Partner, PartnerStatus } from '../partners/entities/partner.entity';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let partnersService: jest.Mocked<PartnersService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser: User = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedPassword',
    role: UserRole.ADMIN,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    hashPassword: jest.fn(),
    validatePassword: jest.fn(),
  };

  const mockPartner: Partner = {
    id: '1',
    companyName: 'Test Company',
    email: 'partner@example.com',
    password: 'hashedPassword',
    phone: '123456789',
    document: '12345678901',
    commissionPercentage: 10,
    status: PartnerStatus.ACTIVE,
    description: 'Test Partner',
    website: 'https://test.com',
    address: 'Test Address',
    city: 'Test City',
    state: 'Test State',
    zipCode: '12345',
    createdAt: new Date(),
    updatedAt: new Date(),
    hashPassword: jest.fn(),
    validatePassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: PartnersService,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    partnersService = module.get(PartnersService);
    jwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      mockUser.validatePassword = jest.fn().mockResolvedValue(true);
      usersService.findByEmail.mockResolvedValue(mockUser);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toEqual(mockUser);
      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should return null when user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      mockUser.validatePassword = jest.fn().mockResolvedValue(false);
      usersService.findByEmail.mockResolvedValue(mockUser);

      const result = await service.validateUser('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access token when credentials are valid', async () => {
      const loginDto = { email: 'test@example.com', password: 'password' };
      mockUser.validatePassword = jest.fn().mockResolvedValue(true);
      usersService.findByEmail.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await service.login(loginDto);

      expect(result).toEqual({
        access_token: 'mock-jwt-token',
        user: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          role: mockUser.role,
        },
      });
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      const loginDto = { email: 'test@example.com', password: 'wrongpassword' };
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      const loginDto = { email: 'test@example.com', password: 'password' };
      const inactiveUser = { ...mockUser, isActive: false };
      mockUser.validatePassword = jest.fn().mockResolvedValue(true);
      usersService.findByEmail.mockResolvedValue(inactiveUser);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('partnerLogin', () => {
    it('should return access token when partner credentials are valid', async () => {
      const loginDto = { email: 'partner@example.com', password: 'password' };
      mockPartner.validatePassword = jest.fn().mockResolvedValue(true);
      partnersService.findByEmail.mockResolvedValue(mockPartner);
      jwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await service.partnerLogin(loginDto);

      expect(result).toEqual({
        access_token: 'mock-jwt-token',
        partner: {
          id: mockPartner.id,
          companyName: mockPartner.companyName,
          email: mockPartner.email,
          status: mockPartner.status,
          commissionPercentage: mockPartner.commissionPercentage,
        },
      });
    });

    it('should throw UnauthorizedException when partner is inactive', async () => {
      const loginDto = { email: 'partner@example.com', password: 'password' };
      const inactivePartner = { ...mockPartner, status: PartnerStatus.INACTIVE };
      mockPartner.validatePassword = jest.fn().mockResolvedValue(true);
      partnersService.findByEmail.mockResolvedValue(inactivePartner);

      await expect(service.partnerLogin(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateJwtPayload', () => {
    it('should return user when token is valid', async () => {
      const payload = { sub: '1', email: 'test@example.com', role: 'ADMIN' };
      usersService.findById.mockResolvedValue(mockUser);

      const result = await service.validateJwtPayload(payload);

      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      const payload = { sub: '1', email: 'test@example.com', role: 'ADMIN' };
      usersService.findById.mockResolvedValue(null);

      await expect(service.validateJwtPayload(payload)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      const payload = { sub: '1', email: 'test@example.com', role: 'ADMIN' };
      const inactiveUser = { ...mockUser, isActive: false };
      usersService.findById.mockResolvedValue(inactiveUser);

      await expect(service.validateJwtPayload(payload)).rejects.toThrow(UnauthorizedException);
    });
  });
}); 