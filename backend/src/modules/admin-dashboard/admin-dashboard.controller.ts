import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AdminDashboardService, GlobalOverview } from './admin-dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AIInsightRequestDto } from './dto/ai-insight-request.dto';

@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard)
export class AdminDashboardController {
  constructor(private readonly adminDashboardService: AdminDashboardService) {}

  @Get('global-overview')
  async getGlobalOverview(): Promise<GlobalOverview> {
    return this.adminDashboardService.getGlobalOverview();
  }

  @Post('ai-insights')
  async generateAIInsights(@Body() requestDto: AIInsightRequestDto): Promise<{ analysis: string }> {
    return this.adminDashboardService.generateAIInsights(requestDto);
  }
} 