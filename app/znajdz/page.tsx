import { Suspense } from 'react';
import ZnajdzClient from './ZnajdzClient';

export default function Page() {
  return (
    <Suspense fallback={<div>Ładowanie...</div>}>
      <ZnajdzClient />
    </Suspense>
  );
}
