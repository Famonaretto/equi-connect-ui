'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, getDocs, getFirestore, query, orderBy, updateDoc, arrayUnion, serverTimestamp, where, deleteDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import specializations from '@/utils/specializations';
import locations from '@/utils/locations';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { addDoc } from 'firebase/firestore';

type Zgloszenie = {
  id: string;
  name: string;
  location: string;
  contactTypes: string[];
  specialization: string[];
  topic: string;
  description: string;
  status?: string;
};

export default function ListaZgloszen() {
  const [zgloszenia, setZgloszenia] = useState<Zgloszenie[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);
  const [showLoc, setShowLoc] = useState(false);
  const [showSpec, setShowSpec] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [mojeOferty, setMojeOferty] = useState<{ zgloszenieId: string; ofertaId: string }[]>([]);

const [editingOfertaId, setEditingOfertaId] = useState<string | null>(null);


  const handleSpecChange = (value: string) => {
    setSelectedSpecs((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
    );
  };

const handleLocationChange = (value: string) => {
  setSelectedLocations((prev) => {
    if (value === 'Cała Polska') {
      if (prev.includes('Cała Polska')) {
        // Odznaczenie "Cała Polska" → wyczyść wszystkie
        return [];
      } else {
        // Zaznaczenie "Cała Polska" → zaznacz wszystkie lokalizacje
        return [...locations];
      }
    } else {
      let updated: string[];
      if (prev.includes(value)) {
        updated = prev.filter((item) => item !== value);
      } else {
        updated = [...prev, value];
      }

      // Jeśli w liście jest "Cała Polska" i klikamy inną lokalizację → usuń "Cała Polska"
      if (updated.includes('Cała Polska') && value !== 'Cała Polska') {
        updated = updated.filter((loc) => loc !== 'Cała Polska');
      }

      return updated;
    }
  });
};

// Stan do dialogu
const [showDialog, setShowDialog] = useState(false);
const [selectedZgloszenie, setSelectedZgloszenie] = useState<string | null>(null);
const [terminy, setTerminy] = useState<{ date: string, time: string }[]>([
  { date: '', time: '' }
]);
const [priceFrom, setPriceFrom] = useState('');
const [priceTo, setPriceTo] = useState('');
const [confirmationDialog, setConfirmationDialog] = useState(false);


// Funkcja uruchamiana po kliknięciu przycisku "Zaproponuj pomoc"
const handleProposeHelp = (id: string) => {
  setSelectedZgloszenie(id);
  setShowDialog(true); // 🔥 zamiast confirm
};


const handleCancelOffer = async (ofertaId: string) => {
  const confirmed = window.confirm('Czy na pewno chcesz anulować tę ofertę?');

  if (!confirmed) return;

  const db = getFirestore(app);

  try {
    await deleteDoc(doc(db, 'ofertySpecjalistow', ofertaId));
    alert('✅ Oferta została anulowana.');

    // Odśwież listę ofert w stanie
    setMojeOferty((prev) => prev.filter((o) => o.ofertaId !== ofertaId));
  } catch (error) {
    console.error('❌ Błąd przy anulowaniu oferty:', error);
    alert('❌ Nie udało się anulować oferty.');
  }
};


const handleEditOffer = async (ofertaId: string) => {
  const db = getFirestore(app);
  const ofertaRef = doc(db, 'ofertySpecjalistow', ofertaId);
  const ofertaSnap = await getDoc(ofertaRef);

  if (!ofertaSnap.exists()) {
    alert('❌ Nie znaleziono oferty.');
    return;
  }

  const oferta = ofertaSnap.data();

  // Wypełnij stan formularza danymi z oferty
  setSelectedZgloszenie(oferta.zgloszenieId || '');
  setEditingOfertaId(ofertaId); // 🔥 Dodaj nowy stan!
  setPriceFrom(oferta.cena?.od || '');
  setPriceTo(oferta.cena?.do || '');
  setTerminy(
    oferta.proponowaneTerminy?.map((t: string) => {
      const [date, ...rest] = t.split(' ');
      const time = rest.join(' ') || '';
      return { date, time };
    }) || [{ date: '', time: '' }]
  );

  setShowDialog(true);
};




// Funkcja wywoływana po kliknięciu "Potwierdź propozycję" w dialogu
const confirmProposeHelp = async () => {
  if (!selectedZgloszenie) return;

  const db = getFirestore(app);
  const auth = getAuth(app);
  const currentUser = auth.currentUser;

  if (!currentUser) {
    alert("❌ Musisz być zalogowany jako specjalista.");
    return;
  }

  // 👉 SPRAWDŹ, CZY JUŻ ISTNIEJE OFERTA TEGO SPECJALISTY DLA TEGO ZGŁOSZENIA
  const ofertaQuery = query(
    collection(db, 'ofertySpecjalistow'),
    where('zgloszenieId', '==', selectedZgloszenie),
    where('specjalistaId', '==', currentUser.uid)
  );

const snapshot = await getDocs(ofertaQuery);
const isAnotherOfferExists = snapshot.docs.some((doc) => doc.id !== editingOfertaId);

if (isAnotherOfferExists) {
  alert("❌ Już dodałeś ofertę do tego zgłoszenia.");
  return;
}


  // 👉 PRZYGOTUJ LISTĘ TERMINÓW
const preparedTerminy = terminy.map(({ date, time }) =>
  date && time ? `${date} ${time}` : 'Do ustalenia'
);


  const oferta = {
    zgloszenieId: selectedZgloszenie,
    specjalistaId: currentUser.uid,
    specjalistaEmail: currentUser.email,
    specjalistaName: currentUser.displayName || 'Specjalista',
    proponowaneTerminy: preparedTerminy, // 👉 teraz tablica, nie pojedynczy string
    cena: {
      od: priceFrom || '',
      do: priceTo || '',
    },
    status: 'oczekuje',
    createdAt: serverTimestamp(),
  };

  try {
    if (editingOfertaId) {
      // 🔄 aktualizacja istniejącej oferty
      const ofertaRef = doc(db, 'ofertySpecjalistow', editingOfertaId);
      await updateDoc(ofertaRef, oferta);
    } else {
      // 🆕 nowa oferta
      await addDoc(collection(db, 'ofertySpecjalistow'), oferta);

      // zmień status zgłoszenia
      const zgRef = doc(db, 'zgloszenia', selectedZgloszenie);
      await updateDoc(zgRef, {
        status: 'z ofertą pomocy',
      });
    }


    // ✅ 2. Ustaw status zgłoszenia
    const zgRef = doc(db, 'zgloszenia', selectedZgloszenie);
    await updateDoc(zgRef, {
      status: 'z ofertą pomocy',
    });

    // ✅ 3. Reset formularza
    setShowDialog(false);
    setSelectedZgloszenie(null);
    setTerminy([{ date: '', time: '' }]);
    setPriceFrom('');
    setPriceTo('');
    setEditingOfertaId(null); // ← TU!
    setConfirmationDialog(true);



  } catch (error) {
    console.error('❌ Błąd przy zapisie oferty:', error);
    alert('❌ Coś poszło nie tak przy zapisie oferty.');
  }
};




  const clearFilters = () => {
    setSelectedLocations([]);
    setSelectedSpecs([]);
  };

  const removeLocation = (loc: string) => {
    setSelectedLocations((prev) => prev.filter((l) => l !== loc));
  };

  const removeSpec = (spec: string) => {
    setSelectedSpecs((prev) => prev.filter((s) => s !== spec));
  };

  const filteredZgloszenia = zgloszenia.filter((z) => {
    const matchLocation =
      selectedLocations.length === 0 ||
      selectedLocations.some((loc) => loc.toLowerCase() === z.location.toLowerCase());

    const matchSpecializations =
      selectedSpecs.length === 0 ||
      z.specialization.some((spec) =>
        selectedSpecs.map((s) => s.toLowerCase()).includes(spec.toLowerCase())
      );

    return matchLocation && matchSpecializations;
  });

 useEffect(() => {
  const checkRole = () => {
    const storedRole = localStorage.getItem('role');
    setUserRole(storedRole);
  };

  // sprawdzamy przy pierwszym renderze
  checkRole();

  // nasłuchujemy na event emitowany w logowaniu/rejestracji
  window.addEventListener('userChanged', checkRole);

  return () => {
    window.removeEventListener('userChanged', checkRole);
  };
}, []);

useEffect(() => {
  const db = getFirestore(app);
  const auth = getAuth();

  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    const q = query(
      collection(db, 'ofertySpecjalistow'),
      where('specjalistaId', '==', user.uid)
    );

    const snapshot = await getDocs(q);
    const results = snapshot.docs.map(doc => ({
      zgloszenieId: doc.data().zgloszenieId,
      ofertaId: doc.id,
    }));

    setMojeOferty(results);
  });

  return () => unsubscribe();
}, []);


  useEffect(() => {
    const fetchZgloszenia = async () => {
      const db = getFirestore(app);
      const q = query(collection(db, 'zgloszenia'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Zgloszenie[];

      setZgloszenia(data);
    };

    fetchZgloszenia();
  }, []);

  return (
    <section style={{ maxWidth: '1200px', margin: '4rem auto', padding: '2rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#0D1F40',
            margin: 0,
          }}
        >
          Lista zgłoszeń właścicieli koni
        </h1>

{userRole !== 'specjalista' && (
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
    Zgłoś problem behawioralny
  </Link>
)}

      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
        {/* SIDEBAR */}
        {/* SIDEBAR */}
<aside
  style={{
    flex: '1 1 250px',
    minWidth: '250px',
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid #ccc',
    paddingRight: '1rem',
  }}
>
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
      <h3 style={{ margin: 0, color: '#0D1F40' }}>Filtry</h3>
    </div>

    {/* Lokalizacja */}
    <div style={{ marginBottom: '2rem' }}>
      <button onClick={() => setShowLoc(!showLoc)} style={toggleBtn}>
        {showLoc ? '▼' : '▶'} Lokalizacja
      </button>
      {showLoc && (
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {locations.map((loc) => (
            <label key={loc}>
              <input
                type="checkbox"
                value={loc}
                checked={selectedLocations.includes(loc)}
                onChange={() => handleLocationChange(loc)}
              />{' '}
              {loc}
            </label>
          ))}
        </div>
      )}
    </div>

    {/* Specjalizacja */}
    <div style={{ marginBottom: '1rem' }}>
      <button onClick={() => setShowSpec(!showSpec)} style={toggleBtn}>
        {showSpec ? '▼' : '▶'} Specjalizacja
      </button>
      {showSpec && (
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {specializations.map((spec) => (
            <label key={spec}>
              <input
                type="checkbox"
                value={spec}
                checked={selectedSpecs.includes(spec)}
                onChange={() => handleSpecChange(spec)}
              />{' '}
              {spec}
            </label>
          ))}
        </div>
      )}
    </div>

    {/* Przycisk pod specjalizacją */}
    <button
      onClick={clearFilters}
      style={{
        backgroundColor: '#ccc',
        color: '#333',
        padding: '0.8rem 1.2rem',
        borderRadius: '0.5rem',
        fontWeight: 'bold',
        fontSize: '1rem',
        border: 'none',
        cursor: 'pointer',
        width: '100%',
      }}
    >
      Wyczyść wszystkie filtry
    </button>
  </div>
</aside>



        {/* MAIN CONTENT */}
        <div style={{ flex: '3 1 700px' }}>
          {/* WYŚWIETLANIE AKTYWNYCH FILTRÓW */}
{(selectedLocations.length > 0 || selectedSpecs.length > 0) && (
  <div
    style={{
      marginBottom: '1rem',
      display: 'flex',
      flexWrap: 'wrap',
      gap: '0.5rem',
    }}
  >
    {[
...(selectedLocations.includes('Cała Polska')
  ? locations.filter((loc) => loc !== 'Cała Polska')
  : selectedLocations
).map((loc) => (
  <span
    key={loc}
    style={{
      background: '#eee',
      padding: '0.3rem 0.6rem',
      borderRadius: '0.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.3rem',
      border: '1px solid #ccc',
    }}
  >
    {loc}
    <button
      onClick={() => removeLocation(loc)}
      style={{
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        fontWeight: 'bold',
        color: '#333',
      }}
    >
      ×
    </button>
  </span>
)),

      ...selectedSpecs.map((spec) => (
        <span
          key={spec}
          style={{
            background: '#eee',
            padding: '0.3rem 0.6rem',
            borderRadius: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            border: '1px solid #ccc',
          }}
        >
          {spec}
          <button
            onClick={() => removeSpec(spec)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              color: '#333',
            }}
          >
            ×
          </button>
        </span>
      )),
    ]}
  </div>
)}


          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0D1F40', marginBottom: '1rem' }}>
            Wyniki wyszukiwania:
          </h2>

          {filteredZgloszenia.map((z) => (
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
              <h2 style={{ fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {z.topic}
              </h2>
              <p><strong>Imię:</strong> {z.name}</p>
              <p><strong>Lokalizacja:</strong> {z.location}</p>
              <p><strong>Forma kontaktu:</strong> {z.contactTypes.join(', ')}</p>
              <p><strong>Specjalizacje:</strong> {z.specialization.join(', ')}</p>
              <p><strong>Opis:</strong><br />{z.description}</p>
              <Link href={`/zgloszenia/${z.id}`}>
                <button style={{ marginTop: '1rem' }}>Zobacz szczegóły</button>
              </Link>
              {userRole === 'specjalista' && (() => {
  const mojaOferta = mojeOferty.find((o) => o.zgloszenieId === z.id);

  if (!mojaOferta) {
    return (
      <button
        onClick={() => handleProposeHelp(z.id)}
        style={{
          ...buttonStylePrimary,
          marginTop: '1rem',
        }}
      >
        💡 Zaproponuj pomoc
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
      <button
        onClick={() => handleEditOffer(mojaOferta.ofertaId)}
        style={{
          ...buttonStyleSecondary,
          backgroundColor: '#FF9800',
          color: '#fff',
        }}
      >
        ✏️ Zobacz swoją ofertę
      </button>
      <button
        onClick={() => handleCancelOffer(mojaOferta.ofertaId)}
        style={{
          ...buttonStyleSecondary,
          backgroundColor: '#F44336',
          color: '#fff',
        }}
      >
        ❌ Anuluj ofertę
      </button>
    </div>
  );
})()}


            </div>
          ))}

          {filteredZgloszenia.length === 0 && (
            <p style={{ fontStyle: 'italic', color: '#777' }}>
              Brak zgłoszeń pasujących do wybranych filtrów.
            </p>
          )}
        </div>
      </div>
      {showDialog && (
  <div style={{
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  }}>
    <div style={{
  background: 'white',
  padding: '2rem',
  borderRadius: '1rem',
  width: '400px',
  maxWidth: '90%',
  maxHeight: '90vh',        // 🔥 maksymalna wysokość
  overflowY: 'auto'         // 🔥 przewijanie pionowe, jeśli za duże
}}>

<h3 style={{ marginBottom: '1rem', color: '#0D1F40' }}>💡 Zaproponuj pomoc</h3>

<label>Proponowane terminy:</label>
{terminy.map((t, index) => (
  <div key={index} style={{ marginBottom: '1rem', borderBottom: '1px dashed #ccc', paddingBottom: '1rem' }}>
    <label>Data konsultacji:</label>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
      <input
        type="date"
        value={t.date}
        onChange={(e) => {
          const newTerminy = [...terminy];
          newTerminy[index].date = e.target.value;
          setTerminy(newTerminy);
        }}
        disabled={t.date === 'do ustalenia'}
        style={inputStyle}
      />
      <label style={{ fontSize: '0.9rem' }}>
        <input
          type="checkbox"
          checked={t.date === 'do ustalenia'}
          onChange={(e) => {
            const newTerminy = [...terminy];
            newTerminy[index].date = e.target.checked ? 'do ustalenia' : '';
            setTerminy(newTerminy);
          }}
        /> Do ustalenia
      </label>
    </div>

    <label>Godzina:</label>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
      <input
        type="time"
        value={t.time}
        onChange={(e) => {
          const newTerminy = [...terminy];
          newTerminy[index].time = e.target.value;
          setTerminy(newTerminy);
        }}
        disabled={t.time === 'do ustalenia'}
        style={inputStyle}
      />
      <label style={{ fontSize: '0.9rem' }}>
        <input
          type="checkbox"
          checked={t.time === 'do ustalenia'}
          onChange={(e) => {
            const newTerminy = [...terminy];
            newTerminy[index].time = e.target.checked ? 'do ustalenia' : '';
            setTerminy(newTerminy);
          }}
        /> Do ustalenia
      </label>
    </div>

    {terminy.length > 1 && (
      <button
        onClick={() => {
          const newTerminy = terminy.filter((_, i) => i !== index);
          setTerminy(newTerminy);
        }}
        style={{ ...buttonStyleSecondary, backgroundColor: '#eee', fontSize: '0.85rem' }}
      >
        Usuń ten termin
      </button>
    )}
  </div>
))}

<button
  onClick={() => setTerminy([...terminy, { date: '', time: '' }])}
  style={{ ...buttonStyleSecondary, marginBottom: '1rem' }}
>
  ➕ Dodaj kolejny termin
</button>


<button
  type="button"
  onClick={() => setTerminy([...terminy, { date: '', time: '' }])}
  style={{
    backgroundColor: '#0D1F40',
    color: 'white',
    padding: '0.4rem 0.8rem',
    borderRadius: '0.4rem',
    fontSize: '0.9rem',
    border: 'none',
    cursor: 'pointer',
    marginTop: '0.5rem'
  }}
>
  ➕ Dodaj kolejny termin
</button>


<label>Cena orientacyjna (od):</label>
<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
  <input
    type="number"
    value={priceFrom}
    onChange={(e) => setPriceFrom(e.target.value)}
    style={inputStyle}
  />
  <span>zł</span>
</div>

<label>Cena orientacyjna (do):</label>
<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
  <input
    type="number"
    value={priceTo}
    onChange={(e) => setPriceTo(e.target.value)}
    style={inputStyle}
  />
  <span>zł</span>
</div>

<p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1rem' }}>
  Podane ceny są orientacyjne i mogą ulec zmianie po konsultacji.
</p>

<div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
  <button style={buttonStyleSecondary} onClick={() => setShowDialog(false)}>Anuluj</button>
<button
  style={buttonStylePrimary}
  onClick={confirmProposeHelp}
>
  {editingOfertaId ? 'Zapisz zmiany' : 'Potwierdź propozycję'}
</button>



</div>

    </div>
  </div>
)}
{confirmationDialog && (
  <div style={{
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1100,
  }}>
    <div style={{
      background: 'white',
      padding: '2rem',
      borderRadius: '1rem',
      width: '350px',
      textAlign: 'center'
    }}>
      <h3 style={{ marginBottom: '1rem', color: '#0D1F40' }}>✅ Propozycja wysłana</h3>
      <p style={{ marginBottom: '1.5rem', color: '#333' }}>
        Twoja propozycja została przesłana właścicielowi konia.
      </p>
      <button
        style={buttonStylePrimary}
        onClick={() => setConfirmationDialog(false)}
      >
        Zamknij
      </button>
    </div>
  </div>
)}


    </section>
  );
}



// 🔧 STYLE
const toggleBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontWeight: 'bold',
  fontSize: '1.1rem',
  color: '#0D1F40',
  cursor: 'pointer',
  textAlign: 'left',
  padding: 0,
};

const tagStyle: React.CSSProperties = {
  backgroundColor: '#f9f9f9',
  border: '1px solid #ccc',
  borderRadius: '0.5rem',
  padding: '0.3rem 0.6rem',
  fontSize: '0.85rem',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
  lineHeight: '1',
  transition: 'border-color 0.2s, background-color 0.2s',
};

const tagButton: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontWeight: 'bold',
  cursor: 'pointer',
  fontSize: '1rem',
  lineHeight: '1',
  padding: 0,
  margin: 0,
};


const clearBtn: React.CSSProperties = {
  backgroundColor: '#ccc',
  color: '#333',
  padding: '0.6rem 1rem',
  border: 'none',
  borderRadius: '0.5rem',
  fontWeight: 'bold',
  cursor: 'pointer',
};

const clearBtnSmall: React.CSSProperties = {
  backgroundColor: '#eee',
  color: '#0D1F40',
  padding: '0.4rem 0.8rem',
  border: '1px solid #ccc',
  borderRadius: '0.5rem',
  fontSize: '0.85rem',
  cursor: 'pointer',
};
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.6rem',
  marginBottom: '0.8rem',
  border: '1px solid #ccc',
  borderRadius: '0.4rem',
};

const buttonStylePrimary: React.CSSProperties = {
  backgroundColor: '#0D1F40',
  color: 'white',
  padding: '0.6rem 1.2rem',
  borderRadius: '0.5rem',
  border: 'none',
  fontWeight: 'bold',
  cursor: 'pointer',
};

const buttonStyleSecondary: React.CSSProperties = {
  backgroundColor: '#ccc',
  color: '#333',
  padding: '0.6rem 1.2rem',
  borderRadius: '0.5rem',
  border: 'none',
  fontWeight: 'bold',
  cursor: 'pointer',
};
