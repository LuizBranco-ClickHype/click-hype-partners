'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Check, X, Download, Clock, Building, Mail, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { proposalsService, Proposal } from '../../../services/proposals.service';

export default function PropostaPublicaPage() {
  const params = useParams();
  const publicLink = params.publicLink as string;
  
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (publicLink) {
      loadProposal();
    }
  }, [publicLink]);

  const loadProposal = async () => {
    try {
      setLoading(true);
      const data = await proposalsService.getProposalByPublicLink(publicLink);
      setProposal(data);
    } catch (error) {
      toast.error('Proposta não encontrada');
      console.error('Erro ao carregar proposta:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (status: 'APPROVED' | 'REJECTED') => {
    if (!proposal) return;

    try {
      setActionLoading(true);
      await proposalsService.updateProposalStatus(publicLink, status);
      
      setProposal(prev => prev ? { ...prev, status } : null);
      
      toast.success(
        status === 'APPROVED' 
          ? 'Proposta aprovada com sucesso!' 
          : 'Proposta rejeitada.'
      );
    } catch (error) {
      toast.error('Erro ao atualizar status da proposta');
      console.error('Erro ao atualizar status:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'DRAFT': 'bg-gray-100 text-gray-800',
      'SENT': 'bg-blue-100 text-blue-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const texts = {
      'DRAFT': 'Rascunho',
      'SENT': 'Enviada',
      'APPROVED': 'Aprovada',
      'REJECTED': 'Rejeitada'
    };
    return texts[status as keyof typeof texts] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Proposta não encontrada</h1>
          <p className="text-gray-600">A proposta que você está procurando não existe ou foi removida.</p>
        </div>
      </div>
    );
  }

  const isExpired = new Date(proposal.validUntil) < new Date();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-rose-500 text-white p-3 rounded-lg">
                <Building className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">CLICK HYPE</h1>
                <p className="text-gray-600">Soluções em Marketing Digital</p>
              </div>
            </div>
            <div className="text-right">
              <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(proposal.status)}`}>
                {getStatusText(proposal.status)}
              </div>
              {isExpired && (
                <div className="text-red-600 text-sm mt-1 flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Proposta expirada
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Título da Proposta */}
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{proposal.title}</h2>
          <div className="text-gray-600">
            <p className="mb-2">Proposta preparada para: <strong>{proposal.clientName}</strong></p>
            {proposal.clientEmail && (
              <p className="flex items-center justify-center gap-2">
                <Mail className="h-4 w-4" />
                {proposal.clientEmail}
              </p>
            )}
          </div>
        </div>

        {/* Escopo */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Escopo do Projeto</h3>
          <div className="prose prose-gray max-w-none">
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
              {proposal.scope}
            </div>
          </div>
        </div>

        {/* Itens e Valores */}
        {proposal.items && proposal.items.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Itens da Proposta</h3>
            <div className="space-y-4">
              {proposal.items.map((item, index) => (
                <div key={index} className="flex justify-between items-start border-b border-gray-200 pb-4">
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium">{item.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-semibold text-gray-900">
                      {formatCurrency(item.value)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Total */}
        <div className="bg-rose-50 border-2 border-rose-200 rounded-lg p-8">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Valor Total da Proposta</h3>
            <div className="text-4xl font-bold text-rose-600 mb-4">
              {formatCurrency(proposal.totalValue)}
            </div>
            <p className="text-gray-600">
              <Clock className="inline h-4 w-4 mr-1" />
              Válida até: {formatDate(proposal.validUntil)}
            </p>
          </div>
        </div>

        {/* Ações */}
        {proposal.status === 'SENT' && !isExpired && (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                O que você decide sobre esta proposta?
              </h3>
              <p className="text-gray-600 mb-6">
                Sua resposta será enviada automaticamente para o parceiro.
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => handleStatusUpdate('APPROVED')}
                  disabled={actionLoading}
                  className="bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Check className="h-5 w-5" />
                  {actionLoading ? 'Processando...' : 'Aprovar Proposta'}
                </button>
                <button
                  onClick={() => handleStatusUpdate('REJECTED')}
                  disabled={actionLoading}
                  className="bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <X className="h-5 w-5" />
                  {actionLoading ? 'Processando...' : 'Rejeitar Proposta'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status Final */}
        {(proposal.status === 'APPROVED' || proposal.status === 'REJECTED') && (
          <div className={`rounded-lg p-8 text-center ${
            proposal.status === 'APPROVED' 
              ? 'bg-green-50 border-2 border-green-200' 
              : 'bg-red-50 border-2 border-red-200'
          }`}>
            <div className={`inline-flex items-center gap-2 text-xl font-semibold mb-2 ${
              proposal.status === 'APPROVED' ? 'text-green-800' : 'text-red-800'
            }`}>
              {proposal.status === 'APPROVED' ? (
                <>
                  <Check className="h-6 w-6" />
                  Proposta Aprovada!
                </>
              ) : (
                <>
                  <X className="h-6 w-6" />
                  Proposta Rejeitada
                </>
              )}
            </div>
            <p className={proposal.status === 'APPROVED' ? 'text-green-700' : 'text-red-700'}>
              {proposal.status === 'APPROVED' 
                ? 'Obrigado por aceitar nossa proposta. Entraremos em contato em breve!'
                : 'Obrigado pelo seu tempo. Esperamos poder trabalhar juntos no futuro.'
              }
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-8 border-t border-gray-200">
          <p className="text-gray-500 text-sm">
            Esta proposta foi gerada automaticamente pela plataforma Click Hype Partners
          </p>
        </div>
      </div>
    </div>
  );
} 