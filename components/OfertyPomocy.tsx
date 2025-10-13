'use client';

import { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { app } from '@/lib/firebase';

export default function OfertyPomocy() {
  const [oferty, setOferty] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOferty = async () => {
      const auth = getAuth(app);
      const user = auth.currentUser;
      if (!user) return;

      const db = getFirestore(app);
      const q = query(
        collection(db, 'oferty_pomocy'),
        where('wlasciciel', '==', user.email)
      );

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setOferty(data);
      setLoading(false);
    };

    fetchOferty();
  }, []);

  if (loading) return <p>Ładowanie ofert pomocy...</p>;
  if (oferty.length === 0) return <p>Brak otrzymanych ofert.</p>;

  return (
    <section>
      <h2>Otrzymane oferty pomocy</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {oferty.map((oferta) => (
          <li
            key={oferta.id}
            style={{
              border: '1px solid #ccc',
              borderRadius: '0.5rem',
              padding: '1rem',
              marginBottom: '1rem',
            }}
          >
            <p><strong>Temat zgłoszenia:</strong> {oferta.temat}</p>
            <p><strong>Specjalista:</strong> {oferta.specjalista}</p>
            <p><strong>Status:</strong> {oferta.status}</p>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
              <button onClick={() => alert('Zaakceptowano ofertę')} style={btn}>Zaakceptuj</button>
              <button onClick={() => alert('Odrzucono ofertę')} style={{ ...btn, backgroundColor: '#ccc', color: '#000' }}>Odrzuć</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

const btn: React.CSSProperties = {
  backgroundColor: '#0D1F40',
  color: 'white',
  padding: '0.5rem 1rem',
  borderRadius: '0.4rem',
  border: 'none',
  cursor: 'pointer',
};
