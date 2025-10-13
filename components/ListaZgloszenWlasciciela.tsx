'use client';

import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  orderBy,
} from 'firebase/firestore';
import { app } from '@/lib/firebase';
import Link from 'next/link';
import locations from '@/utils/locations';
import specializations from '@/utils/specializations';
import { contactOptions } from '@/utils/contactOptions';

type Zgloszenie = {
  id: string;
  name: string;
  email: string;
  location: string;
  contactTypes: string[];
  specialization: string[];
  topic: string;
  description: string;
  includeSurvey?: boolean;
  createdAt?: any;
  status?: string;
};

type OfertaSpecjalisty = {
  specjalistaId: string;
  specjalistaName: string;
  specjalistaEmail: string;
  proponowanyTermin: string;
  cena: {
    od: string;
    do: string;
  };
};

export default function ListaZgloszenWlasciciela() {
  const [zgloszenia, setZgloszenia] = useState<Zgloszenie[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Zgloszenie>>({});
  const [oferty, setOferty] = useState<Record<string, OfertaSpecjalisty[]>>({});

  const [selectedRejectionReason, setSelectedRejectionReason] = useState('');
  const [rejectionDropdownVisible, setRejectionDropdownVisible] = useState<string | null>(null);

  const rejectionReasons = [
  "Cena zbyt wysoka",
  "Termin nieodpowiedni",
  "Wybieram innego specjalistę",
  "Inny powód",
];


  const db = getFirestore(app);

  useEffect(() => {
    const auth = getAuth(app);

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user?.email) {
        setUserEmail(user.email);

        const q = query(
          collection(db, 'zgloszenia'),
          where('email', '==', user.email),
          orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Zgloszenie[];

        setZgloszenia(data);
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  // ✅ Pobieranie ofert od specjalistów
  useEffect(() => {
    const fetchOferty = async () => {
      const db = getFirestore(app);
      const snapshot = await getDocs(collection(db, 'ofertySpecjalistow'));
      const allOferty = snapshot.docs.map(doc => doc.data() as OfertaSpecjalisty & { zgloszenieId: string });

      const grouped: Record<string, OfertaSpecjalisty[]> = {};

      allOferty.forEach((oferta) => {
        const zgId = (oferta as any).zgloszenieId;
        if (!grouped[zgId]) grouped[zgId] = [];
        grouped[zgId].push(oferta);
      });

      setOferty(grouped);
    };

    fetchOferty();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć to zgłoszenie?')) return;
    await deleteDoc(doc(db, 'zgloszenia', id));
    setZgloszenia((prev) => prev.filter((z) => z.id !== id));
  };

  const handleEditChange = (field: keyof Zgloszenie, value: any) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = async () => {
    if (!editId) return;

    await updateDoc(doc(db, 'zgloszenia', editId), editData);
    setZgloszenia((prev) =>
      prev.map((z) => (z.id === editId ? { ...z, ...editData } : z))
    );

    setEditId(null);
    setEditData({});
  };

  const filtered = zgloszenia.filter((z) => !filterStatus || z.status === filterStatus);

  if (loading) return <p>Ładowanie zgłoszeń...</p>;

  return (
    <div style={{ marginTop: '1rem' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '2rem',
      }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0D1F40', margin: 0 }}>
          Twoje zgłoszenia problemów
        </h2>

        <Link
          href="/zgloszenia/zloz"
          style={{
            backgroundColor: '#0D1F40',
            color: 'white',
            padding: '0.6rem 1.2rem',
            borderRadius: '0.5rem',
            textDecoration: 'none',
            fontWeight: 'bold',
            fontSize: '1rem',
            whiteSpace: 'nowrap',
          }}
        >
          ➕ Zgłoś problem behawioralny
        </Link>
      </div>

      {/* FILTRY */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ fontWeight: 'bold', marginRight: '1rem' }}>
          Filtrowanie po statusie:
        </label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ padding: '0.5rem', borderRadius: '0.5rem' }}
        >
          <option value="">Wszystkie</option>
          <option value="oczekujące">⏳ Oczekujące</option>
          <option value="z ofertą pomocy">💡 Z ofertą pomocy</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p style={{ fontStyle: 'italic', color: '#777' }}>
          Brak zgłoszeń pasujących do wybranych filtrów.
        </p>
      ) : (
        filtered.map((z) => (
          <div
            key={z.id}
            style={{
              backgroundColor: 'white',
              border: '1px solid #ddd',
              borderRadius: '0.8rem',
              padding: '1.5rem',
              marginBottom: '2rem',
            }}
          >
            {editId === z.id ? (
              <>
                <p><strong>Imię i nazwisko:</strong> {z.name}</p>
                <p><strong>Email:</strong> {z.email}</p>

                <label>Lokalizacja:</label>
                <select
                  value={editData.location || ''}
                  onChange={(e) => handleEditChange('location', e.target.value)}
                  style={inputStyle}
                >
                  <option value="">-- Wybierz województwo --</option>
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>

                <label>Temat zgłoszenia:</label>
                <input
                  value={editData.topic || ''}
                  onChange={(e) => handleEditChange('topic', e.target.value)}
                  placeholder="Temat zgłoszenia"
                  style={inputStyle}
                />

                <label>Forma kontaktu:</label>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  {contactOptions.map((type) => (
                    <label key={type}>
                      <input
                        type="checkbox"
                        checked={editData.contactTypes?.includes(type) || false}
                        onChange={() => {
                          const current = editData.contactTypes || [];
                          handleEditChange(
                            'contactTypes',
                            current.includes(type)
                              ? current.filter((t) => t !== type)
                              : [...current, type]
                          );
                        }}
                      /> {type}
                    </label>
                  ))}
                </div>

                <label>Specjalizacje:</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                  {specializations.map((spec) => (
                    <label key={spec} style={{ width: '45%' }}>
                      <input
                        type="checkbox"
                        checked={editData.specialization?.includes(spec) || false}
                        onChange={() => {
                          const current = editData.specialization || [];
                          handleEditChange(
                            'specialization',
                            current.includes(spec)
                              ? current.filter((s) => s !== spec)
                              : [...current, spec]
                          );
                        }}
                      /> {spec}
                    </label>
                  ))}
                </div>

                <label>Opis problemu:</label>
                <textarea
                  value={editData.description || ''}
                  onChange={(e) => handleEditChange('description', e.target.value)}
                  placeholder="Opisz szczegóły..."
                  style={{ ...inputStyle, resize: 'vertical' }}
                />

                <label>
                  <input
                    type="checkbox"
                    checked={!!editData.includeSurvey}
                    onChange={() => handleEditChange('includeSurvey', !editData.includeSurvey)}
                  /> Dołączona ocena zachowania
                </label>

                <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                  <button onClick={handleSaveEdit} style={buttonStylePrimary}>
                    💾 Zapisz zmiany
                  </button>
                  <button onClick={() => setEditId(null)} style={buttonStyleSecondary}>
                    Anuluj
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  {z.topic}
                </h2>
                <p><strong>Imię i nazwisko:</strong> {z.name}</p>
                <p><strong>Email:</strong> {z.email}</p>
                <p><strong>Lokalizacja:</strong> {z.location}</p>
                <p><strong>Forma kontaktu:</strong> {z.contactTypes?.join(', ')}</p>
                <p><strong>Specjalizacje:</strong> {z.specialization?.join(', ')}</p>
                <p><strong>Opis:</strong><br />{z.description}</p>
                <p><strong>Status:</strong> {z.status || 'oczekujące'}</p>
                <p><strong>Data zgłoszenia:</strong> {z.createdAt?.toDate?.().toLocaleDateString() || '—'}</p>

                {/* ✅ Lista ofert specjalistów */}
                {z.status === 'z ofertą pomocy' && oferty[z.id] && (
                  <div style={{ marginTop: '1rem', background: '#f9f9f9', border: '1px solid #ddd', padding: '1rem', borderRadius: '0.5rem' }}>
                    <h4 style={{ marginBottom: '0.5rem', color: '#0D1F40' }}>💡 Oferty pomocy od specjalistów:</h4>
{oferty[z.id].map((oferta, index) => (
  <div key={index} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px dashed #ccc' }}>
    <p><strong>Specjalista:</strong> {oferta.specjalistaName}</p>
    <p><strong>Email:</strong> {oferta.specjalistaEmail}</p>
    <p><strong>Proponowany termin:</strong> {oferta.proponowanyTermin}</p>
    <p><strong>Cena:</strong> {oferta.cena.od} zł - {oferta.cena.do} zł</p>

    {/* 🔘 PRZYCISKI */}
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
      {/* Zobacz profil */}
      <button
        onClick={() => {
          if (oferta.specjalistaId) {
            window.location.href = `/specjalista/profil/${oferta.specjalistaId}`;
          } else {
            alert('Brak ID specjalisty.');
          }
        }}
        style={{
          backgroundColor: '#0D1F40',
          color: 'white',
          padding: '0.5rem 1rem',
          borderRadius: '0.3rem',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        👤 Zobacz profil
      </button>

      {/* Zaakceptuj */}
      <button
        onClick={async () => {
          const ofertaRef = query(
            collection(db, 'ofertySpecjalistow'),
            where('specjalistaId', '==', oferta.specjalistaId),
            where('zgloszenieId', '==', z.id)
          );
          const snapshot = await getDocs(ofertaRef);
          snapshot.forEach(async (docSnap) => {
            await updateDoc(doc(db, 'ofertySpecjalistow', docSnap.id), {
              status: 'zaakceptowana',
            });
          });
          alert('Oferta została zaakceptowana.');
        }}
        style={{
          backgroundColor: 'green',
          color: 'white',
          padding: '0.5rem 1rem',
          borderRadius: '0.3rem',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        ✅ Zaakceptuj
      </button>

      {/* Odrzuć */}
      <button
        onClick={() => setRejectionDropdownVisible(`${z.id}-${index}`)}
        style={{
          backgroundColor: '#c00',
          color: 'white',
          padding: '0.5rem 1rem',
          borderRadius: '0.3rem',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        ❌ Odrzuć
      </button>
    </div>

    {/* Powód odrzucenia */}
    {rejectionDropdownVisible === `${z.id}-${index}` && (
      <div style={{ marginTop: '1rem' }}>
        <label>
          <strong>Powód odrzucenia: </strong>
          <select
            value={selectedRejectionReason}
            onChange={(e) => setSelectedRejectionReason(e.target.value)}
            style={{ marginLeft: '1rem', padding: '0.5rem', borderRadius: '0.3rem' }}
          >
            <option value="">-- Wybierz --</option>
            {["Cena zbyt wysoka", "Termin nieodpowiedni", "Wybieram innego specjalistę", "Inny powód"].map((reason, i) => (
              <option key={i} value={reason}>{reason}</option>
            ))}
          </select>
        </label>
        <button
          disabled={!selectedRejectionReason}
          onClick={async () => {
            const ofertaRef = query(
              collection(db, 'ofertySpecjalistow'),
              where('specjalistaId', '==', oferta.specjalistaId),
              where('zgloszenieId', '==', z.id)
            );
            const snapshot = await getDocs(ofertaRef);
            snapshot.forEach(async (docSnap) => {
              await updateDoc(doc(db, 'ofertySpecjalistow', docSnap.id), {
                status: 'odrzucona',
                powodOdrzucenia: selectedRejectionReason,
              });
            });

            alert('Oferta została odrzucona.');
            setRejectionDropdownVisible(null);
            setSelectedRejectionReason('');
          }}
          style={{
            marginLeft: '1rem',
            backgroundColor: '#c00',
            color: 'white',
            padding: '0.4rem 1rem',
            borderRadius: '0.3rem',
            border: 'none',
            cursor: selectedRejectionReason ? 'pointer' : 'not-allowed',
            opacity: selectedRejectionReason ? 1 : 0.5,
          }}
        >
          Potwierdź odrzucenie
        </button>
      </div>
    )}
  </div>
))}

                  </div>
                )}

                <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                  <button onClick={() => {
                    setEditId(z.id);
                    setEditData({
                      location: z.location || '',
                      topic: z.topic || '',
                      contactTypes: Array.isArray(z.contactTypes) ? z.contactTypes : [],
                      specialization: Array.isArray(z.specialization) ? z.specialization : [],
                      description: z.description || '',
                      includeSurvey: !!z.includeSurvey,
                    });
                  }} style={buttonStylePrimary}>
                    ✏️ Edytuj
                  </button>

                  <button onClick={() => handleDelete(z.id)} style={buttonStyleDanger}>
                    🗑️ Usuń
                  </button>

                  <Link href={`/zgloszenia/${z.id}`}>
                    <button style={buttonStyleSecondary}>🔍 Zobacz szczegóły</button>
                  </Link>
                </div>
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.8rem',
  marginBottom: '1rem',
  borderRadius: '0.5rem',
  border: '1px solid #ccc',
};

const buttonStylePrimary: React.CSSProperties = {
  backgroundColor: '#0D1F40',
  color: 'white',
  padding: '0.6rem 1.2rem',
  borderRadius: '0.5rem',
  border: 'none',
  cursor: 'pointer',
};

const buttonStyleSecondary: React.CSSProperties = {
  backgroundColor: '#ccc',
  color: '#333',
  padding: '0.6rem 1.2rem',
  borderRadius: '0.5rem',
  border: 'none',
  cursor: 'pointer',
};

const buttonStyleDanger: React.CSSProperties = {
  backgroundColor: '#c00',
  color: 'white',
  padding: '0.6rem 1.2rem',
  borderRadius: '0.5rem',
  border: 'none',
  cursor: 'pointer',
};
