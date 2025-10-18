'use client';

import OcenaZachowaniaPage from '@/components/OcenaZachowaniaPage';
import { useRouter } from 'next/navigation';

export default function Page() {
  const router = useRouter();

  return (
    <OcenaZachowaniaPage onBack={() => router.back()} />
  );
}
