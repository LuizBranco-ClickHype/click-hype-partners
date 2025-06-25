import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

import { AppModule } from '../src/app.module';
import { Partner, PartnerStatus } from '../src/modules/partners/entities/partner.entity';
import { Client, ClientStatus } from '../src/modules/clients/entities/client.entity';
import { User, UserRole } from '../src/modules/users/entities/user.entity';
import { AuthService } from '../src/modules/auth/auth.service';

describe('ClientsController (e2e)', () => {
  let app: INestApplication;
  let partnerRepository: Repository<Partner>;
  let clientRepository: Repository<Client>;
  let userRepository: Repository<User>;
  let authService: AuthService;
  
  let testPartner: Partner;
  let testUser: User;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.TEST_DATABASE_HOST || 'localhost',
          port: parseInt(process.env.TEST_DATABASE_PORT) || 5433,
          username: process.env.TEST_DATABASE_USER || 'test_user',
          password: process.env.TEST_DATABASE_PASSWORD || 'test_password',
          database: process.env.TEST_DATABASE_NAME || 'clickhype_test_db',
          entities: [User, Partner, Client],
          synchronize: true,
          dropSchema: true,
        }),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    partnerRepository = moduleFixture.get<Repository<Partner>>(getRepositoryToken(Partner));
    clientRepository = moduleFixture.get<Repository<Client>>(getRepositoryToken(Client));
    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    authService = moduleFixture.get<AuthService>(AuthService);

    await app.init();
  });

  beforeEach(async () => {
    // Limpar banco de dados
    await clientRepository.clear();
    await partnerRepository.clear();
    await userRepository.clear();

    // Criar usuário de teste
    testUser = userRepository.create({
      name: 'Test Admin',
      email: 'admin@test.com',
      password: 'password123',
      role: UserRole.ADMIN,
      isActive: true,
    });
    await userRepository.save(testUser);

    // Criar parceiro de teste
    testPartner = partnerRepository.create({
      companyName: 'Test Partner Company',
      email: 'partner@test.com',
      password: 'password123',
      phone: '11999999999',
      document: '12345678901',
      commissionPercentage: 10,
      status: PartnerStatus.ACTIVE,
      description: 'Test partner description',
      website: 'https://test.com',
      address: 'Test Address',
      city: 'Test City',
      state: 'Test State',
      zipCode: '12345-678',
    });
    await partnerRepository.save(testPartner);

    // Gerar token de autenticação
    const loginResponse = await authService.partnerLogin({
      email: 'partner@test.com',
      password: 'password123',
    });
    authToken = loginResponse.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /clients', () => {
    it('should create a new client successfully', async () => {
      const createClientDto = {
        name: 'Test Client',
        email: 'client@test.com',
        phone: '11888888888',
        startDate: '2024-01-01',
        status: ClientStatus.ACTIVE,
      };

      const response = await request(app.getHttpServer())
        .post('/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createClientDto)
        .expect(201);

      expect(response.body).toMatchObject({
        name: createClientDto.name,
        email: createClientDto.email,
        phone: createClientDto.phone,
        status: createClientDto.status,
        partnerId: testPartner.id,
      });

      // Verificar se foi salvo no banco
      const savedClient = await clientRepository.findOne({
        where: { id: response.body.id },
      });

      expect(savedClient).toBeDefined();
      expect(savedClient.partnerId).toBe(testPartner.id);
    });

    it('should validate required fields', async () => {
      const invalidDto = {
        email: 'invalid-email',
        phone: '11888888888',
      };

      await request(app.getHttpServer())
        .post('/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidDto)
        .expect(400);
    });

    it('should require authentication', async () => {
      const createClientDto = {
        name: 'Test Client',
        email: 'client@test.com',
        startDate: '2024-01-01',
      };

      await request(app.getHttpServer())
        .post('/clients')
        .send(createClientDto)
        .expect(401);
    });

    it('should enforce multi-tenant isolation', async () => {
      // Criar outro parceiro
      const otherPartner = partnerRepository.create({
        companyName: 'Other Partner',
        email: 'other@test.com',
        password: 'password123',
        phone: '11777777777',
        document: '98765432109',
        commissionPercentage: 15,
        status: PartnerStatus.ACTIVE,
        description: 'Other partner',
        website: 'https://other.com',
        address: 'Other Address',
        city: 'Other City',
        state: 'Other State',
        zipCode: '54321-876',
      });
      await partnerRepository.save(otherPartner);

      // Fazer login com o outro parceiro
      const otherLoginResponse = await authService.partnerLogin({
        email: 'other@test.com',
        password: 'password123',
      });
      const otherAuthToken = otherLoginResponse.access_token;

      // Criar cliente com o primeiro parceiro
      const client = clientRepository.create({
        name: 'First Partner Client',
        email: 'first@client.com',
        phone: '11666666666',
        startDate: new Date('2024-01-01'),
        status: ClientStatus.ACTIVE,
        partnerId: testPartner.id,
      });
      await clientRepository.save(client);

      // Tentar acessar cliente do primeiro parceiro com token do segundo
      await request(app.getHttpServer())
        .get(`/clients/${client.id}`)
        .set('Authorization', `Bearer ${otherAuthToken}`)
        .expect(404); // Deve retornar 404 por isolamento multi-tenant
    });
  });

  describe('GET /clients', () => {
    beforeEach(async () => {
      // Criar alguns clientes para teste
      const clients = [
        {
          name: 'Client 1',
          email: 'client1@test.com',
          phone: '11111111111',
          startDate: new Date('2024-01-01'),
          status: ClientStatus.ACTIVE,
          partnerId: testPartner.id,
        },
        {
          name: 'Client 2',
          email: 'client2@test.com',
          phone: '11222222222',
          startDate: new Date('2024-01-02'),
          status: ClientStatus.INACTIVE,
          partnerId: testPartner.id,
        },
      ];

      for (const clientData of clients) {
        const client = clientRepository.create(clientData);
        await clientRepository.save(client);
      }
    });

    it('should return paginated clients for authenticated partner', async () => {
      const response = await request(app.getHttpServer())
        .get('/clients?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(response.body.data).toHaveLength(2);
      expect(response.body.total).toBe(2);

      // Verificar se todos os clientes pertencem ao parceiro correto
      response.body.data.forEach((client: any) => {
        expect(client.partnerId).toBe(testPartner.id);
      });
    });

    it('should filter clients by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/clients?status=ACTIVE')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe(ClientStatus.ACTIVE);
    });

    it('should search clients by name', async () => {
      const response = await request(app.getHttpServer())
        .get('/clients?search=Client 1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Client 1');
    });
  });

  describe('GET /clients/:id', () => {
    let testClient: Client;

    beforeEach(async () => {
      testClient = clientRepository.create({
        name: 'Test Client Detail',
        email: 'detail@test.com',
        phone: '11333333333',
        startDate: new Date('2024-01-01'),
        status: ClientStatus.ACTIVE,
        partnerId: testPartner.id,
      });
      await clientRepository.save(testClient);
    });

    it('should return client details for authenticated partner', async () => {
      const response = await request(app.getHttpServer())
        .get(`/clients/${testClient.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: testClient.id,
        name: testClient.name,
        email: testClient.email,
        phone: testClient.phone,
        status: testClient.status,
        partnerId: testPartner.id,
      });
    });

    it('should return 404 for non-existent client', async () => {
      await request(app.getHttpServer())
        .get('/clients/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /clients/:id', () => {
    let testClient: Client;

    beforeEach(async () => {
      testClient = clientRepository.create({
        name: 'Test Client Update',
        email: 'update@test.com',
        phone: '11444444444',
        startDate: new Date('2024-01-01'),
        status: ClientStatus.ACTIVE,
        partnerId: testPartner.id,
      });
      await clientRepository.save(testClient);
    });

    it('should update client successfully', async () => {
      const updateDto = {
        name: 'Updated Client Name',
        email: 'updated@test.com',
        status: ClientStatus.INACTIVE,
      };

      const response = await request(app.getHttpServer())
        .put(`/clients/${testClient.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body).toMatchObject(updateDto);

      // Verificar se foi atualizado no banco
      const updatedClient = await clientRepository.findOne({
        where: { id: testClient.id },
      });

      expect(updatedClient.name).toBe(updateDto.name);
      expect(updatedClient.email).toBe(updateDto.email);
      expect(updatedClient.status).toBe(updateDto.status);
    });

    it('should validate update data', async () => {
      const invalidUpdateDto = {
        email: 'invalid-email-format',
      };

      await request(app.getHttpServer())
        .put(`/clients/${testClient.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUpdateDto)
        .expect(400);
    });
  });

  describe('DELETE /clients/:id', () => {
    let testClient: Client;

    beforeEach(async () => {
      testClient = clientRepository.create({
        name: 'Test Client Delete',
        email: 'delete@test.com',
        phone: '11555555555',
        startDate: new Date('2024-01-01'),
        status: ClientStatus.ACTIVE,
        partnerId: testPartner.id,
      });
      await clientRepository.save(testClient);
    });

    it('should delete client successfully', async () => {
      await request(app.getHttpServer())
        .delete(`/clients/${testClient.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verificar se foi removido do banco
      const deletedClient = await clientRepository.findOne({
        where: { id: testClient.id },
      });

      expect(deletedClient).toBeNull();
    });

    it('should return 404 when trying to delete non-existent client', async () => {
      await request(app.getHttpServer())
        .delete('/clients/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
}); 