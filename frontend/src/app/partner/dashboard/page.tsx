'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  UsersIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  TrendingUpIcon,
} from '@heroicons/react/24/outline';
import PartnerLayout from '../../../components/Layout/PartnerLayout';
import { partnerService, PartnerDashboard } from '../../../services/partner.service';

interface MetricCard {
  title: string;
  value: string;
  icon: any;
  color: string;
  bgColor: string;
  change?: string;
  changeType?: 'positive' | 'negative';
}

export default function PartnerDashboardPage() {
  const [dashboard, setDashboard] = useState<PartnerDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      const data = await partnerService.getDashboard();
      setDashboard(data);
    } catch (error: any) {
      console.error('Error loading dashboard:', error);
      toast.error('Erro ao carregar dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getMetricCards = (): MetricCard[] => {
    if (!dashboard) return [];

    return [
      {
        title: 'Clientes Ativos',
        value: dashboard.activeClients.toString(),
        icon: UsersIcon,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
      },
      {
        title: 'Faturamento Mensal (MRR)',
        value: formatCurrency(dashboard.mrr),
        icon: CurrencyDollarIcon,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
      },
      {
        title: 'Comissão Estimada',
        value: formatCurrency(dashboard.estimatedCommission),
        icon: TrendingUpIcon,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
      },
      {
        title: 'Taxa de Comissão',
        value: `${dashboard.commissionPercentage}%`,
        icon: ChartBarIcon,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
      },
    ];
  };

  if (isLoading) {
    return (
      <PartnerLayout>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded-md w-48 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="h-12 bg-gray-200 rounded-full w-12 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded-md mb-2"></div>
                <div className="h-8 bg-gray-200 rounded-md w-20"></div>
              </div>
            ))}
          </div>
        </div>
      </PartnerLayout>
    );
  }

  const metricCards = getMetricCards();

  return (
    <PartnerLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Acompanhe o desempenho da sua carteira de clientes
          </p>
        </motion.div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metricCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {card.value}
                  </p>
                  {card.change && (
                    <p className={`text-sm ${
                      card.changeType === 'positive' 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {card.change}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Ações Rápidas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.href = '/partner/clientes'}
              className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200"
            >
              <UsersIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div className="text-left">
                <p className="font-medium text-gray-900">Gerenciar Clientes</p>
                <p className="text-sm text-gray-600">Ver todos os clientes</p>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.href = '/partner/clientes?action=new'}
              className="flex items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-200"
            >
              <div className="h-8 w-8 bg-green-600 rounded-full flex items-center justify-center mr-3">
                <span className="text-white text-lg font-bold">+</span>
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">Adicionar Cliente</p>
                <p className="text-sm text-gray-600">Cadastrar novo cliente</p>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={loadDashboard}
              className="flex items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors duration-200"
            >
              <div className="h-8 w-8 bg-purple-600 rounded-full flex items-center justify-center mr-3">
                <span className="text-white text-sm">⟳</span>
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">Atualizar Dados</p>
                <p className="text-sm text-gray-600">Recarregar métricas</p>
              </div>
            </motion.button>
          </div>
        </motion.div>

        {/* Welcome Message */}
        {dashboard && dashboard.activeClients === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Bem-vindo ao seu Portal!
            </h3>
            <p className="text-gray-600 mb-4">
              Você ainda não possui clientes cadastrados. Comece adicionando seu primeiro cliente para começar a gerar receita.
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.href = '/partner/clientes?action=new'}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              Adicionar Primeiro Cliente
            </motion.button>
          </motion.div>
        )}
      </div>
    </PartnerLayout>
  );
} 