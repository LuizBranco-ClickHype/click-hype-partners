import { api } from './api';

export interface ProposalItem {
  id?: string;
  description: string;
  value: number;
}

export interface Proposal {
  id: string;
  title: string;
  clientName: string;
  clientEmail?: string;
  scope: string;
  totalValue: number;
  status: 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED';
  validUntil: string;
  publicLink: string;
  partnerId: string;
  items: ProposalItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProposalData {
  title: string;
  clientName: string;
  clientEmail?: string;
  scope: string;
  validUntil: string;
  items: ProposalItem[];
}

export interface UpdateProposalData extends Partial<CreateProposalData> {
  status?: 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED';
}

class ProposalsService {
  async getProposals(): Promise<Proposal[]> {
    const response = await api.get('/proposals');
    return response.data;
  }

  async getProposal(id: string): Promise<Proposal> {
    const response = await api.get(`/proposals/${id}`);
    return response.data;
  }

  async getProposalByPublicLink(publicLink: string): Promise<Proposal> {
    const response = await api.get(`/proposals/public/${publicLink}`);
    return response.data;
  }

  async createProposal(data: CreateProposalData): Promise<Proposal> {
    const response = await api.post('/proposals', data);
    return response.data;
  }

  async updateProposal(id: string, data: UpdateProposalData): Promise<Proposal> {
    const response = await api.patch(`/proposals/${id}`, data);
    return response.data;
  }

  async updateProposalStatus(publicLink: string, status: 'APPROVED' | 'REJECTED'): Promise<Proposal> {
    const response = await api.patch(`/proposals/public/${publicLink}/status`, { status });
    return response.data;
  }

  async deleteProposal(id: string): Promise<void> {
    await api.delete(`/proposals/${id}`);
  }

  async downloadProposalPdf(id: string): Promise<Blob> {
    const response = await api.get(`/proposals/${id}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  }

  generatePublicUrl(publicLink: string): string {
    return `${window.location.origin}/proposta/${publicLink}`;
  }

  async copyPublicLink(publicLink: string): Promise<void> {
    const url = this.generatePublicUrl(publicLink);
    await navigator.clipboard.writeText(url);
  }

  getStatusText(status: string): string {
    const statusMap = {
      'DRAFT': 'Rascunho',
      'SENT': 'Enviada',
      'APPROVED': 'Aprovada',
      'REJECTED': 'Rejeitada'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  }

  getStatusColor(status: string): string {
    const colorMap = {
      'DRAFT': 'bg-gray-100 text-gray-800',
      'SENT': 'bg-blue-100 text-blue-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800'
    };
    return colorMap[status as keyof typeof colorMap] || 'bg-gray-100 text-gray-800';
  }
}

export const proposalsService = new ProposalsService(); 