'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type Props = {
  horseId: string;
  horseName: string;
  onBack: () => void;
  onAdd: () => void;         // kliknięcie ➕Dodaj nową ocenę
  onView: (ocenaId: string) => void;  // kliknięcie 👁Zobacz szczegóły
};

type Ocena = {
  id: string;
  createdAt?: Timestamp;
  formData: Record<string, boolean | string>;
};

export default function ListaOcenKonia({ horseId, horseName, onBack, onAdd, onView }: Props) {
  const [oceny, setOceny] = useState<Ocena[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!horseId) return;

    const fetchOceny = async () => {
      try {
        const q = query(
          collection(db, 'konie', horseId, 'oceny'),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        const data = snap.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Ocena, 'id'>),
        }));
        setOceny(data);
      } catch (err) {
        console.error('❌ Błąd pobierania ocen:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOceny();
  }, [horseId]);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h2>📊 Oceny zachowania – {horseName}</h2>

      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
        <button
          onClick={onBack}
          style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #ccc' }}
        >
          ← Wróć do profilu konia
        </button>
        <button
          onClick={onAdd}
          style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: '#0D1F40', color: '#fff' }}
        >
          ➕ Dodaj nową ocenę
        </button>
      </div>

      {loading ? (
        <p>⏳ Ładowanie ocen...</p>
      ) : oceny.length === 0 ? (
        <p>Brak ocen dla tego konia.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {oceny.map((ocena) => (
            <li
              key={ocena.id}
              style={{
                border: '1px solid #ccc',
                borderRadius: '6px',
                padding: '1rem',
                marginBottom: '1rem',
              }}
            >
              <h4>Ocena z dnia: {ocena.createdAt?.toDate().toLocaleString() || 'brak daty'}</h4>
              <button
                onClick={() => onView(ocena.id)}
                style={{
                  padding: '0.3rem 1rem',
                  borderRadius: '6px',
                  border: '1px solid #0D1F40',
                  background: 'white',
                  color: '#0D1F40',
                  cursor: 'pointer',
                }}
              >
                👁 Zobacz szczegóły
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
