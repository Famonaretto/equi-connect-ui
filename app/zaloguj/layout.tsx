'use client';

import { ReactNode } from 'react';
import { DialogProvider } from './../components/DialogProvider';
import { UserProvider } from '@/contexts/UserContext';

export default function ZalogujLayout({ children }: { children: ReactNode }) {
      console.log('📦 ZalogujLayout rendering');

  return (
    <DialogProvider>
      <UserProvider>
        {children}
      </UserProvider>
    </DialogProvider>
  );
}
