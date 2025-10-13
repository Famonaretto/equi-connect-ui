'use client';
import { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { app } from '@/lib/firebase';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  query,
  where,
} from 'firebase/firestore';
import { useOfertaActions } from './useOfertaActions';

type Oferta = {
  id: string;
  zgloszenieId: string;
  temat?: string;
  status: string;
  cena?: { od?: string; do?: string };
  proponowaneTerminy?: string[];
};

const MojeOferty = () => {
  const [oferty, setOferty] = useState<Oferta[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const db = getFirestore(app);

  const { handleCancelOffer, handleEditOffer } = useOfertaActions();

  // 🔁 Pobieranie ofert specjalisty
  useEffect(() => {
    const fetchOferty = async () => {
      const auth = getAuth(app);
      const user = auth.currentUser;

      if (!user) return;

      const q = query(
        collection(db, 'ofertySpecjalistow'),
        where('specjalistaId', '==', user.uid)
      );

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Oferta[];

      setOferty(data);
    };

    fetchOferty();
  }, []);

  // 🧹 Filtrowanie po statusie
  const filteredOferty = oferty.filter((o) =>
    statusFilter ? o.status === statusFilter : true
  );

  // ❌ Anulowanie oferty
  const handleAnuluj = async (id: string) => {
    const confirm = window.confirm('Czy na pewno chcesz anulować tę ofertę?');
    if (!confirm) return;

    try {
      await deleteDoc(doc(db, 'ofertySpecjalistow', id));
      setOferty((prev) => prev.filter((o) => o.id !== id));
      alert('✅ Oferta została anulowana.');
    } catch (err) {
      console.error('Błąd przy anulowaniu:', err);
      alert('❌ Nie udało się anulować oferty.');
    }
  };

const handleEdytuj = (ofertaId: string) => {
  const oferta = oferty.find((o) => o.id === ofertaId);

  if (!oferta) {
    console.error("❌ Nie znaleziono oferty o ID:", ofertaId);
    return;
  }

  const event = new CustomEvent('editOferta', {
    detail: {
      ofertaId,
      oferta, // ✅ tu przekazujemy całą ofertę
    },
  });

  window.dispatchEvent(event);
};


  return (
    <div>
      <h2 style={{ marginBottom: '1rem' }}>Moje oferty pomocy</h2>

      <label style={{ display: 'block', marginBottom: '1rem' }}>
        Filtruj po statusie:{' '}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            marginLeft: '0.5rem',
            padding: '0.4rem 0.8rem',
            borderRadius: '0.3rem',
            border: '1px solid #ccc',
          }}
        >
          <option value="">Wszystkie</option>
          <option value="oczekuje">Oczekuje</option>
          <option value="zaakceptowana">Zaakceptowana</option>
          <option value="odrzucona">Odrzucona</option>
          <option value="anulowana">Anulowana</option>
        </select>
      </label>

      {filteredOferty.length === 0 ? (
        <p>Brak ofert do wyświetlenia.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {filteredOferty.map((oferta) => (
            <li
              key={oferta.id}
              style={{
                border: '1px solid #ccc',
                padding: '1rem',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
              }}
            >
              <p><strong>ID zgłoszenia:</strong> {oferta.zgloszenieId}</p>
              <p><strong>Status:</strong> {oferta.status}</p>
              <p>
                <strong>Cena:</strong>{' '}
                {oferta.cena?.od || '—'} zł – {oferta.cena?.do || '—'} zł
              </p>
{Array.isArray(oferta.proponowaneTerminy) && oferta.proponowaneTerminy.length > 0 && (
  <p>
    <strong>Terminy:</strong> {oferta.proponowaneTerminy.join(', ')}
  </p>
)}

              {/* 🔘 PRZYCISKI */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
<button
  onClick={() => handleEdytuj(oferta.id)}
  style={{
    backgroundColor: '#FF9800',
    color: 'white',
    padding: '0.6rem 1.2rem',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: 'bold',
    transition: 'background-color 0.2s ease',
  }}
  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#e68900')}
  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#FF9800')}
>
  ✏️ Edytuj
</button>

<button
  onClick={() => handleAnuluj(oferta.id)}
  style={{
    backgroundColor: '#F44336',
    color: 'white',
    padding: '0.6rem 1.2rem',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: 'bold',
    transition: 'background-color 0.2s ease',
    marginLeft: '0.5rem',
  }}
  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#d32f2f')}
  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#F44336')}
>
  ❌ Anuluj
</button>

              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MojeOferty;
