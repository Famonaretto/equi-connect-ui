'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type SpecialistProfile = {
  firstName?: string;
  lastName?: string;
  wojewodztwo?: string[];
  cenaOnline?: string;
  cenaStacjonarna?: string;
  contactTypes?: string[];
  specialization?: string[];
  opis?: string;
  doswiadczenie?: string;
  kursy?: string;
  certyfikaty?: string;
  photo?: string;
  avatarUrl?: string; 
  kosztyDojazdu?: string;
  czasTrwania?: string;
};


export default function PublicSpecialistProfilePage() {
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<SpecialistProfile | null>(null);

  const searchParams = useSearchParams();

// Zbieramy filtry z URL-a (jeśli przyszliśmy z filtrowanej listy)
const filters = {
  specialization: searchParams.getAll('specialization'),
  location: searchParams.get('location') || '',
  contactTypes: searchParams.getAll('contactTypes'),
  minRating: searchParams.get('minRating') || '',
  maxPrice: searchParams.get('maxPrice') || '',
};

// Generujemy query string
const query = new URLSearchParams();
filters.specialization.forEach((s) => query.append('specialization', s));
filters.contactTypes.forEach((c) => query.append('contactTypes', c));
if (filters.location) query.append('location', filters.location);
if (filters.minRating) query.append('minRating', filters.minRating);
if (filters.maxPrice) query.append('maxPrice', filters.maxPrice);

const backLink = `/znajdz?${query.toString()}`; // ✅ działa


  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const db = getFirestore(app);
        const docRef = doc(db, 'profile', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setProfile(docSnap.data() as SpecialistProfile);
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error('Błąd pobierania profilu:', error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProfile();
    }
  }, [id]);

  if (loading) return <p style={{ padding: '2rem' }}>Ładowanie...</p>;

  if (!profile) {
    return (
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '2rem' }}>
        <h2>Profil specjalisty</h2>
        <p>Ten specjalista nie uzupełnił jeszcze swojego profilu.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem', color: '#0D1F40' }}>
        {profile.firstName} {profile.lastName}
      </h1>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        <img
  src={profile.avatarUrl || '/images/placeholder.jpg'}


  alt="Zdjęcie specjalisty"
  style={{
    width: '250px',
    height: '250px',
    objectFit: 'cover',
    borderRadius: '1rem',
    border: '2px solid #ccc',
  }}
/>


        <div style={{ flex: 1 }}>
          <p><strong>Specjalizacja:</strong> {profile.specialization?.join(', ') || 'Nie podano'}</p>
          <p><strong>Doświadczenie:</strong> {profile.doswiadczenie || 'Nie podano'}</p>
          <p><strong>Obszar konsultacji stacjonarnych:</strong>{" "}  {Array.isArray(profile.wojewodztwo)    ? profile.wojewodztwo.join(", ")    : profile.wojewodztwo || "Nie podano"}</p>
          <p><strong>Opis:</strong> {profile.opis || 'Brak opisu'}</p>
          <p><strong>Formy kontaktu:</strong> {profile.contactTypes?.join(', ') || 'Nie podano'}</p>
          <p><strong>Cena konsultacji online:</strong> {profile.cenaOnline ? `${profile.cenaOnline} zł` : 'Nie podano'}</p>
          <p><strong>Cena konsultacji stacjonarnej (bez kosztów dojazdu):</strong> {profile.cenaStacjonarna ? `${profile.cenaStacjonarna} zł` : 'Nie podano'}</p>
          <p><strong>Koszty dojazdu:</strong> {profile.kosztyDojazdu || 'Nie podano'}</p>
          <p><strong>Czas trwania wizyty:</strong> {profile.czasTrwania || 'Nie podano'}</p>
          <p><strong>Kursy i uprawnienia:</strong> {profile.kursy || 'Brak danych'}</p>
          <Link
  href={`/konsultacja/umow?specjalista=${encodeURIComponent(`${profile.firstName} ${profile.lastName}`)}`}
>
  <button
    style={{
      backgroundColor: '#0D1F40',
      color: '#fff',
      padding: '0.75rem 1.5rem',
      border: '2px solid #0D1F40',
      borderRadius: '0.5rem',
      cursor: 'pointer',
      marginTop: '1rem',
      marginRight: '1rem',
      fontSize: '1rem',
    }}
  >
    Umów konsultację
  </button>
</Link>

  <Link href={backLink}>
  <button
    style={{
      backgroundColor: '#f0f0f0',
      color: '#0D1F40',
      padding: '0.75rem 1.5rem',
      border: '2px solid #0D1F40',
      borderRadius: '0.5rem',
      cursor: 'pointer',
      marginTop: '1rem',
      fontSize: '1rem',
      fontWeight: 'bold',
    }}
  >
    Wróć do listy specjalistów
  </button>
</Link>

        </div>
       
      </div>
    </div>
  );
}
