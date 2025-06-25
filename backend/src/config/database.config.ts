import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

// Import all entities
import { User } from '../modules/users/entities/user.entity';
import { Partner } from '../modules/partners/entities/partner.entity';
import { Client } from '../modules/clients/entities/client.entity';
import { ClientService } from '../modules/clients/entities/client-service.entity';
import { Proposal } from '../modules/proposals/entities/proposal.entity';
import { ProposalItem } from '../modules/proposals/entities/proposal-item.entity';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      host: this.configService.get('DATABASE_HOST', 'postgres'),
      port: this.configService.get('DATABASE_PORT', 5432),
      username: this.configService.get('DATABASE_USER', 'clickhype_user'),
      password: this.configService.get('DATABASE_PASSWORD'),
      database: this.configService.get('DATABASE_NAME', 'clickhype_partners_db'),
      entities: [User, Partner, Client, ClientService, Proposal, ProposalItem],
      synchronize: this.configService.get('NODE_ENV') !== 'production',
      logging: this.configService.get('NODE_ENV') !== 'production',
      ssl: false,
      extra: {
        max: 20,
        min: 5,
        acquire: 30000,
        idle: 10000,
      },
    };
  }
}

// DataSource for migrations and CLI
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'postgres',
  port: parseInt(process.env.DATABASE_PORT) || 5432,
  username: process.env.DATABASE_USER || 'clickhype_user',
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME || 'clickhype_partners_db',
  entities: [User, Partner, Client, ClientService, Proposal, ProposalItem],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
}); 