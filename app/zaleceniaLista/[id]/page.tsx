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

interface ZaleceniaKoniaPageProps {
  horseId?: string;        // 🔑 opcjonalny props (dla WlascicielPage)
  onBack?: () => void;     // 🔙 przycisk powrotu (dla WlascicielPage)
}

export default function ZaleceniaKoniaPage({ horseId, onBack }: ZaleceniaKoniaPageProps) {
  const params = useParams();
  const idFromParams = Array.isArray(params?.id) ? params.id[0] : params?.id;

  // 🔑 logika: jeśli podano horseId w props, używamy go
  const id = horseId || idFromParams;

  const [zalecenia, setZalecenia] = useState<Zalecenie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchZalecenia = async () => {
      if (!id) {
        console.warn('⚠️ Brak ID konia w URL ani w props.');
        setLoading(false);
        return;
      }

      try {
        const db = getFirestore(app);
        const zaleceniaRef = collection(db, 'zalecenia');

        const q = query(
          zaleceniaRef,
          where('konId', '==', id),
          orderBy('createdAt', 'desc')
        );

        console.log('📤 Pobieram zalecenia dla konia o ID:', id);

        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map(
          (doc: QueryDocumentSnapshot<DocumentData>) => ({
            id: doc.id,
            ...doc.data(),
          })
        ) as Zalecenie[];

        console.log('📄 Znaleziono zaleceń:', docs.length, docs);

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

      {/* 🔙 Powrót tylko w trybie props */}
      {onBack && (
        <button
          onClick={onBack}
          style={{
            marginBottom: '1rem',
            padding: '0.5rem 1rem',
            background: '#0D1F40',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          ⬅ Wróć
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
                <p>
                  <strong>📅 Data:</strong> {date}
                </p>
                <p>
                  <strong>👨‍⚕️ Specjalista:</strong> {z.specialistName || '—'}
                </p>
                <p>
                  <strong>👤 Właściciel:</strong> {z.ownerName || '—'}
                </p>
                <p>
                  <strong>🐴 Koń:</strong> {z.imieKonia || '—'}
                </p>

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
