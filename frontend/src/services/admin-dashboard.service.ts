import api from './api';

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

export interface AIInsightResponse {
  analysis: string;
}

class AdminDashboardService {
  private baseURL = '/admin/dashboard';

  async getGlobalOverview(): Promise<GlobalOverview> {
    const response = await api.get(`${this.baseURL}/global-overview`);
    return response.data;
  }

  async generateAIInsights(platformData?: GlobalOverview): Promise<AIInsightResponse> {
    const response = await api.post(`${this.baseURL}/ai-insights`, {
      platformData,
    });
    return response.data;
  }

  // Utilitários para formatação
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  formatPercentage(value: number): string {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('pt-BR').format(value);
  }

  getStatusColor(value: number): string {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  }

  getStatusIcon(value: number): string {
    if (value > 0) return '↗️';
    if (value < 0) return '↘️';
    return '➡️';
  }
}

export default new AdminDashboardService(); 