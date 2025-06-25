'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Users, 
  DollarSign, 
  FileText, 
  TrendingUp, 
  Brain,
  Crown,
  Building2,
  Activity,
  Zap
} from 'lucide-react';
import AdminLayout from '@/components/Layout/AdminLayout';
import adminDashboardService, { GlobalOverview } from '@/services/admin-dashboard.service';

// Cores para gráficos
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

// Componente de KPI Card
interface KPICardProps {
  title: string;
  value: string;
  growth?: number;
  icon: React.ReactNode;
  description?: string;
}

function KPICard({ title, value, growth, icon, description }: KPICardProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-blue-100 rounded-lg">
          {icon}
        </div>
        {growth !== undefined && (
          <div className={`flex items-center space-x-1 ${adminDashboardService.getStatusColor(growth)}`}>
            <span className="text-sm font-medium">
              {adminDashboardService.formatPercentage(growth)}
            </span>
            <span>{adminDashboardService.getStatusIcon(growth)}</span>
          </div>
        )}
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
      </div>
    </div>
  );
}

// Componente de Ranking de Parceiros
interface PartnerLeaderboardProps {
  partners: Array<{
    partnerName: string;
    clientCount: number;
    totalRevenue: number;
    proposalCount: number;
    conversionRate: number;
  }>;
}

function PartnerLeaderboard({ partners }: PartnerLeaderboardProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
      <div className="flex items-center mb-6">
        <Crown className="h-6 w-6 text-yellow-500 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Top Parceiros</h3>
      </div>
      <div className="space-y-4">
        {partners.slice(0, 5).map((partner, index) => (
          <div 
            key={index} 
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center space-x-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                index === 0 ? 'bg-yellow-100 text-yellow-800' :
                index === 1 ? 'bg-gray-100 text-gray-800' :
                index === 2 ? 'bg-orange-100 text-orange-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {index + 1}
              </div>
              <div>
                <p className="font-medium text-gray-900">{partner.partnerName}</p>
                <p className="text-sm text-gray-500">
                  {partner.clientCount} clientes • {partner.proposalCount} propostas
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900">
                {adminDashboardService.formatCurrency(partner.totalRevenue)}
              </p>
              <p className="text-sm text-gray-500">
                {partner.conversionRate.toFixed(1)}% conversão
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Componente de Gráfico de Receita
interface RevenueChartProps {
  data: Array<{
    month: string;
    revenue: number;
    partners: number;
    clients: number;
  }>;
}

function RevenueChart({ data }: RevenueChartProps) {
  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-');
    const monthNames = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];
    return `${monthNames[parseInt(monthNum) - 1]}/${year.slice(2)}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
      <div className="flex items-center mb-6">
        <TrendingUp className="h-6 w-6 text-green-500 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Evolução do Faturamento</h3>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="month" 
              tickFormatter={formatMonth}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              tickFormatter={(value) => adminDashboardService.formatCurrency(value)}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              labelFormatter={(value) => formatMonth(value as string)}
              formatter={(value: number) => [adminDashboardService.formatCurrency(value), 'Faturamento']}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#10B981" 
              strokeWidth={3}
              name="Faturamento"
              dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Componente de Insights com IA
function AIInsightGenerator() {
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string>('');
  const [error, setError] = useState<string>('');

  const generateInsights = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await adminDashboardService.generateAIInsights();
      setAnalysis(response.analysis);
    } catch (error: any) {
      console.error('Erro ao gerar insights:', error);
      setError(error.response?.data?.message || 'Erro ao gerar análise com IA. Verifique se a API Key está configurada.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatAnalysis = (text: string) => {
    return text.split('\n').map((line, index) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <h4 key={index} className="text-lg font-semibold text-gray-900 mt-4 mb-2">{line.replace(/\*\*/g, '')}</h4>;
      }
      if (line.startsWith('###')) {
        return <h4 key={index} className="text-lg font-semibold text-gray-900 mt-4 mb-2">{line.replace('### ', '')}</h4>;
      }
      if (line.startsWith('- ')) {
        return <li key={index} className="ml-4 text-gray-700">{line.replace('- ', '')}</li>;
      }
      if (line.trim() === '') {
        return <br key={index} />;
      }
      return <p key={index} className="text-gray-700 mb-2">{line}</p>;
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
      <div className="flex items-center mb-6">
        <Brain className="h-6 w-6 text-purple-500 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">🔍 Análise e Insights com IA</h3>
      </div>
      
      {!analysis && !error && (
        <div className="text-center py-8">
          <div className="mb-4">
            <Zap className="h-12 w-12 text-purple-500 mx-auto mb-4" />
            <p className="text-gray-600 mb-6">
              Gere uma análise estratégica completa dos dados da plataforma usando Inteligência Artificial
            </p>
          </div>
          <button
            onClick={generateInsights}
            disabled={isLoading}
            className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Analisando dados...
              </>
            ) : (
              <>
                <Brain className="h-5 w-5 mr-2" />
                🧠 Gerar Análise Estratégica
              </>
            )}
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-500 mr-2">⚠️</div>
            <div>
              <h4 className="text-red-800 font-medium">Erro na Análise</h4>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={generateInsights}
            className="mt-4 text-red-700 hover:text-red-800 font-medium text-sm"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {analysis && (
        <div className="space-y-3">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 mb-4">
            <div className="flex items-center mb-2">
              <Activity className="h-5 w-5 text-purple-600 mr-2" />
              <span className="text-purple-800 font-medium">Análise Gerada com IA</span>
            </div>
            <p className="text-purple-700 text-sm">
              Esta análise foi gerada automaticamente com base nos dados atuais da plataforma
            </p>
          </div>
          
          <div className="prose max-w-none">
            {formatAnalysis(analysis)}
          </div>
          
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              onClick={() => setAnalysis('')}
              className="text-gray-500 hover:text-gray-700 font-medium text-sm mr-4"
            >
              Limpar análise
            </button>
            <button
              onClick={generateInsights}
              disabled={isLoading}
              className="text-purple-600 hover:text-purple-700 font-medium text-sm"
            >
              Gerar nova análise
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [overview, setOverview] = useState<GlobalOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const data = await adminDashboardService.getGlobalOverview();
      setOverview(data);
    } catch (error: any) {
      console.error('Erro ao carregar dashboard:', error);
      setError('Erro ao carregar dados do dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !overview) {
    return (
      <AdminLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-red-800 font-medium">Erro ao carregar dashboard</h3>
          <p className="text-red-700 mt-1">{error}</p>
          <button
            onClick={loadDashboardData}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Tentar novamente
          </button>
        </div>
      </AdminLayout>
    );
  }

  const { globalKPIs, partnerLeaderboard, revenueOverTime, topServices, growthMetrics } = overview;

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Dashboard Global 🚀</h1>
              <p className="text-blue-100">
                Visão 360° da plataforma Click Hype Partners com insights de IA
              </p>
            </div>
            <Building2 className="h-16 w-16 text-blue-200" />
          </div>
        </div>

        {/* KPIs Globais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <KPICard
            title="Total de Parceiros"
            value={adminDashboardService.formatNumber(globalKPIs.totalPartners)}
            growth={growthMetrics.partnersGrowth}
            icon={<Users className="h-6 w-6 text-blue-600" />}
            description="Parceiros ativos"
          />
          <KPICard
            title="Total de Clientes"
            value={adminDashboardService.formatNumber(globalKPIs.totalClients)}
            growth={growthMetrics.clientsGrowth}
            icon={<Building2 className="h-6 w-6 text-green-600" />}
            description="Clientes cadastrados"
          />
          <KPICard
            title="Faturamento Global (MRR)"
            value={adminDashboardService.formatCurrency(globalKPIs.globalMRR)}
            growth={growthMetrics.revenueGrowth}
            icon={<DollarSign className="h-6 w-6 text-yellow-600" />}
            description="Receita mensal recorrente"
          />
          <KPICard
            title="Total de Propostas"
            value={adminDashboardService.formatNumber(globalKPIs.totalProposals)}
            icon={<FileText className="h-6 w-6 text-purple-600" />}
            description="Propostas criadas"
          />
          <KPICard
            title="Receita Média/Parceiro"
            value={adminDashboardService.formatCurrency(globalKPIs.averageRevenuePerPartner)}
            icon={<TrendingUp className="h-6 w-6 text-indigo-600" />}
            description="Média de faturamento"
          />
        </div>

        {/* Gráficos e Rankings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <RevenueChart data={revenueOverTime} />
          <PartnerLeaderboard partners={partnerLeaderboard} />
        </div>

        {/* Principais Serviços */}
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <div className="flex items-center mb-6">
            <Activity className="h-6 w-6 text-blue-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Principais Serviços</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {topServices.map((service, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 text-center">
                <h4 className="font-medium text-gray-900 mb-1">{service.name}</h4>
                <p className="text-2xl font-bold text-blue-600 mb-1">
                  {service.count}
                </p>
                <p className="text-sm text-gray-500">
                  {adminDashboardService.formatCurrency(service.value)} médio
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Insights com IA */}
        <AIInsightGenerator />
      </div>
    </AdminLayout>
  );
} 