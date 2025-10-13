'use client';

import { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { app } from '@/lib/firebase';

export default function ProsbySpecjalisty() {
  const [prosby, setProsby] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProsby = async () => {
      const auth = getAuth(app);
      const user = auth.currentUser;
      if (!user) return;

      const db = getFirestore(app);
      const q = query(
        collection(db, 'prosby'), // lub "zgloszeniaSpecjalne"
        where('specialistEmail', '==', user.email)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setProsby(data);
      setLoading(false);
    };

    fetchProsby();
  }, []);

  if (loading) return <p>Ładowanie próśb o pomoc...</p>;

  return (
    <section style={{ maxWidth: '800px', margin: '2rem auto', padding: '1rem' }}>
      <h2>🆘 Prośby od właścicieli</h2>
      {prosby.length === 0 ? (
        <p>Nie masz żadnych nowych próśb o pomoc.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {prosby.map((p) => (
            <li
              key={p.id}
              style={{
                border: '1px solid #ccc',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: '1rem',
              }}
            >
              <p><strong>Temat:</strong> {p.topic}</p>
              <p><strong>Opis:</strong> {p.description}</p>
              <p><strong>Od:</strong> {p.ownerEmail}</p>
              <p><strong>Status:</strong> {p.status}</p>
              <button
                onClick={() => window.location.href = `/panel-specjalisty/prosba/${p.id}`}
                style={{
                  backgroundColor: '#0D1F40',
                  color: 'white',
                  padding: '0.6rem 1.2rem',
                  border: 'none',
                  borderRadius: '0.3rem',
                  marginTop: '0.5rem',
                }}
              >
                Zobacz szczegóły
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
