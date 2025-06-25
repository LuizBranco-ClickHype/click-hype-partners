import { Controller, Get, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MonitoringService } from './monitoring.service';

@ApiTags('Monitoring')
@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get('metrics')
  @Header('Content-Type', 'text/plain')
  @ApiOperation({ summary: 'Obter métricas do sistema em formato Prometheus' })
  @ApiResponse({
    status: 200,
    description: 'Métricas do sistema',
    content: {
      'text/plain': {
        schema: {
          type: 'string',
        },
      },
    },
  })
  async getMetrics(): Promise<string> {
    return this.monitoringService.getMetrics();
  }

  @Get('health')
  @ApiOperation({ summary: 'Verificar saúde do sistema' })
  @ApiResponse({
    status: 200,
    description: 'Status de saúde do sistema',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        timestamp: { type: 'string' },
        uptime: { type: 'number' },
        database: { type: 'string' },
        memory: {
          type: 'object',
          properties: {
            used: { type: 'number' },
            total: { type: 'number' },
            percentage: { type: 'number' },
          },
        },
      },
    },
  })
  async getHealth() {
    return this.monitoringService.getHealthStatus();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obter estatísticas detalhadas do sistema' })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas do sistema',
  })
  async getStats() {
    return this.monitoringService.getSystemStats();
  }
} 