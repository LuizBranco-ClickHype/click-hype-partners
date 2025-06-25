'use client';

import { useEffect } from 'react';
import { authService } from '@/services/auth.service';

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  useEffect(() => {
    // Inicializar o serviço de autenticação
    authService.initialize();
  }, []);

  return <>{children}</>;
} 