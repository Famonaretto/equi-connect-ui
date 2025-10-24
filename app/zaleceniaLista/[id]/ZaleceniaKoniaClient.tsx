'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { app } from '@/lib/firebase';

interface Zalecenie {
  id: string;
  konsultacjaId: string;
  konId: string;
  imieKonia?: string;
  specialistName?: string;
  ownerName?: string;
  zalecenia: string;
  createdAt?: Timestamp;
}

interface Props {
  id: string;
  onBack?: () => void; // ✅ dodajemy onBack jako opcjonalny
}


export default function ZaleceniaKoniaClient({ id, onBack }: Props) {

  const [zalecenia, setZalecenia] = useState<Zalecenie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchZalecenia = async () => {
      try {
        const db = getFirestore(app);
        const zaleceniaRef = collection(db, 'zalecenia');

        const q = query(
          zaleceniaRef,
          where('konId', '==', id),
          orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map(
          (doc: QueryDocumentSnapshot<DocumentData>) => ({
            id: doc.id,
            ...doc.data(),
          })
        ) as Zalecenie[];

        setZalecenia(docs);
      } catch (error) {
        console.error('❌ Błąd podczas pobierania zaleceń:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchZalecenia();
  }, [id]);

  if (loading) return <p>⏳ Ładowanie zaleceń...</p>;
  if (!id) return <p>❌ Brak identyfikatora konia.</p>;

  return (
    <div style={{ maxWidth: '700px', margin: '2rem auto', padding: '1rem' }}>
      <h2 style={{ color: '#0D1F40' }}>📝 Zalecenia dla konia</h2>

      {onBack && (
  <button
    onClick={onBack}
    style={{
      marginTop: '1rem',
      marginBottom: '1rem',
      backgroundColor: '#0D1F40',
      color: 'white',
      border: 'none',
      padding: '0.5rem 1rem',
      borderRadius: '0.4rem',
      cursor: 'pointer'
    }}
  >
    ← Wróć do listy koni
  </button>
)}


      {zalecenia.length === 0 ? (
        <p style={{ marginTop: '1rem' }}>Brak zaleceń dla tego konia.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {zalecenia.map((z) => {
            const date = z.createdAt
              ? z.createdAt.toDate().toLocaleString('pl-PL')
              : '—';

            return (
              <li
                key={z.id}
                style={{
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1rem',
                  background: '#f9f9f9',
                }}
              >
                <p><strong>📅 Data:</strong> {date}</p>
                <p><strong>👨‍⚕️ Specjalista:</strong> {z.specialistName || '—'}</p>
                <p><strong>👤 Właściciel:</strong> {z.ownerName || '—'}</p>
                <p><strong>🐴 Koń:</strong> {z.imieKonia || '—'}</p>
                <h4 style={{ marginTop: '1rem' }}>Zalecenia:</h4>
                <div
                  style={{
                    background: 'white',
                    padding: '0.8rem',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {z.zalecenia}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
