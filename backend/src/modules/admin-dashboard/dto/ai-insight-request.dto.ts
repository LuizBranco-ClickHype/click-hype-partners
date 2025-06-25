import { IsOptional, IsObject } from 'class-validator';
import { GlobalOverview } from '../admin-dashboard.service';

export class AIInsightRequestDto {
  @IsOptional()
  @IsObject()
  platformData?: GlobalOverview;
} 