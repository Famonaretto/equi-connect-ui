'use client';

import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getFirestore, doc, getDoc, collection, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { useDialog } from './../../components/DialogProvider';
import { v4 as uuidv4 } from 'uuid'; // do generowania ID oferty

export default function ZgloszenieDetails() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showDialog } = useDialog();

  const db = getFirestore(app);
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [zgloszenie, setZgloszenie] = useState<any>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  // 🔐 Użytkownik
  useEffect(() => {
    const auth = getAuth(app);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserEmail(user.email || null);
        setUserId(user.uid);
        setUserName(user.displayName || 'Specjalista');

        const uzytkownicyRef = doc(db, 'uzytkownicy', user.uid);
        const userSnap = await getDoc(uzytkownicyRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserRole(data.role || null);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // 📄 Pobierz zgłoszenie
  useEffect(() => {
    const fetchZgloszenie = async () => {
      try {
        const ref = doc(db, 'zgloszenia', id);
        const snapshot = await getDoc(ref);

        if (snapshot.exists()) {
          setZgloszenie(snapshot.data());
        } else {
          console.warn('⚠️ Brak zgłoszenia o ID:', id);
        }
      } catch (err) {
        console.error('❌ Błąd przy pobieraniu zgłoszenia:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchZgloszenie();
    }
  }, [id]);

  const isPreview = searchParams?.get('preview') === 'true';

  // 🔹 Funkcja: zaakceptuj ofertę
const zaakceptujOferte = async (oferta: any) => {
  const db = getFirestore(app);
  const zgRef = doc(db, 'zgloszenia', id);

  await updateDoc(zgRef, {
    status: 'zaakceptowana pomoc',
    zaakceptowanySpecjalista: oferta
  });

  await showDialog(`✅ Zaakceptowałeś pomoc od ${oferta.specjalistaName}`);
};

// 🔹 Funkcja: odrzuć ofertę
const odrzucOferte = async (oferta: any) => {
  const db = getFirestore(app);
  const zgRef = doc(db, 'zgloszenia', id);

  await updateDoc(zgRef, {
    ofertyPomocy: zgloszenie.ofertyPomocy.filter(
      (o: any) => o.specjalistaId !== oferta.specjalistaId
    )
  });

  await showDialog(`❌ Odrzuciłeś ofertę od ${oferta.specjalistaName}`);
};

// 🔹 Funkcja: rozpocznij czat
const rozpocznijCzat = (oferta: any) => {
  router.push(`/czat/${oferta.specjalistaId}`);
};


  // 🔹 Funkcja: zaoferuj pomoc
  const handleOfferHelp = async () => {
    const auth = getAuth(app);
    const currentUser = auth.currentUser;

    if (!currentUser || !zgloszenie) {
      await showDialog('❌ Musisz być zalogowany jako specjalista, aby zaoferować pomoc.');
      return;
    }

    const ofertaId = uuidv4();

    const nowaOferta = {
      id: ofertaId,
      temat: zgloszenie.temat,
      specjalistaId: currentUser.uid,
      specjalistaEmail: currentUser.email,
      specjalistaName: currentUser.displayName || 'Specjalista',
      wlasciciel: zgloszenie.email,
      status: 'oczekuje',
      zgloszenieId: id,
      createdAt: new Date(),
    };

    // dodaj do kolekcji ofert
    await setDoc(doc(db, 'oferty_pomocy', ofertaId), nowaOferta);

    // zaktualizuj zgłoszenie (dodaj do listy ofert i zmień status)
const zgRef = doc(db, 'zgloszenia', id);

// upewniamy się, że pole istnieje
await updateDoc(zgRef, {
  status: 'z ofertą pomocy',
});

// osobno dopisujemy do tablicy
await updateDoc(zgRef, {
  ofertyPomocy: arrayUnion({
    id: ofertaId,
    specjalistaId: currentUser.uid,
    specjalistaEmail: currentUser.email,
    specjalistaName: currentUser.displayName || 'Specjalista',
    wlasciciel: zgloszenie.email,
    temat: zgloszenie.temat,
    status: 'oczekuje',
    createdAt: new Date().toISOString(),
  }),
});




    await showDialog(`✅ Zaoferowałeś pomoc w temacie: ${zgloszenie.temat}`);
  };

  if (loading) return <p style={{ padding: '2rem' }}>Ładowanie...</p>;
  if (!zgloszenie) return <p style={{ padding: '2rem' }}>Nie znaleziono zgłoszenia.</p>;

  return (
    <section style={{ maxWidth: '800px', margin: '4rem auto', padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0D1F40' }}>
        Szczegóły zgłoszenia
      </h1>
      <p><strong>Temat:</strong> {zgloszenie.temat}</p>
      <p><strong>Imię:</strong> {zgloszenie.name}</p>
      <p><strong>Adres email:</strong> {zgloszenie.email}</p>
      <p><strong>Lokalizacja:</strong> {zgloszenie.location}</p>
      <p><strong>Forma kontaktu:</strong> {zgloszenie.contactTypes?.join(', ')}</p>
      <p><strong>Specjalizacje:</strong> {zgloszenie.specialization?.join(', ')}</p>
      <p style={{ marginTop: '1rem' }}><strong>Opis:</strong><br />{zgloszenie.description}</p>

      {userRole === 'właściciel' && zgloszenie.ofertyPomocy?.length > 0 && (
  <div style={{ marginTop: '2rem' }}>
    <h3 style={{ marginBottom: '1rem' }}>💡 Oferty pomocy od specjalistów</h3>

    {zgloszenie.ofertyPomocy.map((oferta: any) => (
      <div
        key={oferta.id}
        style={{
          border: '1px solid #ccc',
          padding: '1rem',
          borderRadius: '0.5rem',
          marginBottom: '1rem',
        }}
      >
        <p><strong>Specjalista:</strong> {oferta.specjalistaName}</p>
        <p><strong>Email:</strong> {oferta.specjalistaEmail}</p>
        <p><strong>Termin:</strong> {oferta.proponowanyTermin || 'Do ustalenia'}</p>
        <p><strong>Cena:</strong> {oferta.cena?.od} - {oferta.cena?.do} zł</p>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button onClick={() => zaakceptujOferte(oferta)} style={baseBtnStyle}>
            ✅ Zaakceptuj
          </button>
          <button onClick={() => odrzucOferte(oferta)} style={baseBtnStyle}>
            ❌ Odrzuć
          </button>
          <button onClick={() => rozpocznijCzat(oferta)} style={baseBtnStyle}>
            💬 Rozpocznij czat
          </button>
          <button
            onClick={() => router.push(`/specjalista/profil/${oferta.specjalistaId}`)}
            style={baseBtnStyle}
          >
            👤 Zobacz profil
          </button>
        </div>
      </div>
    ))}
  </div>
)}


      {userRole === 'specjalista' && (
        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <button onClick={handleOfferHelp} style={baseBtnStyle}>💡 Zaoferuj pomoc</button>
          <button onClick={() => router.push('/zgloszenia/lista')} style={baseBtnStyle}>⬅ Wróć do listy</button>
        </div>
      )}

      {isPreview && (
        <Link
          href="/zaloguj"
          style={{
            marginTop: '2rem',
            display: 'inline-block',
            backgroundColor: '#0D1F40',
            color: 'white',
            padding: '0.6rem 1.2rem',
            borderRadius: '0.5rem',
            textDecoration: 'none',
            fontWeight: 'bold',
            fontSize: '1rem',
          }}
        >
          🔑 Zaloguj się i zobacz szczegóły zgłoszenia
        </Link>
      )}
    </section>
  );
}

const baseBtnStyle: React.CSSProperties = {
  backgroundColor: '#0D1F40',
  color: 'white',
  padding: '0.6rem 1.2rem',
  borderRadius: '0.5rem',
  fontWeight: 'bold',
  fontSize: '1rem',
  border: 'none',
  cursor: 'pointer',
};
