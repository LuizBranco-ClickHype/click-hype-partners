import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClientServiceDto {
  @ApiProperty({ description: 'Descrição do serviço' })
  @IsNotEmpty({ message: 'Descrição é obrigatória' })
  description: string;

  @ApiProperty({ description: 'Taxa mensal do serviço' })
  @IsNotEmpty({ message: 'Taxa mensal é obrigatória' })
  @IsNumber({}, { message: 'Taxa mensal deve ser um número' })
  @IsPositive({ message: 'Taxa mensal deve ser positiva' })
  monthlyFee: number;
} 