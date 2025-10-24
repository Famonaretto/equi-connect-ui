'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { app } from '@/lib/firebase';

interface Props {
  id: string;
}

export default function ZaleceniaClient({ id }: Props) {
  const router = useRouter();
  const [role, setRole] = useState<'wlasciciel' | 'specjalista'>('wlasciciel');
  const [zalecenia, setZalecenia] = useState('');
  const [konsultacja, setKonsultacja] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedRole = localStorage.getItem('role') as 'wlasciciel' | 'specjalista';
    if (savedRole) setRole(savedRole);

    const fetchData = async () => {
      const db = getFirestore(app);
      const docRef = doc(db, 'konsultacje', id as string);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const data = snap.data();
        setKonsultacja({ id: snap.id, ...data });
        setZalecenia(data.zalecenia || '');
      }

      setLoading(false);
    };

    fetchData();
  }, [id]);

  const handleSave = async () => {
    if (!zalecenia.trim()) {
      alert('⚠️ Wpisz zalecenia przed zapisaniem.');
      return;
    }

    const db = getFirestore(app);
    const docRef = doc(db, 'konsultacje', id as string);

    await updateDoc(docRef, { zalecenia });

    await addDoc(collection(db, 'zalecenia'), {
      konsultacjaId: id,
      konId: konsultacja?.konId,
      imieKonia: konsultacja?.imieKonia,
      specialistName: konsultacja?.specjalista,
      ownerName: konsultacja?.ownerName,
      ownerUid: konsultacja?.ownerUid,
      specialistUid: konsultacja?.specjalistaUid,
      zalecenia,
      createdAt: serverTimestamp(),
    });

    alert('✅ Zalecenia zostały zapisane.');
    router.back();
  };

  if (loading) return <p>Ładowanie...</p>;

  return (
    <div style={{ maxWidth: '700px', margin: '2rem auto', padding: '1.5rem' }}>
      <h2 style={{ color: '#0D1F40' }}>
        Zalecenia dla konsultacji: {konsultacja?.temat || '—'}
      </h2>
      <p><strong>Koń:</strong> {konsultacja?.imieKonia || '—'}</p>
      <p><strong>Specjalista:</strong> {konsultacja?.specjalista || '—'}</p>
      <p><strong>Właściciel:</strong> {konsultacja?.ownerName || '—'}</p>

      {role === 'specjalista' ? (
        <div style={{ marginTop: '1.5rem' }}>
          <textarea
            value={zalecenia}
            onChange={(e) => setZalecenia(e.target.value)}
            rows={10}
            style={{
              width: '100%',
              padding: '1rem',
              border: '1px solid #ccc',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontFamily: 'inherit',
            }}
            placeholder="Wpisz zalecenia dla właściciela konia..."
          />
          <button
            onClick={handleSave}
            style={{
              marginTop: '1rem',
              background: '#0D1F40',
              color: 'white',
              padding: '0.8rem 1.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            💾 Zapisz zalecenia
          </button>
        </div>
      ) : (
        <div style={{ marginTop: '1.5rem' }}>
          <h3>Zalecenia specjalisty:</h3>
          <div
            style={{
              background: '#f8f9fa',
              padding: '1rem',
              borderRadius: '0.5rem',
              whiteSpace: 'pre-wrap',
              marginTop: '0.5rem',
            }}
          >
            {zalecenia || '— Brak zaleceń —'}
          </div>
        </div>
      )}
    </div>
  );
}
