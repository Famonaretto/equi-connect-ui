'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import SpecjalistaPage from './SpecjalistaPage'; // 👈 Główna logika strony (przeniesiona)

export default function SpecjalistaClientWrapper() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('profil');

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  return <SpecjalistaPage activeTab={activeTab} setActiveTab={setActiveTab} />;
}
