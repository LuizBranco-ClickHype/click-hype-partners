import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { Partner } from '../partners/entities/partner.entity';
import { Client } from '../clients/entities/client.entity';
import { Proposal } from '../proposals/entities/proposal.entity';
import { ClientService } from '../clients/entities/client-service.entity';
import { AIInsightRequestDto } from './dto/ai-insight-request.dto';

export interface GlobalKPIs {
  totalPartners: number;
  totalClients: number;
  globalMRR: number;
  totalProposals: number;
  averageRevenuePerPartner: number;
}

export interface PartnerLeaderboard {
  partnerName: string;
  clientCount: number;
  totalRevenue: number;
  proposalCount: number;
  conversionRate: number;
}

export interface RevenueOverTime {
  month: string;
  revenue: number;
  partners: number;
  clients: number;
}

export interface GlobalOverview {
  globalKPIs: GlobalKPIs;
  partnerLeaderboard: PartnerLeaderboard[];
  revenueOverTime: RevenueOverTime[];
  topServices: Array<{ name: string; value: number; count: number }>;
  growthMetrics: {
    partnersGrowth: number;
    clientsGrowth: number;
    revenueGrowth: number;
  };
}

@Injectable()
export class AdminDashboardService {
  private readonly logger = new Logger(AdminDashboardService.name);

  constructor(
    @InjectRepository(Partner)
    private partnerRepository: Repository<Partner>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    @InjectRepository(Proposal)
    private proposalRepository: Repository<Proposal>,
    @InjectRepository(ClientService)
    private clientServiceRepository: Repository<ClientService>,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  async getGlobalOverview(): Promise<GlobalOverview> {
    try {
      // Buscar dados básicos
      const [globalKPIs, partnerLeaderboard, revenueOverTime, topServices, growthMetrics] = 
        await Promise.all([
          this.getGlobalKPIs(),
          this.getPartnerLeaderboard(),
          this.getRevenueOverTime(),
          this.getTopServices(),
          this.getGrowthMetrics(),
        ]);

      return {
        globalKPIs,
        partnerLeaderboard,
        revenueOverTime,
        topServices,
        growthMetrics,
      };
    } catch (error) {
      this.logger.error('Error getting global overview:', error);
      throw error;
    }
  }

  private async getGlobalKPIs(): Promise<GlobalKPIs> {
    const [totalPartners, totalClients, totalProposals] = await Promise.all([
      this.partnerRepository.count({ where: { isActive: true } }),
      this.clientRepository.count(),
      this.proposalRepository.count(),
    ]);

    // Calcular MRR global (soma de todos os serviços ativos)
    const result = await this.clientServiceRepository
      .createQueryBuilder('service')
      .select('SUM(service.value)', 'totalRevenue')
      .where('service.isActive = :isActive', { isActive: true })
      .getRawOne();

    const globalMRR = parseFloat(result?.totalRevenue || '0');
    const averageRevenuePerPartner = totalPartners > 0 ? globalMRR / totalPartners : 0;

    return {
      totalPartners,
      totalClients,
      globalMRR,
      totalProposals,
      averageRevenuePerPartner,
    };
  }

  private async getPartnerLeaderboard(): Promise<PartnerLeaderboard[]> {
    const leaderboard = await this.partnerRepository
      .createQueryBuilder('partner')
      .leftJoin('partner.clients', 'client')
      .leftJoin('client.services', 'service')
      .leftJoin('partner.proposals', 'proposal')
      .select([
        'partner.companyName as partnerName',
        'COUNT(DISTINCT client.id) as clientCount',
        'COALESCE(SUM(CASE WHEN service.isActive = true THEN service.value ELSE 0 END), 0) as totalRevenue',
        'COUNT(DISTINCT proposal.id) as proposalCount',
        'COUNT(DISTINCT CASE WHEN proposal.status = \'approved\' THEN proposal.id END) as approvedProposals',
      ])
      .where('partner.isActive = :isActive', { isActive: true })
      .groupBy('partner.id, partner.companyName')
      .orderBy('totalRevenue', 'DESC')
      .limit(10)
      .getRawMany();

    return leaderboard.map(item => ({
      partnerName: item.partnerName,
      clientCount: parseInt(item.clientCount),
      totalRevenue: parseFloat(item.totalRevenue),
      proposalCount: parseInt(item.proposalCount),
      conversionRate: item.proposalCount > 0 
        ? (parseInt(item.approvedProposals) / parseInt(item.proposalCount)) * 100 
        : 0,
    }));
  }

  private async getRevenueOverTime(): Promise<RevenueOverTime[]> {
    const months = [];
    const now = new Date();
    
    // Gerar dados dos últimos 12 meses
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const monthStr = date.toISOString().slice(0, 7); // YYYY-MM
      
      // Contar parceiros ativos no mês
      const partnersCount = await this.partnerRepository.count({
        where: {
          isActive: true,
          createdAt: {
            $lte: nextMonth,
          } as any,
        },
      });

      // Contar clientes criados até o mês
      const clientsCount = await this.clientRepository.count({
        where: {
          createdAt: {
            $lte: nextMonth,
          } as any,
        },
      });

      // Calcular receita do mês (serviços ativos)
      const revenueResult = await this.clientServiceRepository
        .createQueryBuilder('service')
        .select('COALESCE(SUM(service.value), 0)', 'revenue')
        .where('service.isActive = :isActive', { isActive: true })
        .andWhere('service.createdAt <= :date', { date: nextMonth })
        .getRawOne();

      months.push({
        month: monthStr,
        revenue: parseFloat(revenueResult?.revenue || '0'),
        partners: partnersCount,
        clients: clientsCount,
      });
    }

    return months;
  }

  private async getTopServices(): Promise<Array<{ name: string; value: number; count: number }>> {
    const services = await this.clientServiceRepository
      .createQueryBuilder('service')
      .select([
        'service.description as name',
        'AVG(service.value) as value',
        'COUNT(*) as count',
      ])
      .where('service.isActive = :isActive', { isActive: true })
      .groupBy('service.description')
      .orderBy('count', 'DESC')
      .limit(5)
      .getRawMany();

    return services.map(service => ({
      name: service.name,
      value: parseFloat(service.value),
      count: parseInt(service.count),
    }));
  }

  private async getGrowthMetrics(): Promise<{
    partnersGrowth: number;
    clientsGrowth: number;
    revenueGrowth: number;
  }> {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

    // Parceiros criados no último mês vs mês anterior
    const [partnersLastMonth, partnersTwoMonthsAgo] = await Promise.all([
      this.partnerRepository.count({
        where: {
          createdAt: {
            $gte: lastMonth,
          } as any,
        },
      }),
      this.partnerRepository.count({
        where: {
          createdAt: {
            $gte: twoMonthsAgo,
            $lt: lastMonth,
          } as any,
        },
      }),
    ]);

    // Clientes criados no último mês vs mês anterior
    const [clientsLastMonth, clientsTwoMonthsAgo] = await Promise.all([
      this.clientRepository.count({
        where: {
          createdAt: {
            $gte: lastMonth,
          } as any,
        },
      }),
      this.clientRepository.count({
        where: {
          createdAt: {
            $gte: twoMonthsAgo,
            $lt: lastMonth,
          } as any,
        },
      }),
    ]);

    // Receita atual vs mês anterior (simplificado)
    const currentRevenue = await this.clientServiceRepository
      .createQueryBuilder('service')
      .select('COALESCE(SUM(service.value), 0)', 'revenue')
      .where('service.isActive = :isActive', { isActive: true })
      .getRawOne();

    const previousRevenue = await this.clientServiceRepository
      .createQueryBuilder('service')
      .select('COALESCE(SUM(service.value), 0)', 'revenue')
      .where('service.isActive = :isActive', { isActive: true })
      .andWhere('service.createdAt < :date', { date: lastMonth })
      .getRawOne();

    const partnersGrowth = partnersTwoMonthsAgo > 0 
      ? ((partnersLastMonth - partnersTwoMonthsAgo) / partnersTwoMonthsAgo) * 100 
      : 0;

    const clientsGrowth = clientsTwoMonthsAgo > 0 
      ? ((clientsLastMonth - clientsTwoMonthsAgo) / clientsTwoMonthsAgo) * 100 
      : 0;

    const currentRev = parseFloat(currentRevenue?.revenue || '0');
    const previousRev = parseFloat(previousRevenue?.revenue || '0');
    const revenueGrowth = previousRev > 0 
      ? ((currentRev - previousRev) / previousRev) * 100 
      : 0;

    return {
      partnersGrowth: Math.round(partnersGrowth * 100) / 100,
      clientsGrowth: Math.round(clientsGrowth * 100) / 100,
      revenueGrowth: Math.round(revenueGrowth * 100) / 100,
    };
  }

  async generateAIInsights(requestDto: AIInsightRequestDto): Promise<{ analysis: string }> {
    try {
      const apiKey = this.configService.get<string>('OPENAI_API_KEY') || 
                     this.configService.get<string>('GEMINI_API_KEY');
      
      if (!apiKey) {
        throw new Error('API Key de IA não configurada. Configure OPENAI_API_KEY ou GEMINI_API_KEY nas variáveis de ambiente.');
      }

      // Buscar dados atuais se não fornecidos
      const overview = requestDto.platformData || await this.getGlobalOverview();
      
      // Construir prompt para análise
      const prompt = this.buildAnalysisPrompt(overview);
      
      // Decidir qual API usar baseado na chave configurada
      const geminiKey = this.configService.get<string>('GEMINI_API_KEY');
      
      let analysis: string;
      
      if (geminiKey) {
        analysis = await this.callGeminiAPI(prompt, geminiKey);
      } else {
        analysis = await this.callOpenAIAPI(prompt, apiKey);
      }

      return { analysis };
    } catch (error) {
      this.logger.error('Error generating AI insights:', error);
      throw error;
    }
  }

  private buildAnalysisPrompt(overview: GlobalOverview): string {
    const { globalKPIs, partnerLeaderboard, revenueOverTime, topServices, growthMetrics } = overview;
    
    return `Você é um Analista de Negócios Sênior especializado em SaaS e plataformas B2B. Analise os seguintes dados da plataforma Click Hype Partners:

**DADOS DA PLATAFORMA:**

**KPIs Globais:**
- Total de Parceiros: ${globalKPIs.totalPartners}
- Total de Clientes: ${globalKPIs.totalClients}
- Faturamento Global (MRR): R$ ${globalKPIs.globalMRR.toLocaleString('pt-BR')}
- Total de Propostas: ${globalKPIs.totalProposals}
- Receita Média por Parceiro: R$ ${globalKPIs.averageRevenuePerPartner.toLocaleString('pt-BR')}

**Ranking de Parceiros (Top 5):**
${partnerLeaderboard.slice(0, 5).map((partner, index) => 
  `${index + 1}. ${partner.partnerName} - ${partner.clientCount} clientes, R$ ${partner.totalRevenue.toLocaleString('pt-BR')} faturamento, ${partner.conversionRate.toFixed(1)}% conversão`
).join('\n')}

**Crescimento (último mês):**
- Crescimento de Parceiros: ${growthMetrics.partnersGrowth.toFixed(1)}%
- Crescimento de Clientes: ${growthMetrics.clientsGrowth.toFixed(1)}%
- Crescimento de Receita: ${growthMetrics.revenueGrowth.toFixed(1)}%

**Principais Serviços:**
${topServices.map(service => `- ${service.name}: ${service.count} contratos, R$ ${service.value.toLocaleString('pt-BR')} médio`).join('\n')}

**ANÁLISE SOLICITADA:**
Forneça uma análise estratégica completa respondendo:

1. **Performance dos Parceiros**: Quem são os parceiros de melhor performance e o que os diferencia dos demais?

2. **Identificação de Riscos**: Existem parceiros com risco de churn (cancelamento)? Quais sinais indicam isso?

3. **Oportunidades de Crescimento**: Quais são as 3 principais oportunidades de crescimento para o negócio?

4. **Saúde da Plataforma**: Resuma a saúde geral da plataforma em um parágrafo.

5. **Recomendações Acionáveis**: Dê 3 recomendações específicas e práticas para os próximos 30 dias.

**INSTRUÇÕES:**
- Use números específicos dos dados fornecidos
- Seja objetivo e acionável
- Formate a resposta com títulos e listas
- Mantenha o tom profissional mas acessível
- Priorize insights que podem gerar ação imediata`;
  }

  private async callGeminiAPI(prompt: string, apiKey: string): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
          {
            contents: [
              {
                parts: [
                  {
                    text: prompt
                  }
                ]
              }
            ]
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
      );

      return response.data.candidates[0].content.parts[0].text;
    } catch (error) {
      this.logger.error('Error calling Gemini API:', error);
      throw new Error('Erro ao gerar análise com Gemini AI');
    }
  }

  private async callOpenAIAPI(prompt: string, apiKey: string): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 2000,
            temperature: 0.7,
          },
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        )
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      this.logger.error('Error calling OpenAI API:', error);
      throw new Error('Erro ao gerar análise com OpenAI');
    }
  }
} 