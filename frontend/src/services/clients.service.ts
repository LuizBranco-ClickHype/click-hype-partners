import { api } from './api.service';

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  startDate: string;
  status: 'ACTIVE' | 'INACTIVE';
  partnerId: string;
  services: ClientService[];
  createdAt: string;
  updatedAt: string;
}

export interface ClientService {
  id: string;
  description: string;
  monthlyFee: number;
  clientId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientDto {
  name: string;
  email?: string;
  phone?: string;
  startDate: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface UpdateClientDto {
  name?: string;
  email?: string;
  phone?: string;
  startDate?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface CreateClientServiceDto {
  description: string;
  monthlyFee: number;
}

export interface UpdateClientServiceDto {
  description?: string;
  monthlyFee?: number;
}

export interface ClientsPaginatedResponse {
  clients: Client[];
  total: number;
  totalPages: number;
}

class ClientsService {
  private static instance: ClientsService;

  static getInstance(): ClientsService {
    if (!ClientsService.instance) {
      ClientsService.instance = new ClientsService();
    }
    return ClientsService.instance;
  }

  // Clients CRUD
  async getClients(page = 1, limit = 10, search = ''): Promise<ClientsPaginatedResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (search) params.append('search', search);

    const response = await api.get(`/clients?${params.toString()}`);
    return response.data;
  }

  async getClient(id: string): Promise<Client> {
    const response = await api.get(`/clients/${id}`);
    return response.data;
  }

  async createClient(data: CreateClientDto): Promise<Client> {
    const response = await api.post('/clients', data);
    return response.data;
  }

  async updateClient(id: string, data: UpdateClientDto): Promise<Client> {
    const response = await api.patch(`/clients/${id}`, data);
    return response.data;
  }

  async deleteClient(id: string): Promise<void> {
    await api.delete(`/clients/${id}`);
  }

  // Client Services CRUD
  async createClientService(clientId: string, data: CreateClientServiceDto): Promise<ClientService> {
    const response = await api.post(`/clients/${clientId}/services`, data);
    return response.data;
  }

  async updateClientService(serviceId: string, data: UpdateClientServiceDto): Promise<ClientService> {
    const response = await api.patch(`/clients/services/${serviceId}`, data);
    return response.data;
  }

  async deleteClientService(serviceId: string): Promise<void> {
    await api.delete(`/clients/services/${serviceId}`);
  }
}

export const clientsService = ClientsService.getInstance(); 