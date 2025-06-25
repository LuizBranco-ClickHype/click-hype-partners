'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { proposalsService, UpdateProposalData, ProposalItem, Proposal } from '../../../../../services/proposals.service';

export default function EditarPropostaPage() {
  const router = useRouter();
  const params = useParams();
  const proposalId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [formData, setFormData] = useState<UpdateProposalData>({
    title: '',
    clientName: '',
    clientEmail: '',
    scope: '',
    validUntil: '',
    items: [{ description: '', value: 0 }],
    status: 'DRAFT'
  });

  useEffect(() => {
    if (proposalId) {
      loadProposal();
    }
  }, [proposalId]);

  const loadProposal = async () => {
    try {
      setInitialLoading(true);
      const proposal = await proposalsService.getProposal(proposalId);
      
      setFormData({
        title: proposal.title,
        clientName: proposal.clientName,
        clientEmail: proposal.clientEmail || '',
        scope: proposal.scope,
        validUntil: proposal.validUntil.split('T')[0], // Format date for input
        items: proposal.items.length > 0 ? proposal.items : [{ description: '', value: 0 }],
        status: proposal.status
      });
    } catch (error) {
      toast.error('Erro ao carregar proposta');
      console.error('Erro ao carregar proposta:', error);
      router.push('/partner/propostas');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleInputChange = (field: keyof UpdateProposalData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleItemChange = (index: number, field: keyof ProposalItem, value: string | number) => {
    const newItems = [...(formData.items || [])];
    newItems[index] = {
      ...newItems[index],
      [field]: field === 'value' ? Number(value) : value
    };
    setFormData(prev => ({
      ...prev,
      items: newItems
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...(prev.items || []), { description: '', value: 0 }]
    }));
  };

  const removeItem = (index: number) => {
    if ((formData.items?.length || 0) > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items?.filter((_, i) => i !== index) || []
      }));
    }
  };

  const getTotalValue = () => {
    return (formData.items || []).reduce((total, item) => total + (Number(item.value) || 0), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.clientName || !formData.scope || !formData.validUntil) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (formData.items?.some(item => !item.description || !item.value)) {
      toast.error('Preencha todos os itens da proposta');
      return;
    }

    try {
      setLoading(true);
      await proposalsService.updateProposal(proposalId, formData);
      toast.success('Proposta atualizada com sucesso!');
      router.push('/partner/propostas');
    } catch (error) {
      toast.error('Erro ao atualizar proposta');
      console.error('Erro ao atualizar proposta:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar Proposta</h1>
          <p className="text-gray-600 mt-1">Atualize as informações da proposta</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações Básicas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título da Proposta *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                placeholder="Ex: Proposta de Marketing Digital"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Validade da Proposta *
              </label>
              <input
                type="date"
                value={formData.validUntil}
                onChange={(e) => handleInputChange('validUntil', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Cliente *
              </label>
              <input
                type="text"
                value={formData.clientName}
                onChange={(e) => handleInputChange('clientName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                placeholder="Nome da empresa ou pessoa"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email do Cliente
              </label>
              <input
                type="email"
                value={formData.clientEmail}
                onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                placeholder="email@exemplo.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status da Proposta
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              >
                <option value="DRAFT">Rascunho</option>
                <option value="SENT">Enviada</option>
                <option value="APPROVED">Aprovada</option>
                <option value="REJECTED">Rejeitada</option>
              </select>
            </div>
          </div>
        </div>

        {/* Escopo */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Escopo do Projeto</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição do Escopo *
            </label>
            <textarea
              value={formData.scope}
              onChange={(e) => handleInputChange('scope', e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              placeholder="Descreva detalhadamente o escopo do projeto, objetivos, entregáveis, cronograma, etc."
              required
            />
          </div>
        </div>

        {/* Itens da Proposta */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Itens da Proposta</h2>
            <button
              type="button"
              onClick={addItem}
              className="bg-rose-500 hover:bg-rose-600 text-white px-3 py-1 rounded-lg flex items-center gap-2 text-sm transition-colors"
            >
              <Plus className="h-4 w-4" />
              Adicionar Item
            </button>
          </div>

          <div className="space-y-4">
            {(formData.items || []).map((item, index) => (
              <div key={index} className="flex gap-4 items-start">
                <div className="flex-1">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    placeholder="Descrição do item/serviço"
                    required
                  />
                </div>
                <div className="w-40">
                  <input
                    type="number"
                    value={item.value}
                    onChange={(e) => handleItemChange(index, 'value', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    placeholder="0,00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                {(formData.items?.length || 0) > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Total:</span>
              <span className="text-2xl font-bold text-rose-600">
                {formatCurrency(getTotalValue())}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="h-4 w-4" />
            )}
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  );
} 