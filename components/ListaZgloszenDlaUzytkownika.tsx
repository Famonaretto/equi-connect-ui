// components/ListaZgloszenDlaUzytkownika.tsx
'use client';
import { useEffect, useState } from 'react';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { app } from '@/lib/firebase';

export default function ListaZgloszenDlaUzytkownika({ userEmail }: { userEmail: string }) {
  const [zgloszenia, setZgloszenia] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const db = getFirestore(app);
      const q = query(collection(db, 'zgloszenia'), where('email', '==', userEmail));
      const snapshot = await getDocs(q);
      setZgloszenia(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    fetchData();
  }, [userEmail]);

  return (
    <ul>
      {zgloszenia.map((z) => (
        <li key={z.id} style={{ marginBottom: '1rem' }}>
          <strong>{z.topic}</strong> – {z.location}
        </li>
      ))}
    </ul>
  );
}
