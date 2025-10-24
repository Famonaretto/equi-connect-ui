import { Suspense } from 'react';
import SpecjalistaClient from './SpecjalistaClient';

export default function Page() {
  return (
    <Suspense fallback={<div>Ładowanie panelu specjalisty...</div>}>
      <SpecjalistaClient />
    </Suspense>
  );
}
