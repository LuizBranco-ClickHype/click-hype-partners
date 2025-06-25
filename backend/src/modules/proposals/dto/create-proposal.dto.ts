import { IsString, IsOptional, IsEmail, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CreateProposalItemDto {
  @IsString()
  description: string;

  @IsString()
  value: number;
}

export class CreateProposalDto {
  @IsString()
  title: string;

  @IsString()
  clientName: string;

  @IsOptional()
  @IsEmail()
  clientEmail?: string;

  @IsString()
  scope: string;

  @IsDateString()
  validUntil: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProposalItemDto)
  items: CreateProposalItemDto[];
} 