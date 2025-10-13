'use client';

import dynamic from 'next/dynamic';

const WlascicielPage = dynamic(() => import('../../components/WlascicielPage'), {
  ssr: false,
});

export default function Page() {
  return <WlascicielPage />;
}
