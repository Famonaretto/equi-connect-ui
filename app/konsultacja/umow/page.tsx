import { Suspense } from 'react';
import UmowKonsultacjeClient from './UmowKonsultacjeClient';

export default function Page() {
  return (
    <Suspense fallback={<p>Ładowanie formularza...</p>}>
      <UmowKonsultacjeClient />
    </Suspense>
  );
}
