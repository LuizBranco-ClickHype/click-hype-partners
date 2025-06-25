import { IsEmail, IsNotEmpty, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClientStatus } from '../entities/client.entity';

export class CreateClientDto {
  @ApiProperty({ description: 'Nome do cliente' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  name: string;

  @ApiPropertyOptional({ description: 'Email do cliente' })
  @IsOptional()
  @IsEmail({}, { message: 'Email deve ter formato válido' })
  email?: string;

  @ApiPropertyOptional({ description: 'Telefone do cliente' })
  @IsOptional()
  phone?: string;

  @ApiProperty({ description: 'Data de início do cliente' })
  @IsNotEmpty({ message: 'Data de início é obrigatória' })
  @IsDateString({}, { message: 'Data de início deve ser uma data válida' })
  startDate: Date;

  @ApiPropertyOptional({ 
    description: 'Status do cliente',
    enum: ClientStatus,
    default: ClientStatus.ACTIVE
  })
  @IsOptional()
  @IsEnum(ClientStatus, { message: 'Status deve ser ACTIVE ou INACTIVE' })
  status?: ClientStatus;
} 