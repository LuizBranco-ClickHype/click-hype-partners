import { api } from './api.service';

export interface Partner {
  id: string;
  companyName: string;
  email: string;
  status: string;
  commissionPercentage: number;
}

export interface PartnerLoginResponse {
  access_token: string;
  partner: Partner;
}

export interface PartnerDashboard {
  activeClients: number;
  mrr: number;
  estimatedCommission: number;
  commissionPercentage: number;
}

class PartnerService {
  private static instance: PartnerService;

  static getInstance(): PartnerService {
    if (!PartnerService.instance) {
      PartnerService.instance = new PartnerService();
    }
    return PartnerService.instance;
  }

  // Authentication
  async login(email: string, password: string): Promise<PartnerLoginResponse> {
    const response = await api.post('/auth/partner/login', {
      email,
      password,
    });
    
    // Store token and partner data
    localStorage.setItem('partner_token', response.data.access_token);
    localStorage.setItem('partner_data', JSON.stringify(response.data.partner));
    
    // Set default authorization header
    api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
    
    return response.data;
  }

  async logout(): Promise<void> {
    localStorage.removeItem('partner_token');
    localStorage.removeItem('partner_data');
    delete api.defaults.headers.common['Authorization'];
  }

  getStoredPartner(): Partner | null {
    const partnerData = localStorage.getItem('partner_data');
    return partnerData ? JSON.parse(partnerData) : null;
  }

  getStoredToken(): string | null {
    return localStorage.getItem('partner_token');
  }

  isAuthenticated(): boolean {
    const token = this.getStoredToken();
    const partner = this.getStoredPartner();
    return !!(token && partner);
  }

  // Dashboard
  async getDashboard(): Promise<PartnerDashboard> {
    const response = await api.get('/dashboard/partner');
    return response.data;
  }

  // Profile
  async getProfile(): Promise<Partner> {
    const response = await api.get('/partners/me');
    return response.data;
  }

  // Initialize service
  init(): void {
    const token = this.getStoredToken();
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }
}

export const partnerService = PartnerService.getInstance(); 