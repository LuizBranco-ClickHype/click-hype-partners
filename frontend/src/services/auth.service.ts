import api from './api';
import Cookies from 'js-cookie';

interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', {
      email,
      password,
    });

    const { access_token, user } = response.data;

    // Armazenar token e usuário
    Cookies.set(this.TOKEN_KEY, access_token, { expires: 1 }); // 1 dia
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));

    // Configurar header de autorização
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

    return response.data;
  }

  logout(): void {
    Cookies.remove(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    delete api.defaults.headers.common['Authorization'];
  }

  getToken(): string | null {
    return Cookies.get(this.TOKEN_KEY) || null;
  }

  getUser(): User | null {
    const userString = localStorage.getItem(this.USER_KEY);
    if (!userString) return null;

    try {
      return JSON.parse(userString);
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  async getProfile(): Promise<User> {
    const response = await api.get<{ user: User }>('/auth/profile');
    return response.data.user;
  }

  // Inicializar o serviço de autenticação
  initialize(): void {
    const token = this.getToken();
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }
}

export const authService = new AuthService(); 