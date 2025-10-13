'use client';

import { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { app } from '@/lib/firebase';

export default function PanelSpecjalistyZgloszenia() {
  const [zgloszenia, setZgloszenia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [oferty, setOferty] = useState<any[]>([]);
  const [nieprzeczytane, setNieprzeczytane] = useState(0);

  const db = getFirestore(app);

  useEffect(() => {
    const fetchOferty = async () => {
      const auth = getAuth(app);
      const user = auth.currentUser;
      if (!user?.email) return;

      const q = query(collection(db, 'oferty'), where('specialistEmail', '==', user.email));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => doc.data());

      setOferty(data);

      const nowe = data.filter(d => !d.oznaczonaJakoPrzeczytana).length;
      setNieprzeczytane(nowe);
    };

    fetchOferty();
  }, [db]);

  useEffect(() => {
    const fetchZgloszenia = async () => {
      const q = query(collection(db, 'zgloszenia'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setZgloszenia(data);
      setLoading(false);
    };

    fetchZgloszenia();
  }, [db]);

  if (loading) return <p>Ładowanie zgłoszeń...</p>;

  return (
    <section style={{ maxWidth: '900px', margin: '2rem auto', padding: '1rem' }}>
      <h2 style={{ fontSize: '1.6rem', marginBottom: '1rem' }}>
        Lista zgłoszeń właścicieli
      </h2>

      {/* 🔔 Licznik wiadomości */}
      <div style={{
        background: '#f5f5f5',
        padding: '1rem',
        borderRadius: '0.5rem',
        marginBottom: '2rem',
        border: '1px solid #ddd'
      }}>
        📨 Masz <strong>{oferty.length}</strong> ofert pomocy,
        z czego <strong>{nieprzeczytane}</strong> jest nieprzeczytanych.
      </div>

      {zgloszenia.length === 0 ? (
        <p>Brak zgłoszeń do wyświetlenia.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {zgloszenia.map((z) => (
            <li
              key={z.id}
              style={{
                border: '1px solid #ccc',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: '1rem',
                background: '#fff',
              }}
            >
              <p><strong>Temat:</strong> {z.temat}</p>
              <p><strong>Imię:</strong> {z.name}</p>
              <p><strong>Lokalizacja:</strong> {z.location}</p>
              <button
                style={{
                  marginTop: '1rem',
                  backgroundColor: '#0D1F40',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.3rem',
                  border: 'none',
                  cursor: 'pointer',
                }}
                onClick={() => window.location.href = `/zgloszenia/${z.id}`}
              >
                Zobacz szczegóły zgłoszenia
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
