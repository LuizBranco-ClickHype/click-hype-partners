import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { PartnerGuard } from '../auth/guards/partner.guard';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(PartnerGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('partner')
  @ApiOperation({ summary: 'Obter métricas do dashboard do parceiro' })
  @ApiResponse({
    status: 200,
    description: 'Métricas do parceiro retornadas com sucesso',
    schema: {
      type: 'object',
      properties: {
        activeClients: { type: 'number' },
        mrr: { type: 'number' },
        estimatedCommission: { type: 'number' },
        commissionPercentage: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido',
  })
  getPartnerDashboard(@Request() req) {
    return this.dashboardService.getPartnerStats(req.user.partnerId);
  }

  @Get('partner/history')
  @UseGuards(PartnerGuard)
  getPartnerHistory(@Request() req) {
    return this.dashboardService.getPartnerHistory(req.user.partnerId);
  }
} 