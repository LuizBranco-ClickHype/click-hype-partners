import api from './api';

export interface Partner {
  id: string;
  companyName: string;
  email: string;
  phone?: string;
  document?: string;
  commissionPercentage: number;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED';
  description?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePartnerData {
  companyName: string;
  email: string;
  phone?: string;
  document?: string;
  commissionPercentage: number;
  status?: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED';
  description?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface UpdatePartnerData extends Partial<CreatePartnerData> {}

export interface PaginatedPartnersResponse {
  data: Partner[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PartnersStats {
  total: number;
  active: number;
  pending: number;
  inactive: number;
}

class PartnersService {
  async getPartners(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedPartnersResponse> {
    const response = await api.get<PaginatedPartnersResponse>('/partners', {
      params,
    });
    return response.data;
  }

  async getPartner(id: string): Promise<Partner> {
    const response = await api.get<Partner>(`/partners/${id}`);
    return response.data;
  }

  async createPartner(data: CreatePartnerData): Promise<Partner> {
    const response = await api.post<Partner>('/partners', data);
    return response.data;
  }

  async updatePartner(id: string, data: UpdatePartnerData): Promise<Partner> {
    const response = await api.patch<Partner>(`/partners/${id}`, data);
    return response.data;
  }

  async deletePartner(id: string): Promise<void> {
    await api.delete(`/partners/${id}`);
  }

  async getStats(): Promise<PartnersStats> {
    const response = await api.get<PartnersStats>('/partners/stats');
    return response.data;
  }
}

export const partnersService = new PartnersService(); 