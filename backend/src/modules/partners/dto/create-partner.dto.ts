import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  MinLength,
  MaxLength,
  Min,
  Max,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartnerStatus } from '../entities/partner.entity';

export class CreatePartnerDto {
  @ApiProperty({
    example: 'Empresa Exemplo Ltda',
    description: 'Nome da empresa do parceiro',
  })
  @IsString({ message: 'Nome da empresa deve ser uma string' })
  @IsNotEmpty({ message: 'Nome da empresa é obrigatório' })
  @MinLength(2, { message: 'Nome da empresa deve ter pelo menos 2 caracteres' })
  @MaxLength(255, { message: 'Nome da empresa deve ter no máximo 255 caracteres' })
  companyName: string;

  @ApiProperty({
    example: 'contato@empresaexemplo.com',
    description: 'Email do parceiro',
  })
  @IsEmail({}, { message: 'Email deve ter um formato válido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;

  @ApiPropertyOptional({
    example: '(11) 99999-9999',
    description: 'Telefone do parceiro',
  })
  @IsOptional()
  @IsString({ message: 'Telefone deve ser uma string' })
  @MaxLength(20, { message: 'Telefone deve ter no máximo 20 caracteres' })
  phone?: string;

  @ApiPropertyOptional({
    example: '12.345.678/0001-90',
    description: 'CNPJ ou CPF do parceiro',
  })
  @IsOptional()
  @IsString({ message: 'Documento deve ser uma string' })
  @MaxLength(20, { message: 'Documento deve ter no máximo 20 caracteres' })
  document?: string;

  @ApiProperty({
    example: 10.5,
    description: 'Percentual de comissão do parceiro (0-100)',
  })
  @IsNumber({}, { message: 'Percentual de comissão deve ser um número' })
  @Min(0, { message: 'Percentual de comissão deve ser no mínimo 0' })
  @Max(100, { message: 'Percentual de comissão deve ser no máximo 100' })
  commissionPercentage: number;

  @ApiPropertyOptional({
    enum: PartnerStatus,
    example: PartnerStatus.PENDING,
    description: 'Status do parceiro',
  })
  @IsOptional()
  @IsEnum(PartnerStatus, { message: 'Status deve ser um valor válido' })
  status?: PartnerStatus;

  @ApiPropertyOptional({
    example: 'Descrição do parceiro e seus serviços',
    description: 'Descrição do parceiro',
  })
  @IsOptional()
  @IsString({ message: 'Descrição deve ser uma string' })
  description?: string;

  @ApiPropertyOptional({
    example: 'https://www.empresaexemplo.com',
    description: 'Website do parceiro',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Website deve ser uma URL válida' })
  website?: string;

  @ApiPropertyOptional({
    example: 'Rua Exemplo, 123, Centro',
    description: 'Endereço do parceiro',
  })
  @IsOptional()
  @IsString({ message: 'Endereço deve ser uma string' })
  @MaxLength(255, { message: 'Endereço deve ter no máximo 255 caracteres' })
  address?: string;

  @ApiPropertyOptional({
    example: 'São Paulo',
    description: 'Cidade do parceiro',
  })
  @IsOptional()
  @IsString({ message: 'Cidade deve ser uma string' })
  @MaxLength(100, { message: 'Cidade deve ter no máximo 100 caracteres' })
  city?: string;

  @ApiPropertyOptional({
    example: 'SP',
    description: 'Estado do parceiro',
  })
  @IsOptional()
  @IsString({ message: 'Estado deve ser uma string' })
  @MaxLength(50, { message: 'Estado deve ter no máximo 50 caracteres' })
  state?: string;

  @ApiPropertyOptional({
    example: '01234-567',
    description: 'CEP do parceiro',
  })
  @IsOptional()
  @IsString({ message: 'CEP deve ser uma string' })
  @MaxLength(10, { message: 'CEP deve ter no máximo 10 caracteres' })
  zipCode?: string;
} 