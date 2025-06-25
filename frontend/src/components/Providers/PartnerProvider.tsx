'use client';

import { useEffect } from 'react';
import { partnerService } from '../../services/partner.service';

interface PartnerProviderProps {
  children: React.ReactNode;
}

export default function PartnerProvider({ children }: PartnerProviderProps) {
  useEffect(() => {
    // Initialize partner service on app load
    partnerService.init();
  }, []);

  return <>{children}</>;
} 